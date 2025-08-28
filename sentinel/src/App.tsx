import './App.css'
import { useEffect, useMemo, useRef, useState } from '@lynx-js/react'

import ShareComposer from './components/ShareComposer.js'
import ResultsList from './components/ResultsList.js'
import DangerMeter from './components/DangerMeter.js'
import ActionBar from './components/ActionBar.js'
import AgentSettings from './components/AgentSettings.js'

import type { AgentOutput, AgentTransportMode, Submission } from './types.js'
import { computeDanger } from './lib/score.js'
import { AgentRegistry } from './agents/AgentRegistry.js'
import { safeStorage } from './lib/safeStorage.js'

export function App(props: { onRender?: () => void }) {
  const [mode, setMode] = useState<AgentTransportMode>(
    () => (safeStorage.getItem('sentinel.mode') as AgentTransportMode) || 'mock'
  )
  const [busy, setBusy] = useState(false)
  const [outputs, setOutputs] = useState<AgentOutput[]>([])
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null)
  const [toast, setToast] = useState<string | null>(null)

  // allow tests to hook into first paint
  const called = useRef(false)
  useEffect(() => {
    if (!called.current) {
      called.current = true
      props.onRender?.()
    }
  }, [props.onRender])

  const registry = useMemo(() => new AgentRegistry(), [])
  const configs = registry.list()
  const score = useMemo(() => computeDanger(outputs), [outputs])

  const showToast = (msg: string) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2600)
  }

  const runScan = async (text: string, media: Submission['media']) => {
    setBusy(true)
    setOutputs([])
    const sub: Submission = { text, media }
    setLastSubmission(sub)
    try {
      const res = await registry.runAll(sub, mode)
      setOutputs(res)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      showToast(`Scan failed: ${message}`)
    } finally {
      setBusy(false)
    }
  }

  const onAction = (choice: 'post-as-is' | 'apply-redactions' | 'discard-part' | 'discard-all') => {
    if (!lastSubmission) return
    if (choice === 'post-as-is') showToast('Posted without changes (demo).')
    else if (choice === 'apply-redactions') showToast('Applied redactions (demo).')
    else if (choice === 'discard-part') showToast('Choose parts to discard (demo).')
    else showToast('Post discarded.')
  }

  return (
    <view className="app-root">
      <view className="topbar">
        <view className="brand">
          <text className="brand-shadow">Sentinel</text>
          <text className="brand-ink">Sentinel</text>
        </view>
        <view className="topbar-controls">
          <text className="muted small">Transport:</text>
          <view
            className="btn btn-ghost"
            bindtap={() => {
              const next: AgentTransportMode = mode === 'mock' ? 'http' : 'mock'
              setMode(next)
              safeStorage.setItem('sentinel.mode', next)
            }}
          >
            <text>{mode === 'mock' ? 'Mock' : 'HTTP'}</text>
          </view>
        </view>
      </view>

      <view className="container">
        <view className="row">
          <view className="col">
            <ShareComposer
              busy={busy}
              score={outputs.length ? score : null}
              onScan={(t, m) => runScan(t, m)}
              onCensor={() => onAction('apply-redactions')}
            />
            <view className="spacer" />
            <ActionBar disabled={!outputs.length || busy} onAction={onAction} />
          </view>

          <view className="col">
            <DangerMeter score={outputs.length ? score : null} />
            <view className="spacer" />
            <ResultsList outputs={outputs} />
            <view className="spacer" />
            <AgentSettings configs={configs} onSave={(next) => registry.update(next)} />
          </view>
        </view>
      </view>

      {busy && (
        <view className="veil">
          <view className="card center">
            <view className="spinner" />
            <text>Scanning with agents…</text>
          </view>
        </view>
      )}

      {toast && (
        <view style={{ position: 'fixed', right: 16, bottom: 16, zIndex: 50 }}>
          <view className="card" style={{ background: '#1a1c25', borderColor: '#2b3b52' }}>
            <text>{toast}</text>
          </view>
        </view>
      )}
    </view>
  )
}

export default App