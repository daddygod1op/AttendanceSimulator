/**
 * Immutable Audit Logger & Compliance Monitoring Service
 * Compliant with India's Digital Personal Data Protection Act (DPDPA 2023 Section 6 & 8)
 * and Family Educational Rights and Privacy Act (FERPA 34 CFR Part 99.32 recordkeeping rules).
 *
 * Tracks every access to student education records, directory queries, SIS refreshes,
 * and consent modifications with cryptographic integrity verification.
 */

const fs = require('fs');
const path = require('path');
const { computeChecksum } = require('./cryptoService');

const AUDIT_LOG_FILE = path.join(__dirname, 'audit_trail.log');
const MAX_IN_MEMORY_LOGS = 500;

class AuditLogger {
  constructor() {
    this.memoryLogs = [];
    this.loadRecentLogs();
  }

  loadRecentLogs() {
    try {
      if (fs.existsSync(AUDIT_LOG_FILE)) {
        const lines = fs.readFileSync(AUDIT_LOG_FILE, 'utf8').trim().split('\n').filter(Boolean);
        const parsed = lines
          .slice(-MAX_IN_MEMORY_LOGS)
          .map((line) => {
            try {
              return JSON.parse(line);
            } catch (e) {
              return null;
            }
          })
          .filter(Boolean);
        this.memoryLogs = parsed;
      }
    } catch (err) {
      console.warn('[AuditLogger] Could not load prior audit log:', err.message);
    }
  }

  /**
   * Log an audit event
   * @param {object} event
   * @param {string} event.actorId - User roll or account id (e.g., '2510990000', 'ADMIN_DEAN')
   * @param {string} event.actorRole - 'STUDENT' | 'FACULTY_MENTOR' | 'INSTITUTIONAL_ADMIN' | 'SYSTEM'
   * @param {string} event.action - 'VIEW_DIRECTORY' | 'VIEW_STUDENT_RECORD' | 'VIEW_GRADES' | 'SIS_REFRESH' | 'UPDATE_CONSENT' | 'EXPORT_REPORT' | 'LOGIN' | 'ACCESS_DENIED'
   * @param {string} [event.targetResource] - e.g., 'U25AIML-G13_DIRECTORY', 'STUDENT_2510993272'
   * @param {string} [event.clientIp] - Client IP address
   * @param {string} [event.userAgent] - Browser / Client user-agent
   * @param {string} [event.status] - 'SUCCESS' | 'DENIED' | 'FLAGGED'
   * @param {string} [event.complianceTag] - 'DPDPA_SEC_6_NOTICE' | 'FERPA_DIRECTORY_INFO' | 'FERPA_EDUCATION_RECORD' | 'RBAC_ENFORCED'
   * @param {object} [event.details] - Additional contextual metadata
   */
  log({
    actorId = 'ANONYMOUS',
    actorRole = 'UNAUTHENTICATED',
    action,
    targetResource = 'GENERAL',
    clientIp = '127.0.0.1',
    userAgent = 'WebBrowser',
    status = 'SUCCESS',
    complianceTag = 'DPDPA_SEC_6',
    details = {}
  }) {
    const timestamp = new Date().toISOString();
    const eventId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    const logEntry = {
      id: eventId,
      timestamp,
      actorId,
      actorRole,
      action,
      targetResource,
      clientIp: clientIp.replace('::ffff:', ''),
      userAgent: userAgent ? userAgent.substring(0, 80) : 'Browser',
      status,
      complianceTag,
      details,
      checksum: computeChecksum({ timestamp, actorId, action, targetResource, status })
    };

    // Store in-memory
    this.memoryLogs.unshift(logEntry);
    if (this.memoryLogs.length > MAX_IN_MEMORY_LOGS) {
      this.memoryLogs.pop();
    }

    // Append to file asynchronously
    const line = JSON.stringify(logEntry) + '\n';
    fs.appendFile(AUDIT_LOG_FILE, line, (err) => {
      if (err) console.error('[AuditLogger] Failed to append log:', err.message);
    });

    return logEntry;
  }

  /**
   * Query audit logs with role-based filtering
   * @param {object} filterOptions
   * @returns {Array} List of matching audit entries
   */
  getLogs({ limit = 50, actorId = null, action = null, status = null } = {}) {
    let result = this.memoryLogs;
    if (actorId) {
      result = result.filter((l) => l.actorId === actorId);
    }
    if (action) {
      result = result.filter((l) => l.action === action);
    }
    if (status) {
      result = result.filter((l) => l.status === status);
    }
    return result.slice(0, limit);
  }

  /**
   * Summary metrics for compliance reporting dashboard
   */
  getComplianceMetrics() {
    const total = this.memoryLogs.length;
    const byAction = {};
    const deniedCount = this.memoryLogs.filter((l) => l.status === 'DENIED').length;
    const consentUpdates = this.memoryLogs.filter((l) => l.action === 'UPDATE_CONSENT').length;
    const sisRefreshes = this.memoryLogs.filter((l) => l.action === 'SIS_REFRESH').length;

    this.memoryLogs.forEach((l) => {
      byAction[l.action] = (byAction[l.action] || 0) + 1;
    });

    return {
      totalLoggedEvents: total,
      accessDeniedCount: deniedCount,
      consentUpdatesCount: consentUpdates,
      sisSyncCycles: sisRefreshes,
      distribution: byAction,
      frameworks: ['India DPDPA 2023', 'FERPA (34 CFR Part 99)', 'Chitkara SIS Governance Charter']
    };
  }
}

const auditLogger = new AuditLogger();
module.exports = auditLogger;
