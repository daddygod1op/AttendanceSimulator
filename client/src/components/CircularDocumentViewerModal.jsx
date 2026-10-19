import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  Printer,
  FileText,
  ShieldCheck,
  Download,
  Copy,
  Check
} from 'lucide-react';
import { safeText } from './CircularsFeed';

export default function CircularDocumentViewerModal({ notice, student, onClose }) {
  const [copied, setCopied] = useState(false);
  const [iframeError, setIframeError] = useState(false);

  if (!notice) return null;

  const id = safeText(notice.id, '4611');
  const title = safeText(notice.title, 'Official University Notice');
  const docUrl = `/api/circulars/${id}/document`;
  const downloadUrl = `/api/circulars/${id}/download`;

  const handleCopyLink = () => {
    const fullUrl = `${window.location.origin}${docUrl}`;
    navigator.clipboard.writeText(fullUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenNewTab = () => {
    window.open(docUrl, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.open(`${docUrl}?print=1`, '_blank');
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
      <div
        className="doc-viewer-container animate-scale-up"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '980px',
          maxWidth: '96vw',
          height: '92vh',
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
            height: '62px',
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
                  maxWidth: '420px'
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: '#38bdf8', fontWeight: 600 }}>CUIET Notice #{id}</span>
                <span>•</span>
                <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: 3 }}>
                  <ShieldCheck size={11} /> Official University Document
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              onClick={handleOpenNewTab}
              className="btn btn-primary"
              style={{
                padding: '7px 14px',
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
              title="Open full notice document in a new tab"
            >
              <ExternalLink size={14} />
              <span>Open in New Tab</span>
            </button>

            <a
              href={downloadUrl}
              download
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
                textDecoration: 'none'
              }}
              title="Download official printable notice"
            >
              <Download size={14} />
              <span className="hidden-mobile">Download</span>
            </a>

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
                border: '1px solid rgba(255, 255, 255, 0.15)',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
              title="Print official document"
            >
              <Printer size={14} />
              <span className="hidden-mobile">Print</span>
            </button>

            <button
              onClick={handleCopyLink}
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
              title="Copy verified document link"
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

        {/* Document Body: Direct In-App Responsive Iframe Reader */}
        <div
          style={{
            flex: 1,
            position: 'relative',
            backgroundColor: '#090d16',
            overflow: 'hidden'
          }}
        >
          {!iframeError ? (
            <iframe
              src={docUrl}
              onError={() => setIframeError(true)}
              title={`Chitkara University Official Circular #${id}`}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                backgroundColor: '#ffffff'
              }}
            />
          ) : (
            <div style={{ padding: '2rem', color: '#fff', textAlign: 'center' }}>
              <h3>Official Notice Document #{id}</h3>
              <p style={{ color: 'var(--text-muted)' }}>{title}</p>
              <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                <a href={docUrl} target="_blank" rel="noreferrer" className="btn btn-primary">
                  Open Document Directly
                </a>
                <a href={downloadUrl} download className="btn btn-outline">
                  Download Document
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
