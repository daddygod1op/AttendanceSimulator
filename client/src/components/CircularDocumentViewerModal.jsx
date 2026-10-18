import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Printer,
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Building,
  Layers,
  Copy,
  Check
} from 'lucide-react';
import { safeText } from './CircularsFeed';

export default function CircularDocumentViewerModal({ notice, student, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!notice) return null;

  const id = safeText(notice.id, '4611');
  const cuietPrintUrl = `https://cuiet.codebrigade.in/dashboardFeed/printItem/1/${id}`;
  const cuietFeedUrl = `https://cuiet.codebrigade.in/notifications/display`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(cuietPrintUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenOriginalPortal = () => {
    window.open(cuietPrintUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3000,
        backgroundColor: 'rgba(2, 6, 23, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <div
        className="doc-viewer-container animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '920px',
          maxWidth: '96vw',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0f172a',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 30px 90px -15px rgba(0, 0, 0, 0.95)',
          overflow: 'hidden'
        }}
      >
        {/* Top Control Bar */}
        <div
          style={{
            height: '60px',
            backgroundColor: '#1e293b',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 1.25rem',
            gap: '1rem',
            flexShrink: 0
          }}
        >
          {/* Document Title & Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: 'rgba(128, 0, 0, 0.25)',
                border: '1px solid rgba(128, 0, 0, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#f87171',
                flexShrink: 0
              }}
            >
              <FileText size={18} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  color: '#fff',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {notice.title}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Original CUIET Notice #{id}</span>
                <span>•</span>
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ShieldCheck size={11} /> Official University Portal Record
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleOpenOriginalPortal}
              className="btn btn-primary"
              style={{
                padding: '7px 14px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #e63946, #c1121f)',
                boxShadow: '0 2px 10px rgba(230, 57, 70, 0.35)'
              }}
              title="Open the real document directly on cuiet.codebrigade.in"
            >
              <ExternalLink size={14} />
              <span>Open in CUIET Portal</span>
            </button>

            <button
              onClick={handlePrint}
              className="btn btn-outline"
              style={{
                padding: '7px 12px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
              title="Print notice"
            >
              <Printer size={14} />
              <span className="hidden-mobile">Print</span>
            </button>

            <button
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#cbd5e1',
                borderRadius: '8px',
                width: 32,
                height: 32,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
              title="Close modal"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.75rem',
            backgroundColor: '#090d16'
          }}
        >
          {/* Main Document Paper Card */}
          <div
            style={{
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: '10px',
              padding: '36px 42px',
              boxShadow: '0 15px 45px rgba(0, 0, 0, 0.55)',
              fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
            }}
          >
            {/* Chitkara Crest Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '2.5px solid #800000',
                paddingBottom: '16px',
                marginBottom: '18px',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <img
                  src="/chitkara_logo.png"
                  alt="Chitkara University"
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                  style={{
                    width: 68,
                    height: 68,
                    objectFit: 'contain'
                  }}
                />
                <div>
                  <h1
                    style={{
                      margin: '0 0 3px 0',
                      fontFamily: "'Cinzel', Georgia, serif",
                      fontSize: '1.4rem',
                      fontWeight: 800,
                      color: '#800000',
                      letterSpacing: '1px'
                    }}
                  >
                    CHITKARA UNIVERSITY
                  </h1>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#1e293b' }}>
                    Chitkara University Institute of Engineering & Technology (CUIET)
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#64748b', fontWeight: 600 }}>
                    PUNJAB CAMPUS • NH-64, CHANDIGARH-PATIALA NATIONAL HIGHWAY
                  </div>
                </div>
              </div>

              {/* Official Portal Stamp */}
              <div
                style={{
                  border: '2px solid #800000',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  textAlign: 'center',
                  background: 'rgba(128, 0, 0, 0.03)'
                }}
              >
                <div style={{ fontSize: '0.64rem', fontWeight: 800, color: '#800000', letterSpacing: '1px' }}>
                  OFFICIAL PORTAL
                </div>
                <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#1e293b' }}>
                  CUIET / ERP
                </div>
                <div style={{ fontSize: '0.64rem', color: '#10b981', fontWeight: 700 }}>
                  ✓ AUTHENTIC SYNC
                </div>
              </div>
            </div>

            {/* Meta Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                fontWeight: 600,
                color: '#334155',
                borderBottom: '1px dashed #cbd5e1',
                paddingBottom: '10px',
                marginBottom: '18px',
                flexWrap: 'wrap',
                gap: 8
              }}
            >
              <div>
                Notice ID: <strong style={{ color: '#800000' }}>#{id}</strong>
              </div>
              <div>
                Category: <strong>{safeText(notice.category, 'Official Announcement')}</strong>
              </div>
              <div>
                Published Date: <strong>{safeText(notice.date, 'October 2026')}</strong>
              </div>
              <div>
                Portal Source: <strong style={{ color: '#0284c7' }}>cuiet.codebrigade.in</strong>
              </div>
            </div>

            {/* Official Title Banner */}
            <div
              style={{
                backgroundColor: '#fff5f5',
                borderLeft: '4px solid #800000',
                borderTop: '1px solid #fee2e2',
                borderRight: '1px solid #fee2e2',
                borderBottom: '1px solid #fee2e2',
                padding: '14px 18px',
                marginBottom: '20px',
                borderRadius: '4px'
              }}
            >
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#800000', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 2 }}>
                OFFICIAL NOTICE TITLE:
              </div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: '#1e293b', lineHeight: 1.4 }}>
                {safeText(notice.title, 'University Circular')}
              </h2>
            </div>

            {/* Primary CUIET Portal Link Banner */}
            <div
              style={{
                backgroundColor: '#f0fdf4',
                border: '1.5px solid #86efac',
                borderRadius: '8px',
                padding: '16px 20px',
                marginBottom: '22px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#15803d', fontWeight: 700, fontSize: '0.9rem' }}>
                  <CheckCircle2 size={17} />
                  <span>Direct Official CUIET CodeBrigade Document Link</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: '#166534', marginTop: 3 }}>
                  This notice is directly connected to the CUIET Chalkpad system. Click to open the official document layout:
                </div>
                <div style={{ fontSize: '0.74rem', color: '#475569', marginTop: 4, fontFamily: 'monospace' }}>
                  {cuietPrintUrl}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleOpenOriginalPortal}
                  className="btn btn-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#800000',
                    color: '#fff',
                    border: '1px solid #660000',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 700
                  }}
                >
                  <ExternalLink size={14} />
                  <span>Open in CUIET</span>
                </button>

                <button
                  onClick={handleCopyLink}
                  style={{
                    padding: '8px 12px',
                    fontSize: '0.82rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#fff',
                    color: '#334155',
                    border: '1px solid #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 600
                  }}
                  title="Copy direct portal URL"
                >
                  {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
                  <span>{copied ? 'Copied' : 'Copy Link'}</span>
                </button>
              </div>
            </div>

            {/* Authentic Text Body from University */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                Official Circular Text & Instructions:
              </div>
              <div
                style={{
                  padding: '18px 22px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '0.92rem',
                  lineHeight: '1.75',
                  color: '#1e293b',
                  whiteSpace: 'pre-wrap'
                }}
              >
                {safeText(notice.description, 'Official academic communication dispatched via Chitkara University CUIET ERP portal.')}
              </div>
            </div>

            {/* Official Portal Dispatch Footer */}
            <div
              style={{
                marginTop: '28px',
                paddingTop: '16px',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: '14px'
              }}
            >
              <div
                style={{
                  border: '1.5px dashed #800000',
                  padding: '8px 16px',
                  borderRadius: '4px',
                  background: 'rgba(128, 0, 0, 0.02)'
                }}
              >
                <div style={{ fontSize: '0.66rem', fontWeight: 800, color: '#800000', letterSpacing: '0.8px' }}>
                  CHITKARA UNIVERSITY CUIET
                </div>
                <div style={{ fontSize: '0.76rem', fontWeight: 700, color: '#1e293b' }}>
                  DISPATCHED VIA CODEBRIGADE CHALKPAD
                </div>
                <div style={{ fontSize: '0.68rem', color: '#64748b' }}>
                  Target Endpoint: dashboardFeed/printItem/1/{id}
                </div>
              </div>

              <div style={{ textAlign: 'right', fontSize: '0.78rem' }}>
                <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.86rem' }}>
                  Chitkara University Administration
                </div>
                <div style={{ color: '#475569', fontWeight: 600 }}>
                  Institute of Engineering & Technology (CUIET)
                </div>
                <div style={{ color: '#800000', fontSize: '0.72rem', fontWeight: 700 }}>
                  https://cuiet.codebrigade.in
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
