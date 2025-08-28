// src/components/ShareComposer.tsx
import { useCallback, useRef, useState } from '@lynx-js/react';
import type { DangerScore, UploadedMedia } from '../types.js';
import { Input, Textarea, Video } from './Primitives.js';

type LynxBindEvt = { detail?: { value?: string } };

export default function ShareComposer(props: {
  busy: boolean;
  score: DangerScore | null;
  onScan: (text: string, media: UploadedMedia[]) => void;
  onCensor: () => void;
}) {
  const [text, setText] = useState('');
  const [location, setLocation] = useState('Example Street, City');
  const [media, setMedia] = useState<UploadedMedia[]>([]);

  // Works in both Lynx and web preview
  const inputRef = useRef<HTMLInputElement | { click?: () => void } | null>(null);

  const onTextInput = (e: LynxBindEvt) => {
    setText(e.detail?.value ?? '');
  };

  const onLocationInput = (e: LynxBindEvt) => {
    setLocation(e.detail?.value ?? '');
  };

  const pickFiles = useCallback(() => {
    'background only';
    const el = inputRef.current;
    // Narrow and call .click() if present
    if (el && typeof (el as HTMLInputElement).click === 'function') {
      (el as HTMLInputElement).click();
    } else if (el && typeof (el as { click?: () => void }).click === 'function') {
      (el as { click?: () => void }).click?.();
    }
  }, []);

  const onFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const items: UploadedMedia[] = Array.from(files).map((file) => {
      const kind = file.type.startsWith('video/') ? 'video' : 'image';
      return { id: crypto.randomUUID(), file, kind, previewUrl: URL.createObjectURL(file) };
    });
    setMedia((m) => (items.length ? items : m));
  }, []);

  const scan = useCallback(() => {
    'background only';
    props.onScan(text, media);
  }, [props, text, media]);

  const first = media[0];
  const risk = props.score?.value ?? null;

  return (
    <view className="card">
      <view className="share-grid">
        {/* Left side: fields */}
        <view className="share-left">
          {/* Description */}
          <view className="field">
            <text className="fs-16 fw-700">Add description…</text>
            <Textarea
              className="textarea"
              placeholder="Say something about your post"
              value={text}
              bindinput={onTextInput}
            />
            {/* Chips row (hashtags / mention) */}
            <view className="chips">
              <view className="chip"><text># Hashtags</text></view>
              <view className="chip"><text>@ Mention</text></view>
            </view>
          </view>

          {/* Location */}
          <view className="field">
            <text className="fs-16 fw-700">Location</text>
            <Input
              className="input"
              value={location}
              placeholder="Example Street, City"
              bindinput={onLocationInput}
            />
          </view>

          {/* Meta rows (placeholders to match share sheet) */}
          <view className="meta-rows">
            <view className="meta-row"><text className="link">Add link</text></view>
            <view className="meta-row"><text>Everyone can view this post</text></view>
            <view className="meta-row"><text className="muted">More options</text></view>
            <view className="meta-row"><text className="muted">Share to</text></view>
          </view>

          {/* Loading status during scan */}
          {props.busy && (
            <view className="status">
              <text className="small muted">
                Loading (searching for related info about user on the internet)
              </text>
            </view>
          )}

          {/* Risk banner after results */}
          {!props.busy && risk !== null && (
            <view className="risk-banner">
              <view className="risk-header">
                <text className="fw-700">Privacy Risk:</text>
                <text className="fw-700" style={{ marginLeft: 6 }}>{risk}%</text>
              </view>
              <view className="risk-bar">
                <view
                  className="risk-fill"
                  style={{ width: `${Math.min(100, Math.max(0, risk))}%` }}
                />
              </view>
              <text className="small">
                Your location and personal info might be inferred from your media/text.
              </text>

              <view className="risk-actions">
                <view className="btn btn-primary" bindtap={props.onCensor}>
                  <text>Censor sensitive info</text>
                </view>
              </view>
            </view>
          )}

          {/* Scan / file actions */}
          <view className="actions-row">
            <view className="btn" bindtap={pickFiles}><text>Add media</text></view>
            <view
              className={`btn ${text || media.length ? 'btn-primary' : ''}`}
              bindtap={scan}
            >
              <text>{props.busy ? 'Scanning…' : 'Scan for risks'}</text>
            </view>

            {/* hidden file picker */}
            <Input
              ref={inputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden-input"                    // instead of style={{ display: 'none' }}
              onChange={(e) => {                          // robust: works in Lynx + web
                const evt = e as {
                  currentTarget?: { files?: FileList | null };
                  target?: { files?: FileList | null };
                };
                onFiles(evt.currentTarget?.files ?? evt.target?.files ?? null);
              }}
            />
          </view>
        </view>

        {/* Right side: media preview */}
        <view className="share-right">
          <view className="media-box" bindtap={pickFiles}>
            {first ? (
              first.kind === 'image'
                ? <image src={first.previewUrl} className="media-img" />
                : <Video src={first.previewUrl} className="media-img" controls muted />
            ) : (
              <text className="muted small">Tap to select media</text>
            )}
          </view>
          <view className="media-edit">
            <text className="link">Edit cover</text>
          </view>
        </view>
      </view>
    </view>
  );
}