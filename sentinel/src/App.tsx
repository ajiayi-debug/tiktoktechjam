import { useCallback, useEffect, useMemo, useState } from '@lynx-js/react'

import './App.css'

import UploadZone from './components/UploadZone.js'
import ResultsList from './components/ResultsList.js'
import DangerMeter from './components/DangerMeter.js'
import ActionBar from './components/ActionBar.js'
import AgentSettings from './components/AgentSettings.js'

import type { AgentOutput, AgentTransportMode, Submission } from './types.ts'
import { computeDanger } from './lib/score.js'
import { AgentRegistry } from './agents/AgentRegistry.js'

export function App(props: { onRender?: () => void }) {
  const [mode, setMode] = useState<AgentTransportMode>(
    () => (localStorage.getItem('sentinel.mode') as AgentTransportMode) || 'mock'
  )
  const [busy, setBusy] = useState(false)
  const [outputs, setOutputs] = useState<AgentOutput[]>([])
  const [lastSubmission, setLastSubmission] = useState<Submission | null>(null)

  const registry = useMemo(() => new AgentRegistry(), [])
  const configs = registry.list()
  const score = useMemo(() => computeDanger(outputs), [outputs])

  useEffect(() => {
    console.info('🛡️ Sentinel booted (Lynx)')
  }, [])
  props.onRender?.()

  const toggleMode = useCallback(() => {
    'background only'
    const next = mode === 'mock' ? 'http' : 'mock'
    setMode(next)
    localStorage.setItem('sentinel.mode', next)
  }, [mode])

  const runScan = useCallback(async (text: string, media: Submission['media']) => {
    setBusy(true)
    setOutputs([])
    const sub: Submission = { text, media }
    setLastSubmission(sub)
    try {
      const res = await registry.runAll(sub, mode)
      setOutputs(res)
    } catch (err: any) {
      // eslint-disable-next-line no-alert
      alert(`Scan failed: ${err?.message || err}`)
    } finally {
      setBusy(false)
    }
  }, [mode, registry])

  const onAction = useCallback((
    choice: 'post-as-is' | 'apply-redactions' | 'discard-part' | 'discard-all'
  ) => {
    if (!lastSubmission) return
    // eslint-disable-next-line no-alert
    if (choice === 'post-as-is') alert('✅ Posted without changes (demo). Integrate your publish pipeline here.')
    else if (choice === 'apply-redactions') alert('✂️ Redactions applied (demo). Hook to Agent 3 redact API, then publish.')
    else if (choice === 'discard-part') alert('🗂️ Open a modal to choose parts to discard (demo).')
    else alert('🗑️ Post discarded.')
  }, [lastSubmission])

  return (
    <view className='app-root'>
      {/* Top bar (TikTok-styled brand) */}
      <view className='topbar'>
        <view className='brand'>
          <text className='brand-shadow'>Sentinel</text>
          <text className='brand-ink'>Sentinel</text>
        </view>
        <view className='topbar-controls'>
          <text className='muted small'>Transport:</text>
          <view className='btn btn-ghost' bindtap={toggleMode}>
            <text>{mode === 'mock' ? 'Mock' : 'HTTP'}</text>
          </view>
        </view>
      </view>

      {/* Main content */}
      <view className='container'>
        <view className='row'>
          <view className='col'>
            <UploadZone onSubmit={runScan} />
            <view className='spacer' />
            <ActionBar disabled={!outputs.length || busy} onAction={onAction} />
          </view>

          <view className='col'>
            <DangerMeter score={outputs.length ? score : null} />
            <view className='spacer' />
            <ResultsList outputs={outputs} />
            <view className='spacer' />
            <AgentSettings configs={configs} onSave={(next) => registry.update(next)} />
          </view>
        </view>
      </view>

      {/* Busy overlay */}
      {busy && (
        <view className='veil'>
          <view className='card center'>
            <view className='spinner' />
            <text>Scanning with agents…</text>
          </view>
        </view>
      )}

      {/* Footer note (as a view to satisfy Lynx JSX types) */}
      <view className='footer muted small'>
        <text>Built for Lynx + TypeScript. In HTTP mode, Agent 1 gets masked text + hashed PII anchors.</text>
      </view>
    </view>
  )
}

export default App

