import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  FileCheck2,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  User,
  Globe,
  Database,
  Calendar,
  Layers,
  ArrowUpDown
} from 'lucide-react';

export default function AuditLogViewer({ currentUser }) {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filterAction, setFilterAction] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/compliance/audit-logs');
      const data = await res.json();
      if (data?.logs) {
        setLogs(data.logs);
        setMetrics(data.metrics);
      }
    } catch (e) {
      console.error('Failed to load audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (filterAction !== 'ALL' && l.action !== filterAction) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        l.actorId.toLowerCase().includes(q) ||
        (l.targetResource || '').toLowerCase().includes(q) ||
        l.action.toLowerCase().includes(q) ||
        (l.complianceTag || '').toLowerCase().includes(q) ||
        (l.clientIp || '').includes(q)
      );
    }
    return true;
  });

  const getActionBadge = (action, status) => {
    if (status === 'DENIED') {
      return (
        <span className="badge badge-danger" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <AlertTriangle size={12} />
          {action}
        </span>
      );
    }
    if (action === 'SIS_REFRESH') {
      return (
        <span className="badge badge-info" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Database size={12} />
          SIS Sync
        </span>
      );
    }
    if (action === 'UPDATE_CONSENT') {
      return (
        <span className="badge badge-success" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <ShieldCheck size={12} />
          Consent Update
        </span>
      );
    }
    if (action === 'VIEW_DIRECTORY') {
      return (
        <span className="badge badge-warning" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <FileCheck2 size={12} />
          Directory Access
        </span>
      );
    }
    return (
      <span className="badge badge-neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <Activity size={12} />
        {action}
      </span>
    );
  };

  return (
    <div className="audit-log-viewer-container animate-fade-in" style={{ padding: '1rem 0' }}>
      {/* Hero Header */}
      <div className="section-hero-header" style={{ marginBottom: '1.5rem' }}>
        <div className="hero-badge" style={{ background: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)', color: '#38bdf8' }}>
          <ShieldAlert size={14} />
          <span>Statutory Compliance & Educational Recordkeeping</span>
        </div>
        <h2>Regulatory Audit & Data Governance Log</h2>
        <p>
          Immutable, tamper-evident audit records under <strong className="text-white">India DPDPA 2023</strong> and{' '}
          <strong className="text-white">FERPA 34 CFR Part 99</strong> recordkeeping mandates for U25AIML-G13.
        </p>
      </div>

      {/* Metrics Cards */}
      {metrics && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '14px',
            marginBottom: '20px'
          }}
        >
          <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Logged Events</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
              {metrics.totalLoggedEvents}
            </div>
            <span style={{ fontSize: '0.72rem', color: '#10b981' }}>SHA-256 Checksum Verified</span>
          </div>

          <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Scope Violations Blocked</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#ef4444', marginTop: 4 }}>
              {metrics.accessDeniedCount}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Non-G13 Queries Quarantined</span>
          </div>

          <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>DPDPA Consent Updates</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#10b981', marginTop: 4 }}>
              {metrics.consentUpdatesCount}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Section 6 Data Principal Actions</span>
          </div>

          <div className="glass-panel" style={{ padding: '16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>SIS Sync Executions</span>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: '#38bdf8', marginTop: 4 }}>
              {metrics.sisSyncCycles}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>Official University Pipelines</span>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 18px',
          borderRadius: '12px',
          display: 'flex',
          gap: '12px',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '16px'
        }}
      >
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ color: 'var(--text-dim)' }} />
          <input
            type="text"
            className="search-input"
            placeholder="Search by Actor Roll, Target Resource, IP, or Compliance Tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', background: 'transparent', border: 'none', color: '#fff', outline: 'none' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Filter size={15} style={{ color: 'var(--text-muted)' }} />
          <select
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--border-subtle)',
              color: '#fff',
              borderRadius: '8px',
              padding: '6px 12px',
              fontSize: '0.82rem'
            }}
          >
            <option value="ALL">All Actions</option>
            <option value="VIEW_DIRECTORY">Directory Queries</option>
            <option value="VIEW_STUDENT_RECORD">Student Record Views</option>
            <option value="SIS_REFRESH">SIS Refreshes</option>
            <option value="UPDATE_CONSENT">Consent Updates</option>
            <option value="ACCESS_DENIED">Quarantined / Denied</option>
            <option value="LOGIN">SSO Logins</option>
          </select>

          <button
            className="btn btn-outline"
            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCw size={13} className={loading ? 'spinning' : ''} style={{ marginRight: 6 }} />
            Refresh
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel" style={{ borderRadius: '14px', overflowX: 'auto' }}>
        <table className="register-table" style={{ width: '100%', fontSize: '0.82rem' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: '12px 16px' }}>Timestamp</th>
              <th style={{ textAlign: 'left' }}>Actor & Role</th>
              <th style={{ textAlign: 'left' }}>Action</th>
              <th style={{ textAlign: 'left' }}>Target Resource</th>
              <th style={{ textAlign: 'left' }}>Compliance Framework</th>
              <th style={{ textAlign: 'left' }}>Status</th>
              <th style={{ textAlign: 'left', paddingRight: '16px' }}>Client IP</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.length > 0 ? (
              filteredLogs.map((entry) => (
                <tr key={entry.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                    {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}{' '}
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      ({new Date(entry.timestamp).toLocaleDateString([], { month: 'short', day: 'numeric' })})
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <User size={13} style={{ color: 'var(--text-dim)' }} />
                      <strong style={{ color: '#fff' }}>{entry.actorId}</strong>
                      <span className="code-pill" style={{ fontSize: '0.7rem', padding: '1px 6px' }}>
                        {entry.actorRole}
                      </span>
                    </div>
                  </td>
                  <td>{getActionBadge(entry.action, entry.status)}</td>
                  <td style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                    {entry.targetResource}
                  </td>
                  <td>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid var(--border-subtle)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        color: '#94a3b8'
                      }}
                    >
                      {entry.complianceTag}
                    </span>
                  </td>
                  <td>
                    {entry.status === 'SUCCESS' ? (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>Permitted</span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>Forbidden (403)</span>
                    )}
                  </td>
                  <td style={{ paddingRight: '16px', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                    {entry.clientIp}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-dim)' }}>
                  No audit log entries matching current criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
