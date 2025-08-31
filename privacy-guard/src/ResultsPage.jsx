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
    case 'soft-hints':
      return 'Soft Hints Analysis';
    case 'media pii':
      return 'Media PII Detection';
    case 'web research':
      return 'Web Research';
    case 'SummaryAgent':
      return 'Summary Agent';
    default:
      return key || 'Agent Output';
  }
}

// Get risk color based on level
function getRiskColor(risk) {
  if (risk >= 70) return '#ff4757';
  if (risk >= 40) return '#ffa502';
  if (risk >= 20) return '#ffd93d';
  return '#6bcf7f';
}

function isDataUrl(u) {
  return typeof u === 'string' && u.startsWith('data:');
}
function decodeDataUrl(u) {
  // data:mime;base64,AAAA...
  try {
    const [, meta, b64] = u.match(/^data:([^;]+);base64,(.*)$/) || [];
    if (!b64) return { mime: '', text: '' };
    const text = atob(b64);
    return { mime: meta || '', text };
  } catch {
    return { mime: '', text: '' };
  }
}

function ArtifactView({ item }) {
  // string artifact
  if (typeof item === 'string') {
    return <div style={{ color: '#fff', whiteSpace: 'pre-wrap' }}>{item}</div>;
  }

  // object artifact
  if (item && typeof item === 'object') {
    const label = item.label ?? 'Artifact';
    const url = item.url;

    // data: URL -> small inline preview if it's text/*
    if (isDataUrl(url)) {
      const { mime, text } = decodeDataUrl(url);
      const isText = mime.startsWith('text/');
      return (
        <div>
          <div style={{ color: '#fff', fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 6 }}>{mime || 'data'}</div>
          {isText ? (
            <pre
              style={{
                background: '#111',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                padding: 10,
                color: '#ddd',
                maxHeight: 220,
                overflow: 'auto',
                margin: 0,
              }}
            >
              {text}
            </pre>
          ) : (
            <div style={{ color: '#9ca3af' }}>
              (Binary data preview not shown)
            </div>
          )}
        </div>
      );
    }

    // http(s) link or no link
    return (
      <div>
        <div style={{ color: '#fff' }}>{label}</div>
        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#25F4EE', fontSize: 12, wordBreak: 'break-all' }}
          >
            {url}
          </a>
        ) : (
          <div style={{ color: '#9ca3af', fontSize: 12 }}>(no link)</div>
        )}
      </div>
    );
  }

  // anything else
  return (
    <pre
      style={{
        background: '#111',
        border: '1px solid #2a2a2a',
        borderRadius: 8,
        padding: 10,
        color: '#ddd',
        margin: 0,
      }}
    >
      {JSON.stringify(item, null, 2)}
    </pre>
  );
}

