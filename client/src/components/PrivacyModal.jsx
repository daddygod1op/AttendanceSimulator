import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Database,
  FileCheck2,
  Info
} from 'lucide-react';

export default function PrivacyModal({ isOpen, onClose, onDataPurged }) {
  const [purging, setPurging] = useState(false);
  const [purgedSuccess, setPurgedSuccess] = useState(false);

  if (!isOpen) return null;

  const handlePurge = async () => {
    if (!window.confirm('Are you sure you want to delete all cached session tokens, cookies, and local attendance records from this device?')) {
      return;
    }

    setPurging(true);
    try {
      const res = await fetch('/api/auth/purge-data', { method: 'POST' });
      if (res.ok) {
        localStorage.removeItem('chitkara_session_data');
        setPurgedSuccess(true);
        if (onDataPurged) {
          onDataPurged();
        }
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (e) {
      console.error('Failed to purge data:', e);
    } finally {
      setPurging(false);
    }
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onClick={onClose}
      style={{ zIndex: 2000, backgroundColor: 'rgba(3, 7, 18, 0.92)' }}
    >
      <div
        className="login-modal-container animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '560px',
          width: '92%',
          maxHeight: '90vh',
          overflowY: 'auto',
          backgroundColor: '#0f172a',
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.98)'
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
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
                Privacy & Data Protection Notice
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Chitkara University CUIET Portal Convenience Dashboard
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {purgedSuccess ? (
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '10px',
                padding: '20px',
                textAlign: 'center',
                color: '#10b981'
              }}
            >
              <CheckCircle2 size={36} style={{ margin: '0 auto 10px auto' }} />
              <h4 style={{ margin: '0 0 6px 0', color: '#fff' }}>All Personal Data Purged</h4>
              <p style={{ margin: 0, fontSize: '0.85rem' }}>
                All session tokens, cookies, and cached attendance files have been permanently erased from disk and memory.
              </p>
            </div>
          ) : (
            <div>
              {/* Notice Section 1: What Data is Accessed */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Database size={15} style={{ color: '#38bdf8' }} />
                  <span>1. What Data is Accessed</span>
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  The application retrieves only your personal educational records directly from your authenticated CUIET CodeBrigade account:
                  lecture-by-lecture attendance timestamps, subject list, weekly timetable, semester grades, and university circulars.
                </p>
              </div>

              {/* Notice Section 2: Why */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Info size={15} style={{ color: '#f59e0b' }} />
                  <span>2. Why This Data is Accessed</span>
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  The official portal requires mobile OTP verification every time it is reopened and does not provide an interactive calendar view. This dashboard stores your encrypted session cookie to eliminate repeat OTP prompts and renders your attendance in an interactive calendar and date-wise register.
                </p>
              </div>

              {/* Notice Section 3: Isolation Guarantee */}
              <div style={{ marginBottom: '16px' }}>
                <h4 style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Lock size={15} style={{ color: '#10b981' }} />
                  <span>3. Single-Student Isolation Guarantee</span>
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  This dashboard is strictly isolated to <strong>your own student profile</strong>. It does not query, display, infer, or store any other student’s personal data, batchmate rosters, photos, or marks.
                </p>
              </div>

              {/* Notice Section 4: Storage & Key Management */}
              <div style={{ marginBottom: '20px' }}>
                <h4 style={{ color: '#fff', fontSize: '0.9rem', margin: '0 0 6px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <FileCheck2 size={15} style={{ color: 'var(--primary)' }} />
                  <span>4. Storage & Encryption</span>
                </h4>
                <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  Session cookies and attendance records are stored locally and encrypted using <strong>AES-256-GCM authenticated encryption</strong> with secure server-side keys. No credentials, OTPs, or passwords are ever exposed in frontend client code.
                </p>
              </div>

              {/* Danger Zone: Purge Button */}
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  borderRadius: '10px',
                  padding: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 12
                }}
              >
                <div>
                  <strong style={{ color: '#fca5a5', fontSize: '0.88rem' }}>Delete All Stored Data</strong>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Wipe all encrypted cookies, cached attendance, and logout immediately.
                  </p>
                </div>

                <button
                  className="btn btn-outline-danger"
                  onClick={handlePurge}
                  disabled={purging}
                  style={{ fontSize: '0.82rem', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <Trash2 size={14} />
                  <span>{purging ? 'Purging...' : 'Purge My Data'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
