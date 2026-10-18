import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  AlertCircle,
  Loader2,
  Lock,
  User,
  Calendar,
  Eye,
  EyeOff,
  Smartphone,
  ArrowLeft,
  CheckCircle2
} from 'lucide-react';
import { getDeviceSessionId } from '../utils/sessionHelper';

export default function LoginModal({ isOpen, onClose, onLoginSuccess }) {
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
  const [loginStepStatus, setLoginStepStatus] = useState(null);
  const [error, setError] = useState(null);



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
    setLoginStepStatus({ step: 1, totalSteps: 4, label: 'Connecting to Portal', detail: 'Connecting to CUIET server in cloud...', percent: 20 });

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 44000);

    try {
      const sessionId = getDeviceSessionId();
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        signal: controller.signal,
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
      clearTimeout(timeoutId);

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
        setLoginStepStatus(null);
        return;
      }

      // Succeeded directly
      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      }
      onClose();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError('Connection to portal took longer than expected. Please tap Log In again.');
      } else {
        setError(err.message || 'Authentication error. Please try again.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setLoginStepStatus(null);
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const sessionId = getDeviceSessionId();
      const res = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'x-session-id': sessionId
        },
        body: JSON.stringify({ otp: otp.trim(), sessionId })
      });
      clearTimeout(timeoutId);

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to verify OTP. Please try again.');
      }

      if (onLoginSuccess) {
        onLoginSuccess(data.data);
      }
      onClose();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setError('Verification timed out. Please tap Verify again.');
      } else {
        setError(err.message || 'Failed to verify OTP. Please try again.');
      }
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setLoginStepStatus(null);
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
          maxWidth: '480px',
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
                width: 42,
                height: 42,
                background: '#ffffff',
                padding: '3px 5px',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
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
                Chitkara University Portal
              </h3>
              <p style={{ margin: '2px 0 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Official CUIET Student Authentication
              </p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
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

          {/* Live Progress Banner when Loading */}
          {loading && loginStepStatus && (
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1px solid rgba(56, 189, 248, 0.25)',
                borderRadius: '10px',
                padding: '12px 14px',
                marginBottom: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Loader2 size={16} className="spinning" style={{ color: '#38bdf8' }} />
                <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#38bdf8' }}>
                  {loginStepStatus.label || 'Authenticating...'}
                </span>
                <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                  {elapsedSeconds}s
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#bae6fd' }}>
                {loginStepStatus.detail || 'Contacting official portal servers...'}
              </p>
            </div>
          )}

          {/* STEP 1: CREDENTIALS */}
          {step === 'credentials' ? (
            <form onSubmit={handleCredentialsSubmit} autoComplete="off">
              {/* Roll Number / Username */}
              <div className="auth-input-group">
                <div className="auth-input-label">
                  <span>University Roll Number / Username</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    e.g. 251099xxxx
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
                  <span>Portal Password</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                    Chalkpad account password
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
                  padding: '13px',
                  fontSize: '0.96rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginTop: '10px'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="spinning" />
                    <span>Signing In... ({elapsedSeconds}s)</span>
                  </>
                ) : (
                  <>
                    <Shield size={16} />
                    <span>Log In to Portal</span>
                  </>
                )}
              </button>
            </form>
          ) : (
            /* STEP 2: OTP VERIFICATION */
            <form onSubmit={handleVerifyOtp}>
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.08)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '20px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12
                }}
              >
                <Smartphone size={22} style={{ color: '#38bdf8', flexShrink: 0, marginTop: 2 }} />
                <p style={{ margin: 0, fontSize: '0.86rem', color: '#bae6fd', lineHeight: 1.5 }}>
                  {otpMessage || 'A one-time password has been sent to your registered mobile / email. Enter it below to complete sign in.'}
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: 8, textAlign: 'center' }}>
                  Enter 4-Digit Verification OTP
                </label>
                <input
                  type="text"
                  maxLength={6}
                  className="auth-input"
                  placeholder="• • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                  autoFocus
                  id="cuiet-otp-input"
                  style={{
                    fontSize: '1.6rem',
                    textAlign: 'center',
                    letterSpacing: '10px',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    padding: '14px',
                    backgroundColor: '#1e293b',
                    background: '#1e293b',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#fff',
                    borderRadius: '12px',
                    width: '100%'
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setStep('credentials')}
                  style={{ padding: '12px 16px', fontSize: '0.88rem' }}
                >
                  <ArrowLeft size={16} style={{ marginRight: 4 }} />
                  Back
                </button>

                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                  style={{ flex: 1, padding: '12px', fontSize: '0.94rem', fontWeight: 700 }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={16} className="spinning" style={{ marginRight: 6 }} />
                      Verifying OTP...
                    </>
                  ) : (
                    'Verify & Open Dashboard'
                  )}
                </button>
              </div>

              <div style={{ marginTop: '14px', textAlign: 'center' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCooldown > 0}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: resendCooldown > 0 ? 'var(--text-dim)' : 'var(--primary)',
                    fontSize: '0.8rem',
                    cursor: resendCooldown > 0 ? 'default' : 'pointer'
                  }}
                >
                  {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          )}

          {/* Privacy & Security Footnote */}
          <div
            style={{
              marginTop: '22px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              paddingTop: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: 'var(--text-dim)'
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Lock size={12} style={{ color: '#10b981' }} /> Official SSL Encrypted
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Shield size={12} style={{ color: '#38bdf8' }} /> AES-256-GCM Secure
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
