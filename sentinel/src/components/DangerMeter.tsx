import { useCallback, useState } from '@lynx-js/react';
import type { DangerScore } from '../types.js';

export default function DangerMeter({ score }: { score: DangerScore | null }) {
  const [open, setOpen] = useState(false);

  const v = score?.value ?? 0;
  const pct = Math.max(0, Math.min(100, Number.isFinite(v) ? v : 0));

  let label: 'Safe' | 'Caution' | 'Elevated' | 'Critical' = 'Safe';
  if (v >= 70) label = 'Critical';
  else if (v >= 40) label = 'Elevated';
  else if (v >= 15) label = 'Caution';

  const toggleOpen = useCallback(() => {
    // eslint-disable-next-line no-unused-expressions
    'background only';
    setOpen((o) => !o);
  }, []);

  return (
    <view className="card">
      <view className="row" style={{ alignItems: 'center' }}>
        <text className="fs-18 fw-700">Danger score</text>
        <view className="pill" style={{ marginLeft: 8 }}>
          <text>{label}</text>
        </view>
      </view>

      <view className="danger-meter" style={{ marginTop: 12 }}>
        <view className="danger-fill" style={{ width: `${pct}%` }} />
      </view>

      <view className="row" style={{ marginTop: 8, justifyContent: 'space-between' }}>
        <text className="small muted">0</text>
        <text className="fw-700">{pct}</text>
        <text className="small muted">100</text>
      </view>

      {score?.reasons?.length ? (
        <view style={{ marginTop: 8 }}>
          <view className="link small" bindtap={toggleOpen}>
            <text>{open ? 'Hide reasons' : 'Why this score'}</text>
          </view>

          {open && (
            <view style={{ marginTop: 6 }}>
              {score.reasons.map((r, i) => (
                <view key={i} style={{ marginBottom: 4 }}>
                  <text className="small">{`• ${r}`}</text>
                </view>
              ))}
            </view>
          )}
        </view>
      ) : (
        <text className="small muted" style={{ marginTop: 8 }}>
          Run a scan to see risk drivers.
        </text>
      )}
    </view>
  );
}
