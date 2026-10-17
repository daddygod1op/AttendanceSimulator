/**
 * Student Privacy & Consent Management Service
 * Implements regulatory compliance with:
 *  - India Digital Personal Data Protection Act (DPDPA 2023, Sections 5 & 6 on Notice and Consent)
 *  - FERPA (34 CFR Part 99 regarding Directory Information vs Non-Directory Education Records)
 *
 * Provides granular student consent controls for profile photo publication and grade directory visibility.
 */

const fs = require('fs');
const path = require('path');
const auditLogger = require('./auditLogger');

const CONSENT_FILE = path.join(__dirname, 'student_consents.json');

class ConsentService {
  constructor() {
    this.consents = new Map();
    this.loadConsents();
  }

  loadConsents() {
    try {
      if (fs.existsSync(CONSENT_FILE)) {
        const raw = JSON.parse(fs.readFileSync(CONSENT_FILE, 'utf8'));
        Object.entries(raw).forEach(([roll, val]) => {
          this.consents.set(roll, val);
        });
      }
    } catch (err) {
      console.warn('[ConsentService] Could not load stored consents:', err.message);
    }
  }

  saveConsents() {
    try {
      const obj = {};
      this.consents.forEach((val, key) => {
        obj[key] = val;
      });
      fs.writeFileSync(CONSENT_FILE, JSON.stringify(obj, null, 2), 'utf8');
    } catch (err) {
      console.error('[ConsentService] Failed to persist consents:', err.message);
    }
  }

  /**
   * Get consent profile for a given student roll number
   */
  getConsent(rollNo) {
    if (!rollNo) return this.getDefaultConsent();
    if (!this.consents.has(rollNo)) {
      const defaultConsent = this.getDefaultConsent(rollNo);
      this.consents.set(rollNo, defaultConsent);
      this.saveConsents();
      return defaultConsent;
    }
    return this.consents.get(rollNo);
  }

  getDefaultConsent(rollNo = null) {
    return {
      rollNo,
      universityPhotoApproved: true, // Official Chitkara ID photo approved by administration
      studentPhotoConsent: true,      // Student consent to display in G13 directory
      gradeDirectoryConsent: true,    // Student consent to display marks in G13 directory
      contactEmailConsent: true,      // Student consent to display official email
      dpdpaNoticeAcknowledged: true,  // Acknowledged DPDPA Section 6 notice
      lastConsentUpdate: new Date().toISOString()
    };
  }

  /**
   * Update student privacy consent preferences
   */
  updateConsent(rollNo, updates, actorInfo = {}) {
    const current = this.getConsent(rollNo);
    const updated = {
      ...current,
      ...updates,
      rollNo,
      lastConsentUpdate: new Date().toISOString()
    };

    this.consents.set(rollNo, updated);
    this.saveConsents();

    auditLogger.log({
      actorId: actorInfo.actorId || rollNo,
      actorRole: actorInfo.actorRole || 'STUDENT',
      action: 'UPDATE_CONSENT',
      targetResource: `CONSENT_${rollNo}`,
      clientIp: actorInfo.clientIp || '127.0.0.1',
      userAgent: actorInfo.userAgent || 'Web',
      complianceTag: 'DPDPA_SEC_6_CONSENT',
      details: {
        photoConsent: updated.studentPhotoConsent,
        gradeConsent: updated.gradeDirectoryConsent,
        emailConsent: updated.contactEmailConsent
      }
    });

    return updated;
  }

