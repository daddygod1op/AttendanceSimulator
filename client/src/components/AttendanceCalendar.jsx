import React, { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Info,
  BookOpen,
  Filter
} from 'lucide-react';

export default function AttendanceCalendar({
  register = [],
  subjects = [],
  selectedSubject = '',
  filterMissedOnly = false,
  onSelectSubject,
  onToggleMissedOnly
}) {
  // Available months from data: June 2026 to October 2026
  // Default to October 2026 (current semester month)
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed: 9 = October
  const [selectedDayEvents, setSelectedDayEvents] = useState(null);
  const [activeSubject, setActiveSubject] = useState(selectedSubject || '');
  // Modes: 'ALL' | 'FULL_DAY_100' | 'ANY_ABSENT'
  const [missedFilterMode, setMissedFilterMode] = useState(filterMissedOnly ? 'FULL_DAY_100' : 'ALL');

  useEffect(() => {
    setActiveSubject(selectedSubject || '');
  }, [selectedSubject]);

  useEffect(() => {
    setMissedFilterMode(filterMissedOnly ? 'FULL_DAY_100' : 'ALL');
  }, [filterMissedOnly]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Subject options
  const subjectOptions = useMemo(() => {
    const map = new Map();
    subjects.forEach(s => {
      if (s.name) map.set(s.code || s.name, s.name);
    });
    register.forEach(r => {
      const key = r.subjectCode || r.subjectName;
      if (key && !map.has(key)) map.set(key, r.subjectName || r.subjectCode);
    });
    return Array.from(map.entries()).map(([code, name]) => ({ code, name }));
  }, [subjects, register]);

  // Filter records by selected subject
  const subjectFilteredRecords = useMemo(() => {
    if (!activeSubject) return register;
    return register.filter(
      r => r.subjectCode === activeSubject || (r.subjectName && r.subjectName.toLowerCase().includes(activeSubject.toLowerCase()))
    );
  }, [register, activeSubject]);

  // Group records by Date: "YYYY-MM-DD"
  const recordsByDate = useMemo(() => {
    const grouped = {};
    subjectFilteredRecords.forEach(r => {
      if (!r.date) return;
      // Date format is "DD-MM-YYYY"
      const parts = r.date.split('-');
      if (parts.length === 3) {
        const day = parts[0].padStart(2, '0');
        const month = parts[1].padStart(2, '0');
        const year = parts[2];
        const key = `${year}-${month}-${day}`;
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(r);
      }
    });
    return grouped;
  }, [subjectFilteredRecords]);

  // Month stats
  const monthStats = useMemo(() => {
    const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
    let total = 0;
    let present = 0;
    let absent = 0;
    let leaves = 0;
    let daysWithAbsences = 0;
    let fullDayMissedCount = 0;

    Object.entries(recordsByDate).forEach(([dateStr, events]) => {
      if (dateStr.startsWith(monthKey)) {
        let dayPresent = 0;
        let dayAbsent = 0;
        let dayLeaves = 0;
        events.forEach(ev => {
          total++;
          if (ev.status === 'Present') {
            present++;
            dayPresent++;
          } else if (ev.status === 'Absent') {
            absent++;
            dayAbsent++;
          } else {
            leaves++;
            dayLeaves++;
          }
        });
        if (dayAbsent > 0) daysWithAbsences++;
        if (events.length > 0 && dayAbsent === events.length && dayPresent === 0) {
          fullDayMissedCount++;
        }
      }
    });

    const effectiveAttended = present + leaves;
    const percentage = total > 0 ? Math.round((effectiveAttended / total) * 1000) / 10 : 0;
    return { total, present, absent, leaves, percentage, daysWithAbsences, fullDayMissedCount };
  }, [recordsByDate, currentYear, currentMonth]);

  // Calendar matrix calculation
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    // Monday as first day of week: 0 = Mon, 6 = Sun
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = lastDayOfMonth.getDate();
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();

    const days = [];

    // Previous month padding days
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      days.push({
        day: prevMonthLastDay - i,
        isCurrentMonth: false,
        dateKey: null
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({
        day: d,
        isCurrentMonth: true,
        dateKey,
        events: recordsByDate[dateKey] || []
      });
    }

    // Next month padding days to complete grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        dateKey: null
      });
    }

    return days;
  }, [currentYear, currentMonth, recordsByDate]);

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDayEvents(null);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDayEvents(null);
  };

  return (
    <div className="attendance-calendar-container" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Calendar Header Controls */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
        background: 'var(--bg-card)',
        padding: '1.25rem 1.5rem',
        borderRadius: 'var(--radius-md)',
        border: '1px solid var(--border-subtle)'
      }}>
        {/* Month Navigation */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem' }}
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.45rem 0.75rem' }}
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          <h3 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.4rem',
            fontWeight: 800,
            color: '#fff',
            minWidth: '180px'
          }}>
            {monthNames[currentMonth]} {currentYear}
          </h3>
        </div>

        {/* Right Controls: Missed Days Filter Toggle + Subject Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          {/* Missed Days Filter Toggle (All Days / 100% Missed Full Days / Any Absence) */}
          <div style={{
            display: 'flex',
            background: 'rgba(0, 0, 0, 0.35)',
            padding: '3px',
            borderRadius: '10px',
            border: '1px solid var(--border-subtle)',
            gap: 4
          }}>
            <button
              type="button"
              onClick={() => {
                setMissedFilterMode('ALL');
                if (onToggleMissedOnly) onToggleMissedOnly(false);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                background: missedFilterMode === 'ALL' ? 'rgba(255, 255, 255, 0.12)' : 'transparent',
                color: missedFilterMode === 'ALL' ? '#fff' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              id="calendar-all-days-btn"
            >
              All Days
            </button>

            <button
              type="button"
              onClick={() => {
                setMissedFilterMode('FULL_DAY_100');
                if (onToggleMissedOnly) onToggleMissedOnly(true);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                background: missedFilterMode === 'FULL_DAY_100' ? '#ef4444' : 'transparent',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: missedFilterMode === 'FULL_DAY_100' ? '0 2px 8px rgba(239, 68, 68, 0.5)' : 'none',
                transition: 'all 0.2s ease'
              }}
              id="calendar-100-percent-missed-btn"
              title="Highlight ONLY days where you missed 100% of all lectures (0 classes attended)"
            >
              <span>🚨 100% Missed Days</span>
              <span style={{
                background: missedFilterMode === 'FULL_DAY_100' ? '#ffffff' : 'rgba(239, 68, 68, 0.25)',
                color: missedFilterMode === 'FULL_DAY_100' ? '#ef4444' : '#f87171',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {monthStats.fullDayMissedCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMissedFilterMode('ANY_ABSENT');
                if (onToggleMissedOnly) onToggleMissedOnly(true);
              }}
              style={{
                padding: '6px 12px',
                borderRadius: '7px',
                border: 'none',
                background: missedFilterMode === 'ANY_ABSENT' ? '#f59e0b' : 'transparent',
                color: missedFilterMode === 'ANY_ABSENT' ? '#000' : 'var(--text-muted)',
                fontWeight: 700,
                fontSize: '0.8rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: missedFilterMode === 'ANY_ABSENT' ? '0 2px 8px rgba(245, 158, 11, 0.4)' : 'none',
                transition: 'all 0.2s ease'
              }}
              id="calendar-any-missed-btn"
              title="Highlight any day that has at least 1 absence"
            >
              <span>⚠️ Any Absence</span>
              <span style={{
                background: missedFilterMode === 'ANY_ABSENT' ? '#000' : 'rgba(245, 158, 11, 0.2)',
                color: missedFilterMode === 'ANY_ABSENT' ? '#f59e0b' : '#fbbf24',
                padding: '1px 6px',
                borderRadius: '999px',
                fontSize: '0.72rem',
                fontWeight: 800
              }}>
                {monthStats.daysWithAbsences}
              </span>
            </button>
          </div>

          {/* Subject Filter Dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={16} style={{ color: 'var(--text-dim)' }} />
            <select
              className="select-field"
              style={{ width: '240px', padding: '0.55rem 0.85rem' }}
              value={activeSubject}
              onChange={(e) => {
                setActiveSubject(e.target.value);
                if (onSelectSubject) onSelectSubject(e.target.value);
                setSelectedDayEvents(null);
              }}
              id="calendar-subject-select"
            >
              <option value="">All Subjects (Consolidated)</option>
              {subjectOptions.map(opt => (
                <option key={opt.code} value={opt.code}>
                  {opt.code} - {opt.name}
                </option>
              ))}
            </select>
            {activeSubject && (
              <button
                type="button"
                onClick={() => {
                  setActiveSubject('');
                  if (onSelectSubject) onSelectSubject('');
                  setSelectedDayEvents(null);
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.15)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  borderRadius: '6px',
                  color: '#93c5fd',
                  padding: '5px 10px',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Reset to All Subjects"
              >
                <span>✕ All Subjects</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Month Statistics Bar */}
      <div className="register-summary-bar">
        <div className="summary-item">
          <span style={{ color: 'var(--text-dim)' }}>Month:</span>
          <span className="summary-value">{monthNames[currentMonth]}</span>
        </div>
        <div className="summary-item">
          <span style={{ color: 'var(--text-dim)' }}>Lectures Held:</span>
          <span className="summary-value">{monthStats.total}</span>
        </div>
        <div className="summary-item">
          <span style={{ color: 'var(--present-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <CheckCircle size={15} /> Attended:
          </span>
          <span className="summary-value" style={{ color: 'var(--present-green)' }}>{monthStats.present}</span>
        </div>
        <div className="summary-item">
          <span style={{ color: 'var(--absent-red)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <XCircle size={15} /> Missed:
          </span>
          <span className="summary-value" style={{ color: 'var(--absent-red)' }}>{monthStats.absent}</span>
        </div>
        {monthStats.leaves > 0 && (
          <div className="summary-item">
            <span style={{ color: 'var(--leave-blue)' }}>Leaves:</span>
            <span className="summary-value" style={{ color: 'var(--leave-blue)' }}>{monthStats.leaves}</span>
          </div>
        )}
        <div className="summary-item" style={{ marginLeft: 'auto' }}>
          <span style={{ color: 'var(--text-muted)' }}>Month Attendance:</span>
          <span
            className="summary-value"
            style={{
              color: monthStats.percentage >= 75 ? 'var(--present-green)' : 'var(--absent-red)',
              fontSize: '1.25rem'
            }}
          >
            {monthStats.percentage}%
          </span>
        </div>
      </div>

      {/* Calendar Grid Container */}
      <div style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(var(--blur))',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '1.5rem',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Days of Week Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          textAlign: 'center',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
          fontSize: '0.82rem',
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: 'var(--text-dim)',
          marginBottom: '0.75rem',
          paddingBottom: '0.75rem',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
          <div>Sun</div>
        </div>

        {/* Missed Days Filter Active Banner */}
        {missedFilterMode !== 'ALL' && (
          <div style={{
            background: missedFilterMode === 'FULL_DAY_100'
              ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.22), rgba(185, 28, 28, 0.12))'
              : 'linear-gradient(135deg, rgba(245, 158, 11, 0.22), rgba(180, 83, 9, 0.12))',
            border: missedFilterMode === 'FULL_DAY_100' ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(245, 158, 11, 0.5)',
            borderRadius: '10px',
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '1rem',
            fontSize: '0.86rem',
            color: missedFilterMode === 'FULL_DAY_100' ? '#fca5a5' : '#fde68a',
            boxShadow: missedFilterMode === 'FULL_DAY_100' ? '0 4px 15px rgba(239, 68, 68, 0.2)' : '0 4px 15px rgba(245, 158, 11, 0.2)'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
              <XCircle size={16} style={{ color: missedFilterMode === 'FULL_DAY_100' ? '#ef4444' : '#f59e0b' }} />
              <span>
                {missedFilterMode === 'FULL_DAY_100' ? (
                  <>Calendar Filter: Highlighting <strong>{monthStats.fullDayMissedCount} full-day absence(s) (100% missed)</strong> in {monthNames[currentMonth]} {currentYear}</>
                ) : (
                  <>Calendar Filter: Highlighting <strong>{monthStats.daysWithAbsences} day(s) with at least 1 absence</strong> in {monthNames[currentMonth]} {currentYear}</>
                )}
              </span>
            </span>
            <button
              onClick={() => {
                setMissedFilterMode('ALL');
                if (onToggleMissedOnly) onToggleMissedOnly(false);
              }}
              style={{
                background: 'rgba(255, 255, 255, 0.12)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                borderRadius: '6px',
                color: '#fff',
                padding: '4px 12px',
                fontSize: '0.8rem',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              Show All Days
            </button>
          </div>
        )}

        {/* Days Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '0.5rem'
        }}>
          {calendarDays.map((cell, idx) => {
            if (!cell.isCurrentMonth) {
              return (
                <div
                  key={`pad_${idx}`}
                  style={{
                    minHeight: '96px',
                    padding: '0.5rem',
                    background: 'rgba(255, 255, 255, 0.01)',
                    borderRadius: 'var(--radius-sm)',
                    opacity: 0.15,
                    color: 'var(--text-dim)',
                    fontSize: '0.85rem'
                  }}
                >
                  {cell.day}
                </div>
              );
            }

            const events = cell.events || [];
            const hasEvents = events.length > 0;
            const presents = events.filter(e => e.status === 'Present').length;
            const absents = events.filter(e => e.status === 'Absent').length;
            const leaves = events.filter(e => e.status === 'Medical Leave' || e.status === 'Duty Leave').length;
            const isSelected = selectedDayEvents && selectedDayEvents.dateKey === cell.dateKey;
            
            // 100% Missed: Day had scheduled classes AND 100% were absent (0 present, absents === events.length)
            const is100PercentMissed = hasEvents && presents === 0 && absents === events.length;
            const isAnyMissed = hasEvents && absents > 0;

            const isMissedHighlight = missedFilterMode === 'FULL_DAY_100'
              ? is100PercentMissed
              : missedFilterMode === 'ANY_ABSENT'
              ? isAnyMissed
              : false;

            const isDimmed = missedFilterMode === 'FULL_DAY_100'
              ? !is100PercentMissed
              : missedFilterMode === 'ANY_ABSENT'
              ? !isAnyMissed
              : false;

            return (
              <div
                key={cell.dateKey}
                onClick={() => hasEvents && setSelectedDayEvents({ dateKey: cell.dateKey, day: cell.day, events })}
                style={{
                  minHeight: '100px',
                  padding: '0.6rem',
                  background: isMissedHighlight
                    ? (missedFilterMode === 'FULL_DAY_100'
                        ? 'linear-gradient(135deg, rgba(239, 68, 68, 0.28), rgba(185, 28, 28, 0.18))'
                        : 'linear-gradient(135deg, rgba(245, 158, 11, 0.28), rgba(180, 83, 9, 0.18))')
                    : isSelected
                    ? 'rgba(230, 57, 70, 0.15)'
                    : hasEvents
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'transparent',
                  border: isMissedHighlight
                    ? (missedFilterMode === 'FULL_DAY_100' ? '2px solid #ef4444' : '2px solid #f59e0b')
                    : isSelected
                    ? '1px solid var(--primary)'
                    : hasEvents
                    ? '1px solid var(--border-subtle)'
                    : '1px solid rgba(255, 255, 255, 0.02)',
                  boxShadow: isMissedHighlight
                    ? (missedFilterMode === 'FULL_DAY_100' ? '0 0 16px rgba(239, 68, 68, 0.45)' : '0 0 16px rgba(245, 158, 11, 0.45)')
                    : 'none',
                  opacity: isDimmed ? 0.28 : 1,
                  borderRadius: 'var(--radius-sm)',
                  cursor: hasEvents ? 'pointer' : 'default',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
                className={`${hasEvents ? 'calendar-active-day' : ''} ${isMissedHighlight ? 'calendar-day-missed-highlight' : ''} ${isDimmed ? 'calendar-day-dimmed' : ''}`}
              >
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.3rem'
                }}>
                  <span style={{
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    color: isMissedHighlight ? (missedFilterMode === 'FULL_DAY_100' ? '#f87171' : '#fbbf24') : hasEvents ? '#fff' : 'var(--text-dim)'
                  }}>
                    {cell.day}
                  </span>

                  {isMissedHighlight ? (
                    <span className="calendar-missed-badge" style={{
                      background: missedFilterMode === 'FULL_DAY_100' ? 'rgba(239, 68, 68, 0.35)' : 'rgba(245, 158, 11, 0.35)',
                      color: missedFilterMode === 'FULL_DAY_100' ? '#fca5a5' : '#fde68a',
                      border: missedFilterMode === 'FULL_DAY_100' ? '1px solid rgba(239, 68, 68, 0.6)' : '1px solid rgba(245, 158, 11, 0.6)',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 4
                    }}>
                      {missedFilterMode === 'FULL_DAY_100' ? `🚨 100% Missed (${absents}/${events.length})` : `⚠️ ${absents} Missed`}
                    </span>
                  ) : hasEvents ? (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--text-dim)',
                      background: 'rgba(255, 255, 255, 0.08)',
                      padding: '0.1rem 0.35rem',
                      borderRadius: '4px'
                    }}>
                      {events.length} lec{events.length > 1 ? 's' : ''}
                    </span>
                  ) : null}
                </div>

                {/* Status Badges within the Day Box */}
                {hasEvents ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    {presents > 0 && (
                      <div style={{
                        background: 'var(--present-bg)',
                        color: 'var(--present-green)',
                        border: '1px solid var(--present-border)',
                        borderRadius: '4px',
                        padding: '0.15rem 0.4rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>✓ Present</span>
                        <span>{presents}</span>
                      </div>
                    )}
                    {absents > 0 && (
                      <div style={{
                        background: 'var(--absent-bg)',
                        color: 'var(--absent-red)',
                        border: '1px solid var(--absent-border)',
                        borderRadius: '4px',
                        padding: '0.15rem 0.4rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>✕ Absent</span>
                        <span>{absents}</span>
                      </div>
                    )}
                    {leaves > 0 && (
                      <div style={{
                        background: 'var(--leave-bg)',
                        color: 'var(--leave-blue)',
                        border: '1px solid var(--leave-border)',
                        borderRadius: '4px',
                        padding: '0.15rem 0.4rem',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}>
                        <span>★ Leave</span>
                        <span>{leaves}</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ height: '14px' }} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Day Details Drawer when a day is clicked */}
      {selectedDayEvents && (
        <div style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-highlight)',
          borderRadius: 'var(--radius-md)',
          padding: '1.5rem',
          animation: 'slide-up 0.2s ease',
          boxShadow: 'var(--shadow-md)'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            borderBottom: '1px solid var(--border-subtle)',
            paddingBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <CalendarIcon size={18} style={{ color: 'var(--primary)' }} />
              <h4 style={{ fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                Class Details for {selectedDayEvents.day} {monthNames[currentMonth]} {currentYear}
              </h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                ({selectedDayEvents.events.length} session{selectedDayEvents.events.length > 1 ? 's' : ''})
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {activeSubject && (
                <button
                  className="btn btn-secondary"
                  style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', color: '#93c5fd' }}
                  onClick={() => {
                    setActiveSubject('');
                    if (onSelectSubject) onSelectSubject('');
                  }}
                >
                  Show All Subjects
                </button>
              )}
              <button
                className="btn btn-secondary"
                style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem' }}
                onClick={() => setSelectedDayEvents(null)}
              >
                Close
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
            {selectedDayEvents.events.map((ev, eIdx) => {
              const isPresent = ev.status === 'Present';
              const isAbsent = ev.status === 'Absent';
              const isSelectedSubject = activeSubject && (activeSubject === ev.subjectCode || (ev.subjectName && ev.subjectName.includes(activeSubject)));

              return (
                <div
                  key={ev.id || eIdx}
                  style={{
                    background: isSelectedSubject ? 'rgba(59, 130, 246, 0.1)' : 'rgba(255, 255, 255, 0.03)',
                    border: isSelectedSubject ? '1px solid rgba(59, 130, 246, 0.5)' : '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '1rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '0.8rem',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: 8 }}>
                      <span className="subject-code-badge" style={{ fontSize: '0.7rem' }}>
                        {ev.subjectCode}
                      </span>
                      <div
                        onClick={() => {
                          const code = ev.subjectCode || ev.subjectName;
                          setActiveSubject(code);
                          if (onSelectSubject) onSelectSubject(code);
                        }}
                        style={{
                          fontWeight: 700,
                          color: '#fff',
                          fontSize: '0.95rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          marginTop: 3
                        }}
                        title={`Click to filter calendar to ${ev.subjectName}`}
                      >
                        <span style={{ textDecoration: 'underline', textUnderlineOffset: 3 }}>{ev.subjectName}</span>
                      </div>
                    </div>

                    {isPresent ? (
                      <span className="status-badge present" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', flexShrink: 0 }}>
                        <CheckCircle size={12} /> Present
                      </span>
                    ) : isAbsent ? (
                      <span className="status-badge absent" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', flexShrink: 0 }}>
                        <XCircle size={12} /> Absent
                      </span>
                    ) : (
                      <span className="status-badge leave" style={{ fontSize: '0.72rem', padding: '0.2rem 0.55rem', flexShrink: 0 }}>
                        {ev.status}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <Clock size={13} style={{ color: 'var(--text-dim)' }} />
                      <span>{ev.time}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <User size={13} style={{ color: 'var(--text-dim)' }} />
                      <span>{ev.faculty}</span>
                    </div>
                  </div>

                  {/* Quick Click Filter Button for this Subject */}
                  <button
                    type="button"
                    onClick={() => {
                      const code = ev.subjectCode || ev.subjectName;
                      if (isSelectedSubject) {
                        setActiveSubject('');
                        if (onSelectSubject) onSelectSubject('');
                      } else {
                        setActiveSubject(code);
                        if (onSelectSubject) onSelectSubject(code);
                      }
                    }}
                    style={{
                      background: isSelectedSubject ? 'rgba(59, 130, 246, 0.25)' : 'rgba(255, 255, 255, 0.05)',
                      border: isSelectedSubject ? '1px solid #3b82f6' : '1px solid rgba(255, 255, 255, 0.12)',
                      borderRadius: '6px',
                      padding: '5px 10px',
                      color: isSelectedSubject ? '#93c5fd' : 'var(--text-muted)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <BookOpen size={12} />
                    <span>{isSelectedSubject ? 'Showing Only This Subject (Click to Reset)' : `Filter Calendar to ${ev.subjectCode}`}</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
