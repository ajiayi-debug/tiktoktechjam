import React, { useMemo, useRef, useState } from 'react'

// TikTok palette
const colors = {
  bg: '#0f0f0f',
  text: '#ffffff',
  accentPink: '#FE2C55',
  accentCyan: '#25F4EE',
  muted: '#1a1a1a',
  border: '#2a2a2a',
}

// ---------- Types ----------
/** @typedef {Object} AgentOutput
 * @property {string} id
 * @property {('text-crawl'|'rev-search'|'censor') } agent
 * @property {string} summary
 * @property {number} risk // 0-100
 * @property {{label: string, url?: string}[]} artifacts // downloadable outputs
 * @property {('queued'|'running'|'done'|'error')} status
 */

/** @typedef {Object} Submission
 * @property {string} id
 * @property {string} text
 * @property {File[]} photos
 * @property {File[]} videos
 */

// ---------- Utilities ----------
const uid = () => Math.random().toString(36).slice(2)

const classNames = (...xs) => xs.filter(Boolean).join(' ')

function humanBytes(n) {
  if (n < 1024) return `${n} B`
  const kb = n / 1024
  if (kb < 1024) return `${kb.toFixed(1)} KB`
  const mb = kb / 1024
  if (mb < 1024) return `${mb.toFixed(1)} MB`
  const gb = mb / 1024
  return `${gb.toFixed(1)} GB`
}

// Pretend-risk scoring: combine agent risks
function combinedRisk(outputs /** @type {AgentOutput[]} */) {
  if (!outputs?.length) return 0
  const valid = outputs.filter(o => Number.isFinite(o.risk))
  if (!valid.length) return 0
  // Weighted: text crawl 40%, rev-search 40%, censor findings 20%
  const weights = { 'text-crawl': 0.4, 'rev-search': 0.4, 'censor': 0.2 }
  let score = 0, wsum = 0
  for (const o of valid) { score += (o.risk || 0) * (weights[o.agent] || 0.33); wsum += (weights[o.agent] || 0.33) }
  return Math.round(score / (wsum || 1))
}

// ---------- Mock Agent Implementations ----------
// In production, replace these with real API calls.
async function callTextCrawlAPI(text) {
  await sleep(1200 + Math.random()*800)
  if (!text?.trim()) throw new Error('Empty text')
  const leakHits = Math.min(5, Math.floor(text.length / 80))
  const risk = Math.min(100, 10 + leakHits * 15 + (/[0-9]{3,}/.test(text) ? 20 : 0) + (/@/.test(text) ? 25 : 0))
  return /** @type {AgentOutput} */({
    id: uid(), agent: 'text-crawl', status: 'done',
    risk,
    summary: leakHits
      ? `Found ${leakHits} potential similarity matches online suggesting exposure risk.`
      : 'No obvious public matches found for this text.',
    artifacts: leakHits
      ? Array.from({length: leakHits}, (_,i)=>({label:`Similar page #${i+1}`, url: '#'}))
      : [],
  })
}

async function callReverseSearchAPI(files /** @type {(File[]) }*/) {
  await sleep(1500 + Math.random()*1200)
  if (!files?.length) throw new Error('No media provided')
  const hits = Math.floor(files.length * (Math.random()*1.2))
  const risk = Math.min(100, 20 + hits*18)
  return /** @type {AgentOutput} */({
    id: uid(), agent: 'rev-search', status: 'done', risk,
    summary: hits ? `Reverse search found ${hits} similar result(s).` : 'No reverse image/video matches found.',
    artifacts: hits ? Array.from({length: hits}, (_,i)=>({label:`Match ${i+1}`, url: '#'})) : []
  })
}

async function callCensorAPI(files /** @type {(File[]) }*/) {
  await sleep(1800 + Math.random()*1200)
  if (!files?.length) throw new Error('No media to censor')
  const redactions = Math.floor(1 + Math.random()*files.length*1.5)
  const risk = Math.min(100, 10 + redactions*12)
  return /** @type {AgentOutput} */({
    id: uid(), agent: 'censor', status: 'done', risk,
    summary: redactions ? `Detected ${redactions} sensitive region(s). Generated censored variants.` : 'No sensitive regions detected.',
    artifacts: files.map((f, i) => ({ label: `Censored ${f.name || `media_${i+1}`}`, url: '#'}))
  })
}

const sleep = (ms) => new Promise(res => setTimeout(res, ms))