// JSON Renderer Component
function JsonRenderer({ data, level = 0 }) {
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (key) => {
    setCollapsed(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const renderValue = (value, key = '') => {
    if (value === null) return <span style={{ color: '#ff79c6' }}>null</span>;
    if (value === undefined) return <span style={{ color: '#ff79c6' }}>undefined</span>;

    if (typeof value === 'boolean') {
      return <span style={{ color: '#bd93f9' }}>{value.toString()}</span>;
    }

    if (typeof value === 'number') {
      return <span style={{ color: '#50fa7b' }}>{value}</span>;
    }

    if (typeof value === 'string') {
      return <span style={{ color: '#f1fa8c' }}>"{value}"</span>;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) return <span style={{ color: '#6272a4' }}>[]</span>;

      const isCollapsed = collapsed[key];
      return (
        <span>
          <span
            onClick={() => toggleCollapse(key)}
            style={{ cursor: 'pointer', color: '#8be9fd', userSelect: 'none' }}
          >
            [{isCollapsed ? '...' : ''}
          </span>
          {!isCollapsed && (
            <div style={{ marginLeft: 20 }}>
              {value.map((item, idx) => (
                <div key={idx} style={{ marginTop: 4 }}>
                  <span style={{ color: '#6272a4' }}>[{idx}]:</span> {renderValue(item, `${key}[${idx}]`)}
                </div>
              ))}
            </div>
          )}
          {!isCollapsed && <span style={{ color: '#8be9fd' }}>]</span>}
        </span>
      );
    }

    if (typeof value === 'object') {
      const entries = Object.entries(value);
      if (entries.length === 0) return <span style={{ color: '#6272a4' }}>{'{}'}</span>;

      const isCollapsed = collapsed[key];
      return (
        <span>
          <span
            onClick={() => toggleCollapse(key)}
            style={{ cursor: 'pointer', color: '#ff79c6', userSelect: 'none' }}
          >
            {'{' + (isCollapsed ? '...' : '')}
          </span>
          {!isCollapsed && (
            <div style={{ marginLeft: 20 }}>
              {entries.map(([k, v], idx) => (
                <div key={k} style={{ marginTop: 4 }}>
                  <span style={{ color: '#8be9fd' }}>"{k}"</span>
                  <span style={{ color: '#f8f8f2' }}>: </span>
                  {renderValue(v, `${key}.${k}`)}
                  {idx < entries.length - 1 && <span style={{ color: '#f8f8f2' }}>,</span>}
                </div>
              ))}
            </div>
          )}
          {!isCollapsed && <span style={{ color: '#ff79c6' }}>{'}'}</span>}
        </span>
      );
    }

    return <span style={{ color: '#f8f8f2' }}>{String(value)}</span>;
  };

  return <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{renderValue(data, 'root')}</div>;
}

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [uploaded, setUploaded] = useState(false);
  const [showJsonView, setShowJsonView] = useState(false);

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

  // Handle both possible structures
  const dangerScore = report.dangerScore ?? report.risk ?? 0;
  const artifacts = Array.isArray(report.artifacts) ? report.artifacts : [];

  // Build a normalized findings array.
  // If BE didn’t send report.findings, synthesize one from top-level fields.
  const findings = Array.isArray(report.findings) && report.findings.length
    ? report.findings
    : [{
        agent: report.agent, // can be string or array
        summary: report.detailed_summary || report.summary || '',
        risk: report.risk ?? dangerScore,
        status: report.status,
        artifacts: artifacts
      }];

  // --- Actions ---
  const continueWithoutChanges = async () => {
    setUploaded(true);
  };

  const doNotUpload = async () => {
    navigate('/');
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
          Overall risk: <span style={{ color: '#fff' }}>{dangerScore}</span>
          {Array.isArray(report.agent) && report.agent.length ? (
            <> · Agents: <span style={{ color: '#fff' }}>{report.agent.join(', ')}</span></>
          ) : report.agent ? (
            <> · Agent: <span style={{ color: '#fff' }}>{String(report.agent)}</span></>
          ) : null}
        </div>

        <DangerMeter score={dangerScore} />

        {/* Toggle between views */}
        <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
          <button
            onClick={() => setShowJsonView(false)}
            style={{
              padding: '8px 16px',
              background: !showJsonView ? tiktokCyan : '#222',
              color: !showJsonView ? '#000' : '#fff',
              border: `1px solid ${line}`,
              borderRadius: 8,
              fontWeight: 600,
              transition: 'all 200ms ease'
            }}
          >
            Summary View
          </button>
          <button
            onClick={() => setShowJsonView(true)}
            style={{
              padding: '8px 16px',
              background: showJsonView ? tiktokCyan : '#222',
              color: showJsonView ? '#000' : '#fff',
              border: `1px solid ${line}`,
              borderRadius: 8,
              fontWeight: 600,
              transition: 'all 200ms ease'
            }}
          >
            JSON View
          </button>
        </div>

        {/* Content based on view */}
        {!showJsonView ? (
          <>
            {/* Summary from report if available */}
            {report.summary && (
              <div style={{
                marginTop: 16,
                padding: 16,
                background: '#1a1a1a',
                border: `1px solid ${line}`,
                borderRadius: 10
              }}>
                <div style={{ color: tiktokCyan, fontWeight: 700, marginBottom: 8, fontSize: 16 }}>
                  Overall Summary
                </div>
                <div style={{ color: '#fff', lineHeight: 1.6 }}>{report.summary}</div>
                {report.status && (
                  <div style={{ marginTop: 8, fontSize: 12 }}>
                    <span style={{ color: textMuted }}>Status: </span>
                    <span style={{
                      color: report.status === 'done' ? '#6bcf7f' :
                        report.status === 'error' ? '#ff4757' :
                          '#ffa502'
                    }}>
                      {report.status}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Agent artifacts/findings */}
            {artifacts.length > 0 && (
              <>
                <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginTop: 20, marginBottom: 12 }}>
                  Detailed Findings
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {artifacts.map((art, i) => (
                    <div
                      key={`artifact-${i}`}
                      style={{
                        border: `1px solid ${line}`,
                        borderRadius: 10,
                        padding: 16,
                        background: '#1a1a1a',
                        display: 'grid',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ color: tiktokCyan, fontWeight: 700 }}>Agent Output</div>
                        {/* optional chip if you want a neutral pill */}
                        <div
                          style={{
                            padding: '4px 12px',
                            background: '#2a2a2a',
                            border: `1px solid ${line}`,
                            borderRadius: 6,
                            fontSize: 12,
                            color: '#9ca3af',
                            fontWeight: 600,
                          }}
                        >
                          artifact #{i + 1}
                        </div>
                      </div>

                      <ArtifactView item={art} />
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Originals */}
            {(photos.length > 0 || videos.length > 0) && (
              <>
                <div style={{ color: '#fff', marginTop: 20, marginBottom: 8, fontSize: 16, fontWeight: 700 }}>
                  Original Media
                </div>
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

            {/* Censored previews */}
            {report.censoredMedia?.length > 0 && (
              <>
                <div style={{ color: '#fff', marginTop: 20, marginBottom: 8, fontSize: 16, fontWeight: 700 }}>
                  Censored Previews
                </div>
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
          </>
        ) : (
          /* JSON View */
          <div style={{
            marginTop: 16,
            padding: 16,
            background: '#1a1a1a',
            border: `1px solid ${line}`,
            borderRadius: 10,
            overflowX: 'auto'
          }}>
            <JsonRenderer data={report} />
          </div>
        )}

        {/* Download button */}
        <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
          <button
            onClick={downloadReportJson}
            style={{
              padding: 10,
              background: '#222',
              color: '#fff',
              border: `1px solid ${line}`,
              borderRadius: 10,
              fontWeight: 600
            }}
          >
            Download Report (.json)
          </button>
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

        {/* Upload complete overlay */}
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
      </div>
    </div>
  );
}
