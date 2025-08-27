import { useCallback } from '@lynx-js/react'
import type { AgentOutput } from '../types.ts'

export default function ResultsList({ outputs }: { outputs: AgentOutput[] }) {
  const openLink = useCallback((url: string) => { 'background only'; try { window.open(url, '_blank') } catch { location.href = url } }, [])

  return (
    <view className="card">
      <text className="fs-18 fw-700" style={{ marginBottom: 8 }}>Agent findings</text>
      {!outputs.length && <text className="muted small">No results yet. Run a scan.</text>}

      <view className="grid" style={{ marginTop: 8 }}>
        {outputs.map((o) => (
          <view className="result-item" key={o.agent}>
            <view className="row" style={{ alignItems: 'center', marginBottom: 6 }}>
              <text className="fw-700">
                {o.agent === 'text-leak' && 'Agent 1 – Text Leak Scanner'}
                {o.agent === 'reverse-image' && 'Agent 2 – Reverse Image Search'}
                {o.agent === 'redaction' && 'Agent 3 – Redaction & Warning'}
              </text>
              {o.stats && (
                <view className="pill" style={{ marginLeft: 'auto' }}>
                  <text>{Object.entries(o.stats).map(([k, v]) => `${k}: ${v}`).join(' · ')}</text>
                </view>
              )}
            </view>

            {!o.findings.length ? (
              <text className="muted small">No findings.</text>
            ) : (
              <view className="grid">
                {o.findings.map((f) => (
                  <view className="result-item" key={f.id}>
                    <view className="row" style={{ alignItems: 'center' }}>
                      <view
                        className="pill"
                        style={{ background: f.severity === 'high' ? '#2a0f12' : f.severity === 'medium' ? '#2a2512' : '#0f1f2a', borderColor: '#2b3b52' }}
                      >
                        <text>{f.severity.toUpperCase()}</text>
                      </view>
                      <text className="fw-600" style={{ marginLeft: 8 }}>{f.title}</text>

                      {f.url && (
                        <view className="link small" style={{ marginLeft: 'auto' }} bindtap={() => openLink(f.url!)}>
                          <text>Open</text>
                        </view>
                      )}
                    </view>

                    {f.description && <text className="small muted" style={{ marginTop: 6 }}>{f.description}</text>}
                  </view>
                ))}
              </view>
            )}
          </view>
        ))}
      </view>
    </view>
  )
}
