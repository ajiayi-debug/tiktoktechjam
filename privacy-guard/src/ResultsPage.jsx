// ResultsPage.jsx
/** @typedef {import('./App.jsx').AgentOutput} AgentOutput */
/** @typedef {import('./App.jsx').Submission} Submission */

import React, { useMemo, useState } from 'react';
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
      <div role="meter" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}
           style={{ height: 10, background: '#1f1f1f', borderRadius: 999, overflow: 'hidden', border: '1px solid #222' }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: `linear-gradient(90deg, ${tiktokCyan}, ${tiktokPink})`,
          transition: 'width 300ms ease'
        }}/>
      </div>
    </div>
  );
}

function downloadBlob(filename, mime, data) {
  const blob = new Blob([data], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ResultsPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  if (!state || !state.report) {
    return (
      <div style={{ minHeight: '100vh', background: bg, color: '#fff', padding: 16 }}>
        <div style={{ background: panel, border: `1px solid ${line}`, borderRadius: 12, padding: 16 }}>
          No analysis data found.
          <div style={{ marginTop: 12 }}>
            <button onClick={() => navigate('/')}
                    style={{ padding: 10, background: tiktokCyan, border: 'none', borderRadius: 10, fontWeight: 700 }}>
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { report, photos = [], videos = [], username = '' } = state;
  const { dangerScore = 0 } = report;

  // Select which censored media to upload (defaults to all)
  const [selected, setSelected] = useState(() =>
    new Set((report.censoredMedia || []).map(m => m.id))
  );
  const toggleSel = (id) => {
    setSelected(s => {
      const next = new Set(s);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectedCensored = useMemo(
    () => (report.censoredMedia || []).filter(m => selected.has(m.id)),
    [report.censoredMedia, selected]
  );

  // --- Actions (stub back-ends; wire these to your API) ---
  const continueWithoutChanges = async () => {
    alert('Continuing with original upload (no changes).');
  };
  const uploadCensored = async () => {
    if (selectedCensored.length === 0) {
      alert('Select at least one censored item (or choose Do not upload).');
      return;
    }
    alert(`Uploading ${selectedCensored.length} censored item(s).`);
  };
  const doNotUpload = async () => {
    alert('Not uploading.');
  };

  const downloadReportJson = () => {
    downloadBlob('privacy_report.json', 'application/json', JSON.stringify(report, null, 2));
  };
  const downloadArtifacts = () => {
    const urls = (report.findings || []).flatMap(f => (f.artifacts || []).map(a => a.url).filter(Boolean));
    if (urls.length === 0) return alert('No downloadable artifacts found.');
    urls.forEach(u => window.open(u, '_blank', 'noopener'));
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
              fontWeight: 700
            }}
          >
            ← Back
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <h3 style={{ color: '#fff', margin: 0 }}>Analysis Results</h3>
            {username && (
              <span style={{ color: '#9ca3af', fontSize: 14 }}>
                for <span style={{ color: '#fff', fontWeight: 700 }}>
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
          {report.findings.map((f, i) => (
            <div key={`finding-${i}`} style={{ border: `1px solid ${line}`, borderRadius: 10, padding: 12 }}>
              <div style={{ color: '#fff', fontWeight: 700, marginBottom: 4 }}>
                {f.agent === 'text-crawl' && 'Text Similarity / Web Crawl'}
                {f.agent === 'rev-search' && 'Reverse Image/Video Search'}
                {f.agent === 'censor' && 'Censoring Output'}
              </div>
              <div style={{ color: textMuted }}>{f.summary}</div>
              <div style={{ marginTop: 6, fontSize: 12, color: '#fff' }}>Risk: {f.risk}</div>
            </div>
          ))}
        </div>

        {/* Originals */}
        {(photos.length > 0 || videos.length > 0) && (
          <>
            <div style={{ color: '#fff', marginTop: 16, marginBottom: 6 }}>Original Media</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {photos.map((p, idx) => (
                <img key={`orig-photo-${idx}`} src={URL.createObjectURL(p)} alt=""
                     style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover' }} />
              ))}
              {videos.map((v, idx) => (
                <video key={`orig-video-${idx}`} src={URL.createObjectURL(v)} controls
                       style={{ width: 150, height: 100, borderRadius: 8, objectFit: 'cover' }} />
              ))}
            </div>
          </>
        )}

        {/* Censored previews with selection */}
        {report.censoredMedia?.length > 0 && (
          <>
            <div style={{ color: '#fff', marginTop: 16, marginBottom: 6 }}>Censored Previews (tap to select)</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {report.censoredMedia.map((m) => {
                const on = selected.has(m.id);
                return (
                  <button key={`censored-${m.id}`} onClick={() => toggleSel(m.id)}
                          style={{
                            padding: 0, borderRadius: 10, overflow: 'hidden',
                            border: `2px solid ${on ? tiktokCyan : line}`, position: 'relative'
                          }}>
                    <img src={m.url} alt={m.label} style={{ width: 100, height: 100, objectFit: 'cover', display: 'block' }} />
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 11, padding: '2px 4px', textAlign: 'center'
                    }}>
                      {on ? 'Selected' : 'Tap to select'}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ color: textMuted, fontSize: 12, marginTop: 6 }}>
              Selected: {selectedCensored.length} / {report.censoredMedia.length}
            </div>
          </>
        )}

        {/* Downloads */}
        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button onClick={downloadReportJson}
                  style={{ padding: 10, background: '#222', color: '#fff', border: `1px solid ${line}`, borderRadius: 10, fontWeight: 600 }}>
            Download Report (.json)
          </button>
          <button onClick={downloadArtifacts}
                  style={{ padding: 10, background: '#222', color: '#fff', border: `1px solid ${line}`, borderRadius: 10, fontWeight: 600 }}>
            Download Agent Artifacts
          </button>
        </div>

        {/* --- Sticky Decision Bar --- */}
        <div style={{
          position: 'fixed', left: 0, right: 0, bottom: 0,
          padding: 12, background: 'rgba(15,15,15,0.98)', borderTop: `1px solid ${line}`
        }}>
          <div style={{ maxWidth: 'clamp(360px, 92vw, 900px)', margin: '0 auto', display: 'grid', gap: 8,
                        gridTemplateColumns: '1fr 1fr 1fr' }}>
            <button onClick={continueWithoutChanges}
                    style={{ padding: 12, background: '#222', color: '#fff', border: `1px solid ${line}`,
                             borderRadius: 10, fontWeight: 700 }}>
              Continue without changes
            </button>
            <button onClick={uploadCensored}
                    style={{ padding: 12, background: tiktokCyan, border: 'none', borderRadius: 10, fontWeight: 700 }}>
              Upload censored
            </button>
            <button onClick={doNotUpload}
                    style={{ padding: 12, background: tiktokPink, color: '#fff', border: 'none',
                             borderRadius: 10, fontWeight: 700 }}>
              Do not upload
            </button>
          </div>
        </div>
        {/* --- End Sticky Decision Bar --- */}

        <div style={{ color: textMuted, fontSize: 12, marginTop: 8 }}>
          Tip: replace the mocked agent calls with your API endpoints.
        </div>
      </div>
    </div>
  );
}