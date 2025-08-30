import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const tiktokCyan = '#25F4EE';
const tiktokPink = '#FE2C55';
const bg = '#0f0f0f';
const panel = '#141414';
const line = '#2a2a2a';
const textMuted = '#9ca3af';

function DangerMeter({ score }) {
  const pct = Math.min(100, Math.max(0, score));
  return (
    <div style={{ marginTop: 16 }}>
      <div style={{ color: '#fff', fontSize: 12, marginBottom: 6 }}>Danger Meter: {pct}</div>
      <div style={{ height: 10, background: '#1f1f1f', borderRadius: 999, overflow: 'hidden', border: '1px solid #222' }}>
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

// --- Mock agent calls (replace with your real endpoints later) ---
async function runAgents({ text, photos, videos }) {
  const textFindings = text
    ? [{ type: 'text-crawl', summary: 'No exact matches found. Similar phrasing on 2 sites.', risk: 20 }]
    : [];
  const reverseFindings =
    photos.length + videos.length > 0
      ? [{ type: 'reverse-media', summary: 'Potential face match risk if posted publicly.', risk: 45 }]
      : [];
  const censorFindings =
    photos.length + videos.length > 0
      ? [{ type: 'censor', summary: 'Blurred faces and license plates created.', risk: 10 }]
      : [];

  const findings = [...textFindings, ...reverseFindings, ...censorFindings];
  const base = findings.reduce((m, f) => Math.max(m, f.risk), 0);
  const dangerScore = Math.min(100, base + Math.max(0, findings.length - 1) * 5);

  return {
    findings,
    dangerScore,
    censoredMedia: photos.concat(videos).map((f, i) => ({ id: i, label: f.name || `media-${i}`, url: URL.createObjectURL(f) })),
  };
}

export default function UploadPage() {
  const [username, setUsername] = useState('');         // <-- NEW
  const [text, setText] = useState('');
  const [photos, setPhotos] = useState([]);
  const [videos, setVideos] = useState([]);
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const photoInput = useRef(null);
  const videoInput = useRef(null);

  const canAnalyze = useMemo(() => Boolean(text || photos.length > 0 || videos.length > 0), [text, photos.length, videos.length]);

  const onFiles = (kind, fileList) => {
    const arr = Array.from(fileList || []);
    if (kind === 'photo') setPhotos(p => [...p, ...arr]);
    if (kind === 'video') setVideos(p => [...p, ...arr]);
  };

  const onRemove = (kind, idx) => {
    if (kind === 'photo') setPhotos(ps => ps.filter((_, i) => i !== idx));
    if (kind === 'video') setVideos(ps => ps.filter((_, i) => i !== idx));
  };

  const runAnalysis = async () => {
    try {
      setBusy(true);
      const report = await runAgents({ text, photos, videos });
      navigate('/results', { state: { report, text, photos, videos, username } }); // <-- pass username
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, padding: 16 }}>
      <div style={{ background: panel, border: `1px solid ${line}`, borderRadius: 12, padding: 12 }}>
        {/* Username (optional) */}
        <input
          type="text"
          inputMode="text"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Enter your username (optional)"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{
            width: '100%',
            background: '#121212',
            color: '#fff',
            border: `1px solid ${line}`,
            padding: 10,
            borderRadius: 10,
            outline: 'none',
            marginBottom: 10,
          }}
        />

        <textarea
          placeholder="Type your caption, message, or any text…"
          value={text}
          onChange={e => setText(e.target.value)}
          rows={4}
          style={{
            width: '100%',
            background: '#121212',
            color: '#fff',
            border: `1px solid ${line}`,
            padding: 10,
            borderRadius: 10,
            outline: 'none',
          }}
        />

        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button
            onClick={() => photoInput.current?.click()}
            style={{ flex: 1, padding: 12, background: tiktokCyan, border: 'none', borderRadius: 10, fontWeight: 600 }}
          >
            Upload Photos
          </button>
          <input
            ref={photoInput}
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            style={{ display: 'none' }}
            onChange={e => onFiles('photo', e.target.files)}
          />

          <button
            onClick={() => videoInput.current?.click()}
            style={{ flex: 1, padding: 12, background: tiktokPink, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600 }}
          >
            Upload Videos
          </button>
          <input
            ref={videoInput}
            type="file"
            accept="video/*"
            multiple
            capture
            style={{ display: 'none' }}
            onChange={e => onFiles('video', e.target.files)}
          />
        </div>

        {(photos.length > 0 || videos.length > 0) && (
          <div style={{ marginTop: 16 }}>
            {photos.length > 0 && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#fff', marginBottom: 8 }}>Photos</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {photos.map((photo, idx) => (
                    <div key={`photo-${idx}`} style={{ position: 'relative' }}>
                      <img
                        src={URL.createObjectURL(photo)}
                        alt="Uploaded"
                        style={{ width: 100, height: 100, borderRadius: 8, objectFit: 'cover' }}
                      />
                      <button
                        onClick={() => onRemove('photo', idx)}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: '#ff3b30',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                        aria-label={`Remove photo ${idx + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {videos.length > 0 && (
              <div>
                <div style={{ color: '#fff', marginBottom: 8 }}>Videos</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {videos.map((video, idx) => (
                    <div key={`video-${idx}`} style={{ position: 'relative' }}>
                      <video
                        src={URL.createObjectURL(video)}
                        controls
                        style={{ width: 150, height: 100, borderRadius: 8, objectFit: 'cover' }}
                      />
                      <button
                        onClick={() => onRemove('video', idx)}
                        style={{
                          position: 'absolute',
                          top: -8,
                          right: -8,
                          backgroundColor: '#ff3b30',
                          color: '#fff',
                          border: 'none',
                          borderRadius: '50%',
                          width: 24,
                          height: 24,
                          cursor: 'pointer',
                          fontWeight: 700,
                        }}
                        aria-label={`Remove video ${idx + 1}`}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <button
          onClick={runAnalysis}
          disabled={!canAnalyze || busy}
          style={{
            marginTop: 16,
            padding: 12,
            width: '100%',
            background: canAnalyze && !busy ? tiktokCyan : '#2b2b2b',
            color: '#000',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            opacity: busy ? 0.8 : 1,
          }}
        >
          {busy ? 'Analyzing…' : 'Analyze'}
        </button>

        <div style={{ color: textMuted, fontSize: 12, marginTop: 8 }}>
          We’ll check your text/media for privacy risks, attempt reverse searches, and generate optional censoring.
        </div>
      </div>
    </div>
  );
}
