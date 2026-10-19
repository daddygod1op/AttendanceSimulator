import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Printer,
  FileText,
  ShieldCheck,
  Download,
  Copy,
  Check,
  Tag,
  Clock,
  Sparkles
} from 'lucide-react';
import { safeText } from './CircularsFeed';

export default function CircularDocumentViewerModal({ notice, student, onClose }) {
  const [copied, setCopied] = useState(false);

  if (!notice) return null;

  const id = safeText(notice.id, '4611');
  const title = safeText(notice.title, 'Official University Notice');
  const description = safeText(notice.description || notice.snippet, 'Official academic circular from Chitkara University Institute of Engineering & Technology (CUIET).');
  const date = safeText(notice.date, '15 October 2026');
  const category = safeText(notice.category, 'Official Circular');
  const refNo = `CU/CUIET/EXAM/2026/NOTIF-${id}`;

  const studentName = safeText(student?.name, 'Chitkara Student');
  const studentRoll = safeText(student?.rollNo, '');
  const studentClass = safeText(student?.className || student?.branch, 'B.Tech Engineering');
  const studentGroup = safeText(student?.group, '');

  const handleCopyText = () => {
    const textToCopy = `CHITKARA UNIVERSITY\nRef: ${refNo}\nDate: ${date}\nSubject: ${title}\n\n${description}\n\nController of Examinations\nChitkara University, Punjab`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleOpenNewTab = () => {
    window.open(`/api/circulars/${id}/document`, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadHtml = () => {
    const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${title} - Chitkara University</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #fff; color: #0f172a; padding: 32px; }
    .page { max-width: 820px; margin: 0 auto; border: 1px solid #cbd5e1; padding: 36px 44px; border-radius: 8px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2.5px solid #800000; padding-bottom: 14px; margin-bottom: 16px; }
    .uni-name { font-size: 22px; font-weight: 800; color: #800000; margin: 0 0 2px 0; }
    .inst-name { font-size: 13px; font-weight: 700; color: #1e293b; }
    .campus-name { font-size: 11px; color: #64748b; }
    .badge { border: 2px solid #800000; padding: 6px 12px; border-radius: 4px; text-align: center; }
    .ref-bar { display: flex; justify-content: space-between; font-size: 12px; color: #334155; padding-bottom: 8px; border-bottom: 1px dashed #cbd5e1; margin-bottom: 16px; }
    .subject-box { background: #fff5f5; border-left: 4px solid #800000; padding: 12px 16px; margin-bottom: 16px; border-radius: 4px; }
    .subject-box h2 { margin: 0; font-size: 15px; color: #800000; }
    .content-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 18px; font-size: 13px; line-height: 1.7; white-space: pre-wrap; margin-bottom: 20px; }
    .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: flex-end; }
  </style>
</head>
<body>
  <div class="page">
    <div class="header">
      <div>
        <div class="uni-name">CHITKARA UNIVERSITY</div>
        <div class="inst-name">Chitkara University Institute of Engineering & Technology (CUIET)</div>
        <div class="campus-name">PUNJAB CAMPUS • NH-64, CHANDIGARH-PATIALA NATIONAL HIGHWAY</div>
      </div>
      <div class="badge">
        <div style="font-size: 10px; font-weight: 800; color: #800000;">OFFICIAL ERP</div>
        <div style="font-size: 10px; color: #10b981; font-weight: 700;">✓ VERIFIED</div>
      </div>
    </div>
    <div class="ref-bar">
      <div>Notice: <strong>#${id}</strong> (${category})</div>
      <div>Ref: <strong>${refNo}</strong></div>
      <div>Date: <strong>${date}</strong></div>
    </div>
    <div class="subject-box">
      <h2>${title}</h2>
    </div>
    <div style="font-size: 12px; color: #475569; margin-bottom: 12px;">
      <strong>Issued To:</strong> ${studentName} ${studentRoll ? `(${studentRoll})` : ''} • ${studentClass}
    </div>
    <div class="content-box">
${description}
    </div>
    <div class="footer">
      <div style="border: 1px dashed #800000; padding: 6px 10px; font-size: 10px; border-radius: 4px; color: #800000;">
        <strong>CUIET ACADEMIC RECORDS DISPATCHED</strong><br>
        Verified Official Portal Circular
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
    const a = document.createElement('a');
    a.href = url;
    a.download = `Chitkara_Notice_${id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderContentWithLinks = (text) => {
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
              color: '#0284c7',
              textDecoration: 'underline',
              wordBreak: 'break-all',
              fontWeight: 600
            }}
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  return (
    <div
      className="modal-backdrop animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 3500,
        backgroundColor: 'rgba(2, 6, 23, 0.94)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem'
      }}
    >
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #official-printable-notice, #official-printable-notice * {
            visibility: visible !important;
          }
          #official-printable-notice {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 20px !important;
            box-shadow: none !important;
            border: none !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .modal-backdrop, .no-print-bar {
            background: transparent !important;
            backdrop-filter: none !important;
            display: block !important;
            position: static !important;
          }
        }
      `}</style>

      <div
        className="doc-viewer-container animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '920px',
          maxWidth: '96vw',
          height: '92vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#0b1120',
          borderRadius: '16px',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          boxShadow: '0 30px 90px -15px rgba(0, 0, 0, 0.95)',
          overflow: 'hidden'
        }}
      >
        {/* Top Control Bar */}
        <div
          className="no-print-bar"
          style={{
            height: '64px',
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
                width: 36,
                height: 36,
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.2)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
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
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '380px'
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>Notice #{id}</span>
                <span>•</span>
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ShieldCheck size={11} /> Official CUIET Document
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{
                padding: '7px 13px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'linear-gradient(135deg, #e63946, #c1121f)',
                boxShadow: '0 2px 10px rgba(230, 57, 70, 0.35)',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 700
              }}
              title="Print official document or save as PDF"
            >
              <Printer size={14} />
              <span>Print / Save PDF</span>
            </button>

            <button
              onClick={handleDownloadHtml}
              className="btn btn-outline"
              style={{
                padding: '7px 12px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Download verified official notice file"
            >
              <Download size={14} />
              <span className="hidden-mobile">Download</span>
            </button>

            <button
              onClick={handleOpenNewTab}
              className="btn btn-outline"
              style={{
                padding: '7px 12px',
                fontSize: '0.82rem',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(255, 255, 255, 0.06)',
                color: '#e2e8f0',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Open verified document in a separate browser tab"
            >
              <ExternalLink size={14} />
              <span className="hidden-mobile">New Tab</span>
            </button>

            <button
              onClick={handleCopyText}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#cbd5e1',
                borderRadius: '6px',
                padding: '7px 10px',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                fontSize: '0.82rem',
                cursor: 'pointer'
              }}
              title="Copy official circular text"
            >
              {copied ? <Check size={14} style={{ color: '#10b981' }} /> : <Copy size={14} />}
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
              title="Close viewer"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Authentic Document Sheet */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px 16px',
            backgroundColor: '#090d16',
            display: 'flex',
            justifyContent: 'center'
          }}
        >
          <div
            id="official-printable-notice"
            style={{
              maxWidth: '820px',
              width: '100%',
              backgroundColor: '#ffffff',
              color: '#0f172a',
              borderRadius: '10px',
              padding: '36px 42px',
              boxShadow: '0 15px 45px rgba(0, 0, 0, 0.6)',
              border: '1px solid #cbd5e1',
              fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              alignSelf: 'flex-start'
            }}
          >
            {/* University Crest & Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '2.5px solid #800000',
                paddingBottom: '16px',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src="/chitkara_logo.png"
                  alt="Chitkara University Logo"
                  style={{ width: '60px', height: '60px', objectFit: 'contain' }}
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
                <div>
                  <h1
                    style={{
                      margin: '0 0 2px 0',
                      fontSize: '22px',
                      fontWeight: 800,
                      color: '#800000',
                      letterSpacing: '0.5px'
                    }}
                  >
                    CHITKARA UNIVERSITY
                  </h1>
                  <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#1e293b' }}>
                    Chitkara University Institute of Engineering & Technology (CUIET)
                  </div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                    PUNJAB CAMPUS • NH-64, CHANDIGARH-PATIALA NATIONAL HIGHWAY
                  </div>
                </div>
              </div>

              <div
                style={{
                  border: '2px solid #800000',
                  padding: '6px 12px',
                  borderRadius: '4px',
                  textAlign: 'center',
                  backgroundColor: '#fff'
                }}
              >
                <div style={{ fontSize: '10px', fontWeight: 800, color: '#800000', letterSpacing: '0.8px' }}>
                  OFFICIAL RECORD
                </div>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#1e293b' }}>
                  CUIET ERP
                </div>
                <div style={{ fontSize: '10px', color: '#10b981', fontWeight: 700 }}>
                  ✓ VERIFIED DISPATCH
                </div>
              </div>
            </div>

            {/* Reference Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                borderBottom: '1px dashed #cbd5e1',
                paddingBottom: '10px',
                marginBottom: '18px',
                flexWrap: 'wrap',
                gap: '8px'
              }}
            >
              <div>Notice Ref: <strong style={{ color: '#800000' }}>{refNo}</strong></div>
              <div>Category: <strong style={{ color: '#800000' }}>{category}</strong></div>
              <div>Date: <strong>{date}</strong></div>
              <div>Department: <strong>Academic Records & Examinations</strong></div>
            </div>

            {/* Subject Banner */}
            <div
              style={{
                backgroundColor: '#fff5f5',
                borderLeft: '4px solid #800000',
                padding: '12px 18px',
                marginBottom: '18px',
                borderRadius: '4px'
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 800,
                  color: '#800000',
                  lineHeight: '1.4'
                }}
              >
                {title}
              </h2>
            </div>

            {/* Issued To Block */}
            <div
              style={{
                backgroundColor: '#f1f5f9',
                border: '1px solid #e2e8f0',
                borderRadius: '6px',
                padding: '10px 14px',
                marginBottom: '18px',
                fontSize: '12px',
                color: '#334155',
                display: 'flex',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '6px'
              }}
            >
              <div>
                <strong>Issued To:</strong> {studentName} {studentRoll ? `(Roll No: ${studentRoll})` : ''}
              </div>
              <div>
                <strong>Class / Group:</strong> {studentClass} {studentGroup ? `(${studentGroup})` : ''}
              </div>
              <div>
                <strong>Status:</strong> <span style={{ color: '#10b981', fontWeight: 700 }}>Active Enrolled Student</span>
              </div>
            </div>

            {/* Main Circular Content */}
            <div
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '22px',
                fontSize: '13.5px',
                lineHeight: '1.75',
                color: '#1e293b',
                whiteSpace: 'pre-wrap',
                marginBottom: '22px'
              }}
            >
              {renderContentWithLinks(description)}
            </div>

            {/* Statutory University Guidelines */}
            <div
              style={{
                marginTop: '16px',
                borderTop: '1px solid #e2e8f0',
                paddingTop: '14px',
                fontSize: '11.5px',
                color: '#475569'
              }}
            >
              <h4 style={{ margin: '0 0 6px 0', fontSize: '11.5px', fontWeight: 700, color: '#1e293b' }}>
                Official Academic Notice Regulations:
              </h4>
              <ol style={{ margin: 0, paddingLeft: '18px', lineHeight: '1.6' }}>
                <li>Students must produce their official RFID Student Identity Card upon entry into examination/administrative halls.</li>
                <li>Entry to examination and administrative blocks closes 15 minutes prior to session commencement.</li>
                <li>Mobile phones, smart devices, and unauthorized electronic devices are strictly prohibited.</li>
                <li>In case of discrepancies or clarification, contact the Office of the Controller of Examinations or Department Coordinator.</li>
              </ol>
            </div>

            {/* Signatory Section */}
            <div
              style={{
                marginTop: '26px',
                paddingTop: '16px',
                borderTop: '1px solid #cbd5e1',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                flexWrap: 'wrap',
                gap: '16px'
              }}
            >
              <div
                style={{
                  border: '1.5px dashed #800000',
                  padding: '8px 14px',
                  fontSize: '10.5px',
                  borderRadius: '4px',
                  color: '#800000',
                  backgroundColor: '#fff'
                }}
              >
                <strong>CHITKARA UNIVERSITY CUIET RECORDS</strong><br />
                Ref: {refNo}<br />
                <span style={{ color: '#10b981', fontWeight: 700 }}>AUTHENTICATED PORTAL DISPATCH</span>
              </div>

              <div style={{ textAlign: 'right', fontSize: '12px' }}>
                <div style={{ fontWeight: 800, color: '#0f172a' }}>Dr. S. K. Pathak</div>
                <div style={{ color: '#475569' }}>Controller of Examinations</div>
                <div style={{ color: '#800000', fontSize: '11px', fontWeight: 600 }}>Chitkara University, Punjab</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
