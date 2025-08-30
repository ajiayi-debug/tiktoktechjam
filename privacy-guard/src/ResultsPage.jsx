/** @typedef {import('./App.jsx').AgentOutput} AgentOutput */
/** @typedef {import('./App.jsx').Submission} Submission */

import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const tiktokCyan = '#25F4EE';
const tiktokPink = '#FE2C55';
const bg = '#0f0f0f';
const panel = '#141414';
const line = '#2a2a2a';
const textMuted = '#9ca3af';

function DangerMeter({ score }) {
  const pct = Math.min(100, Math.max(0, Number(score) || 0));
  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ color: '#fff', fontSize: 12, marginBottom: 6 }}>Danger Meter: {pct}</div>
      <div
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        style={{ height: 10, background: '#1f1f1f', borderRadius: 999, overflow: 'hidden', border: '1px solid #222' }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: `linear-gradient(90deg, ${tiktokCyan}, ${tiktokPink})`,
            transition: 'width 300ms ease',
          }}
        />
      </div>
    </div>
  );
}

function downloadBlob(filename, mime, data) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Map agent/type keys to human labels
function agentLabel(key) {
  switch (key) {
    case 'text-crawl':
      return 'Text Similarity / Web Crawl';
    case 'rev-search':
    case 'reverse-media':
      return 'Reverse Image/Video Search';
    case 'censor':
      return 'Censoring Output';
    default:
      return 'Agent Output';
  }
}

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [uploaded, setUploaded] = useState(false);

  if (!state || !state.report) {
    return (
      <div style={{ minHeight: '100vh', background: bg, color: '#fff', padding: 16 }}>
        <div style={{ background: panel, border: `1px solid ${line}`, borderRadius: 12, padding: 16 }}>
          No analysis data found.
          <div style={{ marginTop: 12 }}>
            <button
              onClick={() => navigate('/')}
              style={{ padding: 10, background: tiktokCyan, border: 'none', borderRadius: 10, fontWeight: 700 }}
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { report, photos = [], videos = [], username = '' } = state;
  const { dangerScore = 0 } = report;

  // --- Actions ---
  const continueWithoutChanges = async () => {
    // TODO: call your finalize-original endpoint here
    setUploaded(true); // show overlay; clicking anywhere will navigate('/')
  };

  const doNotUpload = async () => {
    // TODO: optional: call a cancel endpoint
    navigate('/'); // go back to first page
  };

  const downloadReportJson = () => {
    downloadBlob('privacy_report.json', 'application/json', JSON.stringify(report, null, 2));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, padding: 16 }}>
      <div style={{ background: panel, border: `1px solid ${line}`, borderRadius: 12, padding: 16, paddingBottom: 90 }}>
        {/* Back + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <button
            onClick={() => navigate('/')}
            aria-label="Back to Upload"
            style={{
              padding: '8px 10px',
              background: '#222',
              color: '#fff',
              border: `1px solid ${line}`,
              borderRadius: 10,
              fontWeight: 700,
            }}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ color: '#fff', margin: 0 }}>Analysis Results</h3>
            {username && (
              <span style={{ color: '#9ca3af', fontSize: 14 }}>
                for{' '}
                <span style={{ color: '#fff', fontWeight: 700 }}>
                  {username.startsWith('@') ? username : `@${username}`}
                </span>
              </span>
            )}
          </div>
        </div>

        <div style={{ marginTop: 6, color: textMuted, fontSize: 13 }}>
          We found {report.findings.length} issue{report.findings.length === 1 ? '' : 's'}.
        </div>

        <DangerMeter score={dangerScore} />

        {/* Findings */}
        <div style={{ marginTop: 12, display: 'grid', gap: 8 }}>
          {report.findings.map((f, i) => {
            const key = f.agent ?? f.type; // support both shapes
            return (
              <div key={`finding-${i}`} style={{ border: `1px solid ${line}`, borderRadius: 10, padding: 12 }}>
                <div style={{ color: '#fff', fontWeight: 700, marginBottom: 4 }}>{agentLabel(key)}</div>
                <div style={{ color: textMuted }}>{f.summary}</div>
                <div style={{ marginTop: 6, fontSize: 12, color: '#fff' }}>Risk: {f.risk ?? 0}</div>
              </div>
            );
          })}
        </div>

        {/* Originals */}
        {(photos.length > 0 || videos.length > 0) && (
          <>
            <div style={{ color: '#fff', marginTop: 16, marginBottom: 6 }}>Original Media</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {photos.map((p, idx) => (
                <img
                  key={`orig-photo-${idx}`}
                  src={URL.createObjectURL(p)}
                  alt=""
                  style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover' }}
                />
              ))}
              {videos.map((v, idx) => (
                <video
                  key={`orig-video-${idx}`}
                  src={URL.createObjectURL(v)}
                  controls
                  style={{ width: 150, height: 100, borderRadius: 8, objectFit: 'cover' }}
                />
              ))}
            </div>
          </>
        )}

        {/* Censored previews (read-only) */}
        {report.censoredMedia?.length > 0 && (
          <>
            <div style={{ color: '#fff', marginTop: 16, marginBottom: 6 }}>Censored Previews</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {report.censoredMedia.map((m) => (
                <img
                  key={`censored-${m.id}`}
                  src={m.url}
                  alt={m.label}
                  style={{ width: 100, height: 100, objectFit: 'cover', borderRadius: 8 }}
                />
              ))}
            </div>
          </>
        )}

        {/* Downloads */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button
            onClick={downloadReportJson}
            style={{ padding: 10, background: '#222', color: '#fff', border: `1px solid ${line}`, borderRadius: 10, fontWeight: 600 }}
          >
            Download Report (.json)
          </button>
          {/* Removed: Download Agent Artifacts */}
        </div>

        {/* --- Sticky Decision Bar (2 buttons) --- */}
        {!uploaded && (
          <div
            style={{
              position: 'fixed',
              left: 0,
              right: 0,
              bottom: 0,
              padding: 12,
              background: 'rgba(15,15,15,0.98)',
              borderTop: `1px solid ${line}`,
            }}
          >
            <div
              style={{
                maxWidth: 'clamp(360px, 92vw, 900px)',
                margin: '0 auto',
                display: 'grid',
                gap: 8,
                gridTemplateColumns: '1fr 1fr',
              }}
            >
              <button
                onClick={continueWithoutChanges}
                style={{
                  padding: 12,
                  background: '#222',
                  color: '#fff',
                  border: `1px solid ${line}`,
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                Continue without changes
              </button>
              <button
                onClick={doNotUpload}
                style={{
                  padding: 12,
                  background: tiktokPink,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontWeight: 700,
                }}
              >
                Do not upload
              </button>
            </div>
          </div>
        )}
        {/* --- End Sticky Decision Bar --- */}

        {/* FULL-SCREEN "Uploaded!" OVERLAY – click anywhere to return home */}
        {uploaded && (
          <div
            onClick={() => navigate('/')}
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') navigate('/');
            }}
            style={{
              position: 'fixed',
              inset: 0,
              background: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              cursor: 'pointer',
            }}
            aria-label="Upload complete. Click to return to Upload page."
            role="button"
          >
            <div style={{ color: '#fff', fontSize: 28, fontWeight: 800, pointerEvents: 'none' }}>Uploaded!</div>
          </div>
        )}

        <div style={{ color: textMuted, fontSize: 12, marginTop: 8 }}>
          Tip: replace the mocked agent calls with your API endpoints.
        </div>
      </div>
    </div>
  );
}