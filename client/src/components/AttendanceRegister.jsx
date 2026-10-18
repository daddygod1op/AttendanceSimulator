import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  User,
  ArrowUpDown,
  RotateCcw,
  BookOpen,
  Table as TableIcon,
  AlertTriangle,
  Flame,
  Info,
  CalendarDays,
  X,
  ExternalLink
} from 'lucide-react';
import AttendanceCalendar from './AttendanceCalendar';

export default function AttendanceRegister({
  register = [],
  subjects = [],
  timetable = null,
  initialSubjectFilter = '',
  initialViewMode = 'calendar',
  onBack
}) {
  const [viewMode, setViewMode] = useState(initialViewMode); // 'calendar' | 'table'
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState(initialSubjectFilter);
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortField, setSortField] = useState('date'); // 'date' | 'subject' | 'status'
  const [sortOrder, setSortOrder] = useState('desc'); // 'asc' | 'desc'
  const [filterMissedAllDayOnly, setFilterMissedAllDayOnly] = useState(false);
  const [isTimetableModalOpen, setIsTimetableModalOpen] = useState(false);
  const [isMissedDaysDrawerOpen, setIsMissedDaysDrawerOpen] = useState(false);

  useEffect(() => {
    if (initialSubjectFilter !== undefined) {
      setSelectedSubject(initialSubjectFilter);
    }
  }, [initialSubjectFilter]);

  useEffect(() => {
    if (initialViewMode) {
      setViewMode(initialViewMode);
    }
  }, [initialViewMode]);

  // Default weekly timetable if not supplied from scrape or if old scrape had night shift hours (Standard Chitkara College Hours: 09:00 AM - 03:00 PM)
  const isNightShift = timetable?.periods?.[0]?.time?.includes('04:10') || timetable?.periods?.[0]?.time?.includes('05:00');
  const activeTimetable = (!timetable || isNightShift) ? {
    periods: [
      { period: 1, time: '09:00 AM - 09:50 AM' },
      { period: 2, time: '09:50 AM - 10:40 AM' },
      { period: 3, time: '10:50 AM - 11:40 AM' },
      { period: 4, time: '11:40 AM - 12:30 PM' },
      { period: 5, time: '01:20 PM - 02:10 PM' },
      { period: 6, time: '02:10 PM - 03:00 PM' }
    ],
    schedule: {
      Monday: [
        { period: 1, time: '09:00 AM - 09:50 AM', subjectCode: '25CSE0203', room: 'LH-402', faculty: 'Himanshu Sharma' },
        { period: 2, time: '09:50 AM - 10:40 AM', subjectCode: '25CSE0203', room: 'LH-402', faculty: 'Himanshu Sharma' },
        { period: 3, time: '10:50 AM - 11:40 AM', subjectCode: '24CSE0209', room: 'LH-402', faculty: 'Sourabh Batra' },
        { period: 4, time: '11:40 AM - 12:30 PM', subjectCode: '24CSE0209', room: 'LH-402', faculty: 'Sourabh Batra' },
        { period: 5, time: '01:20 PM - 02:10 PM', subjectCode: '25CSE0202 / 25CSE0204', room: 'MB104 / LH-402', faculty: 'Gourav Kaloniya' },
        { period: 6, time: '02:10 PM - 03:00 PM', subjectCode: '25CSE0202 / 25CSE0204', room: 'MB104 / LH-402', faculty: 'Gourav Kaloniya' }
      ],
      Tuesday: [
        { period: 1, time: '09:00 AM - 09:50 AM', subjectCode: '25CSE0202', room: 'MB104', faculty: 'Gourav Kaloniya' },
        { period: 2, time: '09:50 AM - 10:40 AM', subjectCode: '25CSE0204', room: 'LH-402', faculty: 'Gourav Kaloniya' },
        { period: 3, time: '10:50 AM - 11:40 AM', subjectCode: '25CSE0203', room: 'LH-402', faculty: 'Himanshu Sharma' },
        { period: 4, time: '11:40 AM - 12:30 PM', subjectCode: '25CSE0203', room: 'LH-402', faculty: 'Himanshu Sharma' },
        { period: 5, time: '01:20 PM - 02:10 PM', subjectCode: '24CSE0209', room: 'LH-402', faculty: 'Sourabh Batra' },
        { period: 6, time: '02:10 PM - 03:00 PM', subjectCode: '24CSE0209', room: 'LH-402', faculty: 'Sourabh Batra' }
      ],
      Wednesday: [
        { period: 1, time: '09:00 AM - 09:50 AM', subjectCode: '25CAI0201', room: 'LH-402', faculty: 'Hemant Kumar / Saravjeet Singh' },
        { period: 2, time: '09:50 AM - 10:40 AM', subjectCode: '25CAI0201', room: 'LH-402', faculty: 'Hemant Kumar / Saravjeet Singh' },
        { period: 3, time: '10:50 AM - 11:40 AM', subjectCode: '25CSE0203', room: 'LH-402', faculty: 'Himanshu Sharma' },
        { period: 4, time: '11:40 AM - 12:30 PM', subjectCode: '25CSE0203', room: 'LH-402', faculty: 'Himanshu Sharma' },
        { period: 5, time: '01:20 PM - 02:10 PM', subjectCode: '25CSE0204 / 25CSE0202', room: 'LH-402 / MB104', faculty: 'Gourav Kaloniya' },
        { period: 6, time: '02:10 PM - 03:00 PM', subjectCode: '25CSE0204 / 25CSE0202', room: 'LH-402 / MB104', faculty: 'Gourav Kaloniya' }
      ],
      Thursday: [
        { period: 1, time: '09:00 AM - 09:50 AM', subjectCode: '25CSE0204', room: 'LH-402', faculty: 'Gourav Kaloniya' },
        { period: 2, time: '09:50 AM - 10:40 AM', subjectCode: '25CSE0204', room: 'LH-402', faculty: 'Gourav Kaloniya' },
        { period: 3, time: '10:50 AM - 11:40 AM', subjectCode: '25CAI0201', room: 'LH-402', faculty: 'Hemant Kumar / Saravjeet Singh' },
        { period: 4, time: '11:40 AM - 12:30 PM', subjectCode: '25CAI0201', room: 'LH-402', faculty: 'Hemant Kumar / Saravjeet Singh' }
      ],
      Friday: [
        { period: 1, time: '09:00 AM - 09:50 AM', subjectCode: '25CSE0202 / 25CSE0204', room: 'MB104 / LH-402', faculty: 'Gourav Kaloniya' },
        { period: 2, time: '09:50 AM - 10:40 AM', subjectCode: '25CSE0202 / 25CSE0204', room: 'MB104 / LH-402', faculty: 'Gourav Kaloniya' }
      ]
    }
  } : timetable;

  // Group lectures by date and calculate day-wise bunks / timetable stats
  const { dayStatsMap, fullDayMissedDates } = useMemo(() => {
    const dayMap = {};
    (register || []).forEach(r => {
      if (!dayMap[r.date]) dayMap[r.date] = [];
      dayMap[r.date].push(r);
    });

    const dayStats = {};
    const fullDayMissed = [];

    Object.entries(dayMap).forEach(([dateStr, lecs]) => {
      const total = lecs.length;
      const absentCount = lecs.filter(l => l.status === 'Absent').length;
      const presentCount = lecs.filter(l => l.status === 'Present').length;
      const leavesCount = lecs.filter(l => l.status === 'Duty Leave' || l.status === 'Medical Leave').length;
      const isFullDayMissed = (absentCount === total && total > 0);

      let dayOfWeek = 'Class Day';
      try {
        const parts = dateStr.split('-');
        if (parts.length === 3) {
          const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
          dayOfWeek = d.toLocaleDateString('en-US', { weekday: 'long' });
        }
      } catch (e) {}

      dayStats[dateStr] = {
        total,
        absentCount,
        presentCount,
        leavesCount,
        isFullDayMissed,
        dayOfWeek
      };

      if (isFullDayMissed) {
        fullDayMissed.push({
          date: dateStr,
          dayOfWeek,
          totalClasses: total,
          lectures: lecs
        });
      }
    });

    // Chronological descending sort
    fullDayMissed.sort((a, b) => {
      const [d1, m1, y1] = a.date.split('-');
      const [d2, m2, y2] = b.date.split('-');
      return new Date(`${y2}-${m2}-${d2}`) - new Date(`${y1}-${m1}-${d1}`);
    });

    return { dayStatsMap: dayStats, fullDayMissedDates: fullDayMissed };
  }, [register]);

  // Extract unique subject names/codes for filter dropdown
  const subjectOptions = useMemo(() => {
    const list = new Map();
    subjects.forEach(s => {
      if (s.name) list.set(s.code || s.name, s.name);
    });
    register.forEach(r => {
      const key = r.subjectCode || r.subjectName;
      if (key && !list.has(key)) {
        list.set(key, r.subjectName || r.subjectCode);
      }
    });
    return Array.from(list.entries()).map(([code, name]) => ({ code, name }));
  }, [subjects, register]);

  // Handle column sorting
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtered and sorted records
  const filteredRecords = useMemo(() => {
    return register
      .filter((row) => {
        const dayStat = dayStatsMap[row.date] || {};

        // Filter: Only days where student missed ALL classes
        if (filterMissedAllDayOnly && !dayStat.isFullDayMissed) {
          return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDate = row.date?.toLowerCase().includes(q);
          const matchSubj =
            (row.subjectName || '').toLowerCase().includes(q) ||
            (row.subjectCode || '').toLowerCase().includes(q);
          const matchFaculty = (row.faculty || '').toLowerCase().includes(q);
          const matchStatus = (row.status || '').toLowerCase().includes(q);
          const matchDay = (dayStat.dayOfWeek || '').toLowerCase().includes(q);
          if (!matchDate && !matchSubj && !matchFaculty && !matchStatus && !matchDay) return false;
        }

        // Subject filter
        if (selectedSubject) {
          const matchCode = row.subjectCode === selectedSubject;
          const matchName = row.subjectName?.toLowerCase().includes(selectedSubject.toLowerCase());
          if (!matchCode && !matchName) return false;
        }

        // Status filter
        if (selectedStatus !== 'ALL') {
          if (selectedStatus === 'PRESENT' && row.status !== 'Present') return false;
          if (selectedStatus === 'ABSENT' && row.status !== 'Absent') return false;
          if (selectedStatus === 'LEAVE' && row.status !== 'Duty Leave' && row.status !== 'Medical Leave')
            return false;
        }

        // Date range
        if (startDate) {
          const [d, m, y] = (row.date || '').split('-');
          const rDate = new Date(`${y}-${m}-${d}`);
          const sDate = new Date(startDate);
          if (!isNaN(rDate) && !isNaN(sDate) && rDate < sDate) return false;
        }
        if (endDate) {
          const [d, m, y] = (row.date || '').split('-');
          const rDate = new Date(`${y}-${m}-${d}`);
          const eDate = new Date(endDate);
          if (!isNaN(rDate) && !isNaN(eDate) && rDate > eDate) return false;
        }

        return true;
      })
      .sort((a, b) => {
        let valA = a[sortField] || '';
        let valB = b[sortField] || '';

        if (sortField === 'date') {
          const [d1, m1, y1] = (a.date || '').split('-');
          const [d2, m2, y2] = (b.date || '').split('-');
          const timeA = new Date(`${y1}-${m1}-${d1}`).getTime() || 0;
          const timeB = new Date(`${y2}-${m2}-${d2}`).getTime() || 0;
          return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
        }

        valA = String(valA).toLowerCase();
        valB = String(valB).toLowerCase();

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
  }, [
    register,
    searchQuery,
    selectedSubject,
    selectedStatus,
    startDate,
    endDate,
    sortField,
    sortOrder,
    filterMissedAllDayOnly,
    dayStatsMap
  ]);

  // Dynamic calculations for current filtered records
  const stats = useMemo(() => {
    const total = filteredRecords.length;
    const present = filteredRecords.filter(r => r.status === 'Present').length;
    const absent = filteredRecords.filter(r => r.status === 'Absent').length;
    const leaves = filteredRecords.filter(
      r => r.status === 'Duty Leave' || r.status === 'Medical Leave'
    ).length;
    const effectiveAttended = present + leaves;
    const percentage = total > 0 ? Math.round((effectiveAttended / total) * 1000) / 10 : 0;

    return { total, present, absent, leaves, percentage };
  }, [filteredRecords]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedSubject('');
    setSelectedStatus('ALL');
    setStartDate('');
    setEndDate('');
    setFilterMissedAllDayOnly(false);
  };

  return (
    <div className="register-view-container">
      {/* Top Navigation & Action Controls */}
      <div
        className="register-top-bar"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            className="btn-back-dashboard"
            onClick={onBack}
            id="back-to-dashboard-btn"
          >
            <ArrowLeft size={16} />
            <span>Back to Dashboard</span>
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* View Timetable Button */}
          <button
            onClick={() => setIsTimetableModalOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: '9px',
              border: '1px solid rgba(59, 130, 246, 0.35)',
              background: 'rgba(59, 130, 246, 0.12)',
              color: 'var(--accent-blue)',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.86rem'
            }}
            id="view-timetable-modal-btn"
          >
            <Clock size={15} />
            <span>Official Class Timetable</span>
          </button>

          {/* Missed All Classes Days Quick Drawer Trigger */}
          <button
            onClick={() => setIsMissedDaysDrawerOpen(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: '9px',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              background: 'rgba(239, 68, 68, 0.15)',
              color: '#f87171',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.86rem'
            }}
            id="open-missed-days-drawer-btn"
          >
            <AlertTriangle size={15} />
            <span>Missed All Classes Days ({fullDayMissedDates.length} Days)</span>
          </button>

          {/* View Mode Toggle Buttons */}
          <div
            style={{
              display: 'flex',
              background: 'rgba(255, 255, 255, 0.05)',
              padding: '4px',
              borderRadius: '12px',
              border: '1px solid var(--border-subtle)',
              gap: 4
            }}
          >
            <button
              onClick={() => setViewMode('calendar')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 14px',
                borderRadius: '9px',
                border: 'none',
                background:
                  viewMode === 'calendar' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'transparent',
                color: viewMode === 'calendar' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.86rem',
                boxShadow: viewMode === 'calendar' ? '0 4px 12px rgba(239, 68, 68, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
              id="view-mode-calendar-btn"
            >
              <Calendar size={15} />
              <span>Subject Calendar</span>
            </button>

            <button
              onClick={() => setViewMode('table')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 14px',
                borderRadius: '9px',
                border: 'none',
                background:
                  viewMode === 'table' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '0.86rem',
                boxShadow: viewMode === 'table' ? '0 4px 12px rgba(239, 68, 68, 0.35)' : 'none',
                transition: 'all 0.2s ease'
              }}
              id="view-mode-table-btn"
            >
              <TableIcon size={15} />
              <span>Detailed Register Table</span>
            </button>
          </div>
        </div>
      </div>

      {/* Prominent Missed-All-Classes Alert Card */}
      {fullDayMissedDates.length > 0 && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(185, 28, 28, 0.05))',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: '14px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.25)',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <AlertTriangle size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff' }}>
                Full-Day Absences Detected ({fullDayMissedDates.length} Days Where You Missed 100% of Classes)
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: 2 }}>
                Dates where every scheduled period was missed: {fullDayMissedDates.slice(0, 5).map(d => `${d.date} (${d.totalClasses} classes)`).join(', ')}...
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                setFilterMissedAllDayOnly(!filterMissedAllDayOnly);
              }}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid rgba(239, 68, 68, 0.4)',
                background: filterMissedAllDayOnly ? '#ef4444' : 'rgba(239, 68, 68, 0.2)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
              id="toggle-missed-all-classes-btn"
            >
              <span>{filterMissedAllDayOnly ? 'Showing 100% Missed Days Only ✓' : 'Filter to 100% Missed Days (Calendar & Table)'}</span>
            </button>
            <button
              onClick={() => setIsMissedDaysDrawerOpen(true)}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '0.84rem',
                fontWeight: 700,
                border: '1px solid var(--border-subtle)',
                background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-main)',
                cursor: 'pointer'
              }}
            >
              View Full Dateline
            </button>
          </div>
        </div>
      )}

      {/* RENDER CALENDAR VIEW */}
      {viewMode === 'calendar' ? (
        <AttendanceCalendar
          register={register}
          subjects={subjects}
          selectedSubject={selectedSubject}
          filterMissedOnly={filterMissedAllDayOnly}
          onSelectSubject={(subj) => setSelectedSubject(subj)}
          onToggleMissedOnly={(val) => setFilterMissedAllDayOnly(val)}
        />
      ) : (
        /* RENDER TABLE VIEW */
        <>
          {/* Dynamic Summary Bar */}
          <div className="register-summary-bar">
            <div className="summary-item">
              <span style={{ color: 'var(--text-dim)' }}>Lectures Displayed:</span>
              <span className="summary-value">{stats.total}</span>
            </div>
            <div className="summary-item">
              <span style={{ color: 'var(--present-green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={15} /> Present:
              </span>
              <span className="summary-value" style={{ color: 'var(--present-green)' }}>
                {stats.present}
              </span>
            </div>
            <div className="summary-item">
              <span style={{ color: 'var(--absent-red)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <XCircle size={15} /> Absent:
              </span>
              <span className="summary-value" style={{ color: 'var(--absent-red)' }}>
                {stats.absent}
              </span>
            </div>
            {stats.leaves > 0 && (
              <div className="summary-item">
                <span style={{ color: 'var(--leave-blue)' }}>Duty/Medical:</span>
                <span className="summary-value" style={{ color: 'var(--leave-blue)' }}>
                  {stats.leaves}
                </span>
              </div>
            )}
            <div className="summary-item" style={{ marginLeft: 'auto' }}>
              <span style={{ color: 'var(--text-muted)' }}>Filtered Attendance:</span>
              <span
                className="summary-value"
                style={{
                  color: stats.percentage >= 75 ? 'var(--present-green)' : 'var(--absent-red)',
                  fontSize: '1.3rem'
                }}
              >
                {stats.percentage}%
              </span>
            </div>
          </div>

          {/* Filter Controls Toolbar */}
          <div className="filter-toolbar">
            {/* Search */}
            <div className="search-box-wrapper">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                className="input-field"
                placeholder="Search date, subject, faculty, day of week..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="register-search-input"
              />
            </div>

            {/* Subject Filter Dropdown */}
            <div>
              <select
                className="select-field"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                id="register-subject-filter"
              >
                <option value="">All Subjects</option>
                {subjectOptions.map((opt) => (
                  <option key={opt.code} value={opt.code}>
                    {opt.code} - {opt.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                className="select-field"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                id="register-status-filter"
              >
                <option value="ALL">All Statuses</option>
                <option value="PRESENT">Present Only (✓)</option>
                <option value="ABSENT">Absent Only (✕)</option>
                <option value="LEAVE">Duty/Medical Leaves</option>
              </select>
            </div>

            {/* Filter Toggle: Missed All Classes in Day */}
            <button
              onClick={() => setFilterMissedAllDayOnly(!filterMissedAllDayOnly)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 14px',
                borderRadius: '8px',
                border: filterMissedAllDayOnly ? '1px solid #ef4444' : '1px solid var(--border-subtle)',
                background: filterMissedAllDayOnly ? 'rgba(239, 68, 68, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                color: filterMissedAllDayOnly ? '#f87171' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.84rem',
                cursor: 'pointer'
              }}
              title="Filter to show only the days where you missed all scheduled lectures"
            >
              <AlertTriangle size={14} />
              <span>100% Missed Days ({fullDayMissedDates.length})</span>
            </button>

            {/* Date Filter (Start) */}
            <div>
              <input
                type="date"
                className="date-field"
                placeholder="From Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                title="Filter from date"
                id="register-start-date"
              />
            </div>

            {/* Reset Button */}
            <div>
              <button
                className="btn-reset-filters"
                onClick={resetFilters}
                title="Clear all active filters"
                id="register-reset-filters-btn"
              >
                <RotateCcw size={14} style={{ display: 'inline', marginRight: 4 }} />
                Reset
              </button>
            </div>
          </div>

          {/* Date-Wise Attendance Table with Daily Timetable Bunk Column */}
          <div className="table-card">
            <div className="table-responsive">
              <table className="register-table">
                <thead>
                  <tr>
                    <th style={{ width: '3%' }}>#</th>
                    <th onClick={() => handleSort('date')} style={{ width: '13%' }}>
                      Date & Day
                      <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th style={{ width: '12%' }}>Period / Time</th>
                    <th onClick={() => handleSort('subjectName')} style={{ width: '22%' }}>
                      Subject & Code
                      <ArrowUpDown size={12} className="sort-icon" />
                    </th>
                    <th style={{ width: '14%' }}>Faculty</th>
                    <th style={{ width: '11%' }}>Lecture Status</th>
                    {/* NEW COLUMN: Daily Timetable & Bunk Status */}
                    <th style={{ width: '25%' }}>
                      Daily Timetable & Bunk Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((row, rIdx) => {
                      const isPresent = row.status === 'Present';
                      const isAbsent = row.status === 'Absent';
                      const dayStat = dayStatsMap[row.date] || {
                        total: 1,
                        absentCount: isAbsent ? 1 : 0,
                        presentCount: isPresent ? 1 : 0,
                        isFullDayMissed: isAbsent,
                        dayOfWeek: 'Class Day'
                      };

                      return (
                        <tr
                          key={row.id}
                          style={{
                            background: dayStat.isFullDayMissed
                              ? 'rgba(239, 68, 68, 0.04)'
                              : 'transparent'
                          }}
                        >
                          <td style={{ color: 'var(--text-dim)', fontWeight: 700, fontSize: '0.8rem' }}>
                            {row.lectureNo || rIdx + 1}
                          </td>
                          <td style={{ fontWeight: 600, color: '#fff', whiteSpace: 'nowrap' }}>
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                <Calendar size={14} style={{ color: 'var(--text-dim)' }} />
                                <span>{row.date}</span>
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2, paddingLeft: 20 }}>
                                {dayStat.dayOfWeek}
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <Clock size={14} style={{ color: 'var(--text-dim)' }} />
                              <span>{row.time || 'Period'}</span>
                            </div>
                          </td>
                          <td>
                            <div style={{ fontWeight: 600, color: '#fff' }}>{row.subjectName}</div>
                            {row.subjectCode && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: 2 }}>
                                {row.subjectCode}
                              </div>
                            )}
                          </td>
                          <td style={{ color: 'var(--text-muted)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <User size={14} style={{ color: 'var(--text-dim)' }} />
                              <span>{row.faculty || 'Faculty Member'}</span>
                            </div>
                          </td>
                          <td>
                            {isPresent ? (
                              <span className="status-badge present">
                                <CheckCircle size={13} />
                                Present
                              </span>
                            ) : isAbsent ? (
                              <span className="status-badge absent">
                                <XCircle size={13} />
                                Absent
                              </span>
                            ) : (
                              <span className="status-badge leave">{row.status}</span>
                            )}
                          </td>
                          {/* NEW COLUMN CELL: Daily Timetable Status */}
                          <td>
                            {dayStat.isFullDayMissed ? (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(239, 68, 68, 0.15)',
                                  border: '1px solid rgba(239, 68, 68, 0.35)',
                                  color: '#f87171',
                                  fontSize: '0.8rem',
                                  fontWeight: 700
                                }}
                              >
                                <AlertTriangle size={13} />
                                <span>Missed All {dayStat.total} Classes That Day</span>
                              </div>
                            ) : (
                              <div
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '4px 10px',
                                  borderRadius: '6px',
                                  background: 'rgba(255, 255, 255, 0.03)',
                                  border: '1px solid var(--border-subtle)',
                                  color: 'var(--text-muted)',
                                  fontSize: '0.8rem'
                                }}
                              >
                                <span>
                                  {dayStat.presentCount + dayStat.leavesCount}/{dayStat.total} Attended ({dayStat.absentCount} Missed)
                                </span>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={7}
                        style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-dim)' }}
                      >
                        <div
                          style={{
                            fontSize: '1rem',
                            fontWeight: 600,
                            marginBottom: '0.4rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          No matching attendance records found
                        </div>
                        <p style={{ fontSize: '0.85rem' }}>
                          Try clearing filters or checking another date range.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* MODAL 1: WEEKLY TIMETABLE MODAL */}
      {isTimetableModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsTimetableModalOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '900px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setIsTimetableModalOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Clock size={22} style={{ color: 'var(--accent-blue)' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>Official Weekly Class Timetable</h3>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                    Schedule synced from Chitkara University portal (LH-402 / MB104)
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, overflowX: 'auto' }}>
              <table
                style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  fontSize: '0.84rem',
                  textAlign: 'left'
                }}
              >
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.04)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '12px 14px', color: 'var(--text-dim)' }}>Day</th>
                    {activeTimetable.periods.map(p => (
                      <th key={p.period} style={{ padding: '12px 10px', color: 'var(--text-dim)' }}>
                        <div style={{ fontWeight: 700, color: '#fff' }}>Period {p.period}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', fontWeight: 400 }}>{p.time}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(activeTimetable.schedule).map(([day, periods]) => (
                    <tr
                      key={day}
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: 'rgba(255,255,255,0.01)'
                      }}
                    >
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#fff' }}>
                        {day}
                      </td>
                      {activeTimetable.periods.map(p => {
                        const cell = periods.find(item => item.period === p.period);
                        return (
                          <td key={p.period} style={{ padding: '10px 8px', verticalAlign: 'top' }}>
                            {cell ? (
                              <div
                                style={{
                                  background: 'rgba(59, 130, 246, 0.08)',
                                  border: '1px solid rgba(59, 130, 246, 0.2)',
                                  padding: '6px 8px',
                                  borderRadius: '6px'
                                }}
                              >
                                <div style={{ fontWeight: 700, color: '#fff', fontSize: '0.78rem' }}>
                                  {cell.subjectCode}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  {cell.room || 'LH-402'}
                                </div>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                                  {cell.faculty?.split(',')[0]}
                                </div>
                              </div>
                            ) : (
                              <div style={{ color: 'var(--text-dim)', textAlign: 'center' }}>—</div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: 100% MISSED ALL CLASSES DAYS TIMELINE DRAWER */}
      {isMissedDaysDrawerOpen && (
        <div className="modal-backdrop" onClick={() => setIsMissedDaysDrawerOpen(false)}>
          <div
            className="modal-card"
            style={{ maxWidth: '780px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="modal-close-btn"
              onClick={() => setIsMissedDaysDrawerOpen(false)}
            >
              <X size={20} />
            </button>

            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <AlertTriangle size={22} style={{ color: '#f87171' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800 }}>
                    100% Missed Classes Dateline
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.83rem', color: 'var(--text-muted)' }}>
                    All {fullDayMissedDates.length} calendar days where every single scheduled class was missed
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '65vh', overflowY: 'auto', paddingRight: 6 }}>
              {fullDayMissedDates.map((item, idx) => (
                <div
                  key={item.date}
                  style={{
                    background: 'rgba(239, 68, 68, 0.08)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: '12px',
                    padding: '14px 16px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div>
                      <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff' }}>
                        {item.date}
                      </span>
                      <span style={{ marginLeft: 8, fontSize: '0.84rem', color: 'var(--text-dim)' }}>
                        ({item.dayOfWeek})
                      </span>
                    </div>

                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: '6px',
                        background: 'rgba(239, 68, 68, 0.25)',
                        color: '#f87171',
                        fontSize: '0.8rem',
                        fontWeight: 700
                      }}
                    >
                      Missed All {item.totalClasses} Lectures
                    </span>
                  </div>

                  {/* List of missed classes on that day */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {item.lectures.map((lec, lIdx) => (
                      <div
                        key={lIdx}
                        style={{
                          background: 'rgba(0,0,0,0.3)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                          padding: '6px 10px',
                          fontSize: '0.78rem'
                        }}
                      >
                        <div style={{ fontWeight: 700, color: '#fff' }}>
                          {lec.subjectCode} - {lec.time}
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                          {lec.subjectName}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
