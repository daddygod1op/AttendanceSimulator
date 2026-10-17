import React, { useState, useEffect } from 'react';
import {
  X,
  Globe,
  Key,
  Shield,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Lock,
  User,
  Calendar,
  Eye,
  EyeOff,
  Smartphone,
  RotateCw,
  ArrowLeft,
  Sparkles,
  FileSpreadsheet,
  Upload,
  Info
} from 'lucide-react';
import { getDeviceSessionId } from '../utils/sessionHelper';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
  // Tabs: 'automated' (credentials + OTP) | 'cookie' | 'import'
  const [activeTab, setActiveTab] = useState('automated');

  // Credentials state
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [session, setSession] = useState('20'); // JulDec2026 default
  const [showPassword, setShowPassword] = useState(false);

  // OTP state
  const [step, setStep] = useState('credentials'); // 'credentials' | 'otp'
  const [otp, setOtp] = useState('');
  const [otpMessage, setOtpMessage] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  // Status & loading
  const [loading, setLoading] = useState(false);
  const [loginStepStatus, setLoginStepStatus] = useState('');
  const [error, setError] = useState(null);

  // Import tab state
  const [importFileName, setImportFileName] = useState('');
  const [importLoading, setImportLoading] = useState(false);

  // Cooldown timer for OTP resend
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Elapsed seconds timer when loading
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  useEffect(() => {
    let timer;
    if (loading) {
      setElapsedSeconds(0);
      timer = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      setElapsedSeconds(0);
    }
    return () => clearInterval(timer);
  }, [loading]);

  // Poll login step status from server while loading
  useEffect(() => {
    let interval;
    if (loading) {
      interval = setInterval(async () => {
        try {
          const sessionId = getDeviceSessionId();
          const res = await fetch('/api/status', {
            headers: { 'x-session-id': sessionId }
          });
          const data = await res.json();
          if (data.loginStep) {
            setLoginStepStatus(data.loginStep);
          }
        } catch (e) {}
      }, 800);
    }
    return () => clearInterval(interval);
  }, [loading]);

  if (!isOpen) return null;

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Please enter both your Roll Number / Username and Portal Password.');
      return;
    }

    setError(null);
    setLoading(true);
    setLoginStepStatus({ step: 1, totalSteps: 4, label: 'Connecting to Portal', detail: 'Contacting CUIET server...' });

    try {
      const sessionId = getDeviceSessionId();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({
          username: username.trim(),
          password,
          session,
          sessionId
        })
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Login failed. Please check your credentials.');
      }

      // Check if portal required OTP verification
      if (data.requiresOtp) {
        setStep('otp');
        setOtpMessage(data.message || 'OTP dispatched to your registered mobile number / email.');
        setResendCooldown(60);
        setLoading(false);
        setLoginStepStatus('');
        return;
      }

      // Succeeded directly
      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoginStepStatus('');
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the 4-digit OTP.');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const sessionId = getDeviceSessionId();
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ otp: otp.trim(), sessionId })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify OTP.');
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    try {
      const sessionId = getDeviceSessionId();
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        }
      });
      const data = await res.json();
      if (data.success) {
        setResendCooldown(60);
      } else {
        setError(data.error || 'Failed to resend OTP.');
      }
    } catch (e) {
      setError('Failed to contact server to resend OTP.');
    }
  };

  const handleInteractivePortalLaunch = async () => {
    setError(null);
    setLoading(true);
    setLoginStepStatus({
      step: 2,
      totalSteps: 3,
      label: 'Interactive Portal Window Active',
      detail: 'Complete your login in the browser window on your desktop. This app will auto-detect your session.'
    });

    try {
      const sessionId = getDeviceSessionId();
      const res = await fetch('/api/auth/launch-interactive-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ username, password, session, sessionId })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Interactive portal session ended before login.');
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      }
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoginStepStatus('');
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportLoading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        let jsonPayload = null;

        // Try parsing JSON directly
        try {
          jsonPayload = JSON.parse(text);
        } catch (jsonErr) {
          // If not JSON, send raw text to server
          jsonPayload = { rawContent: text };
        }

        const sessionId = getDeviceSessionId();
        const res = await fetch('/api/attendance/import', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-session-id': sessionId
          },
          body: JSON.stringify({
            fileName: file.name,
            jsonContent: jsonPayload,
            sessionId
          })
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || 'Failed to process official export file.');
        }

        if (onLoginSuccess) {
          onLoginSuccess(data.data);
        }
        onClose();
      } catch (err) {
        setError(err.message || 'Failed to parse official export.');
      } finally {
        setImportLoading(false);
      }
    };

    reader.onerror = () => {
      setError('Could not read the selected file.');
      setImportLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onClick={onClose}
      style={{
        zIndex: 2000,
        backgroundColor: 'rgba(3, 7, 18, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)'
      }}
    >
      <div
        className="login-modal-container animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '540px',
          width: '94%',
          backgroundColor: '#0f172a',
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '16px',
          boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.98), 0 0 0 1px rgba(255, 255, 255, 0.1)',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            backgroundColor: '#1e293b',
            background: '#1e293b',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              className="brand-logo-badge"
              style={{
                width: 38,
                height: 38,
                background: '#ffffff',
                padding: '2px 4px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0
              }}
            >
              <img
                src="/chitkara_logo.png"
                alt="Chitkara University"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#fff', fontWeight: 700 }}>
                Connect to CUIET CodeBrigade Portal
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Personal Student Attendance & Calendar Dashboard
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            backgroundColor: '#090d16',
            background: '#090d16'
          }}
        >
          <button
            className={`tab-btn ${activeTab === 'automated' ? 'active' : ''}`}
            onClick={() => { setActiveTab('automated'); setError(null); }}
            style={{
              flex: 1,
              padding: '12px 10px',
              fontSize: '0.84rem',
              backgroundColor: activeTab === 'automated' ? '#1e293b' : '#090d16',
              color: activeTab === 'automated' ? '#fff' : 'var(--text-muted)',
              borderBottom: activeTab === 'automated' ? '2px solid #ef4444' : '2px solid transparent',
              fontWeight: activeTab === 'automated' ? 700 : 500,
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer'
            }}
          >
            <User size={15} style={{ marginRight: 6 }} />
            Portal Sign In
          </button>

          <button
            className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => { setActiveTab('import'); setError(null); }}
            style={{
              flex: 1,
              padding: '12px 10px',
              fontSize: '0.84rem',
              backgroundColor: activeTab === 'import' ? '#1e293b' : '#090d16',
              color: activeTab === 'import' ? '#fff' : 'var(--text-muted)',
              borderBottom: activeTab === 'import' ? '2px solid #ef4444' : '2px solid transparent',
              fontWeight: activeTab === 'import' ? 700 : 500,
              borderTop: 'none',
              borderLeft: 'none',
              borderRight: 'none',
              cursor: 'pointer'
            }}
          >
            <FileSpreadsheet size={15} style={{ marginRight: 6 }} />
            Import Export
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '24px', backgroundColor: '#0f172a', background: '#0f172a' }}>
          {error && (
            <div
              className="alert-banner error"
              style={{ marginBottom: '18px', padding: '10px 14px', borderRadius: '10px', fontSize: '0.85rem' }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* TAB 1: CREDENTIALS & OTP */}
          {activeTab === 'automated' && (
            <div>
              {step === 'credentials' ? (
                <form onSubmit={handleCredentialsSubmit} autoComplete="off">
                  {/* Roll Number / Username */}
                  <div className="auth-input-group">
                    <div className="auth-input-label">
                      <span>Roll Number / CUIET Username</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        e.g. University Roll Number
                      </span>
                    </div>
                    <div className="auth-input-wrapper">
                      <User size={16} className="auth-input-icon" />
                      <input
                        type="text"
                        name="cuiet_username"
                        autoComplete="off"
                        className="auth-input"
                        placeholder="Enter your university roll number"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        id="cuiet-roll-input"
                        style={{
                          backgroundColor: '#1e293b',
                          background: '#1e293b',
                          border: '1px solid rgba(255, 255, 255, 0.16)',
                          color: '#ffffff',
                          borderRadius: '10px',
                          padding: '12px 14px 12px 42px',
                          width: '100%'
                        }}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="auth-input-group">
                    <div className="auth-input-label">
                      <span>CUIET Portal Password</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                        Official Chalkpad password
                      </span>
                    </div>
                    <div className="auth-input-wrapper">
                      <Lock size={16} className="auth-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="cuiet_pass"
                        autoComplete="new-password"
                        className="auth-input"
                        placeholder="Enter your official portal password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        id="cuiet-password-input"
                        style={{
                          backgroundColor: '#1e293b',
                          background: '#1e293b',
                          border: '1px solid rgba(255, 255, 255, 0.16)',
                          color: '#ffffff',
                          borderRadius: '10px',
                          padding: '12px 42px 12px 42px',
                          width: '100%'
                        }}
                      />
                      <button
                        type="button"
                        className="auth-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Academic Session */}
                  <div className="auth-input-group">
                    <div className="auth-input-label">
                      <span>Academic Session</span>
                      <span style={{ fontSize: '0.72rem', color: '#10b981' }}>
                        Active 2026-27
                      </span>
                    </div>
                    <div className="auth-input-wrapper">
                      <Calendar size={16} className="auth-input-icon" />
                      <select
                        value={session}
                        onChange={(e) => setSession(e.target.value)}
                        className="auth-input"
                        id="cuiet-session-select"
                        style={{
                          backgroundColor: '#1e293b',
                          background: '#1e293b',
                          border: '1px solid rgba(255, 255, 255, 0.16)',
                          color: '#ffffff',
                          borderRadius: '10px',
                          padding: '12px 14px 12px 42px',
                          width: '100%'
                        }}
                      >
                        <option value="20">JulDec2026 (Semester 3 AI & ML - Active)</option>
                        <option value="19">JanJun2026 (Semester 2)</option>
                        <option value="18">JulDec2025 (Semester 1)</option>
                      </select>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    style={{
                      width: '100%',
                      padding: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8
                    }}
                  >
                    {loading ? (
                      <>
                        <Loader2 size={16} className="spinning" />
                        <span>Verifying & Connecting... ({elapsedSeconds}s)</span>
                      </>
                    ) : (
                      <>
                        <Shield size={16} />
                        <span>Log In & Retrieve Records</span>
                      </>
                    )}
                  </button>

                  {/* Interactive desktop window fallback button */}
                  <div style={{ marginTop: '14px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={handleInteractivePortalLaunch}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#38bdf8',
                        fontSize: '0.78rem',
                        cursor: 'pointer',
                        textDecoration: 'underline'
                      }}
                    >
                      Having trouble with CAPTCHA / OTP? Open Interactive Desktop Portal Window
                    </button>
                  </div>
                </form>
              ) : (
                /* OTP STEP */
                <form onSubmit={handleVerifyOtp}>
                  <div
                    style={{
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      borderRadius: '10px',
                      padding: '12px 14px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10
                    }}
                  >
                    <Smartphone size={20} style={{ color: '#38bdf8', flexShrink: 0, marginTop: 2 }} />
                    <p style={{ margin: 0, fontSize: '0.84rem', color: '#bae6fd', lineHeight: 1.5 }}>
                      {otpMessage || 'A one-time password has been sent to your registered mobile / email. Enter it below to complete sign in.'}
                    </p>
                  </div>

                  <div style={{ marginBottom: '18px' }}>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6 }}>
                      Enter 4-Digit OTP
                    </label>
                    <input
                      type="text"
                      maxLength={6}
                      className="auth-input"
                      placeholder="e.g. 1234"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      required
                      autoFocus
                      id="cuiet-otp-input"
                      style={{
                        fontSize: '1.4rem',
                        textAlign: 'center',
                        letterSpacing: '8px',
                        fontFamily: 'monospace',
                        fontWeight: 800,
                        padding: '12px',
                        backgroundColor: '#1e293b',
                        background: '#1e293b',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        color: '#fff'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setStep('credentials')}
                      style={{ padding: '10px 14px', fontSize: '0.85rem' }}
                    >
                      <ArrowLeft size={15} style={{ marginRight: 4 }} />
                      Back
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading}
                      style={{ flex: 1, padding: '10px', fontSize: '0.92rem', fontWeight: 700 }}
                    >
                      {loading ? 'Verifying OTP...' : 'Verify & Continue'}
                    </button>
                  </div>

                  <div style={{ marginTop: '12px', textAlign: 'center' }}>
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={resendCooldown > 0}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: resendCooldown > 0 ? 'var(--text-dim)' : 'var(--primary)',
                        fontSize: '0.78rem',
                        cursor: resendCooldown > 0 ? 'default' : 'pointer'
                      }}
                    >
                      {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: IMPORT OFFICIAL EXPORT */}
          {activeTab === 'import' && (
            <div>
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  marginBottom: '16px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <FileSpreadsheet size={16} style={{ color: '#38bdf8' }} />
                  <strong style={{ color: '#38bdf8', fontSize: '0.86rem' }}>Import Official Downloaded Export</strong>
                </div>
                <p style={{ margin: 0, fontSize: '0.78rem', color: '#bae6fd', lineHeight: 1.45 }}>
                  If portal automation is blocked, download your newest official attendance or grades file from your CUIET account and upload it here. Your dashboard will immediately populate with your real official records.
                </p>
              </div>

              <div
                style={{
                  border: '2px dashed rgba(255, 255, 255, 0.2)',
                  borderRadius: '12px',
                  padding: '30px 20px',
                  textAlign: 'center',
                  background: '#162032',
                  backgroundColor: '#162032',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              >
                <input
                  type="file"
                  accept=".json,.csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer'
                  }}
                />
                <Upload size={32} style={{ color: 'var(--primary)', margin: '0 auto 10px auto' }} />
                <h4 style={{ margin: '0 0 6px 0', color: '#fff', fontSize: '0.95rem' }}>
                  {importFileName ? importFileName : 'Choose or drop your official export file'}
                </h4>
                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Supports .json, .csv, and .xlsx exported from your official CUIET account
                </p>
                {importLoading && (
                  <div style={{ marginTop: 12, color: 'var(--primary)', fontSize: '0.82rem' }}>
                    <Loader2 size={16} className="spinning" style={{ display: 'inline', marginRight: 6 }} />
                    Parsing and importing official records...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Privacy & Security Footnote */}
          <div
            style={{
              marginTop: '20px',
              borderTop: '1px solid rgba(255,255,255,0.06)',
              paddingTop: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: 'var(--text-dim)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Lock size={12} style={{ color: '#10b981' }} /> AES-256-GCM Encrypted
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Shield size={12} style={{ color: '#38bdf8' }} /> Single-Student Isolated
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