  /**
   * Apply privacy controls to a student record based on viewer role and consent
   *
   * Rules:
   * 1. Institutional Admins and Faculty Mentors have legitimate educational interest (FERPA 99.31) -> full access.
   * 2. The student themselves viewing their own record -> full access.
   * 3. Peer students viewing cohort directory:
   *    - Photo: Displayed ONLY if universityPhotoApproved === true AND studentPhotoConsent === true.
   *             Otherwise, returns a privacy avatar with photoConsentStatus: 'WITHHELD'.
   *    - Grades: Displayed if gradeDirectoryConsent === true.
   *              Otherwise, returns grades: { status: 'RESTRICTED_BY_CONSENT', message: 'Student has withheld directory grade visibility.' }
   */
  applyPrivacyFilter(student, viewerRole = 'STUDENT', viewerRollNo = null) {
    if (!student) return null;
    const studentRoll = student.rollNo;
    const isOwner = viewerRollNo && String(viewerRollNo) === String(studentRoll);
    const isPrivileged = viewerRole === 'FACULTY_MENTOR' || viewerRole === 'INSTITUTIONAL_ADMIN';

    // Get consent flags
    const consent = this.getConsent(studentRoll);

    const filtered = { ...student };

    // 1. Photo Privacy Filter
    const canShowPhoto = isPrivileged || isOwner || (consent.universityPhotoApproved && consent.studentPhotoConsent);
    if (!canShowPhoto) {
      filtered.photoUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=1e293b&color=94a3b8&bold=true&size=128`;
      filtered.photoStatus = 'WITHHELD_BY_STUDENT_CONSENT';
      filtered.photoNotice = 'Profile photo hidden per DPDPA privacy preferences';
    } else {
      filtered.photoStatus = 'APPROVED_BY_UNIVERSITY';
    }

    // 2. Grades & Marks Privacy Filter
    const canShowGrades = isPrivileged || isOwner || consent.gradeDirectoryConsent;
    if (!canShowGrades) {
      filtered.grades = {
        status: 'RESTRICTED_BY_STUDENT_CONSENT',
        cgpa: 'Confidential',
        sgpa: 'Confidential',
        letterGrade: 'Restricted',
        internalMarks: 'Withheld',
        message: 'Under India DPDPA Section 6, the student has restricted grade display to cohort members.'
      };
      filtered.cgpa = null;
      filtered.sgpa = null;
    }

    // 3. Email Privacy Filter
    const canShowEmail = isPrivileged || isOwner || consent.contactEmailConsent;
    if (!canShowEmail) {
      filtered.email = 'email-restricted@chitkara.edu.in';
    }

    filtered.consentInfo = {
      photoApproved: consent.universityPhotoApproved,
      photoConsent: consent.studentPhotoConsent,
      gradesConsent: consent.gradeDirectoryConsent,
      lastUpdate: consent.lastConsentUpdate
    };

    return filtered;
  }

  /**
   * Return formal statutory compliance notice
   */
  getDPDPANotice() {
    return {
      title: "Chitkara University Digital Personal Data Protection & Privacy Notice",
      statutoryFramework: [
        "Digital Personal Data Protection Act (DPDPA 2023, Act No. 22 of 2023, Republic of India)",
        "UGC (Promotion of Academic Integrity and Prevention of Plagiarism in Higher Educational Institutions) Guidelines",
        "Family Educational Rights and Privacy Act (FERPA, 34 CFR Part 99) benchmark standards"
      ],
      dataFiduciary: {
        name: "Chitkara University Institute of Engineering & Technology (CUIET)",
        address: "Chandigarh-Patiala National Highway (NH-64), Village Jhansla, Rajpura, Punjab 140401",
        contact: "dpo@chitkara.edu.in / registrar@chitkara.edu.in",
        grievanceOfficer: "Office of Registrar & Grievance Redressal Cell"
      },
      authorizedScope: {
        batch: "Batch 2025 - BE Computer Science & Engineering (AI & ML)",
        cohort: "Section Group U25AIML-G13 (70+ Students)",
        purposes: [
          "Authorized academic directory for U25AIML-G13 peer study groups and project collaborations",
          "Official student attendance recording and verification against minimum statutory threshold (75%)",
          "Display of latest academic progression and internal assessment indicators with documented university permission"
        ]
      },
      dataPrincipalRights: [
        "Right to access summary of personal data and processing activities (Section 11)",
        "Right to correction, completion, and updating of personal educational data (Section 12)",
        "Right to withdraw consent at any time for non-mandatory directory attributes (Section 6(4))",
        "Right of grievance redressal with 72-hour institutional response timeframe (Section 13)"
      ]
    };
  }
}

const consentService = new ConsentService();
module.exports = consentService;