// ---------- Components ----------
function Pill({ children, tone='neutral', onClick }) {
  const toneCls = tone === 'danger' ? 'bg-[#2a0c12] text-[#ff6886] border-[#63212c]' : tone === 'good' ? 'bg-[#0e1f21] text-[#7be9f4] border-[#1d3d42]' : 'bg-[#1a1a1a] text-gray-200 border-[#2a2a2a]'
  return (
    <button onClick={onClick} className={classNames('px-3 py-1 rounded-full border text-sm', toneCls)}>
      {children}
    </button>
  )
}

function SectionCard({ title, right, children }) {
  return (
    <div className="rounded-2xl border" style={{borderColor: colors.border, background: colors.muted}}>
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{borderColor: colors.border}}>
        <h3 className="font-semibold" style={{color: colors.text}}>{title}</h3>
        {right}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function dangerBand(score = 0) {
  const s = Math.max(0, Math.min(100, Number(score) || 0))
  if (s < 20)  return { label: 'Low',      color: '#16a34a' } // green
  if (s < 40)  return { label: 'Guarded',  color: '#facc15' } // yellow
  if (s < 60)  return { label: 'Elevated', color: '#fb923c' } // orange
  if (s < 80)  return { label: 'High',     color: '#ef4444' } // red
  return            { label: 'Severe',   color: '#800000' }   // maroon
}

function DangerMeter({ score }) {
  const { label, color } = dangerBand(score)
  const pct = Math.max(0, Math.min(100, score || 0))

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-gray-300">Danger score: </span>
        <span className="font-semibold" style={{ color }}>{label} · {pct}/100</span>
      </div>
      <div
        className="h-3 w-full rounded-full overflow-hidden border"
        style={{ background: '#191919', borderColor: colors.border }}
        aria-label={`Danger score ${pct} of 100 (${label})`}
      >
        <div
          className="h-full transition-all duration-300 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  )
}

function PreviewStrip({ photos, videos, onRemove }) {
  return (
    <div className="flex gap-3 overflow-x-auto py-1">
      {photos.map((f, i) => (
        <div key={`p-${i}`} className="relative shrink-0">
          <img src={URL.createObjectURL(f)} alt={f.name} className="h-24 w-20 object-cover rounded-lg border" style={{borderColor: colors.border}} />
          <button className="absolute -top-2 -right-2 h-6 w-6 rounded-full" style={{background: colors.accentPink}} onClick={()=>onRemove('photo', i)}>×</button>
        </div>
      ))}
      {videos.map((f, i) => (
        <div key={`v-${i}`} className="relative shrink-0">
          <video src={URL.createObjectURL(f)} className="h-24 w-32 object-cover rounded-lg border" style={{borderColor: colors.border}} muted />
          <button className="absolute -top-2 -right-2 h-6 w-6 rounded-full" style={{background: colors.accentPink}} onClick={()=>onRemove('video', i)}>×</button>
        </div>
      ))}
    </div>
  )
}

function AgentStatusList({ outputs, busy }) {
  const rows = [
    { key: 'text-crawl', label: 'Text Web-Crawl (PII exposure)' },
    { key: 'rev-search', label: 'Reverse Image/Video Search' },
    { key: 'censor', label: 'Censor Sensitive Regions' },
  ]
  const byKey = Object.fromEntries(outputs.map(o=>[o.agent, o]))
  return (
    <div className="flex flex-col gap-2">
      {rows.map(r => {
        const o = byKey[r.key]
        const status = o?.status || (busy ? 'running' : 'queued')
        const tone = status === 'done' ? 'good' : status === 'error' ? 'danger' : 'neutral'
        return (
          <div key={r.key} className="flex items-start justify-between gap-3 rounded-xl px-3 py-2 border" style={{borderColor: colors.border, background: '#121212'}}>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-300">{r.label}</span>
                <Pill tone={tone}>{status.toUpperCase()}</Pill>
              </div>
              <div className="text-xs text-gray-400 mt-1 min-h-5">{o?.summary || (status==='running' ? 'Analyzing…' : 'Pending')}</div>
            </div>
            <div className="text-right">
              {Number.isFinite(o?.risk) && <div className="text-sm" style={{color: colors.text}}>Risk: <b>{o.risk}</b></div>}
              {!!o?.artifacts?.length && (
                <div className="mt-1 flex flex-wrap gap-2 justify-end">
                  {o.artifacts.map((a, i) => (
                    <a key={i} href={a.url || '#'} target="_blank" rel="noreferrer" className="text-xs underline" style={{color: colors.accentCyan}}>
                      {a.label}
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function DecisionBar({ onChoose, disabled }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
      <button disabled={disabled} onClick={()=>onChoose('continue')} className={btnCls('Continue without changes')}>Continue without changes</button>
      <button disabled={disabled} onClick={()=>onChoose('censored')} className={btnCls('Upload censored')}>Upload censored media</button>
      <button disabled={disabled} onClick={()=>onChoose('cancel')} className={btnOutlineCls('Do not upload')}>Do not upload</button>
    </div>
  )
}

function btnCls(label) {
  return classNames(
    'w-full px-4 py-3 rounded-xl font-medium',
    'active:scale-[.99] border',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  )
}
function btnPrimary(label) {
  return classNames(
    btnCls(label),
    'border-transparent',
    'text-black',
    'bg-gradient-to-r from-[#25F4EE] to-[#FE2C55]'
  )
}
function btnOutlineCls(label){
  return classNames(
    btnCls(label),
    'border',
    'text-white',
    'bg-transparent',
  )
}

// ---------- Main App ----------
export default function App() {
  const [text, setText] = useState('')
  const [photos, setPhotos] = useState(/** @type {File[]} */([]))
  const [videos, setVideos] = useState(/** @type {File[]} */([]))
  const [busy, setBusy] = useState(false)
  const [outputs, setOutputs] = useState(/** @type {AgentOutput[]} */([]))
  const [decision, setDecision] = useState(/** @type {null|'continue'|'censored'|'cancel'} */(null))

  const photoInput = useRef(null)
  const videoInput = useRef(null)

  const score = useMemo(()=>combinedRisk(outputs), [outputs])

  function onRemove(kind, idx) {
    if (kind === 'photo') setPhotos(ps => ps.filter((_,i)=>i!==idx))
    if (kind === 'video') setVideos(ps => ps.filter((_,i)=>i!==idx))
  }

  function onFiles(kind, fileList) {
    const arr = Array.from(fileList || [])
    if (kind === 'photo') setPhotos(p => [...p, ...arr])
    if (kind === 'video') setVideos(p => [...p, ...arr])
  }

  async function runAgents() {
  setBusy(true)
  setOutputs([])
  setDecision(null)

  try {
    const jobs = []
    const media = [...photos, ...videos]

    if (text.trim()) {
      jobs.push({ key: 'text-crawl', promise: callTextCrawlAPI(text) })
    }
    if (media.length) {
      jobs.push({ key: 'rev-search', promise: callReverseSearchAPI(media) })
      jobs.push({ key: 'censor',     promise: callCensorAPI(media) })
    }

    const results = await Promise.allSettled(jobs.map(j => j.promise))

    const outs = results.map((res, i) => {
      const key = jobs[i].key
      if (res.status === 'fulfilled') return res.value
      return {
        id: uid(),
        agent: key,                       // ✅ preserve the agent that failed
        status: 'error',
        summary: res.reason?.message || 'Agent error',
        risk: 0,
        artifacts: [],
      }
    })

    setOutputs(outs)
  } finally {
    setBusy(false)
  }
}


  function choose(dec) {
    setDecision(dec)
    // In production, route to your backend upload pipeline here
    // e.g., POST /api/upload { decision, text, photos, videos, selectedArtifacts }
    alert(`Decision: ${dec}. (Hook this to your backend upload flow.)`)
  }

  return (
  // Full-height page background
  <div style={{ minHeight: '100vh', background: colors.bg }}>
    {/* Centered, scrollable column */}
    <div style={{ width: '100%', maxWidth: 'clamp(360px, 92vw, 900px)', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header (sticky within the centered column) */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          padding: '12px 16px',
          borderBottom: `1px solid ${colors.border}`,
          background: colors.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              height: 32,
              width: 32,
              borderRadius: 8,
              background: `linear-gradient(135deg, ${colors.accentCyan}, ${colors.accentPink})`
            }}
          />
          <div style={{ fontWeight: 600, color: colors.text }}>Privacy Guard</div>
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af' }}>Mobile-first</div>
      </div>

      {/* Content */}
      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Input Section */}
        <SectionCard
          title="Your content"
          right={<span className="text-xs text-gray-400">Text</span>}
        >
          <div className="flex flex-col gap-3">
            <textarea
              placeholder="Type your caption, message, or any text…"
              value={text}
              onChange={e=>setText(e.target.value)}
              rows={4}
              className="w-full rounded-xl p-3 text-sm border focus:outline-none"
              style={{background: '#121212', color: colors.text, borderColor: colors.border}}
            />

            <div className="grid grid-cols-2 gap-3">
              {/* Photos */}
                <div className="text-xs text-gray-400 mb-1">Photos</div>
                <div className="flex items-center gap-2">
                  {/* Hidden native input */}
                  <input
                    ref={photoInput}
                    id="photo-input"
                    type="file"
                    accept="image/*"
                    multiple
                    capture="environment"
                    onChange={(e) => onFiles('photo', e.target.files)}
                    style={{ display: 'none' }}
                    aria-hidden="true"
                  />
                  {/* Custom trigger */}
                  <button
                    onClick={() => photoInput.current?.click()}
                    className={btnOutlineCls('Upload Photos')}
                    aria-controls="photo-input"
                  >
                    Upload
                  </button>
                  <span className="text-xs text-gray-400">
                    {photos.length ? `${photos.length} selected` : 'No files selected'}
                  </span>
                </div>
                </div>

              {/* Videos */}
                <div className="text-xs text-gray-400 mb-1">Videos</div>
                <div className="flex items-center gap-2">
                  {/* Hidden native input */}
                  <input
                    ref={videoInput}
                    id="video-input"
                    type="file"
                    accept="video/*"
                    multiple
                    capture
                    onChange={(e) => onFiles('video', e.target.files)}
                    style={{ display: 'none' }}
                    aria-hidden="true"
                  />
                  {/* Custom trigger */}
                  <button
                    onClick={() => videoInput.current?.click()}
                    className={btnOutlineCls('Upload Videos')}
                    aria-controls="video-input"
                  >
                    Upload
                  </button>
                  <span className="text-xs text-gray-400">
                    {videos.length ? `${videos.length} selected` : 'No files selected'}
                  </span>
                </div>
                </div>


            {(photos.length>0 || videos.length>0) && (
              <PreviewStrip photos={photos} videos={videos} onRemove={onRemove} />
            )}

            <div className="text-xs text-gray-500">
              {photos.length>0 && <span>{photos.length} photo(s), </span>}
              {videos.length>0 && <span>{videos.length} video(s), </span>}
              {(photos.length>0 || videos.length>0) && (
                <span>
                  total size ≈ {humanBytes([...photos, ...videos].reduce((s,f)=>s+(f.size||0),0))}
                </span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={runAgents}
                disabled={busy || (!text.trim() && photos.length===0 && videos.length===0)}
                className={btnPrimary('Analyze')}
              >
                {busy ? 'Analyzing…' : 'Analyze'}
              </button>
              <button
                onClick={()=>{
                  setText(''); setPhotos([]); setVideos([]); setOutputs([]); setDecision(null)
                }}
                className={btnOutlineCls('Reset')}
              >
                Reset
              </button>
            </div>
        </SectionCard>

        {/* Results */}
        <SectionCard
          title="Search Results"
          right={<span className="text-xs text-gray-400">Web • Search • Censor</span>}
        >
          <AgentStatusList outputs={outputs} busy={busy} />
          {/* Risk Section */}
          <SectionCard
            title="Risk level"
            right={<span className="text-xs text-gray-400"></span>}
          >
            <DangerMeter score={score} />
          </SectionCard>
        </SectionCard>

        {/* Decision */}
        <SectionCard
          title="What would you like to do?"
          right={<span className="text-xs text-gray-400">Choose an action</span>}
        >
          <DecisionBar onChoose={choose} disabled={busy || outputs.length===0} />
          {decision && (
            <div className="mt-3 text-sm" style={{color: colors.text}}>
              Selected: <b>{decision}</b>
            </div>
          )}
        </SectionCard>

        {/* Dev Notes */}
        <div className="text-[11px] text-gray-500 leading-relaxed">
          <p>
            Note: This demo uses mock agents. Replace <code>callTextCrawlAPI</code>, <code>callReverseSearchAPI</code>, and <code>callCensorAPI</code> with your real endpoints.
            Use presigned URLs or multipart uploads for large files. For iOS Safari, prefer <code>capture</code> on inputs.
          </p>
        </div>
      </div>
    </div>
  </div>
)
}
