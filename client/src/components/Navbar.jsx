import React from 'react';
import {
  RefreshCw,
  LogOut,
  LogIn,
  Clock,
  LayoutDashboard,
  CalendarDays,
  GraduationCap,
  Bell,
  ShieldCheck,
  Shield,
  User,
  Calendar,
  Lock
} from 'lucide-react';

export default function Navbar({
  authStatus,
  lastSyncTime,
  isSyncing,
  onRefresh,
  onOpenLogin,
  onLogout,
  onOpenPrivacy,
  student,
  currentView = 'dashboard',
  onChangeView,
  unreadCircularsCount = 0
}) {
  const formatTime = (isoString) => {
    if (!isoString) return 'Never synced';
    try {
      const d = new Date(isoString);
      return (
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
        ' (' +
        d.toLocaleDateString([], { month: 'short', day: 'numeric' }) +
        ')'
      );
    } catch (e) {
      return 'Recently';
    }
  };

  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'CU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <header className="main-navbar-wrapper">
      <nav className="main-navbar">
        {/* Left: Brand */}
        <div
          className="brand-container"
          onClick={() => onChangeView && onChangeView('dashboard')}
          style={{ cursor: 'pointer' }}
        >
          <div
            className="brand-logo-badge"
            style={{
              background: '#ffffff',
              padding: '2px 4px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 44,
              height: 44,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            <img
              src="/chitkara_logo.png"
              alt="Chitkara University"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'contain'
              }}
            />
          </div>
          <div className="brand-info">
            <h1 className="nav-brand-title">
              Chitkara Attendance
              <span className="brand-source-pill nav-source-pill-desktop" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                cuiet.codebrigade.in
              </span>
            </h1>
            <p className="nav-brand-sub">
              {student?.name ? (
                <span>
                  Official Portal • <strong>{student.session || 'JulDec2026'}</strong>
                </span>
              ) : (
                <span>Student Attendance Engine</span>
              )}
            </p>
          </div>
        </div>

        {/* Right: Actions, Privacy, & Profile Badge */}
        <div className="navbar-actions">
          {/* Privacy & Purge Button */}
          <button
            className="btn btn-outline nav-privacy-btn"
            style={{
              padding: '6px 10px',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              borderColor: 'rgba(16, 185, 129, 0.35)',
              color: '#10b981'
            }}
            onClick={onOpenPrivacy}
            title="Privacy Policy & Purge Data"
          >
            <ShieldCheck size={16} />
            <span className="nav-btn-text">Privacy</span>
          </button>

          {authStatus === 'authenticated' && student && (
            <div className="student-nav-profile-badge" title={`${student.name} (${student.rollNo})`}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #e63946, #8a2be2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.78rem',
                  overflow: 'hidden',
                  flexShrink: 0,
                  border: '1.5px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
                }}
              >
                <img
                  src={student.photoUrl || '/student_profile.jpg'}
                  alt={student.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    objectPosition: 'top'
                  }}
                  onError={(e) => {
                    if (e.target.src !== window.location.origin + '/student_profile.jpg') {
                      e.target.src = '/student_profile.jpg';
                    } else {
                      e.target.style.display = 'none';
                    }
                  }}
                />
              </div>
              <div className="student-nav-details nav-student-meta-desktop">
                <span className="nav-student-name">{student.name}</span>
                <span className="nav-student-roll" style={{ fontFamily: 'monospace' }}>
                  {student.rollNo}
                </span>
              </div>
            </div>
          )}

          {authStatus === 'authenticated' && (
            <div className="sync-status-indicator nav-sync-indicator-desktop">
              <span className={`status-dot ${isSyncing ? 'pulsing' : ''}`}></span>
              <Clock size={13} />
              <span>{formatTime(lastSyncTime)}</span>
            </div>
          )}

          {authStatus === 'authenticated' && (
            <button
              className={`btn btn-refresh nav-refresh-btn ${isSyncing ? 'syncing' : ''}`}
              onClick={onRefresh}
              disabled={isSyncing}
              title="Retrieve fresh records from portal"
              id="refresh-attendance-btn"
            >
              <RefreshCw size={15} />
              <span className="nav-btn-text">{isSyncing ? 'Syncing...' : 'Refresh'}</span>
            </button>
          )}

          {authStatus === 'authenticated' ? (
            <button
              className="btn btn-outline-danger nav-logout-btn"
              onClick={onLogout}
              title="Sign out from session"
              id="logout-btn"
            >
              <LogOut size={15} />
              <span className="nav-btn-text">Sign Out</span>
            </button>
          ) : (
            <button
              className="btn btn-primary nav-login-btn"
              onClick={onOpenLogin}
              id="connect-portal-btn"
            >
              <LogIn size={16} />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </nav>

      {/* Primary Navigation Tabs Strip */}
      {authStatus === 'authenticated' && onChangeView && (
        <div className="navbar-tabs-container">
          <div className="navbar-tabs-scroll">
            <button
              className={`nav-tab-link ${currentView === 'dashboard' ? 'active' : ''}`}
              onClick={() => onChangeView('dashboard')}
              id="nav-tab-dashboard"
            >
              <LayoutDashboard size={15} />
              <span>Attendance Dashboard</span>
            </button>

            <button
              className={`nav-tab-link ${currentView === 'register' ? 'active' : ''}`}
              onClick={() => onChangeView('register')}
              id="nav-tab-register"
            >
              <CalendarDays size={15} />
              <span>Calendar View & Register</span>
            </button>

            <button
              className={`nav-tab-link ${currentView === 'marks' ? 'active' : ''}`}
              onClick={() => onChangeView('marks')}
              id="nav-tab-marks"
            >
              <GraduationCap size={15} />
              <span>Marks & Transcripts</span>
            </button>

            <button
              className={`nav-tab-link ${currentView === 'circulars' ? 'active' : ''}`}
              onClick={() => onChangeView('circulars')}
              id="nav-tab-circulars"
            >
              <Bell size={15} />
              <span>Circulars & Notices</span>
              {unreadCircularsCount > 0 && (
                <span className="nav-tab-badge">{unreadCircularsCount}</span>
              )}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
