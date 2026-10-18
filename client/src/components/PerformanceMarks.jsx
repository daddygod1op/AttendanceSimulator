import React, { useState } from 'react';
import {
  Award,
  GraduationCap,
  TrendingUp,
  FileText,
  Calendar,
  Layers,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  BarChart3,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Table as TableIcon,
  LayoutGrid,
  Check,
  AlertTriangle
} from 'lucide-react';

export default function PerformanceMarks({ performance = null }) {
  // Main tab: 'grades' (default as requested) | 'tests'
  const [activeTab, setActiveTab] = useState('grades');
  // Selected semester: '1 SEM' (default) | '2 SEM' | '3 SEM' | 'All'
  const [selectedSem, setSelectedSem] = useState('1 SEM');
  // View mode within grades: 'cards' | 'table'
  const [viewMode, setViewMode] = useState('cards');

  const tests = performance?.tests || [];
  const semesterGrades = performance?.semesterGrades || [];
  const cgpa = performance?.cgpa || 6.80;
  const sgpaHistory = performance?.sgpaHistory || [
    { semester: 'Semester 1', sgpa: 8.09, cgpa: 8.09, creditsEarned: 24 },
    { semester: 'Semester 2', sgpa: 6.60, cgpa: 7.41, creditsEarned: 18 },
    { semester: 'Semester 3', sgpa: 'Ongoing', cgpa: 6.80, creditsEarned: 18 }
  ];

  const getGradePoint = (grade) => {
    switch (grade?.toUpperCase()) {
      case 'O': return 10;
      case 'A+': return 9;
      case 'A': return 8;
      case 'B+': return 7;
      case 'B': return 6;
      case 'C': return 5;
      case 'F':
      case 'E2': return 0;
      default: return 0;
    }
  };

  const getGradeColorClass = (grade) => {
    switch (grade?.toUpperCase()) {
      case 'O': return 'grade-o';
      case 'A+': return 'grade-a-plus';
      case 'A': return 'grade-a';
      case 'B+': return 'grade-b-plus';
      case 'B': return 'grade-b';
      case 'C': return 'grade-c';
      case 'F':
      case 'E2': return 'grade-f';
      default: return 'grade-default';
    }
  };

  const getPercentColor = (percentStr) => {
    const val = parseFloat(percentStr) || 0;
    if (val >= 75) return '#10b981';
    if (val >= 50) return '#38bdf8';
    if (val >= 35) return '#f59e0b';
    return '#ef4444';
  };

  // Filter grades by selected semester
  const filteredGrades = semesterGrades.filter((g) => {
    if (selectedSem === 'All') return true;
    return g.semester === selectedSem;
  });

  // Calculate semester-specific statistics
  const sem1Grades = semesterGrades.filter(g => g.semester === '1 SEM');
  const sem2Grades = semesterGrades.filter(g => g.semester === '2 SEM');
  const sem3Grades = semesterGrades.filter(g => g.semester === '3 SEM');

  const calcSemStats = (gradesList, semKey) => {
    const totalCredits = gradesList.reduce((acc, g) => acc + (parseFloat(g.credits) || 0), 0);
    const earnedCredits = gradesList
      .filter(g => g.grade?.toUpperCase() !== 'F' && g.grade?.toUpperCase() !== 'E2')
      .reduce((acc, g) => acc + (parseFloat(g.credits) || 0), 0);
    const passedCount = gradesList.filter(g => g.grade?.toUpperCase() !== 'F' && g.grade?.toUpperCase() !== 'E2').length;
    const failedCount = gradesList.filter(g => g.grade?.toUpperCase() === 'F' || g.grade?.toUpperCase() === 'E2').length;

    let sgpa = '—';
    if (semKey === '1 SEM') sgpa = '8.09';
    else if (semKey === '2 SEM') sgpa = '6.60';
    else if (semKey === '3 SEM') sgpa = 'Ongoing';

    return {
      totalCourses: gradesList.length,
      totalCredits,
      earnedCredits,
      passedCount,
      failedCount,
      sgpa
    };
  };

  const currentStats = calcSemStats(filteredGrades, selectedSem);

  return (
    <div className="performance-section-container animate-fade-in">
      {/* Section Hero Header */}
      <div className="section-hero-header">
        <div className="hero-badge">
          <GraduationCap size={14} className="text-accent" />
          <span>Academic Evaluation & Semester Results</span>
        </div>
        <h2>Official Grades & Performance Record</h2>
        <p>
          Semester-wise academic transcripts, grade point averages, and course credits synced directly from{' '}
          <code className="code-pill">cuiet.codebrigade.in/studentPerformanceParent/graphDisplay</code>
        </p>
      </div>

      {/* Top Cumulative KPI Cards Strip (Clickable to switch semesters) */}
      <div className="perf-kpi-grid">
        <div
          className={`kpi-card glass-panel highlight-border ${selectedSem === 'All' ? 'active-kpi' : ''}`}
          onClick={() => {
            setActiveTab('grades');
            setSelectedSem('All');
          }}
          style={{ cursor: 'pointer', transition: 'all 0.2s ease' }}
          title="Click to view all semesters consolidated transcript"
        >
          <div className="kpi-icon-wrap gold">
            <Award size={24} />
          </div>
          <div className="kpi-content">
            <span className="kpi-label">Cumulative GPA</span>
            <div className="kpi-value gold-text">{cgpa.toFixed(2)}</div>
            <span className="kpi-subtext">Across All Completed Terms • 42 Credits Earned</span>
          </div>
        </div>

        {sgpaHistory.map((s, idx) => {
          const semKey = `${idx + 1} SEM`;
          const isSelected = activeTab === 'grades' && selectedSem === semKey;
          return (
            <div
              key={idx}
              className={`kpi-card glass-panel ${isSelected ? 'active-kpi' : ''}`}
              onClick={() => {
                setActiveTab('grades');
                setSelectedSem(semKey);
              }}
              style={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                borderColor: isSelected ? 'var(--primary)' : undefined,
                background: isSelected ? 'rgba(230, 57, 70, 0.08)' : undefined
              }}
              title={`Click to inspect ${s.semester} results and credits`}
            >
              <div className="kpi-icon-wrap cyan">
                <TrendingUp size={22} />
              </div>
              <div className="kpi-content">
                <span className="kpi-label">{s.semester} (Click to View)</span>
                <div className="kpi-value">
                  {typeof s.sgpa === 'number' ? s.sgpa.toFixed(2) : s.sgpa}
                </div>
                <span className="kpi-subtext">{s.creditsEarned} Credits Earned</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sessional Tests Quick Access Callout */}
      {tests.length > 0 && activeTab !== 'tests' && (
        <div
          onClick={() => setActiveTab('tests')}
          style={{
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.15), rgba(239, 68, 68, 0.1))',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            borderRadius: '12px',
            padding: '12px 18px',
            marginBottom: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            flexWrap: 'wrap',
            gap: 10
          }}
          className="sessional-tests-banner"
          title="Click to view all internal sessional test marks"
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
            <div>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.92rem' }}>
                Internal Sessional Test Marks Updated ({tests.length} Evaluations Published)
              </span>
              <p style={{ margin: '2px 0 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                ST-I, Practical Evaluations (PE), and Continuous Assessments (CE) synced directly from CUIET Performance tab.
              </p>
            </div>
          </div>
          <button
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.82rem', fontWeight: 700, background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}
          >
            <span>View Sessional Tests</span>
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* Main Subtab Navigation: Grades vs Tests */}
      <div className="perf-subtab-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div className="tab-buttons-group">
          <button
            className={`perf-tab-btn ${activeTab === 'grades' ? 'active' : ''}`}
            onClick={() => setActiveTab('grades')}
            id="tab-btn-grades"
          >
            <BookOpen size={16} />
            <span>Semester Grades & Credits ({semesterGrades.length} Courses)</span>
          </button>
          <button
            className={`perf-tab-btn ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
            id="tab-btn-tests"
          >
            <BarChart3 size={16} />
            <span>Internal Sessional Tests ({tests.length})</span>
          </button>
        </div>

        {activeTab === 'grades' && (
          <div style={{ display: 'flex', gap: 8, background: 'rgba(255,255,255,0.04)', padding: 4, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <button
              onClick={() => setViewMode('cards')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'cards' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'cards' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <LayoutGrid size={14} />
              <span>Cards</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'table' ? 'var(--primary)' : 'transparent',
                color: viewMode === 'table' ? '#fff' : 'var(--text-muted)',
                fontSize: '0.82rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <TableIcon size={14} />
              <span>Table</span>
            </button>
          </div>
        )}
      </div>

      {/* =========================================================================
          TAB 1: SEMESTER GRADES & CREDITS (SEMESTER-WISE DIVIDED & CLICKABLE)
         ========================================================================= */}
      {activeTab === 'grades' && (
        <div className="grades-view-container animate-fade-in">
          {/* Clickable Semester Selector Cards Bar */}
          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '0.85rem' }}>
              <Sparkles size={16} style={{ color: 'var(--primary)' }} />
              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#fff' }}>
                Select Semester to View Results & Credits:
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: '12px' }}>
              {/* SEMESTER 1 CARD */}
              <button
                type="button"
                className={`sem-choice-card ${selectedSem === '1 SEM' ? 'selected' : ''}`}
                onClick={() => setSelectedSem('1 SEM')}
                style={{
                  background: selectedSem === '1 SEM' ? 'linear-gradient(145deg, #1e293b, #0f172a)' : 'rgba(15, 23, 42, 0.6)',
                  border: selectedSem === '1 SEM' ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: selectedSem === '1 SEM' ? '0 10px 25px -5px rgba(239, 68, 68, 0.3)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Term 1 • JulDec2025
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', fontSize: '0.72rem', fontWeight: 800 }}>
                    8.09 SGPA
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>
                  Semester 1
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#cbd5e1' }}>
                  <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                  <span><strong>24 / 24 Credits Earned</strong> (8 Subjects)</span>
                </div>
              </button>

              {/* SEMESTER 2 CARD */}
              <button
                type="button"
                className={`sem-choice-card ${selectedSem === '2 SEM' ? 'selected' : ''}`}
                onClick={() => setSelectedSem('2 SEM')}
                style={{
                  background: selectedSem === '2 SEM' ? 'linear-gradient(145deg, #1e293b, #0f172a)' : 'rgba(15, 23, 42, 0.6)',
                  border: selectedSem === '2 SEM' ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: selectedSem === '2 SEM' ? '0 10px 25px -5px rgba(239, 68, 68, 0.3)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Term 2 • JanJun2026
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', fontSize: '0.72rem', fontWeight: 800 }}>
                    6.60 SGPA
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>
                  Semester 2
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#cbd5e1' }}>
                  <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                  <span><strong>18 / 20 Credits Earned</strong> (7 Subjects)</span>
                </div>
              </button>

              {/* SEMESTER 3 CARD */}
              <button
                type="button"
                className={`sem-choice-card ${selectedSem === '3 SEM' ? 'selected' : ''}`}
                onClick={() => setSelectedSem('3 SEM')}
                style={{
                  background: selectedSem === '3 SEM' ? 'linear-gradient(145deg, #1e293b, #0f172a)' : 'rgba(15, 23, 42, 0.6)',
                  border: selectedSem === '3 SEM' ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: selectedSem === '3 SEM' ? '0 10px 25px -5px rgba(239, 68, 68, 0.3)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Term 3 • JulDec2026
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '0.72rem', fontWeight: 800 }}>
                    Active Term
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>
                  Semester 3
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#cbd5e1' }}>
                  <Calendar size={14} style={{ color: '#38bdf8' }} />
                  <span><strong>Ongoing Evaluations</strong> (Current Session)</span>
                </div>
              </button>

              {/* ALL SEMESTERS COMBINED */}
              <button
                type="button"
                className={`sem-choice-card ${selectedSem === 'All' ? 'selected' : ''}`}
                onClick={() => setSelectedSem('All')}
                style={{
                  background: selectedSem === 'All' ? 'linear-gradient(145deg, #1e293b, #0f172a)' : 'rgba(15, 23, 42, 0.6)',
                  border: selectedSem === 'All' ? '2px solid #ef4444' : '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '12px',
                  padding: '16px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: selectedSem === 'All' ? '0 10px 25px -5px rgba(239, 68, 68, 0.3)' : 'none'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase' }}>
                    Cumulative Record
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 999, background: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', fontSize: '0.72rem', fontWeight: 800 }}>
                    {cgpa.toFixed(2)} CGPA
                  </span>
                </div>
                <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', color: '#fff', fontWeight: 800 }}>
                  All Semesters
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.82rem', color: '#cbd5e1' }}>
                  <Layers size={14} style={{ color: '#c084fc' }} />
                  <span><strong>{semesterGrades.length} Total Courses</strong> (Combined)</span>
                </div>
              </button>
            </div>
          </div>

          {/* Active Semester Detailed Summary Banner */}
          <div
            style={{
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '16px',
              padding: '1.25rem 1.5rem',
              marginBottom: '1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 16
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span className="brand-source-pill" style={{ background: '#ef4444', color: '#fff', fontWeight: 800 }}>
                  {selectedSem === 'All' ? 'Consolidated Transcript' : String(selectedSem).replace('SEM', 'Semester')}
                </span>
                <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                  {selectedSem === '1 SEM' && 'Session: JulDec2025 • BE-CSE (AI&ML)'}
                  {selectedSem === '2 SEM' && 'Session: JanJun2026 • BE-CSE (AI&ML)'}
                  {selectedSem === '3 SEM' && 'Session: JulDec2026 (Active) • BE-CSE (AI&ML)'}
                  {selectedSem === 'All' && 'Complete Degree Transcripts to Date'}
                </span>
              </div>
              <h3 style={{ margin: 0, fontSize: '1.35rem', color: '#fff', fontWeight: 800 }}>
                {selectedSem === 'All' ? 'All Semester Courses & Grade Records' : `Results for ${String(selectedSem).replace('SEM', 'Semester')}`}
              </h3>
            </div>

            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center', padding: '0 12px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                  {selectedSem === 'All' ? 'Degree CGPA' : 'Semester SGPA'}
                </span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#fbbf24' }}>
                  {selectedSem === 'All' ? cgpa.toFixed(2) : currentStats.sgpa}
                </span>
              </div>

              <div style={{ width: 1, height: 36, background: 'rgba(255, 255, 255, 0.1)' }}></div>

              <div style={{ textAlign: 'center', padding: '0 12px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                  Credits Earned
                </span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#10b981' }}>
                  {currentStats.earnedCredits} <span style={{ fontSize: '0.9rem', color: 'var(--text-dim)', fontWeight: 500 }}>/ {currentStats.totalCredits}</span>
                </span>
              </div>

              <div style={{ width: 1, height: 36, background: 'rgba(255, 255, 255, 0.1)' }}></div>

              <div style={{ textAlign: 'center', padding: '0 12px' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                  Courses Evaluated
                </span>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, color: '#38bdf8' }}>
                  {currentStats.totalCourses}
                </span>
              </div>
            </div>
          </div>

          {/* VIEW MODE 1: CARDS MATRIX (Modern, Rich Aesthetics) */}
          {viewMode === 'cards' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(330px, 1fr))', gap: '16px' }}>
              {filteredGrades.map((g, idx) => {
                const gradePoint = getGradePoint(g.grade);
                const creditPoints = (parseFloat(g.credits) || 0) * gradePoint;
                const isPassed = g.grade?.toUpperCase() !== 'F' && g.grade?.toUpperCase() !== 'E2';

                return (
                  <div
                    key={idx}
                    style={{
                      backgroundColor: '#0f172a',
                      background: '#0f172a',
                      border: isPassed ? '1px solid rgba(255, 255, 255, 0.12)' : '1px solid rgba(239, 68, 68, 0.4)',
                      borderRadius: '14px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: '0 10px 25px -5px rgba(0,0,0,0.5)',
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Top strip with course code & term badge */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <code style={{
                          background: 'rgba(56, 189, 248, 0.12)',
                          color: '#38bdf8',
                          padding: '3px 8px',
                          borderRadius: 6,
                          fontSize: '0.82rem',
                          fontFamily: 'monospace',
                          fontWeight: 700,
                          border: '1px solid rgba(56, 189, 248, 0.25)'
                        }}>
                          {g.courseCode}
                        </code>

                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 6,
                          background: 'rgba(255, 255, 255, 0.06)',
                          color: 'var(--text-muted)',
                          fontSize: '0.74rem',
                          fontWeight: 600
                        }}>
                          {g.semester}
                        </span>
                      </div>

                      {/* Course Name */}
                      <h4 style={{
                        margin: '0 0 14px 0',
                        fontSize: '1.05rem',
                        fontWeight: 800,
                        color: '#fff',
                        lineHeight: 1.4,
                        minHeight: '2.8rem'
                      }}>
                        {g.courseName}
                      </h4>
                    </div>

                    {/* Grade & Credit Metrics Box */}
                    <div
                      style={{
                        backgroundColor: '#1e293b',
                        background: '#1e293b',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        borderRadius: '10px',
                        padding: '12px 14px',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 8,
                        textAlign: 'center',
                        marginBottom: 12
                      }}
                    >
                      <div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                          Credits
                        </span>
                        <strong style={{ fontSize: '1.15rem', color: '#fff' }}>
                          {g.credits}
                        </strong>
                      </div>

                      <div style={{ borderLeft: '1px solid rgba(255,255,255,0.08)', borderRight: '1px solid rgba(255,255,255,0.08)' }}>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                          Official Grade
                        </span>
                        <span className={`grade-pill ${getGradeColorClass(g.grade)}`} style={{ display: 'inline-block', marginTop: 2, padding: '2px 10px', fontSize: '0.95rem' }}>
                          {g.grade}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block', fontWeight: 700 }}>
                          Grade Point
                        </span>
                        <strong style={{ fontSize: '1.15rem', color: '#fbbf24' }}>
                          {gradePoint}
                        </strong>
                      </div>
                    </div>

                    {/* Bottom Status bar */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>
                        Credit Points: <strong>{creditPoints}</strong> ({g.credits} × {gradePoint})
                      </span>

                      {isPassed ? (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#10b981', fontWeight: 700 }}>
                          <Check size={14} />
                          <span>Cleared</span>
                        </span>
                      ) : (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#ef4444', fontWeight: 700 }}>
                          <AlertCircle size={14} />
                          <span>Reappear / Pending</span>
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* VIEW MODE 2: OFFICIAL MARKSHEET TABLE */
            <div className="grades-table-card glass-panel" style={{ backgroundColor: '#0f172a', background: '#0f172a', borderRadius: '16px', overflow: 'hidden' }}>
              <div className="table-responsive">
                <table className="custom-data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Course Code</th>
                      <th>Official Course Title</th>
                      <th>Course Credits</th>
                      <th>Academic Term</th>
                      <th>Grade Points</th>
                      <th>Credit Points</th>
                      <th>Official Grade</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGrades.map((g, idx) => {
                      const gradePoint = getGradePoint(g.grade);
                      const creditPoints = (parseFloat(g.credits) || 0) * gradePoint;
                      const isPassed = g.grade?.toUpperCase() !== 'F' && g.grade?.toUpperCase() !== 'E2';

                      return (
                        <tr key={idx}>
                          <td className="text-muted">{g.srNo || idx + 1}</td>
                          <td>
                            <code className="course-code-pill">{g.courseCode}</code>
                          </td>
                          <td className="course-name-cell" style={{ fontWeight: 600 }}>{g.courseName}</td>
                          <td>
                            <span className="credits-badge" style={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', fontWeight: 700 }}>
                              {g.credits} Credits
                            </span>
                          </td>
                          <td>
                            <span className="sem-badge">{g.semester}</span>
                          </td>
                          <td style={{ color: '#fbbf24', fontWeight: 700 }}>
                            {gradePoint} / 10
                          </td>
                          <td style={{ color: '#fff', fontWeight: 700 }}>
                            {creditPoints}
                          </td>
                          <td>
                            <span className={`grade-pill ${getGradeColorClass(g.grade)}`}>
                              {g.grade}
                            </span>
                          </td>
                          <td>
                            {isPassed ? (
                              <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.82rem' }}>Pass</span>
                            ) : (
                              <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '0.82rem' }}>Reappear</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          TAB 2: INTERNAL SESSIONAL TESTS & EVALUATIONS
         ========================================================================= */}
      {activeTab === 'tests' && (
        <div className="tests-view-container animate-fade-in">
          {tests.length === 0 ? (
            <div className="empty-feed-card" style={{ padding: '3rem', textAlign: 'center', background: '#0f172a', borderRadius: '16px' }}>
              <BarChart3 size={40} className="text-muted" style={{ margin: '0 auto 1rem auto' }} />
              <h3>No sessional test records published yet</h3>
              <p>Faculty evaluations will appear here as soon as they are entered into the CUIET portal.</p>
            </div>
          ) : (
            <div className="tests-grid">
              {tests.map((t, idx) => {
                const percentVal = parseFloat(t.percentage) || 0;
                const barColor = getPercentColor(t.percentage);

                return (
                  <div key={idx} className="test-card glass-panel" style={{ backgroundColor: '#0f172a', background: '#0f172a', borderRadius: '14px', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
                    <div className="test-card-top">
                      <div>
                        <span className="test-type-pill">{t.testType}</span>
                        <span className="test-group-pill">{t.group}</span>
                      </div>
                      <span className="test-date-pill">
                        <Calendar size={12} />
                        {t.testDate}
                      </span>
                    </div>

                    <h3 className="test-subject-name">{t.subject}</h3>

                    <div className="test-details-grid" style={{ backgroundColor: '#1e293b' }}>
                      <div className="test-detail-item">
                        <span className="detail-label">Test Name</span>
                        <span className="detail-value font-bold">{t.testName}</span>
                      </div>
                      <div className="test-detail-item">
                        <span className="detail-label">Evaluator / Faculty</span>
                        <span className="detail-value">{t.teacher || 'Department'}</span>
                      </div>
                      <div className="test-detail-item">
                        <span className="detail-label">Scored / Max</span>
                        <span className="detail-value score-highlight">
                          <strong>{t.marksScored}</strong> / {t.maxMarks}
                        </span>
                      </div>
                      <div className="test-detail-item">
                        <span className="detail-label">Percentage</span>
                        <span className="detail-value font-bold" style={{ color: barColor }}>
                          {t.percentage}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="test-progress-bar-wrap">
                      <div
                        className="test-progress-fill"
                        style={{
                          width: `${Math.min(100, Math.max(0, percentVal))}%`,
                          backgroundColor: barColor
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
