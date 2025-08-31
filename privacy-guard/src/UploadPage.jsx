import React, { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

const tiktokCyan = '#25F4EE';
const tiktokPink = '#FE2C55';
const bg = '#0f0f0f';
const panel = '#141414';
const line = '#2a2a2a';
const textMuted = '#9ca3af';

// --- helper: convert File -> base64 payload (JS version) ---
const fileToB64 = (file) =>
  new Promise((resolve, reject) => {
    if (!(file instanceof Blob)) {
      return reject(new TypeError('Expected a File or Blob'));
    }
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result; // e.g. "data:video/mp4;base64,AAAA..."
      const b64 = String(result).split(',')[1]; // take just the base64 part
      resolve(b64); // return plain base64 string
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

export default function UploadPage() {
  const [username, setUsername] = useState('');
  const [text, setText] = useState('');
  const [image, setImage] = useState(null); // single file
  const [video, setVideo] = useState(null); // single file
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();
  const imageInput = useRef(null);
  const videoInput = useRef(null);

  // ✅ proper guard for button enablement
  const canSend = useMemo(
    () => Boolean(username.trim() && image || video),
    [username, image, video]
  );

  const submitAsJson = async () => {
    try {
      setBusy(true);

      if (!username.trim()) {
        alert('Username is required');
        return;
      }
      if (!image && !video) {
        alert('Please upload one image and one video');
        return;
      }
      // UNCOMMENT WHEN BE IS READY!!!
      const videoPayload = await fileToB64(video);

      const payload = {
        username: username.trim(),
        text,
        video: videoPayload,
        video_extension: 'mp4',
      };

      const res = await fetch('http://localhost:8000/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
      const report = await res.json();

      navigate('/results', { state: { report } });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: bg, padding: 16 }}>
      <div style={{ background: panel, border: `1px solid ${line}`, borderRadius: 12, padding: 12 }}>
        {/* Username (required) */}
        <input
          type="text"
          inputMode="text"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          placeholder="Enter your username"
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
          onChange={(e) => setText(e.target.value)}
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
            onClick={() => imageInput.current?.click()}
            style={{ flex: 1, padding: 12, background: tiktokCyan, border: 'none', borderRadius: 10, fontWeight: 600 }}
          >
            Upload Image
          </button>
          <input
            ref={imageInput}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={(e) => setImage(e.target.files?.[0] || null)}
          />

          <button
            onClick={() => videoInput.current?.click()}
            style={{ flex: 1, padding: 12, background: tiktokPink, color: '#fff', border: 'none', borderRadius: 10, fontWeight: 600 }}
          >
            Upload Video
          </button>
          <input
            ref={videoInput}
            type="file"
            accept="video/*"
            style={{ display: 'none' }}
            onChange={(e) => setVideo(e.target.files?.[0] || null)}
          />
        </div>

        {(image || video) && (
          <div style={{ marginTop: 16 }}>
            {image && (
              <div style={{ marginBottom: 12 }}>
                <div style={{ color: '#fff', marginBottom: 8 }}>Image</div>
                <img
                  src={URL.createObjectURL(image)}
                  alt="Uploaded"
                  style={{ width: 120, height: 120, borderRadius: 8, objectFit: 'cover' }}
                />
              </div>
            )}
            {video && (
              <div>
                <div style={{ color: '#fff', marginBottom: 8 }}>Video</div>
                <video
                  src={URL.createObjectURL(video)}
                  controls
                  style={{
                    width: '100%',
                    height: 'auto',       // keep aspect ratio
                    maxHeight: 320,       // optional cap
                    display: 'block',
                    background: '#000',
                    objectFit: 'contain', // show full frame, no crop
                  }}
                />
              </div>
            )}
          </div>
        )}

        <button
          onClick={submitAsJson}
          disabled={!canSend || busy}
          style={{
            marginTop: 16,
            padding: 12,
            width: '100%',
            background: canSend && !busy ? tiktokCyan : '#2b2b2b',
            color: '#000',
            border: 'none',
            borderRadius: 10,
            fontWeight: 700,
            opacity: busy ? 0.8 : 1,
            cursor: canSend && !busy ? 'pointer' : 'not-allowed',
          }}
        >
          {busy ? 'Uploading…' : 'Analyze'}
        </button>

        <div style={{ color: textMuted, fontSize: 12, marginTop: 8 }}>
          We’ll check your text/media for privacy risks, attempt reverse searches, and generate optional censoring.
        </div>
      </div>
    </div>
  );
}
