import React from 'react';
import { User, BookOpen, Clock, ShieldCheck, AlertCircle, Calendar, ArrowRight, ChevronRight } from 'lucide-react';

export default function SubjectCard({ subject, onSelectSubject }) {
  if (!subject) return null;

  const percentage = subject.percentage || 0;
  const isSafe = percentage >= 75;
  const delivered = subject.delivered || subject.total || 0;
  const attended = subject.attended || 0;

  const handleClick = () => {
    if (onSelectSubject) {
      onSelectSubject(subject.code || subject.name, 'calendar');
    }
  };

  return (
    <div
      className="subject-card"
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        transition: 'transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease'
      }}
      title={`Click to open Attendance Calendar & Register for ${subject.name}`}
    >
      <div>
        <div className="subject-header">
          <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
            <span className="subject-code-badge">{subject.code}</span>
            <h4 className="subject-name" style={{ color: '#fff' }}>
              {subject.name}
            </h4>
          </div>
          <div className={`subject-percent ${isSafe ? 'safe' : 'danger'}`}>
            {percentage}%
          </div>
        </div>

        <div className="subject-faculty">
          <BookOpen size={13} />
          <span>{subject.component || subject.type || 'Course Module'}</span>
          <span style={{ color: 'var(--text-dim)', margin: '0 0.3rem' }}>•</span>
          <span>{subject.code || 'Academic Unit'}</span>
        </div>

        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill ${isSafe ? 'safe' : 'danger'}`}
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>
      </div>

      <div className="subject-stats-row">
        <div>
          <span>Attended: </span>
          <strong style={{ color: '#fff' }}>{attended}</strong> / {delivered}
          {(subject.dutyLeave > 0 || subject.medicalLeave > 0) && (
            <span style={{ color: 'var(--leave-blue)', marginLeft: '0.4rem', fontSize: '0.75rem' }}>
              (+{(subject.dutyLeave || 0) + (subject.medicalLeave || 0)} leaves)
            </span>
          )}
        </div>

        {subject.safeBunks > 0 ? (
          <span className="bunk-pill safe">
            {subject.safeBunks} Bunk{subject.safeBunks > 1 ? 's' : ''} Safe
          </span>
        ) : subject.needClasses > 0 ? (
          <span className="bunk-pill danger">
            Need {subject.needClasses} Classes
          </span>
        ) : (
          <span className="bunk-pill safe">
            At 75% limit
          </span>
        )}
      </div>

      <button
        type="button"
        className="btn-view-subject-calendar"
        onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}
        style={{
          marginTop: '12px',
          width: '100%',
          padding: '8px 12px',
          fontSize: '0.82rem',
          fontWeight: 600,
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.03)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Calendar size={14} style={{ color: 'var(--accent-red)' }} />
          <span>Open Attendance Calendar</span>
        </span>
        <ChevronRight size={15} style={{ color: 'var(--text-dim)' }} />
      </button>
    </div>
  );
}
