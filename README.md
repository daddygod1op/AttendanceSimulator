# Chitkara University SIS Directory & Attendance Portal
## Batch 2025 AI & ML • Section Group U25AIML-G13

An official, enterprise-grade university student directory and attendance intelligence website built with documented authorization from **Chitkara University (CUIET)**. 

The system operates strictly within the authorized scope of the **2025 Computer Science & Engineering (AI & ML) Batch**, specifically the **U25AIML-G13 group of 70+ students** (quarantined from the broader batch of 1,600+ students).

> [!IMPORTANT]
> **No Web Scraping Policy:** All web scraping, headless browser automation, and credential-sniffing bypasses have been permanently decommissioned. The platform interfaces exclusively with the university's approved **Student Information System (SIS)** data sources.

---

## 🏛️ Supported University SIS Integration Adapters

The backend integration layer (`sisIntegrationService.js`) implements a pluggable multi-adapter architecture:

1. **Official SIS / Chalkpad ERP REST API**
   - Direct integration via `CHITKARA_SIS_API_URL` and backend Bearer API Key `CHITKARA_SIS_API_KEY`.
   - Never exposes credentials, secrets, or API keys to the frontend.
2. **Authorized University OAuth 2.0 / OpenID Connect (OIDC)**
   - Single Sign-On (SSO) integration supporting verified university accounts (`@chitkara.edu.in`).
3. **Secure Scheduled University Data Export Pipeline**
   - Automated ingestion of university-managed data exports with SHA-256 HMAC checksum verification.
4. **University-Managed Database View / Read-Only Service Account**
   - Connects to dedicated, read-only institutional views (e.g. `vw_u25aiml_g13_current_academic`).

---

## 🎯 Authorized Scope & Mandatory Data Display

In compliance with institutional charter boundaries:
- **Strict Scope Enforcement:** The system enforces boundary checks at the database and API layer. Any query or request attempting to access student records outside `U25AIML-G13` is immediately rejected with `403 Forbidden: OUT_OF_SCOPE_RESTRICTED` and flagged in the audit log.
- **Data Display for Each Authorized Student:**
  1. **Student Full Name**
  2. **Official Profile Photo:** Displayed where university approval and student consent are recorded; privacy-preserving institutional avatars are rendered when consent is withheld.
  3. **Latest Academic Grades:** Current Semester SGPA, Cumulative CGPA, Internal Assessment marks (e.g. 29/30), and course-level letter grades (CS101–CS105).
  4. **Latest Attendance Record:** Calculated percentage against statutory 75% threshold, total classes held vs. attended, lecture progress, and course-by-course breakdown.
- **Data Freshness Guarantee:** Refreshed records are tagged with `Academic Year 2025-2026, Semester 3 (Current Enrolled)` and verified sync batch IDs to ensure no outdated or previous-year data is displayed.

---

## 🛡️ Security, Cryptography & Role-Based Access Control (RBAC)

