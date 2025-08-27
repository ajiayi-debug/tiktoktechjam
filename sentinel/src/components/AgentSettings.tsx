import { useCallback } from '@lynx-js/react'
import type { AgentConfig } from '../types.ts'

export default function AgentSettings(props: {
  configs: AgentConfig[]
  onSave: (next: AgentConfig) => void
}) {
  const toggle = useCallback((cfg: AgentConfig) => { 'background only'; props.onSave({ ...cfg, enabled: !cfg.enabled }) }, [props])
  const clear  = useCallback((cfg: AgentConfig) => { 'background only'; props.onSave({ ...cfg, baseUrl: '', apiKey: '' }) }, [props])
  const onBase = (cfg: AgentConfig, v: string) => props.onSave({ ...cfg, baseUrl: v })
  const onKey  = (cfg: AgentConfig, v: string) => props.onSave({ ...cfg, apiKey: v })
  const onInput = (fn: (v: string) => void) => (e: any) => fn(e?.detail?.value ?? e?.currentTarget?.value ?? '')

  return (
    <view className="card">
      <view className="row" style={{ alignItems: 'center' }}>
        <text className="fs-18 fw-700" style={{ marginRight: 8 }}>Agent onboarding</text>
        <view className="pill"><text>HTTP or Mock mode compatible</text></view>
      </view>
      <text className="muted small" style={{ marginTop: 4 }}>
        Configure your agent endpoints and keys. Toggle <text className="kbd">Mock</text> in the header for local testing.
      </text>
      <view className="divider" />

      <view className="grid three">
        {props.configs.map((c) => (
          <view className="result-item" key={c.id}>
            <view className="row" style={{ alignItems: 'center' }}>
              <text className="fw-700">{c.name}</text>
              <view className="pill" style={{ marginLeft: 'auto' }}>
                <text>{c.enabled ? 'Enabled' : 'Disabled'}</text>
              </view>
            </view>

            <text className="small muted">Base URL</text>
            <input
              className="input"
              placeholder="https://agent.example.com"
              value={c.baseUrl ?? ''}
              {...({ bindinput: onInput((v) => onBase(c, v)) } as any)}
              onInput={onInput((v) => onBase(c, v))}
            />

            <text className="small muted" style={{ marginTop: 6 }}>API Key (optional)</text>
            <input
              className="input"
              placeholder="sk-..."
              value={c.apiKey ?? ''}
              {...({ bindinput: onInput((v) => onKey(c, v)) } as any)}
              onInput={onInput((v) => onKey(c, v))}
            />

            <view className="row" style={{ marginTop: 8 }}>
              <view className="btn" bindtap={() => toggle(c)}><text>{c.enabled ? 'Disable' : 'Enable'}</text></view>
              <view className="link small" style={{ marginLeft: 12 }} bindtap={() => clear(c)}><text>Clear</text></view>
            </view>
          </view>
        ))}
      </view>
    </view>
  )
}