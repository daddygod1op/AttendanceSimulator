import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  UserCheck,
  FileText,
  AlertTriangle,
  CheckCircle2,
  X,
  ExternalLink,
  HelpCircle,
  Scale
} from 'lucide-react';

export default function PrivacyConsentModal({ isOpen, onClose, currentStudent, onConsentUpdated }) {
  const [photoConsent, setPhotoConsent] = useState(true);
  const [gradeConsent, setGradeConsent] = useState(true);
  const [emailConsent, setEmailConsent] = useState(true);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState('preferences'); // 'preferences' | 'statutory_notice'

  useEffect(() => {
    if (isOpen) {
      setSavedSuccess(false);
      fetch('/api/compliance/consent')
        .then((r) => r.json())
        .then((data) => {
          if (data?.consent) {
            setPhotoConsent(data.consent.studentPhotoConsent ?? true);
            setGradeConsent(data.consent.gradeDirectoryConsent ?? true);
            setEmailConsent(data.consent.contactEmailConsent ?? true);
          }
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSavePreferences = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/compliance/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentPhotoConsent: photoConsent,
          gradeDirectoryConsent: gradeConsent,
          contactEmailConsent: emailConsent
        })
      });

      const data = await res.json();
      if (res.ok) {
        setSavedSuccess(true);
        if (onConsentUpdated) {
          onConsentUpdated(data.consent);
        }
        setTimeout(() => {
          setSavedSuccess(false);
        }, 3000);
      }
    } catch (e) {
      console.error('Failed to update consent:', e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-backdrop animate-fade-in" onClick={onClose} style={{ zIndex: 1100 }}>
      <div
        className="login-modal-container glass-panel animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
                border: '1px solid rgba(16,185,129,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#10b981'
              }}
            >
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>
                Student Privacy & Consent Controls
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                India DPDPA 2023 & FERPA Educational Privacy Governance
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '8px', padding: '12px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <button
            className={`btn ${activeTab === 'preferences' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.84rem', padding: '6px 14px' }}
            onClick={() => setActiveTab('preferences')}
          >
            <UserCheck size={14} style={{ marginRight: 6 }} />
            My Consent Preferences
          </button>
          <button
            className={`btn ${activeTab === 'statutory_notice' ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: '0.84rem', padding: '6px 14px' }}
            onClick={() => setActiveTab('statutory_notice')}
          >
            <Scale size={14} style={{ marginRight: 6 }} />
            DPDPA & FERPA Notice
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px' }}>
          {activeTab === 'preferences' ? (
            <div>
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '12px',
                  padding: '12px 16px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <HelpCircle size={18} style={{ color: '#38bdf8', marginTop: 2, flexShrink: 0 }} />
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#bae6fd', lineHeight: 1.5 }}>
                    Under Section 6(4) of India’s <strong>Digital Personal Data Protection Act (DPDPA 2023)</strong> and FERPA 34 CFR Part 99,
                    you have the statutory right to specify how your educational data and directory items are shared with cohort members.
                  </p>
                </div>
              </div>

              {/* Toggle 1: Photo Display */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  marginBottom: '12px'
                }}
              >
                <div style={{ maxWidth: '80%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Eye size={16} style={{ color: photoConsent ? '#10b981' : 'var(--text-dim)' }} />
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                      Publish Official Profile Photo in Directory
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 24px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Display your official university-approved portrait in the U25AIML-G13 student directory. If toggled off, a privacy-preserving institutional monogram is shown.
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={photoConsent}
                    onChange={(e) => setPhotoConsent(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {/* Toggle 2: Grades Directory Visibility */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  marginBottom: '12px'
                }}
              >
                <div style={{ maxWidth: '80%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Lock size={16} style={{ color: gradeConsent ? '#10b981' : 'var(--text-dim)' }} />
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                      Display Academic CGPA to G13 Classmates
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 24px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Allow verified G13 cohort peers to view your academic grade tier. (Faculty Mentors and University Administrators retain access for institutional advising).
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={gradeConsent}
                    onChange={(e) => setGradeConsent(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {/* Toggle 3: Contact Email */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '12px',
                  marginBottom: '20px'
                }}
              >
                <div style={{ maxWidth: '80%' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <CheckCircle2 size={16} style={{ color: emailConsent ? '#10b981' : 'var(--text-dim)' }} />
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.92rem' }}>
                      Display Official University Email
                    </span>
                  </div>
                  <p style={{ margin: '4px 0 0 24px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Display your official @chitkara.edu.in institutional email address for peer study group communication.
                  </p>
                </div>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={emailConsent}
                    onChange={(e) => setEmailConsent(e.target.checked)}
                  />
                  <span className="slider round"></span>
                </label>
              </div>

              {savedSuccess && (
                <div
                  style={{
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    borderRadius: '8px',
                    padding: '10px 14px',
                    color: '#10b981',
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: '16px'
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>Your privacy consent preferences have been updated and securely logged in the audit trail.</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn btn-outline" onClick={onClose} disabled={loading}>
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleSavePreferences}
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <ShieldCheck size={16} />
                  <span>{loading ? 'Saving...' : 'Save Privacy Preferences'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <div
                style={{
                  background: 'rgba(230, 57, 70, 0.08)',
                  border: '1px solid rgba(230, 57, 70, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginBottom: '16px',
                  color: '#fca5a5'
                }}
              >
                <strong style={{ color: '#fff' }}>Statutory Authority & Scope Charter</strong>
                <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem' }}>
                  This application operates under documented university authorization exclusively for
                  <strong> Chitkara University (CUIET) • Batch 2025 AI & ML (Group U25AIML-G13)</strong>.
                </p>
              </div>

              <h4 style={{ color: '#fff', margin: '14px 0 6px 0', fontSize: '0.92rem' }}>
                1. Data Fiduciary & Contact Notice (DPDPA 2023 Sec. 6)
              </h4>
              <p>
                <strong>Data Fiduciary:</strong> Chitkara University Institute of Engineering & Technology (CUIET).<br />
                <strong>Grievance Officer:</strong> Office of the Registrar & Student Records Cell (dpo@chitkara.edu.in).
              </p>

              <h4 style={{ color: '#fff', margin: '14px 0 6px 0', fontSize: '0.92rem' }}>
                2. Purpose Specification & Educational Use
              </h4>
              <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
                <li>Displaying the latest official academic directory for authorized U25AIML-G13 peer collaboration.</li>
                <li>Displaying verified attendance records against statutory minimum (75%) semester requirements.</li>
                <li>Displaying current academic progression (SGPA/CGPA) with explicit student consent.</li>
              </ul>

              <h4 style={{ color: '#fff', margin: '14px 0 6px 0', fontSize: '0.92rem' }}>
                3. Scope Boundary Enforcement
              </h4>
              <p>
                Access is strictly quarantined to the authorized 72 students of U25AIML-G13. In accordance with university policy,
                no records for other university sections (CSE, ECE, or other batches) can be queried or retrieved.
              </p>

              <h4 style={{ color: '#fff', margin: '14px 0 6px 0', fontSize: '0.92rem' }}>
                4. Data Principal Statutory Rights
              </h4>
              <p>
                Under Section 11, 12, and 13 of DPDPA 2023, you have the right to access summaries of personal data processed,
                request correction of errors, withdraw directory consent, and seek grievance redressal within 72 hours.
              </p>

              <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button className="btn btn-outline" onClick={() => setActiveTab('preferences')}>
                  Back to Consent Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
