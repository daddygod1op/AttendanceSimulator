import React, { useState, useMemo, useEffect } from 'react';
import {
  Bell,
  Search,
  Calendar,
  ExternalLink,
  Tag,
  CheckCircle2,
  FileText,
  AlertCircle,
  X,
  Share2,
  Clock,
  Sparkles,
  ChevronRight,
  Download,
  Paperclip,
  Eye,
  Printer
} from 'lucide-react';
import CircularDocumentViewerModal from './CircularDocumentViewerModal';
import { getCircularDocument } from '../utils/circularDocumentData';

export function safeText(val, fallback = '') {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val.N !== undefined) return safeText(val.N, fallback);
    if (val.S !== undefined) return safeText(val.S, fallback);
    if (val.name !== undefined) return safeText(val.name, fallback);
    if (val.title !== undefined) return safeText(val.title, fallback);
    if (val.text !== undefined) return safeText(val.text, fallback);
    if (val.value !== undefined) return safeText(val.value, fallback);
    try {
      return JSON.stringify(val);
    } catch {
      return fallback;
    }
  }
  return String(val);
}

export default function CircularsFeed({ circulars = [], student }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [activeModalNotice, setActiveModalNotice] = useState(null);
  const [activeDocNotice, setActiveDocNotice] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeModalNotice) {
        setActiveModalNotice(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModalNotice]);

  // Extract categories and counts safely
  const categories = useMemo(() => {
    const list = Array.isArray(circulars) ? circulars : [];
    const counts = { All: list.length };
    list.forEach(c => {
      const cat = safeText(c?.category, 'General');
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [circulars]);

  // Filter circulars safely
  const filteredCirculars = useMemo(() => {
    const list = Array.isArray(circulars) ? circulars : [];
    return list.filter(c => {
      if (!c) return false;
      const cat = safeText(c.category, 'General');
      if (selectedCategory !== 'All' && cat !== selectedCategory) return false;
      if (onlyUnread && !c.isUnread) return false;
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = safeText(c.title).toLowerCase().includes(query);
        const matchesDesc = safeText(c.description || c.snippet).toLowerCase().includes(query);
        const matchesDate = safeText(c.date).toLowerCase().includes(query);
        const matchesCat = cat.toLowerCase().includes(query);
        return matchesTitle || matchesDesc || matchesDate || matchesCat;
      }
      return true;
    });
  }, [circulars, selectedCategory, onlyUnread, searchQuery]);

  const handleCopyLink = (item) => {
    if (!item) return;
    navigator.clipboard.writeText(`${item.title || 'Notice'}\n${item.description || item.snippet || ''}\nSource: Chitkara University CUIET Portal`);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const getCategoryBadgeClass = (cat) => {
    switch (cat) {
      case 'Seating Plan':
        return 'cat-purple';
      case 'Result':
        return 'cat-green';
      case 'Datesheet':
        return 'cat-amber';
      case 'Academic / ERP':
        return 'cat-blue';
      case 'Opportunities':
        return 'cat-pink';
      default:
        return 'cat-default';
    }
  };
  const getNoticeAttachments = (notice) => {
    const rawTitle = safeText(notice?.title, 'Notice');
    const id = safeText(notice?.id, '4611');
    const cleanTitle = String(rawTitle).replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 36) || 'Notice';

    return [{
      id: `att_${id}`,
      name: `${cleanTitle}.pdf`,
      type: 'application/pdf',
      size: 'Official CUIET Attachment',
      url: `/api/circulars/${id}/document`
    }];
  };

  const renderFormattedContent = (text) => {
    if (!text || typeof text !== 'string') return null;
    const parts = text.split(/(https?:\/\/[^\s]+)/);

    return parts.map((part, index) => {
      if (part && (part.startsWith('http://') || part.startsWith('https://'))) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              color: '#38bdf8',
              textDecoration: 'underline',
              wordBreak: 'break-all',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '2px 6px',
              margin: '0 2px',
              background: 'rgba(56, 189, 248, 0.12)',
              borderRadius: 4,
              border: '1px solid rgba(56, 189, 248, 0.25)'
            }}
          >
            <span>{part}</span>
            <ExternalLink size={12} />
          </a>
        );
      }
      return part;
    });
  };

  const handleDownloadNoticeDocument = (notice, att) => {
    const doc = getCircularDocument(notice, student);
    const rawAttName = safeText(att?.name, '');
    const rawTitle = safeText(notice?.title, 'Notice');
    const baseName = rawAttName || `${rawTitle}.pdf`;
    const cleanFileName = String(baseName).replace(/\.pdf$/i, '');
    
    // Create an authentic, fully styled printable document
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${doc.title} - Official Chitkara Document</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700&family=Inter:wght@400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; background: #f8fafc; color: #1e293b; padding: 24px; margin: 0; }
    .page { max-width: 820px; margin: 0 auto; background: #fff; padding: 36px 42px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .crest-row { display: flex; align-items: center; justify-content: space-between; border-bottom: 2.5px solid #800000; padding-bottom: 16px; margin-bottom: 18px; }
    .uni-name { font-family: 'Cinzel', serif; font-size: 22px; font-weight: 700; color: #800000; letter-spacing: 1px; margin: 0; }
    .inst-name { font-size: 13px; font-weight: 600; color: #334155; margin-top: 3px; }
    .ref-bar { display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; border-bottom: 1px dashed #94a3b8; padding-bottom: 8px; margin-bottom: 16px; }
    .subject-banner { background: #fff5f5; border-left: 4px solid #800000; padding: 12px 16px; margin-bottom: 18px; border-radius: 4px; }
    .subject-banner h2 { margin: 0; font-size: 15px; color: #800000; }
    .student-badge { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 6px; padding: 12px 16px; margin-bottom: 18px; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 18px; font-size: 12px; }
    th { background: #800000; color: #fff; padding: 9px 12px; text-align: left; }
    td { padding: 9px 12px; border: 1px solid #e2e8f0; }
    tr:nth-child(even) { background: #f8fafc; }
    .highlight-row { background: #fef3c7 !important; font-weight: 700; }
    .instructions { font-size: 12px; line-height: 1.6; color: #475569; }
    .signatory { display: flex; justify-content: space-between; align-items: flex-end; margin-top: 32px; padding-top: 18px; border-top: 1px solid #e2e8f0; }
    @media print { body { padding: 0; background: #fff; } .page { box-shadow: none; border: none; padding: 0; } }
  </style>
</head>
<body>
  <div class="page">
    <div class="crest-row">
      <div>
        <h1 class="uni-name">CHITKARA UNIVERSITY</h1>
        <div class="inst-name">Chitkara University Institute of Engineering & Technology (CUIET)</div>
        <div style="font-size: 11px; color: #64748b;">PUNJAB CAMPUS • NH-64, CHANDIGARH-PATIALA NATIONAL HIGHWAY</div>
      </div>
      <div style="border: 2px solid #800000; padding: 6px 12px; border-radius: 4px; text-align: center;">
        <div style="font-size: 10px; font-weight: 800; color: #800000;">OFFICIAL ERP</div>
        <div style="font-size: 10px; color: #10b981; font-weight: 700;">✓ VERIFIED</div>
      </div>
    </div>
    <div class="ref-bar">
      <div>Department: <strong style="color: #800000;">${doc.department}</strong></div>
      <div>Ref: <strong>${doc.refNo}</strong></div>
      <div>Date: <strong>${doc.date}</strong></div>
    </div>
    <div class="subject-banner">
      <h2>${doc.subject || doc.title}</h2>
    </div>
    <div class="student-badge">
      <strong>Issued To:</strong> ${doc.student.name} (Roll No: ${doc.student.rollNo}, ${doc.student.group})
      ${doc.personalAllocation ? `<br><strong>Allocated Exam Hall:</strong> ${doc.personalAllocation.hall} &bull; <strong>Desk:</strong> ${doc.personalAllocation.deskRow} &bull; <strong>Reporting:</strong> ${doc.personalAllocation.reportingTime}` : ''}
    </div>
    <div style="font-size: 13px; line-height: 1.6; margin-bottom: 18px;">
      ${notice?.description || 'Official academic communication dispatched via Chitkara University CUIET ERP portal.'}
    </div>
    <div style="margin-top: 24px; border-top: 1px solid #e2e8f0; padding-top: 14px;">
      <h4 style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700;">Guidelines:</h4>
      <ol class="instructions">
        <li>Students must produce their official RFID Student Identity Card upon entry.</li>
        <li>Entry to the examination block closes 15 minutes prior to session commencement.</li>
        <li>Mobile phones and unauthorized electronic devices are strictly prohibited.</li>
      </ol>
    </div>
    <div class="signatory">
      <div style="border: 1.5px dashed #800000; padding: 6px 12px; font-size: 10px; border-radius: 4px;">
        <strong style="color: #800000;">CUIET ACADEMIC RECORDS DISPATCHED</strong><br>
        Ref: ${doc.refNo}
      </div>
      <div style="text-align: right; font-size: 12px;">
        <div style="font-weight: 800;">Dr. S. K. Pathak</div>
        <div style="color: #475569;">Controller of Examinations</div>
        <div style="color: #800000; font-size: 11px;">Chitkara University, Punjab</div>
      </div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${cleanFileName}_Verified.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="circulars-section-container animate-fade-in">
      {/* Section Header */}
      <div className="section-hero-header">
        <div className="hero-badge">
          <Bell size={14} className="text-accent" />
          <span>University Notices & Timeline</span>
        </div>
        <h2>Chitkara Circulars & Notifications</h2>
        <p>
          Official academic announcements, exam schedules, seating plans and results streamed directly from{' '}
          <code className="code-pill">cuiet.codebrigade.in/dashboardFeed/feed/1</code>
        </p>
      </div>

      {/* Controls Bar: Search & Filters */}
      <div className="feed-controls-card">
        <div className="feed-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="feed-search-input"
            placeholder="Search circulars by subject, seating plan, datesheet, keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="clear-search-btn" onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        <div className="category-pills-row">
          {Object.entries(categories).map(([cat, count]) => (
            <button
              key={cat}
              className={`cat-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              <span>{safeText(cat)}</span>
              <span className="pill-count">{safeText(count, '0')}</span>
            </button>
          ))}

          <button
            className={`cat-pill-btn unread-filter ${onlyUnread ? 'active' : ''}`}
            onClick={() => setOnlyUnread(!onlyUnread)}
          >
            <Sparkles size={13} />
            <span>Unread Only</span>
          </button>
        </div>
      </div>

      {/* Results Count Summary */}
      <div className="feed-meta-bar">
        <span>Showing <strong>{safeText(filteredCirculars.length, '0')}</strong> of {safeText(circulars.length, '0')} total circulars</span>
        {selectedCategory !== 'All' && (
          <span className="filter-tag">Filtered by: {safeText(selectedCategory)}</span>
        )}
      </div>

      {/* Circular Cards Grid */}
      {filteredCirculars.length === 0 ? (
        <div className="empty-feed-card">
          <Bell size={42} className="empty-icon text-muted" />
          <h3>No circulars found</h3>
          <p>Try clearing your search query or switching category filters.</p>
          <button
            className="btn btn-outline"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('All');
              setOnlyUnread(false);
            }}
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="circulars-list-grid">
          {filteredCirculars.map((item, idx) => (
            <div
              key={item.id || idx}
              className={`circular-card ${item.isUnread ? 'unread-glow' : ''}`}
              onClick={() => setActiveModalNotice(item)}
            >
              <div className="card-top-meta">
                <div className="meta-left">
                  <span className={`category-tag ${getCategoryBadgeClass(safeText(item.category))}`}>
                    <Tag size={11} />
                    {safeText(item.category, 'General')}
                  </span>
                  {item.isUnread && (
                    <span className="unread-tag">
                      <span className="unread-pulse"></span>
                      Unread
                    </span>
                  )}
                </div>

                <div className="meta-date">
                  <Clock size={13} />
                  <span>{safeText(item.date, 'Official Notice')}</span>
                </div>
              </div>

              <h3 className="circular-card-title">{safeText(item.title, 'University Circular')}</h3>

              <p className="circular-card-desc">
                {safeText(item.description || item.snippet, '')}
              </p>

              <div className="card-bottom-actions">
                <span className="read-more-cue">
                  <span>View Full Notice</span>
                  <ChevronRight size={14} />
                </span>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <a
                    href={`https://cuiet.codebrigade.in/dashboardFeed/printItem/1/${item.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="quick-action-btn"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      background: 'rgba(230, 57, 70, 0.15)',
                      border: '1px solid rgba(230, 57, 70, 0.35)',
                      color: '#f87171',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      textDecoration: 'none',
                      cursor: 'pointer'
                    }}
                    title="Open verified official notice document"
                  >
                    <ExternalLink size={12} />
                    <span>Open Doc</span>
                  </a>

                  <button
                    className="quick-action-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveDocNotice(item);
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      border: '1px solid rgba(56, 189, 248, 0.35)',
                      color: '#38bdf8',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      cursor: 'pointer'
                    }}
                    title="View notice particulars"
                  >
                    <Eye size={12} />
                    <span>View Notice</span>
                  </button>

                  <button
                    className="quick-action-icon-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyLink(item);
                    }}
                    title="Copy circular text"
                  >
                    {copiedId === item.id ? <CheckCircle2 size={15} className="text-success" /> : <Share2 size={15} />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail Modal for Full Circular View (Centered Popup) */}
      {activeModalNotice && (
        <div
          className="modal-backdrop animate-fade-in"
          onClick={() => setActiveModalNotice(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2500,
            backgroundColor: 'rgba(3, 7, 18, 0.92)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.25rem'
          }}
        >
          <div
            className="login-modal-container animate-scale-up"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '680px',
              width: '100%',
              maxHeight: '88vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#0f172a',
              background: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.16)',
              borderRadius: '16px',
              boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.98), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              overflow: 'hidden'
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
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: '1rem'
              }}
            >
              <div className="modal-title-group" style={{ flex: 1 }}>
                <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={`category-tag ${getCategoryBadgeClass(safeText(activeModalNotice.category))}`}>
                    {safeText(activeModalNotice.category, 'General')}
                  </span>
                  <span className="meta-date" style={{ color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Clock size={13} />
                    {safeText(activeModalNotice.date, 'Official Notice')}
                  </span>
                  {activeModalNotice.isUnread && (
                    <span className="unread-tag">
                      <span className="unread-pulse"></span>
                      New
                    </span>
                  )}
                </div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#fff', fontWeight: 800, lineHeight: 1.35 }}>
                  {safeText(activeModalNotice.title, 'University Circular')}
                </h3>
              </div>
              <button
                className="modal-close-btn"
                onClick={() => setActiveModalNotice(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.08)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: '50%',
                  width: 34,
                  height: 34,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  flexShrink: 0
                }}
                title="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div
              className="modal-body notice-modal-body"
              style={{
                padding: '1.5rem',
                overflowY: 'auto',
                backgroundColor: '#0f172a',
                background: '#0f172a'
              }}
            >
              <div
                className="notice-content-box"
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: '#1e293b',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  marginBottom: '1.25rem'
                }}
              >
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.75', color: '#e2e8f0', fontSize: '0.96rem', margin: 0 }}>
                  {renderFormattedContent(activeModalNotice.description)}
                </div>
              </div>

              {/* Attachments Section */}
              {(() => {
                const attachments = getNoticeAttachments(activeModalNotice);
                if (!attachments || attachments.length === 0) return null;

                return (
                  <div style={{ marginBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <Paperclip size={16} style={{ color: '#38bdf8' }} />
                      <h4 style={{ margin: 0, color: '#fff', fontSize: '0.92rem', fontWeight: 700 }}>
                        Official Attached Documents & Downloads ({attachments.length})
                      </h4>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {attachments.map((att, attIdx) => (
                        <div
                          key={att.id || attIdx}
                          className="circular-attachment-card"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '12px 16px',
                            background: '#1e293b',
                            border: '1px solid rgba(56, 189, 248, 0.25)',
                            borderRadius: '10px',
                            gap: 12,
                            flexWrap: 'wrap'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: '1 1 200px' }}>
                            <div
                              style={{
                                width: 40,
                                height: 40,
                                borderRadius: 8,
                                background: 'rgba(239, 68, 68, 0.15)',
                                border: '1px solid rgba(239, 68, 68, 0.3)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#ef4444',
                                flexShrink: 0
                              }}
                            >
                              <FileText size={20} />
                            </div>
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ color: '#fff', fontSize: '0.92rem', fontWeight: 600, wordBreak: 'break-word', lineHeight: 1.35 }}>
                                {att.name}
                              </div>
                              <div style={{ fontSize: '0.74rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                                <span style={{ color: '#ef4444', fontWeight: 600 }}>PDF Document</span>
                                <span>•</span>
                                <span>{att.size || 'Official Portal Attachment'}</span>
                                <span>•</span>
                                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 2 }}>
                                  <CheckCircle2 size={11} /> Verified
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="circular-attachment-actions" style={{ display: 'flex', gap: 8, flexShrink: 0, flexWrap: 'wrap' }}>
                            <button
                              onClick={() => setActiveDocNotice(activeModalNotice)}
                              className="btn btn-primary"
                              style={{
                                padding: '7px 14px',
                                fontSize: '0.82rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'linear-gradient(135deg, #e63946, #c1121f)',
                                boxShadow: '0 2px 8px rgba(230, 57, 70, 0.35)',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                fontWeight: 700
                              }}
                              title="View official notice document"
                            >
                              <Eye size={14} />
                              <span>View Notice</span>
                            </button>
                            <a
                              href={`/api/circulars/${activeModalNotice.id}/document`}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-outline"
                              style={{
                                padding: '7px 12px',
                                fontSize: '0.82rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: '#e2e8f0',
                                textDecoration: 'none',
                                borderRadius: '6px'
                              }}
                              title="Open verified document in new tab"
                            >
                              <ExternalLink size={14} />
                              <span>Open in New Tab</span>
                            </a>
                            <a
                              href={`/api/circulars/${activeModalNotice.id}/download`}
                              download
                              className="btn btn-outline"
                              style={{
                                padding: '7px 12px',
                                fontSize: '0.82rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 6,
                                background: 'rgba(255, 255, 255, 0.05)',
                                color: '#e2e8f0',
                                textDecoration: 'none',
                                borderRadius: '6px'
                              }}
                              title="Download verified official notice"
                            >
                              <Download size={14} />
                              <span>Download</span>
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div
                className="notice-official-source-footer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '1rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                  flexWrap: 'wrap',
                  gap: '12px'
                }}
              >
                <div className="source-info" style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <CheckCircle2 size={16} style={{ color: '#10b981', flexShrink: 0 }} />
                  <span>Verified Notice from Chitkara University Institute of Engineering & Technology</span>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button
                    className="btn btn-outline"
                    style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                    onClick={() => handleCopyLink(activeModalNotice)}
                  >
                    {copiedId === activeModalNotice.id ? (
                      <>
                        <CheckCircle2 size={14} style={{ color: '#10b981' }} />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Share2 size={14} />
                        <span>Copy Notice</span>
                      </>
                    )}
                  </button>
                  <a
                    href={`/api/circulars/${activeModalNotice.id}/document`}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-primary"
                    style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
                  >
                    <ExternalLink size={14} />
                    <span>Open Full Notice</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentic In-App Document Viewer Modal */}
      {activeDocNotice && (
        <CircularDocumentViewerModal
          notice={activeDocNotice}
          student={student}
          onClose={() => setActiveDocNotice(null)}
        />
      )}
    </div>
  );
}
