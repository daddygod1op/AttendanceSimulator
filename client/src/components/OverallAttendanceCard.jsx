import React from 'react';
import {
  ChevronRight,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Award,
  Sparkles,
  GraduationCap
} from 'lucide-react';

export default function OverallAttendanceCard({ overall, student, performance, onClick }) {
  if (!overall) return null;

  const percentage = overall.percentage || 0;
  const isSafe = percentage >= 75;
  const isWarning = percentage >= 65 && percentage < 75;

  // SVG Gauge calculations
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (Math.min(100, Math.max(0, percentage)) / 100) * circumference;

  const getInitials = (name = '') => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return 'CU';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const photoSrc = student?.photoUrl || '';

  const cgpaVal = performance?.cgpa !== undefined ? performance.cgpa : 6.80;

  return (
    <div
      className="overall-attendance-hero"
      onClick={onClick}
      id="overall-attendance-card"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      title="Click to view detailed Date-Wise Attendance Register"
    >
      {/* Student Profile Quick Banner */}
      {student && (
        <div className="hero-student-banner">
          <div className="student-hero-avatar-box">
            <img
              src={photoSrc || '/student_profile.jpg'}
              alt={student.name}
              className="student-hero-img"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                objectPosition: 'top',
                borderRadius: '16px'
              }}
              onError={(e) => {
                if (e.target.src !== window.location.origin + '/student_profile.jpg') {
                  e.target.src = '/student_profile.jpg';
                }
              }}
            />
            <span className="online-verified-indicator">✓</span>
          </div>

          <div className="student-hero-meta">
            <div className="student-hero-title-row">
              <h3 className="student-hero-name">{student.name}</h3>
              <span className="student-hero-roll">{(!student.rollNo || student.rollNo === '40613') ? '2510993347' : student.rollNo}</span>
              <span className="student-hero-cgpa">
                <Award size={13} />
                {typeof cgpaVal === 'number' ? cgpaVal.toFixed(2) : cgpaVal} CGPA
              </span>
            </div>
            <div className="student-hero-sub-row">
              <span>{student.branch || 'Computer Science & Engineering'}</span>
              <span>•</span>
              <span className="group-pill">Group: {student.group || 'U25AIML-G13'}</span>
              <span>•</span>
              <span>{student.semester || 'Semester 3 (AI & ML)'}</span>
            </div>
          </div>
        </div>
      )}

      <div className="hero-click-cue">
        <Calendar size={15} style={{ color: 'var(--accent-red)' }} />
        <span>Open Subject Calendar & Register</span>
        <ChevronRight size={16} />
      </div>

      <div className="hero-grid">
        {/* SVG Circular Progress Gauge */}
        <div className="gauge-container">
          <svg className="gauge-svg" viewBox="0 0 170 170">
            <defs>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#34d399" />
              </linearGradient>
              <linearGradient id="amberGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#fbbf24" />
              </linearGradient>
              <linearGradient id="redGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
            <circle
              className="gauge-bg"
              cx="85"
              cy="85"
              r={radius}
            />
            <circle
              className={`gauge-fill ${isSafe ? 'safe' : isWarning ? 'warning' : 'danger'}`}
              cx="85"
              cy="85"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          <div className="gauge-text">
            <span
              className="gauge-percent"
              style={{
                color: isSafe ? 'var(--present-green)' : isWarning ? 'var(--warn-amber)' : 'var(--absent-red)'
              }}
            >
              {percentage}%
            </span>
            <span className="gauge-label">Overall</span>
          </div>
        </div>

        {/* Attendance Statistics */}
        <div className="hero-stats-col">
          <h3>Overall Attendance</h3>
          <p>Consolidated record across all enrolled courses and labs</p>

          <div className="stats-pill-row">
            <div className="stat-metric">
              <span className="metric-num" style={{ color: 'var(--present-green)' }}>
                {overall.effectiveAttended || overall.attended}
              </span>
              <span className="metric-label">
                Attended {overall.medicalLeave > 0 ? `(${overall.attended} + ${overall.medicalLeave} ML)` : ''}
              </span>
            </div>

            <div className="stat-metric">
              <span className="metric-num">
                {overall.delivered}
              </span>
              <span className="metric-label">Total Held</span>
            </div>

            <div className="stat-metric">
              <span className="metric-num" style={{ color: 'var(--absent-red)' }}>
                {Math.max(0, overall.delivered - overall.attended)}
              </span>
              <span className="metric-label">Missed</span>
            </div>

            {(overall.dutyLeave > 0 || overall.medicalLeave > 0) && (
              <div className="stat-metric">
                <span className="metric-num" style={{ color: 'var(--leave-blue)' }}>
                  {(overall.dutyLeave || 0) + (overall.medicalLeave || 0)}
                </span>
                <span className="metric-label">Approved Leaves</span>
              </div>
            )}
          </div>
        </div>

        {/* Bunk / Recovery Forecast */}
        <div className="bunk-calculator-box">
          <div className="metric-label" style={{ marginBottom: '0.2rem' }}>Attendance Target Status (75% Rule)</div>

          {overall.bunkableClasses > 0 ? (
            <div>
              <div className="bunk-status-badge safe">
                <CheckCircle size={18} />
                <span>{overall.bunkableClasses} Bunk{overall.bunkableClasses > 1 ? 's' : ''} Available</span>
              </div>
              <div className="bunk-subtext" style={{ marginTop: '0.3rem' }}>
                You can safely miss up to {overall.bunkableClasses} lecture{overall.bunkableClasses > 1 ? 's' : ''} and still stay at or above 75%.
              </div>
            </div>
          ) : overall.classesNeeded > 0 ? (
            <div>
              <div className="bunk-status-badge danger">
                <ShieldAlert size={18} />
                <span>Attend Next {overall.classesNeeded} Classes</span>
              </div>
              <div className="bunk-subtext" style={{ marginTop: '0.3rem' }}>
                Attendance is currently below the 75% requirement. You must attend {overall.classesNeeded} consecutive class{overall.classesNeeded > 1 ? 'es' : ''} to recover.
              </div>
            </div>
          ) : (
            <div>
              <div className="bunk-status-badge safe">
                <CheckCircle size={18} />
                <span>On The Limit (75%)</span>
              </div>
              <div className="bunk-subtext" style={{ marginTop: '0.3rem' }}>
                You are exactly at the 75% threshold. Do not miss any upcoming lectures.
              </div>
            </div>
          )}

          {overall.bunkableClasses85 > 0 && (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '0.4rem', marginTop: '0.4rem' }}>
              85% Criteria: <strong>{overall.bunkableClasses85}</strong> bunks available
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
