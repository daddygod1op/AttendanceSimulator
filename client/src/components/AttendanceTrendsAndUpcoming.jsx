import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  Calendar,
  BookOpen,
  MapPin,
  User,
  ShieldAlert,
  Flame,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  X,
  ExternalLink
} from 'lucide-react';

const CODE_TO_NAME = {
  '24CSE0209': 'Database Management System',
  '25CAI0201': 'Statistics and Data Engineering',
  '25CSE0202': 'Programming in Java',
  '25CSE0203': 'Front End Engineering-II',
  '25CSE0204': 'Object Oriented Programming'
};

const CODE_TO_FACULTY = {
  '24CSE0209': 'Sourabh Batra',
  '25CAI0201': 'Hemant Kumar / Saravjeet Singh',
  '25CSE0202': 'Gourav Kaloniya',
  '25CSE0203': 'Himanshu Sharma',
  '25CSE0204': 'Gourav Kaloniya'
};

export default function AttendanceTrendsAndUpcoming({
  overall,
  subjects = [],
  timetable = null,
  onOpenCalendar,
  onOpenTimetable,
  onSelectSubject
}) {
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [modalActiveDay, setModalActiveDay] = useState('Monday');

  const currentDayName = useMemo(() => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[new Date().getDay()];
  }, []);

  // Compute low attendance alerts (< 75% critical, 75-80% warning)
  const lowAttendanceSubjects = useMemo(() => {
    return subjects
      .filter((s) => (Number(s.percentage) || 0) < 80)
      .map((s) => {
        const percentage = Number(s.percentage) || 0;
        const isCritical = percentage < 75;
        const delivered = Number(s.delivered ?? s.total) || 0;
        const attended = Number(s.attended) || 0;

        // Needed classes to reach 75%:
        let needClasses = 0;
        if (s.needClasses !== undefined && s.needClasses !== null && !isNaN(s.needClasses)) {
          needClasses = s.needClasses;
        } else if (percentage < 75) {
          needClasses = Math.max(1, Math.ceil(3 * delivered - 4 * attended));
        }

        // Safe bunks if >= 75%:
        let safeBunks = 0;
        if (s.safeBunks !== undefined && s.safeBunks !== null && !isNaN(s.safeBunks)) {
          safeBunks = s.safeBunks;
        } else if (percentage >= 75) {
          safeBunks = Math.max(0, Math.floor((4 * attended - 3 * delivered) / 3));
        }

        return {
          ...s,
          delivered,
          attended,
          percentage,
          isCritical,
          needClasses,
          safeBunks
        };
      })
      .sort((a, b) => a.percentage - b.percentage);
  }, [subjects]);

  // Weekly daytime academic timetable (Chitkara Standard Hours: 09:00 AM - 03:00 PM)
  const defaultSchedule = useMemo(() => ({
    Monday: [
      { period: 1, time: '09:00 AM - 09:50 AM', subject: 'Front End Engineering-II', subjectCode: '25CSE0203', room: 'LH-402', faculty: 'Himanshu Sharma' },
      { period: 2, time: '09:50 AM - 10:40 AM', subject: 'Front End Engineering-II', subjectCode: '25CSE0203', room: 'LH-402', faculty: 'Himanshu Sharma' },
      { period: 3, time: '10:50 AM - 11:40 AM', subject: 'Database Management System', subjectCode: '24CSE0209', room: 'LH-402', faculty: 'Sourabh Batra' },
      { period: 4, time: '11:40 AM - 12:30 PM', subject: 'Database Management System', subjectCode: '24CSE0209', room: 'LH-402', faculty: 'Sourabh Batra' },
      { period: 5, time: '01:20 PM - 02:10 PM', subject: 'Programming in Java', subjectCode: '25CSE0202', room: 'MB-104', faculty: 'Gourav Kaloniya' },
      { period: 6, time: '02:10 PM - 03:00 PM', subject: 'Object Oriented Programming', subjectCode: '25CSE0204', room: 'LH-402', faculty: 'Gourav Kaloniya' }
    ],
    Tuesday: [
      { period: 1, time: '09:00 AM - 09:50 AM', subject: 'Programming in Java', subjectCode: '25CSE0202', room: 'MB-104', faculty: 'Gourav Kaloniya' },
      { period: 2, time: '09:50 AM - 10:40 AM', subject: 'Object Oriented Programming', subjectCode: '25CSE0204', room: 'LH-402', faculty: 'Gourav Kaloniya' },
      { period: 3, time: '10:50 AM - 11:40 AM', subject: 'Object Oriented Programming', subjectCode: '25CSE0204', room: 'LH-402', faculty: 'Gourav Kaloniya' },
      { period: 4, time: '11:40 AM - 12:30 PM', subject: 'Programming in Java', subjectCode: '25CSE0202', room: 'MB-104', faculty: 'Gourav Kaloniya' },
      { period: 5, time: '01:20 PM - 02:10 PM', subject: 'Front End Engineering-II', subjectCode: '25CSE0203', room: 'LH-402', faculty: 'Himanshu Sharma' },
      { period: 6, time: '02:10 PM - 03:00 PM', subject: 'Database Management System', subjectCode: '24CSE0209', room: 'LH-402', faculty: 'Sourabh Batra' }
    ],
    Wednesday: [
      { period: 1, time: '09:00 AM - 09:50 AM', subject: 'Statistics and Data Engineering', subjectCode: '25CAI0201', room: 'LH-402', faculty: 'Hemant Kumar / Saravjeet Singh' },
      { period: 2, time: '09:50 AM - 10:40 AM', subject: 'Statistics and Data Engineering', subjectCode: '25CAI0201', room: 'LH-402', faculty: 'Hemant Kumar / Saravjeet Singh' },
      { period: 3, time: '10:50 AM - 11:40 AM', subject: 'Front End Engineering-II', subjectCode: '25CSE0203', room: 'LH-402', faculty: 'Himanshu Sharma' },
      { period: 4, time: '11:40 AM - 12:30 PM', subject: 'Front End Engineering-II', subjectCode: '25CSE0203', room: 'LH-402', faculty: 'Himanshu Sharma' },
      { period: 5, time: '01:20 PM - 02:10 PM', subject: 'Object Oriented Programming', subjectCode: '25CSE0204', room: 'LH-402', faculty: 'Gourav Kaloniya' },
      { period: 6, time: '02:10 PM - 03:00 PM', subject: 'Programming in Java', subjectCode: '25CSE0202', room: 'MB-104', faculty: 'Gourav Kaloniya' }
    ],
    Thursday: [
      { period: 1, time: '09:00 AM - 09:50 AM', subject: 'Object Oriented Programming', subjectCode: '25CSE0204', room: 'LH-402', faculty: 'Gourav Kaloniya' },
      { period: 2, time: '09:50 AM - 10:40 AM', subject: 'Programming in Java', subjectCode: '25CSE0202', room: 'MB-104', faculty: 'Gourav Kaloniya' },
      { period: 3, time: '10:50 AM - 11:40 AM', subject: 'Object Oriented Programming', subjectCode: '25CSE0204', room: 'LH-402', faculty: 'Gourav Kaloniya' },
      { period: 4, time: '11:40 AM - 12:30 PM', subject: 'Programming in Java', subjectCode: '25CSE0202', room: 'MB-104', faculty: 'Gourav Kaloniya' },
      { period: 5, time: '01:20 PM - 02:10 PM', subject: 'Statistics and Data Engineering', subjectCode: '25CAI0201', room: 'LH-402', faculty: 'Hemant Kumar / Saravjeet Singh' },
      { period: 6, time: '02:10 PM - 03:00 PM', subject: 'Statistics and Data Engineering', subjectCode: '25CAI0201', room: 'LH-402', faculty: 'Hemant Kumar / Saravjeet Singh' }
    ],
    Friday: [
      { period: 1, time: '09:00 AM - 09:50 AM', subject: 'Programming in Java', subjectCode: '25CSE0202', room: 'MB-104', faculty: 'Gourav Kaloniya' },
      { period: 2, time: '09:50 AM - 10:40 AM', subject: 'Object Oriented Programming', subjectCode: '25CSE0204', room: 'LH-402', faculty: 'Gourav Kaloniya' },
      { period: 3, time: '10:50 AM - 11:40 AM', subject: 'Programming in Java', subjectCode: '25CSE0202', room: 'MB-104', faculty: 'Gourav Kaloniya' },
      { period: 4, time: '11:40 AM - 12:30 PM', subject: 'Object Oriented Programming', subjectCode: '25CSE0204', room: 'LH-402', faculty: 'Gourav Kaloniya' }
    ]
  }), []);

  // Today's classes from timetable
  const todayClasses = useMemo(() => {
    const rawSchedule = timetable?.schedule;
    const dayKey = (currentDayName === 'Saturday' || currentDayName === 'Sunday') ? 'Monday' : currentDayName;
    const rawClasses = (rawSchedule && rawSchedule[dayKey] && rawSchedule[dayKey].length > 0)
      ? rawSchedule[dayKey]
      : (defaultSchedule[dayKey] || []);

    const enriched = rawClasses.map(cls => {
      const code = cls.subjectCode || cls.code || '';
      const name = cls.subjectName || CODE_TO_NAME[code] || cls.subject || cls.name || code;
      const faculty = cls.faculty || CODE_TO_FACULTY[code] || 'Faculty Member';
      const room = cls.room || (code === '25CSE0202' ? 'MB-104' : 'LH-402');
      return {
        ...cls,
        subject: name,
        subjectName: name,
        subjectCode: code,
        faculty,
        room
      };
    });

    return {
      day: dayKey,
      isUpcomingWeek: currentDayName === 'Saturday' || currentDayName === 'Sunday',
      classes: enriched
    };
  }, [timetable, currentDayName, defaultSchedule]);

  // Overall attendance trend calculations
  const totalClasses = overall?.totalLectures || 148;
  const attendedClasses = overall?.attendedLectures || 131;
  const currentPct = overall?.percentage || 88.5;

  // Forecast: attend next 3 classes
  const pctIfAttend3 = Number((((attendedClasses + 3) / (totalClasses + 3)) * 100).toFixed(1));
  // Forecast: miss next 3 classes
  const pctIfMiss3 = Number(((attendedClasses / (totalClasses + 3)) * 100).toFixed(1));

  return (
    <div style={{ margin: '20px 0' }}>
      {/* 1. Low Attendance Alerts (Critical / Warning) */}
      {lowAttendanceSubjects.length > 0 ? (
        <div
          style={{
            background: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            padding: '16px 20px',
            marginBottom: '20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <AlertTriangle size={20} style={{ color: '#ef4444' }} />
            <h4 style={{ margin: 0, color: '#fff', fontSize: '0.98rem', fontWeight: 700 }}>
              Low-Attendance Alerts ({lowAttendanceSubjects.length} Courses Require Attention)
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 12 }}>
            {lowAttendanceSubjects.map((sub) => {
              const isSafe = sub.percentage >= 75;
              return (
                <div
                  key={sub.code || sub.name}
                  onClick={() => onSelectSubject && onSelectSubject(sub.code || sub.name, 'calendar')}
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: sub.isCritical ? '1px solid rgba(239,68,68,0.45)' : '1px solid rgba(245,158,11,0.45)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    position: 'relative'
                  }}
                  className="low-attendance-card"
                  title={`Click to open ${sub.name} in Attendance Register`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 700 }}>
                        {sub.code}
                      </span>
                      <h5 style={{ margin: '2px 0 0 0', color: '#fff', fontSize: '0.92rem', fontWeight: 700 }}>
                        {sub.name}
                      </h5>
                    </div>
                    <span
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: sub.isCritical ? '#ef4444' : '#f59e0b',
                        background: sub.isCritical ? 'rgba(239,68,68,0.18)' : 'rgba(245,158,11,0.18)',
                        padding: '3px 8px',
                        borderRadius: 6,
                        border: sub.isCritical ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.3)'
                      }}
                    >
                      {sub.percentage}%
                    </span>
                  </div>

                  <div style={{ marginTop: 8, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Attended: <strong style={{ color: '#fff' }}>{sub.attended}</strong> / {sub.delivered} classes
                  </div>

                  {sub.isCritical ? (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: '0.78rem',
                        color: '#fca5a5',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Flame size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                      <span>
                        Must attend next <strong style={{ color: '#fff' }}>{sub.needClasses} consecutive class{sub.needClasses > 1 ? 'es' : ''}</strong> to achieve 75% eligibility.
                      </span>
                    </div>
                  ) : (
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: '0.78rem',
                        color: '#86efac',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <CheckCircle2 size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                      <span>
                        {sub.safeBunks > 0 ? (
                          <>Can safely bunk <strong style={{ color: '#fff' }}>{sub.safeBunks} class{sub.safeBunks > 1 ? 'es' : ''}</strong> and stay above 75%.</>
                        ) : (
                          <>Currently at 75.0% threshold (0 safe bunks).</>
                        )}
                      </span>
                    </div>
                  )}

                  <div
                    style={{
                      marginTop: 10,
                      paddingTop: 8,
                      borderTop: '1px solid rgba(255,255,255,0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.74rem',
                      color: '#38bdf8'
                    }}
                  >
                    <span>Click to View Subject Attendance Register</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div
          style={{
            background: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.25)',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}
        >
          <CheckCircle2 size={18} style={{ color: '#10b981', flexShrink: 0 }} />
          <span style={{ fontSize: '0.86rem', color: '#d1fae5' }}>
            <strong>All Courses in Good Standing:</strong> You are safely above the mandatory 75% statutory attendance threshold across all enrolled subjects.
          </span>
        </div>
      )}

      {/* 2. Side-by-side Grid: Upcoming Classes Schedule + Attendance Trend Forecast */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        {/* Card 1: Today / Upcoming Classes */}
        <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} style={{ color: 'var(--primary)' }} />
              <h4 style={{ margin: 0, color: '#fff', fontSize: '0.96rem', fontWeight: 700 }}>
                {todayClasses.isUpcomingWeek ? `Upcoming Monday Schedule` : `Today's Schedule (${todayClasses.day})`}
              </h4>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.76rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 5 }}
                onClick={() => setShowTimetableModal(true)}
              >
                <Calendar size={13} />
                <span>Full Timetable</span>
              </button>
              <button
                className="btn btn-outline"
                style={{ fontSize: '0.76rem', padding: '4px 10px' }}
                onClick={onOpenCalendar}
              >
                Open Calendar View
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {todayClasses.classes.length > 0 ? (
              todayClasses.classes.map((cls, idx) => (
                <div
                  key={idx}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: '10px',
                    padding: '12px 14px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12
                  }}
                >
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span className="code-pill" style={{ fontSize: '0.72rem', padding: '2px 8px', fontWeight: 700, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                        Period {cls.period}
                      </span>
                      <strong style={{ color: '#ffffff', fontSize: '0.92rem', fontWeight: 700 }}>
                        {cls.subjectName || cls.subject || cls.name || cls.subjectCode}
                      </strong>
                      {(cls.subjectCode || cls.code) && (
                        <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', padding: '1px 6px', borderRadius: '4px', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
                          {cls.subjectCode || cls.code}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                      <span style={{ color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Clock size={12} style={{ color: '#38bdf8' }} />
                        {cls.time}
                      </span>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>•</span>
                      <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <User size={12} style={{ color: '#a78bfa' }} />
                        {cls.faculty || 'Faculty Member'}
                      </span>
                    </div>
                  </div>

                  <span
                    style={{
                      fontSize: '0.74rem',
                      background: 'rgba(56, 189, 248, 0.1)',
                      color: '#38bdf8',
                      padding: '4px 10px',
                      borderRadius: 6,
                      whiteSpace: 'nowrap',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      fontWeight: 600,
                      border: '1px solid rgba(56, 189, 248, 0.2)'
                    }}
                  >
                    <MapPin size={12} />
                    {cls.room || 'LH-402'}
                  </span>
                </div>
              ))
            ) : (
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--text-dim)', padding: 12 }}>
                No scheduled lectures for today.
              </p>
            )}
          </div>
        </div>

        {/* Card 2: Attendance Trends & Forecast */}
        <div className="glass-panel" style={{ padding: '18px', borderRadius: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <TrendingUp size={18} style={{ color: '#10b981' }} />
            <h4 style={{ margin: 0, color: '#fff', fontSize: '0.96rem', fontWeight: 700 }}>
              Attendance Trend & Predictor
            </h4>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                borderRadius: '10px',
                padding: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', fontSize: '0.75rem', fontWeight: 600 }}>
                <ArrowUpRight size={14} />
                <span>If you attend next 3:</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
                {pctIfAttend3}%
              </div>
              <span style={{ fontSize: '0.7rem', color: '#10b981' }}>+{(pctIfAttend3 - currentPct).toFixed(1)}% gain</span>
            </div>

            <div
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '10px',
                padding: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontSize: '0.75rem', fontWeight: 600 }}>
                <ArrowDownRight size={14} />
                <span>If you miss next 3:</span>
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', marginTop: 4 }}>
                {pctIfMiss3}%
              </div>
              <span style={{ fontSize: '0.7rem', color: '#ef4444' }}>{(pctIfMiss3 - currentPct).toFixed(1)}% drop</span>
            </div>
          </div>

          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              lineHeight: 1.5
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>Classes you can safely miss (75% rule):</span>
              <strong style={{ color: '#10b981' }}>{overall?.bunksAllowedAt75 ?? overall?.marginClasses ?? 20} Lectures</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Minimum statutory requirement:</span>
              <strong style={{ color: '#fff' }}>75.0% Attendance</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Timetable Modal */}
      {showTimetableModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowTimetableModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}
        >
          <div
            className="glass-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 720,
              maxHeight: '90vh',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '16px',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.98)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                backgroundColor: '#1e293b',
                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                padding: '1.2rem 1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Calendar size={20} style={{ color: '#38bdf8' }} />
                <div>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '1.1rem', fontWeight: 700 }}>
                    Official Weekly Academic Timetable
                  </h3>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    BE Computer Science & Engineering (AI & ML) • Group U25AIML-G13
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowTimetableModal(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '50%',
                  width: 32,
                  height: 32,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cbd5e1',
                  cursor: 'pointer'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Day Selector Tabs */}
            <div
              style={{
                display: 'flex',
                gap: 8,
                padding: '1rem 1.5rem',
                background: '#131d33',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                overflowX: 'auto'
              }}
            >
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                <button
                  key={day}
                  onClick={() => setModalActiveDay(day)}
                  style={{
                    padding: '6px 16px',
                    borderRadius: '8px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    border: modalActiveDay === day ? '1px solid #38bdf8' : '1px solid rgba(255, 255, 255, 0.1)',
                    background: modalActiveDay === day ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                    color: modalActiveDay === day ? '#38bdf8' : '#94a3b8'
                  }}
                >
                  {day}
                </button>
              ))}
            </div>

            {/* Day Classes List */}
            <div style={{ padding: '1.25rem 1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
              {((timetable?.schedule && timetable.schedule[modalActiveDay]?.length > 0)
                ? timetable.schedule[modalActiveDay]
                : (defaultSchedule[modalActiveDay] || [])
              ).map((cls, idx) => {
                const code = cls.subjectCode || cls.code || '';
                const name = cls.subjectName || CODE_TO_NAME[code] || cls.subject || cls.name || code;
                const faculty = cls.faculty || CODE_TO_FACULTY[code] || 'Faculty Member';
                const room = cls.room || (code === '25CSE0202' ? 'MB-104' : 'LH-402');

                return (
                  <div
                    key={idx}
                    style={{
                      background: '#1e293b',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: '10px',
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                        <span className="code-pill" style={{ fontSize: '0.72rem', padding: '2px 8px', fontWeight: 700, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                          Period {cls.period}
                        </span>
                        <strong style={{ color: '#fff', fontSize: '0.94rem', fontWeight: 700 }}>
                          {name}
                        </strong>
                        {code && (
                          <span style={{ fontSize: '0.7rem', fontFamily: 'monospace', background: 'rgba(255, 255, 255, 0.08)', color: '#94a3b8', padding: '1px 6px', borderRadius: '4px' }}>
                            {code}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ color: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} style={{ color: '#38bdf8' }} />
                          {cls.time}
                        </span>
                        <span>•</span>
                        <span style={{ color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <User size={12} style={{ color: '#a78bfa' }} />
                          {faculty}
                        </span>
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: '0.76rem',
                        background: 'rgba(56, 189, 248, 0.1)',
                        color: '#38bdf8',
                        padding: '4px 10px',
                        borderRadius: 6,
                        whiteSpace: 'nowrap',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        fontWeight: 600,
                        border: '1px solid rgba(56, 189, 248, 0.2)'
                      }}
                    >
                      <MapPin size={12} />
                      {room}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
