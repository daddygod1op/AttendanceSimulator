import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import LoginModal from './components/LoginModal';
import PrivacyModal from './components/PrivacyModal';
import OverallAttendanceCard from './components/OverallAttendanceCard';
import SubjectCard from './components/SubjectCard';
import AttendanceRegister from './components/AttendanceRegister';
import AttendanceTrendsAndUpcoming from './components/AttendanceTrendsAndUpcoming';
import CircularsFeed from './components/CircularsFeed';
import PerformanceMarks from './components/PerformanceMarks';
import {
  Globe,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Calendar,
  BookOpen,
  TrendingUp,
  LogIn,
  Key,
  Layers,
  Sparkles,
  Table as TableIcon,
  Bell,
  GraduationCap,
  CalendarDays,
  Upload,
  FileSpreadsheet,
  Lock,
  ArrowRight,
  Award
} from 'lucide-react';

import { getDeviceSessionId, clearDeviceSession } from './utils/sessionHelper';
import { CANONICAL_EVENING_TIMETABLE } from './utils/timetableData';

export default function App() {
  const [authStatus, setAuthStatus] = useState(() => {
    try {
      const cached = localStorage.getItem('chitkara_session_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.attendance || parsed.student)) return 'authenticated';
      }
    } catch (e) {}
    return 'unauthenticated';
  });

  const [isSyncing, setIsSyncing] = useState(false);

  const [student, setStudent] = useState(() => {
    try {
      const cached = localStorage.getItem('chitkara_session_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        const stu = parsed?.student || parsed?.attendance?.student;
        if (stu) return stu;
      }
    } catch (e) {}
    return null;
  });

  const [attendance, setAttendance] = useState(() => {
    try {
      const cached = localStorage.getItem('chitkara_session_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        const att = parsed?.attendance;
        if (att && att.overall && att.overall.delivered > 0) {
          if (!att.timetable || !att.timetable.schedule || att.timetable?.periods?.[0]?.time?.includes('09:00')) {
            att.timetable = CANONICAL_EVENING_TIMETABLE;
          }
          return att;
        }
      }
    } catch (e) {}
    return null;
  });

  const [lastSyncTime, setLastSyncTime] = useState(() => {
    try {
      const cached = localStorage.getItem('chitkara_session_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        return parsed?.lastSyncTime || null;
      }
    } catch (e) {}
    return null;
  });

  const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'register' | 'marks' | 'circulars'
  const [selectedSubjectFilter, setSelectedSubjectFilter] = useState('');
  const [registerViewMode, setRegisterViewMode] = useState('calendar'); // 'calendar' | 'table'
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [alert, setAlert] = useState(null);

  // Initial load: verify session with backend, rehydrate if necessary
  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const sessionId = getDeviceSessionId();
      const res = await fetch('/api/status', {
        headers: { 'x-session-id': sessionId }
      });
      const data = await res.json();

      if (data.authStatus === 'authenticated' && data.attendance && data.attendance.overall?.delivered > 0) {
        delete data.attendance.batchmates;
        if (!data.attendance.timetable || !data.attendance.timetable.schedule || data.attendance.timetable?.periods?.[0]?.time?.includes('09:00')) {
          data.attendance.timetable = CANONICAL_EVENING_TIMETABLE;
        }
        const liveStudent = data.student || data.attendance.student;
        setAuthStatus('authenticated');
        setAttendance(data.attendance);
        setStudent(liveStudent);
        setLastSyncTime(data.lastSyncTime);
        saveSessionToStorage(data.attendance, liveStudent, data.lastSyncTime);

        // Auto-refresh if date-wise register or sessional tests are missing
        if (!data.attendance.register?.length || !data.attendance.performance?.tests?.length) {
          console.log('[App] Auto-refreshing session to pull full date-wise register and internal tests...');
          handleRefresh();
        }
      } else if (data.authStatus === 'authenticated') {
        // Authenticated but attendance is empty on server: sync fresh data immediately
        setAuthStatus('authenticated');
        handleRefresh();
      } else {
        // If server rebooted or lost memory, but client has saved session in localStorage:
        // Do NOT log the user out! Restore session on server!
        const cached = localStorage.getItem('chitkara_session_data');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.attendance && parsed.attendance.overall?.delivered > 0) {
            if (!parsed.attendance.timetable || !parsed.attendance.timetable.schedule || parsed.attendance.timetable?.periods?.[0]?.time?.includes('09:00')) {
              parsed.attendance.timetable = CANONICAL_EVENING_TIMETABLE;
            }
            const cachedStudent = parsed.student || parsed.attendance.student;
            setAuthStatus('authenticated');
            setAttendance(parsed.attendance);
            setStudent(cachedStudent);
            setLastSyncTime(parsed.lastSyncTime);
            saveSessionToStorage(parsed.attendance, cachedStudent, parsed.lastSyncTime);
            // Rehydrate backend session
            fetch('/api/auth/restore-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'x-session-id': sessionId
              },
              body: JSON.stringify({
                attendance: parsed.attendance,
                student: cachedStudent
              })
            }).then(() => {
              if (!parsed.attendance.register?.length || !parsed.attendance.performance?.tests?.length) {
                handleRefresh();
              }
            }).catch(() => {});
            return;
          }
        }
        setAuthStatus('unauthenticated');
      }
    } catch (e) {
      console.warn('Could not verify server status:', e);
      // Keep showing cached data if present
      const cached = localStorage.getItem('chitkara_session_data');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (parsed && parsed.attendance && parsed.attendance.overall?.delivered > 0) {
            const cachedStudent = parsed.student || parsed.attendance.student;
            setAuthStatus('authenticated');
            setAttendance(parsed.attendance);
            setStudent(cachedStudent);
            return;
          }
        } catch (err) {}
      }
      setAuthStatus('unauthenticated');
    }
  };

  const saveSessionToStorage = (attendanceData, studentData, syncTime) => {
    try {
      const cleanData = attendanceData ? { ...attendanceData } : null;
      if (cleanData) {
        delete cleanData.batchmates;
        if (!cleanData.timetable || !cleanData.timetable.schedule || cleanData.timetable?.periods?.[0]?.time?.includes('09:00')) {
          cleanData.timetable = CANONICAL_EVENING_TIMETABLE;
        }
      }
      const cleanStudent = studentData || attendanceData?.student;
      localStorage.setItem(
        'chitkara_session_data',
        JSON.stringify({
          attendance: cleanData,
          student: cleanStudent,
          lastSyncTime: syncTime || attendanceData?.scrapedAt || new Date().toISOString()
        })
      );
    } catch (e) {
      console.warn('Could not save session to localStorage:', e);
    }
  };

  const fetchAttendance = async () => {
    try {
      const sessionId = getDeviceSessionId();
      const res = await fetch('/api/attendance', {
        headers: { 'x-session-id': sessionId }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          delete json.data.batchmates;
          if (!json.data.timetable || !json.data.timetable.schedule || json.data.timetable?.periods?.[0]?.time?.includes('09:00')) {
            json.data.timetable = CANONICAL_EVENING_TIMETABLE;
          }
          setAttendance(json.data);
        }
        const stu = json.student || json.data?.student;
        setStudent(stu);
        setLastSyncTime(json.lastSyncTime);
        setAuthStatus('authenticated');
        saveSessionToStorage(json.data, stu, json.lastSyncTime);
      }
    } catch (e) {
      console.error('Failed to fetch attendance:', e);
    }
  };

  const handleRefresh = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    setAlert({ type: 'syncing', text: 'Retrieving latest attendance, notices & marks from official Chitkara portal...' });

    try {
      const sessionId = getDeviceSessionId();
      const res = await fetch('/api/attendance/refresh', {
        method: 'POST',
        headers: { 'x-session-id': sessionId }
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to refresh attendance.');
      }

      if (data.data) {
        delete data.data.batchmates;
        setAttendance(data.data);
      }
      const refreshedStudent = data.data?.student || student;
      if (refreshedStudent) {
        setStudent(refreshedStudent);
      }
      const syncTime = data.lastSyncTime || new Date().toISOString();
      setLastSyncTime(syncTime);
      saveSessionToStorage(data.data, refreshedStudent, syncTime);

      setAlert({
        type: 'success',
        text: 'All records, notices, marks & calendar register successfully refreshed from official portal!'
      });
      setTimeout(() => setAlert(null), 4000);
    } catch (err) {
      // Do NOT log out on refresh failure — only show status message
      setAlert({ type: 'error', text: err.message || 'Could not sync latest data. Showing cached attendance.' });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      const sessionId = getDeviceSessionId();
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'x-session-id': sessionId }
      });
    } catch (e) {}
    clearDeviceSession();
    setAuthStatus('unauthenticated');
    setStudent(null);
    setAttendance(null);
    setLastSyncTime(null);
    setCurrentView('dashboard');
    setAlert({ type: 'info', text: 'Signed out from portal session. All cached records cleared.' });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleLoginSuccess = (scrapedData) => {
    if (scrapedData) {
      delete scrapedData.batchmates;
      const stu = scrapedData.student;
      setAttendance(scrapedData);
      setStudent(stu);
      const syncTime = scrapedData.scrapedAt || new Date().toISOString();
      setLastSyncTime(syncTime);
      saveSessionToStorage(scrapedData, stu, syncTime);
    }
    setAuthStatus('authenticated');
    setAlert({
      type: 'success',
      text: 'Successfully connected and retrieved attendance records from CUIET portal!'
    });
    setTimeout(() => setAlert(null), 4500);
  };

  const handleOpenRegister = (subjectCode = '', mode = 'calendar') => {
    setSelectedSubjectFilter(subjectCode);
    setRegisterViewMode(mode);
    setCurrentView('register');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const unreadCircularsCount = (attendance?.circulars || []).filter((c) => c.isUnread).length;

  return (
    <div className="app-container">
      {/* Top Navigation */}
      <Navbar
        authStatus={authStatus}
        lastSyncTime={lastSyncTime}
        isSyncing={isSyncing}
        onRefresh={handleRefresh}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        onLogout={handleLogout}
        onOpenPrivacy={() => setIsPrivacyModalOpen(true)}
        student={student}
        currentView={currentView}
        onChangeView={(view) => {
          setCurrentView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        unreadCircularsCount={unreadCircularsCount}
      />

      <main className="main-content">
        {/* Alert / Notification Banner */}
        {alert && (
          <div className={`alert-banner ${alert.type}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {alert.type === 'error' && <AlertCircle size={18} />}
              {alert.type === 'success' && <CheckCircle2 size={18} />}
              {alert.type === 'syncing' && <TrendingUp size={18} />}
              <span>{alert.text}</span>
            </div>
            {alert.type === 'error' && authStatus === 'expired' && (
              <button
                className="btn btn-primary"
                style={{ padding: '0.35rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => setIsLoginModalOpen(true)}
              >
                Sign In Now
              </button>
            )}
          </div>
        )}

        {/* View Switching */}
        {authStatus === 'authenticated' && attendance ? (
          currentView === 'register' ? (
            /* Interactive Calendar View & Register */
            <AttendanceRegister
              register={attendance.register || []}
              subjects={attendance.subjects || []}
              timetable={attendance.timetable || null}
              initialSubjectFilter={selectedSubjectFilter}
              initialViewMode={registerViewMode}
              onBack={() => setCurrentView('dashboard')}
            />
          ) : currentView === 'circulars' ? (
            /* Official Notices View */
            <CircularsFeed circulars={attendance.circulars || []} student={student} />
          ) : currentView === 'marks' ? (
            /* Academic Grades View */
            <PerformanceMarks performance={attendance.performance} />
          ) : (
            /* Primary Dashboard View (Single Student) */
            <div>
              <div className="view-header">
                <div className="view-title-group">
                  <h2>Student Attendance Dashboard</h2>
                  <p className="view-subtitle">
                    Live data synced from Chitkara University Chalkpad portal (cuiet.codebrigade.in)
                  </p>
                </div>

                {student && (
                  <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <span className="brand-source-pill" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                      Class: {student.branch || '2025-BE-CSE-AI&ML-3 SEM'}
                    </span>
                    <span className="brand-source-pill" style={{ background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)' }}>
                      Session: {student.session || 'JulDec2026'}
                    </span>
                  </div>
                )}
              </div>

              {/* Overall Attendance Card with Profile & CGPA */}
              <OverallAttendanceCard
                overall={attendance.overall}
                student={student}
                performance={attendance.performance}
                onClick={() => handleOpenRegister('', 'calendar')}
              />

              {/* Low-Attendance Alerts, Trends, & Upcoming Classes Schedule */}
              <AttendanceTrendsAndUpcoming
                student={student}
                overall={attendance.overall}
                subjects={attendance.subjects || []}
                timetable={attendance.timetable || null}
                onOpenCalendar={() => handleOpenRegister('', 'calendar')}
                onOpenTimetable={() => handleOpenRegister('', 'table')}
                onSelectSubject={(code, mode) => handleOpenRegister(code, mode || 'calendar')}
              />

              {/* Quick Action Buttons */}
              <div style={{ display: 'flex', gap: 12, margin: '1.5rem 0', flexWrap: 'wrap' }}>
                <button
                  onClick={() => handleOpenRegister('', 'calendar')}
                  className="btn"
                  style={{
                    background: 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))',
                    border: '1px solid rgba(239,68,68,0.3)',
                    color: '#fff',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontWeight: 700,
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                  id="open-calendar-hero-btn"
                >
                  <Calendar size={18} style={{ color: 'var(--accent-red)' }} />
                  <span>Open Subject Attendance Calendar</span>
                </button>

                <button
                  onClick={() => handleOpenRegister('', 'table')}
                  className="btn"
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-muted)',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                  id="open-table-hero-btn"
                >
                  <TableIcon size={18} />
                  <span>View Full Date-Wise Table</span>
                </button>

                <button
                  onClick={() => setCurrentView('marks')}
                  className="btn"
                  style={{
                    background: 'rgba(245, 158, 11, 0.08)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    color: '#fbbf24',
                    padding: '12px 20px',
                    borderRadius: '10px',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    cursor: 'pointer'
                  }}
                  id="open-marks-hero-btn"
                >
                  <Award size={18} />
                  <span>Internal Sessional Tests & Marks</span>
                </button>
              </div>

              {/* Courses & Enrolled Subjects Grid */}
              <div style={{ marginTop: '2.5rem' }}>
                <div className="section-title">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={20} style={{ color: 'var(--primary)' }} />
                    <span>Enrolled Courses & Subjects ({attendance.subjects?.length || 0})</span>
                  </div>
                  <button
                    className="btn-back-dashboard"
                    style={{ fontSize: '0.82rem', padding: '0.4rem 0.85rem' }}
                    onClick={() => handleOpenRegister('', 'calendar')}
                  >
                    <Calendar size={14} style={{ color: 'var(--accent-red)' }} />
                    <span>View All In Calendar</span>
                  </button>
                </div>

                <div className="subjects-grid">
                  {attendance.subjects && attendance.subjects.length > 0 ? (
                    attendance.subjects.map((sub) => (
                      <SubjectCard
                        key={sub.id || sub.code}
                        subject={sub}
                        onSelectSubject={(code, mode) => handleOpenRegister(code, mode || 'calendar')}
                      />
                    ))
                  ) : (
                    <p style={{ color: 'var(--text-dim)', padding: '1rem' }}>No individual subjects detected.</p>
                  )}
                </div>

                {/* Dashboard Footer Badge */}
                <div style={{ marginTop: '3.5rem', padding: '1.75rem 0 1rem 0', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                    <Lock size={13} style={{ color: '#10b981' }} />
                    <span>Strict Single-Student Isolated Dashboard • Official CUIET CodeBrigade Chalkpad Sync</span>
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span>Made with</span>
                    <span style={{ color: '#ef4444' }}>❤️</span>
                    <span>by</span>
                    <strong style={{ color: '#38bdf8', fontWeight: 700 }}>Aarush Wadhwa</strong>
                  </div>
                </div>
              </div>
            </div>
          )
        ) : authStatus === 'expired' ? (
          /* Explicit Session Expired Shield Screen - ZERO Data Leakage */
          <div className="landing-hero-container animate-fade-in" style={{ padding: '3rem 1.5rem', textAlign: 'center' }}>
            <div style={{
              maxWidth: 560,
              margin: '0 auto',
              background: '#0f172a',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '20px',
              padding: '2.5rem 2rem',
              boxShadow: '0 25px 50px rgba(0,0,0,0.7)'
            }}>
              <div style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.5rem auto',
                color: '#ef4444'
              }}>
                <Lock size={30} />
              </div>

              <h2 style={{ fontSize: '1.6rem', color: '#fff', fontWeight: 800, marginBottom: '0.75rem' }}>
                Portal Session Expired
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.6, marginBottom: '2rem' }}>
                Your Chitkara Chalkpad portal session has expired. To protect your student privacy and prevent unauthorized access, all attendance records, timetable, and marks have been securely locked.
              </p>

              <button
                className="btn btn-primary"
                onClick={() => setIsLoginModalOpen(true)}
                style={{
                  padding: '14px 24px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                  width: '100%'
                }}
                id="session-expired-reconnect-btn"
              >
                <LogIn size={18} />
                <span>Reconnect to CUIET CodeBrigade Portal</span>
              </button>
            </div>
          </div>
        ) : (
          /* Pleasing Landing Page Hero (Attendly & CUIET Inspired) */
          <div className="landing-hero-container animate-fade-in">
            <div className="landing-pill-badge">
              <Sparkles size={14} />
              <span>CHITKARA UNIVERSITY • CUIET CODEBRIGADE PORTAL SYNC</span>
            </div>

            <h1 className="landing-hero-title">
              Smart Attendance & Calendar Tracking for <span className="gradient-text">Chitkara Engineers</span>
            </h1>

            <p className="landing-hero-subtitle">
              Experience your official date-wise attendance in an interactive calendar matrix, calculate safe bunks, inspect academic marks, and view campus circulars—all with zero OTP friction.
            </p>

            <div className="landing-action-group">
              <button
                className="btn btn-primary"
                style={{
                  padding: '14px 26px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  boxShadow: '0 4px 20px rgba(230, 57, 70, 0.45)'
                }}
                onClick={() => setIsLoginModalOpen(true)}
                id="landing-hero-login-btn"
              >
                <LogIn size={18} />
                <span>Sign In with CUIET Portal</span>
                <ArrowRight size={16} />
              </button>

              <button
                className="btn btn-secondary"
                style={{
                  padding: '14px 22px',
                  fontSize: '0.95rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
                onClick={() => {
                  if (authStatus === 'authenticated') {
                    setCurrentView('circulars');
                  } else {
                    setIsLoginModalOpen(true);
                  }
                }}
              >
                <Bell size={16} style={{ color: '#e63946' }} />
                <span>View Campus Circulars</span>
              </button>
            </div>

            {/* Feature Cards Grid */}
            <div className="landing-feature-grid">
              <div className="landing-feature-card">
                <div className="landing-card-icon-box" style={{ background: 'rgba(230, 57, 70, 0.15)', color: '#ff6b6b' }}>
                  <Calendar size={22} />
                </div>
                <h4 className="landing-card-title">Subject-Wise Calendar</h4>
                <p className="landing-card-desc">
                  View every single lecture on a calendar grid with green presents, red missed classes, and official timetable periods.
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-card-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#34d399' }}>
                  <ShieldCheck size={22} />
                </div>
                <h4 className="landing-card-title">Direct Portal Sync</h4>
                <p className="landing-card-desc">
                  Seamless synchronization with your official Chalkpad credentials for fast, accurate attendance tracking.
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-card-icon-box" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  <TrendingUp size={22} />
                </div>
                <h4 className="landing-card-title">Safe Bunk Margin</h4>
                <p className="landing-card-desc">
                  Know exact number of lectures you can safely skip or need to attend to keep your attendance safely at or above 75%.
                </p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-card-icon-box" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc' }}>
                  <Bell size={22} />
                </div>
                <h4 className="landing-card-title">Official Circulars & Notices</h4>
                <p className="landing-card-desc">
                  Real-time university notifications, exam schedules, seating arrangements, and department circulars.
                </p>
              </div>
            </div>

            {/* Trust & Privacy Badge */}
            <div style={{ marginTop: '3rem', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, color: 'var(--text-dim)', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <Lock size={14} style={{ color: '#10b981' }} />
                <span>Strict Single-Student Isolated Dashboard • Official CUIET CodeBrigade Chalkpad Sync</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 5 }}>
                <span>Made with</span>
                <span style={{ color: '#ef4444' }}>❤️</span>
                <span>by</span>
                <strong style={{ color: '#38bdf8', fontWeight: 700 }}>Aarush Wadhwa</strong>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Login & Verification Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Privacy Notice & Data Purge Modal */}
      <PrivacyModal
        isOpen={isPrivacyModalOpen}
        onClose={() => setIsPrivacyModalOpen(false)}
        onDataPurged={() => {
          setAttendance(null);
          setStudent(null);
          setAuthStatus('unauthenticated');
          setAlert({
            type: 'info',
            text: 'All personal session records and cached cookies have been permanently deleted.'
          });
          setTimeout(() => setAlert(null), 3500);
        }}
      />
    </div>
  );
}