- **AES-256-GCM Field-Level Encryption:** Sensitive student personal data and identifiers are encrypted at rest using server-side keys (`cryptoService.js`).
- **Zero Frontend Credential Exposure:** All auth tokens and API secrets reside in server memory or signed HMAC-SHA256 bearer tokens.
- **Role-Based Access Control (RBAC):**
  - `STUDENT`: Authorized G13 member. Can view the G13 directory (respecting peers' privacy consent), plus their own full academic file and attendance register.
  - `FACULTY_MENTOR`: Course coordinator & advisor (e.g., Dr. Monica Jain). Can view aggregated cohort metrics, individual academic files, and export statutory compliance rosters.
  - `INSTITUTIONAL_ADMIN`: University SIS Administrator. Can trigger live SIS sync cycles, inspect tamper-evident audit logs, and manage compliance keys.

---

## 📜 Regulatory & Privacy Compliance

### 1. India’s Digital Personal Data Protection Act (DPDPA 2023)
- **Section 6 Notice & Consent:** Clear statutory notice specifying data fiduciary details, purpose limitation (G13 peer study groups and attendance compliance), and retention rules.
- **Granular Student Consent Controls:** Students can toggle photo directory visibility, grade directory visibility, and contact email display at any time (`PrivacyConsentModal.jsx`).
- **Data Principal Rights:** Mechanism to exercise right to access (Sec. 11), right to correction (Sec. 12), and right to withdraw consent (Sec. 6(4)).

### 2. FERPA (34 CFR Part 99) Benchmark Standards
- Separation between **Directory Information** and **Non-Directory Education Records** (grades require explicit student consent or authorized educational interest).
- 34 CFR § 99.32 Recordkeeping: Immutable audit log tracking every request for educational records.

### 3. Immutable Audit Logging
- Every directory query, record access, SIS refresh, and consent change is appended to `audit_trail.log` with SHA-256 cryptographic integrity hashes (`auditLogger.js`).
- Searchable and filterable in real time via the **Compliance & Audit Logs** dashboard tab.

---

## 📁 System Architecture

```
Attendance/
├── client/                                # React 19 + Vite Dashboard
│   ├── src/
│   │   ├── components/
│   │   │   ├── BatchmatesDirectory.jsx    # Scoped G13 Student Directory with Photos, Grades & Attendance
│   │   │   ├── PrivacyConsentModal.jsx    # DPDPA 2023 / FERPA Student Privacy & Consent Controls
│   │   │   ├── AuditLogViewer.jsx         # Statutory Regulatory Audit Trail & Governance Monitor
│   │   │   ├── LoginModal.jsx             # Institutional Single Sign-On (SSO) & OAuth 2.0 Portal
│   │   │   ├── Navbar.jsx                 # Header, DPDPA triggers, SIS sync & role badge
│   │   │   ├── OverallAttendanceCard.jsx  # Hero circular gauge & bunk/attend calculator
│   │   │   ├── SubjectCard.jsx            # Enrolled course cards & statutory warnings
│   │   │   ├── AttendanceRegister.jsx     # Date-wise timetable & calendar
│   │   │   ├── PerformanceMarks.jsx       # Marks, SGPA, CGPA & transcripts
│   │   │   └── CircularsFeed.jsx          # Official university circulars & notices
│   │   ├── App.jsx                        # Master orchestrator & view router
│   │   └── index.css                      # Obsidian glassmorphic design system
│   └── vite.config.js                     # Proxies /api to backend (port 5000)
│
├── server/                                # Node.js + Express Backend
│   ├── server.js                          # REST API & RBAC Route Controller
│   ├── sisIntegrationService.js           # Multi-Adapter Official University SIS Provider
│   ├── authService.js                     # Institutional SSO, OAuth 2.0 & Role Authorization
│   ├── cryptoService.js                   # AES-256-GCM Encryption & HMAC Token Signing
│   ├── auditLogger.js                     # Immutable Audit Logger with Checksums
│   ├── consentService.js                  # DPDPA 2023 & FERPA Consent Manager
│   └── g13_verified_list.json             # Verified Authorized 72 Students in U25AIML-G13
│
└── start.js                               # Full-stack orchestrator script
```

---

## 🚀 Running the Application

### Prerequisites
- Node.js (v18+)
- npm

### 1. Run the Full Application
```bash
node start.js
```
This concurrently boots:
- **Backend API:** `http://localhost:5000` (Official SIS REST API & Scope Enforcer)
- **Frontend Dashboard:** `http://localhost:5173` (React 19 + Vite Client)

### 2. Verify Endpoints
- Directory: `GET http://localhost:5000/api/batchmates`
- Student Record: `GET http://localhost:5000/api/batchmates/2510990000`
- Scope Quarantine Test: `GET http://localhost:5000/api/batchmates/2510990646` (Returns `403 Forbidden`)
- SIS Refresh: `POST http://localhost:5000/api/sis/refresh`
- Audit Logs: `GET http://localhost:5000/api/compliance/audit-logs`
