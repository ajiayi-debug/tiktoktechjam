// import React, { useMemo, useRef, useState } from 'react'

// // TikTok palette
// const colors = {
//   bg: '#0f0f0f',
//   text: '#ffffff',
//   accentPink: '#FE2C55',
//   accentCyan: '#25F4EE',
//   muted: '#1a1a1a',
//   border: '#2a2a2a',
// }

// // ---------- Types ----------
// /** @typedef {Object} AgentOutput
//  * @property {string} id
//  * @property {('text-crawl'|'rev-search'|'censor') } agent
//  * @property {string} summary
//  * @property {number} risk // 0-100
//  * @property {{label: string, url?: string}[]} artifacts // downloadable outputs
//  * @property {('queued'|'running'|'done'|'error')} status
//  */

// /** @typedef {Object} Submission
//  * @property {string} id
//  * @property {string} text
//  * @property {File[]} photos
//  * @property {File[]} videos
//  */

// // ---------- Utilities ----------
// const uid = () => Math.random().toString(36).slice(2)

// const classNames = (...xs) => xs.filter(Boolean).join(' ')

// function humanBytes(n) {
//   if (n < 1024) return `${n} B`
//   const kb = n / 1024
//   if (kb < 1024) return `${kb.toFixed(1)} KB`
//   const mb = kb / 1024
//   if (mb < 1024) return `${mb.toFixed(1)} MB`
//   const gb = mb / 1024
//   return `${gb.toFixed(1)} GB`
// }

// // Pretend-risk scoring: combine agent risks
// function combinedRisk(outputs /** @type {AgentOutput[]} */) {
//   if (!outputs?.length) return 0
//   const valid = outputs.filter(o => Number.isFinite(o.risk))
//   if (!valid.length) return 0
//   // Weighted: text crawl 40%, rev-search 40%, censor findings 20%
//   const weights = { 'text-crawl': 0.4, 'rev-search': 0.4, 'censor': 0.2 }
//   let score = 0, wsum = 0
//   for (const o of valid) { score += (o.risk || 0) * (weights[o.agent] || 0.33); wsum += (weights[o.agent] || 0.33) }
//   return Math.round(score / (wsum || 1))
// }

// // ---------- Mock Agent Implementations ----------
// // In production, replace these with real API calls.
// async function callTextCrawlAPI(text) {
//   await sleep(1200 + Math.random()*800)
//   if (!text?.trim()) throw new Error('Empty text')
//   const leakHits = Math.min(5, Math.floor(text.length / 80))
//   const risk = Math.min(100, 10 + leakHits * 15 + (/[0-9]{3,}/.test(text) ? 20 : 0) + (/@/.test(text) ? 25 : 0))
//   return /** @type {AgentOutput} */({
//     id: uid(), agent: 'text-crawl', status: 'done',
//     risk,
//     summary: leakHits
//       ? `Found ${leakHits} potential similarity matches online suggesting exposure risk.`
//       : 'No obvious public matches found for this text.',
//     artifacts: leakHits
//       ? Array.from({length: leakHits}, (_,i)=>({label:`Similar page #${i+1}`, url: '#'}))
//       : [],
//   })
// }

// async function callReverseSearchAPI(files /** @type {(File[]) }*/) {
//   await sleep(1500 + Math.random()*1200)
//   if (!files?.length) throw new Error('No media provided')
//   const hits = Math.floor(files.length * (Math.random()*1.2))
//   const risk = Math.min(100, 20 + hits*18)
//   return /** @type {AgentOutput} */({
//     id: uid(), agent: 'rev-search', status: 'done', risk,
//     summary: hits ? `Reverse search found ${hits} similar result(s).` : 'No reverse image/video matches found.',
//     artifacts: hits ? Array.from({length: hits}, (_,i)=>({label:`Match ${i+1}`, url: '#'})) : []
//   })
// }

// async function callCensorAPI(files /** @type {(File[]) }*/) {
//   await sleep(1800 + Math.random()*1200)
//   if (!files?.length) throw new Error('No media to censor')
//   const redactions = Math.floor(1 + Math.random()*files.length*1.5)
//   const risk = Math.min(100, 10 + redactions*12)
//   return /** @type {AgentOutput} */({
//     id: uid(), agent: 'censor', status: 'done', risk,
//     summary: redactions ? `Detected ${redactions} sensitive region(s). Generated censored variants.` : 'No sensitive regions detected.',
//     artifacts: files.map((f, i) => ({ label: `Censored ${f.name || `media_${i+1}`}`, url: '#'}))
//   })
// }

// const sleep = (ms) => new Promise(res => setTimeout(res, ms))

// // ---------- Components ----------
// function Pill({ children, tone='neutral', onClick }) {
//   const toneCls = tone === 'danger' ? 'bg-[#2a0c12] text-[#ff6886] border-[#63212c]' : tone === 'good' ? 'bg-[#0e1f21] text-[#7be9f4] border-[#1d3d42]' : 'bg-[#1a1a1a] text-gray-200 border-[#2a2a2a]'
//   return (
//     <button onClick={onClick} className={classNames('px-3 py-1 rounded-full border text-sm', toneCls)}>
//       {children}
//     </button>
//   )
// }

// function SectionCard({ title, right, children }) {
//   return (
//     <div className="rounded-2xl border" style={{borderColor: colors.border, background: colors.muted}}>
//       <div className="flex items-center justify-between gap-3 px-4 py-3 border-b" style={{borderColor: colors.border}}>
//         <h3 className="font-semibold" style={{color: colors.text}}>{title}</h3>
//         {right}
//       </div>
//       <div className="p-4">{children}</div>
//     </div>
//   )
// }

// function dangerBand(score = 0) {
//   const s = Math.max(0, Math.min(100, Number(score) || 0))
//   if (s < 20)  return { label: 'Low',      color: '#16a34a' } // green
//   if (s < 40)  return { label: 'Guarded',  color: '#facc15' } // yellow
//   if (s < 60)  return { label: 'Elevated', color: '#fb923c' } // orange
//   if (s < 80)  return { label: 'High',     color: '#ef4444' } // red
//   return            { label: 'Severe',   color: '#800000' }   // maroon
// }

// function DangerMeter({ score }) {
//   const { label, color } = dangerBand(score)
//   const pct = Math.max(0, Math.min(100, score || 0))

//   return (
//     <div className="w-full">
//       <div className="flex items-center justify-between mb-2">
//         <span className="text-sm text-gray-300">Danger score: </span>
//         <span className="font-semibold" style={{ color }}>{label} · {pct}/100</span>
//       </div>
//       <div
//         className="h-3 w-full rounded-full overflow-hidden border"
//         style={{ background: '#191919', borderColor: colors.border }}
//         aria-label={`Danger score ${pct} of 100 (${label})`}
//       >
//         <div
//           className="h-full transition-all duration-300 ease-out"
//           style={{ width: `${pct}%`, background: color }}
//         />
//       </div>
//     </div>
//   )
// }

// function PreviewStrip({ photos, videos, onRemove }) {
//   return (
//     <div className="flex gap-3 overflow-x-auto py-1">
//       {photos.map((f, i) => (
//         <div key={`p-${i}`} className="relative shrink-0">
//           <img src={URL.createObjectURL(f)} alt={f.name} className="h-24 w-20 object-cover rounded-lg border" style={{borderColor: colors.border}} />
//           <button className="absolute -top-2 -right-2 h-6 w-6 rounded-full" style={{background: colors.accentPink}} onClick={()=>onRemove('photo', i)}>×</button>
//         </div>
//       ))}
//       {videos.map((f, i) => (
//         <div key={`v-${i}`} className="relative shrink-0">
//           <video src={URL.createObjectURL(f)} className="h-24 w-32 object-cover rounded-lg border" style={{borderColor: colors.border}} muted />
//           <button className="absolute -top-2 -right-2 h-6 w-6 rounded-full" style={{background: colors.accentPink}} onClick={()=>onRemove('video', i)}>×</button>
//         </div>
//       ))}
//     </div>
//   )
// }

// function AgentStatusList({ outputs, busy }) {
//   const rows = [
//     { key: 'text-crawl', label: 'Text Web-Crawl (PII exposure)' },
//     { key: 'rev-search', label: 'Reverse Image/Video Search' },
//     { key: 'censor', label: 'Censor Sensitive Regions' },
//   ]
//   const byKey = Object.fromEntries(outputs.map(o=>[o.agent, o]))
//   return (
//     <div className="flex flex-col gap-2">
//       {rows.map(r => {
//         const o = byKey[r.key]
//         const status = o?.status || (busy ? 'running' : 'queued')
//         const tone = status === 'done' ? 'good' : status === 'error' ? 'danger' : 'neutral'
//         return (
//           <div key={r.key} className="flex items-start justify-between gap-3 rounded-xl px-3 py-2 border" style={{borderColor: colors.border, background: '#121212'}}>
//             <div className="flex-1">
//               <div className="flex items-center gap-2">
//                 <span className="text-sm text-gray-300">{r.label}</span>
//                 <Pill tone={tone}>{status.toUpperCase()}</Pill>
//               </div>
//               <div className="text-xs text-gray-400 mt-1 min-h-5">{o?.summary || (status==='running' ? 'Analyzing…' : 'Pending')}</div>
//             </div>
//             <div className="text-right">
//               {Number.isFinite(o?.risk) && <div className="text-sm" style={{color: colors.text}}>Risk: <b>{o.risk}</b></div>}
//               {!!o?.artifacts?.length && (
//                 <div className="mt-1 flex flex-wrap gap-2 justify-end">
//                   {o.artifacts.map((a, i) => (
//                     <a key={i} href={a.url || '#'} target="_blank" rel="noreferrer" className="text-xs underline" style={{color: colors.accentCyan}}>
//                       {a.label}
//                     </a>
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         )
//       })}
//     </div>
//   )
// }

// function DecisionBar({ onChoose, disabled }) {
//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
//       <button disabled={disabled} onClick={()=>onChoose('continue')} className={btnCls('Continue without changes')}>Continue without changes</button>
//       <button disabled={disabled} onClick={()=>onChoose('censored')} className={btnCls('Upload censored')}>Upload censored media</button>
//       <button disabled={disabled} onClick={()=>onChoose('cancel')} className={btnOutlineCls('Do not upload')}>Do not upload</button>
//     </div>
//   )
// }

// function btnCls(label) {
//   return classNames(
//     'w-full px-4 py-3 rounded-xl font-medium',
//     'active:scale-[.99] border',
//     'disabled:opacity-50 disabled:cursor-not-allowed',
//   )
// }
// function btnPrimary(label) {
//   return classNames(
//     btnCls(label),
//     'border-transparent',
//     'text-black',
//     'bg-gradient-to-r from-[#25F4EE] to-[#FE2C55]'
//   )
// }
// function btnOutlineCls(label){
//   return classNames(
//     btnCls(label),
//     'border',
//     'text-white',
//     'bg-transparent',
//   )
// }

// // ---------- Main App ----------
// export default function App() {
//   const [text, setText] = useState('')
//   const [photos, setPhotos] = useState(/** @type {File[]} */([]))
//   const [videos, setVideos] = useState(/** @type {File[]} */([]))
//   const [busy, setBusy] = useState(false)
//   const [outputs, setOutputs] = useState(/** @type {AgentOutput[]} */([]))
//   const [decision, setDecision] = useState(/** @type {null|'continue'|'censored'|'cancel'} */(null))

//   const photoInput = useRef(null)
//   const videoInput = useRef(null)

//   const score = useMemo(()=>combinedRisk(outputs), [outputs])

//   function onRemove(kind, idx) {
//     if (kind === 'photo') setPhotos(ps => ps.filter((_,i)=>i!==idx))
//     if (kind === 'video') setVideos(ps => ps.filter((_,i)=>i!==idx))
//   }

//   function onFiles(kind, fileList) {
//     const arr = Array.from(fileList || [])
//     if (kind === 'photo') setPhotos(p => [...p, ...arr])
//     if (kind === 'video') setVideos(p => [...p, ...arr])
//   }

//   async function runAgents() {
//   setBusy(true)
//   setOutputs([])
//   setDecision(null)

//   try {
//     const jobs = []
//     const media = [...photos, ...videos]

//     if (text.trim()) {
//       jobs.push({ key: 'text-crawl', promise: callTextCrawlAPI(text) })
//     }
//     if (media.length) {
//       jobs.push({ key: 'rev-search', promise: callReverseSearchAPI(media) })
//       jobs.push({ key: 'censor',     promise: callCensorAPI(media) })
//     }

//     const results = await Promise.allSettled(jobs.map(j => j.promise))

//     const outs = results.map((res, i) => {
//       const key = jobs[i].key
//       if (res.status === 'fulfilled') return res.value
//       return {
//         id: uid(),
//         agent: key,                       // ✅ preserve the agent that failed
//         status: 'error',
//         summary: res.reason?.message || 'Agent error',
//         risk: 0,
//         artifacts: [],
//       }
//     })

//     setOutputs(outs)
//   } finally {
//     setBusy(false)
//   }
// }


//   function choose(dec) {
//     setDecision(dec)
//     // In production, route to your backend upload pipeline here
//     // e.g., POST /api/upload { decision, text, photos, videos, selectedArtifacts }
//     alert(`Decision: ${dec}. (Hook this to your backend upload flow.)`)
//   }

//   return (
//   // Full-height page background
//   <div style={{ minHeight: '100vh', background: colors.bg }}>
//     {/* Centered, scrollable column */}
//     <div style={{ width: '100%', maxWidth: 'clamp(360px, 92vw, 900px)', margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
      
//       {/* Header (sticky within the centered column) */}
//       <div
//         style={{
//           position: 'sticky',
//           top: 0,
//           zIndex: 10,
//           padding: '12px 16px',
//           borderBottom: `1px solid ${colors.border}`,
//           background: colors.bg,
//           display: 'flex',
//           alignItems: 'center',
//           justifyContent: 'space-between'
//         }}
//       >
//         <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
//           <div
//             style={{
//               height: 32,
//               width: 32,
//               borderRadius: 8,
//               background: `linear-gradient(135deg, ${colors.accentCyan}, ${colors.accentPink})`
//             }}
//           />
//           <div style={{ fontWeight: 600, color: colors.text }}>Privacy Guard</div>
//         </div>
//         <div style={{ fontSize: 12, color: '#9ca3af' }}>Mobile-first</div>
//       </div>

//       {/* Content */}
//       <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 16 }}>
//         {/* Input Section */}
//         <SectionCard
//           title="Your content"
//           right={<span className="text-xs text-gray-400">Text</span>}
//         >
//           <div className="flex flex-col gap-3">
//             <textarea
//               placeholder="Type your caption, message, or any text…"
//               value={text}
//               onChange={e=>setText(e.target.value)}
//               rows={4}
//               className="w-full rounded-xl p-3 text-sm border focus:outline-none"
//               style={{background: '#121212', color: colors.text, borderColor: colors.border}}
//             />

//             <div className="grid grid-cols-2 gap-3">
//               {/* Photos */}
//                 <div className="text-xs text-gray-400 mb-1">Photos</div>
//                 <div className="flex items-center gap-2">
//                   {/* Hidden native input */}
//                   <input
//                     ref={photoInput}
//                     id="photo-input"
//                     type="file"
//                     accept="image/*"
//                     multiple
//                     capture="environment"
//                     onChange={(e) => onFiles('photo', e.target.files)}
//                     style={{ display: 'none' }}
//                     aria-hidden="true"
//                   />
//                   {/* Custom trigger */}
//                   <button
//                     onClick={() => photoInput.current?.click()}
//                     className={btnOutlineCls('Upload Photos')}
//                     aria-controls="photo-input"
//                   >
//                     Upload
//                   </button>
//                   <span className="text-xs text-gray-400">
//                     {photos.length ? `${photos.length} selected` : 'No files selected'}
//                   </span>
//                 </div>
//                 </div>

//               {/* Videos */}
//                 <div className="text-xs text-gray-400 mb-1">Videos</div>
//                 <div className="flex items-center gap-2">
//                   {/* Hidden native input */}
//                   <input
//                     ref={videoInput}
//                     id="video-input"
//                     type="file"
//                     accept="video/*"
//                     multiple
//                     capture
//                     onChange={(e) => onFiles('video', e.target.files)}
//                     style={{ display: 'none' }}
//                     aria-hidden="true"
//                   />
//                   {/* Custom trigger */}
//                   <button
//                     onClick={() => videoInput.current?.click()}
//                     className={btnOutlineCls('Upload Videos')}
//                     aria-controls="video-input"
//                   >
//                     Upload
//                   </button>
//                   <span className="text-xs text-gray-400">
//                     {videos.length ? `${videos.length} selected` : 'No files selected'}
//                   </span>
//                 </div>
//                 </div>


//             {(photos.length>0 || videos.length>0) && (
//               <PreviewStrip photos={photos} videos={videos} onRemove={onRemove} />
//             )}

//             <div className="text-xs text-gray-500">
//               {photos.length>0 && <span>{photos.length} photo(s), </span>}
//               {videos.length>0 && <span>{videos.length} video(s), </span>}
//               {(photos.length>0 || videos.length>0) && (
//                 <span>
//                   total size ≈ {humanBytes([...photos, ...videos].reduce((s,f)=>s+(f.size||0),0))}
//                 </span>
//               )}
//             </div>

//             <div className="flex gap-2">
//               <button
//                 onClick={runAgents}
//                 disabled={busy || (!text.trim() && photos.length===0 && videos.length===0)}
//                 className={btnPrimary('Analyze')}
//               >
//                 {busy ? 'Analyzing…' : 'Analyze'}
//               </button>
//               <button
//                 onClick={()=>{
//                   setText(''); setPhotos([]); setVideos([]); setOutputs([]); setDecision(null)
//                 }}
//                 className={btnOutlineCls('Reset')}
//               >
//                 Reset
//               </button>
//             </div>
//         </SectionCard>

//         {/* Results */}
//         <SectionCard
//           title="Search Results"
//           right={<span className="text-xs text-gray-400">Web • Search • Censor</span>}
//         >
//           <AgentStatusList outputs={outputs} busy={busy} />
//           {/* Risk Section */}
//           <SectionCard
//             title="Risk level"
//             right={<span className="text-xs text-gray-400"></span>}
//           >
//             <DangerMeter score={score} />
//           </SectionCard>
//         </SectionCard>

//         {/* Decision */}
//         <SectionCard
//           title="What would you like to do?"
//           right={<span className="text-xs text-gray-400">Choose an action</span>}
//         >
//           <DecisionBar onChoose={choose} disabled={busy || outputs.length===0} />
//           {decision && (
//             <div className="mt-3 text-sm" style={{color: colors.text}}>
//               Selected: <b>{decision}</b>
//             </div>
//           )}
//         </SectionCard>

//         {/* Dev Notes */}
//         <div className="text-[11px] text-gray-500 leading-relaxed">
//           <p>
//             Note: This demo uses mock agents. Replace <code>callTextCrawlAPI</code>, <code>callReverseSearchAPI</code>, and <code>callCensorAPI</code> with your real endpoints.
//             Use presigned URLs or multipart uploads for large files. For iOS Safari, prefer <code>capture</code> on inputs.
//           </p>
//         </div>
//       </div>
//     </div>
//   </div>
// )
// }


import React, { useMemo, useRef, useState } from 'react'

// App palette, for the modern, dark UI
const colors = {
  bg: '#111827', // Dark Slate Blue
  bgSecondary: '#1f2937', // Lighter Slate
  text: '#f9fafb', // Off-white
  textMuted: '#9ca3af', // Gray
  border: '#374151',
  accentRed: '#ef4444',
  riskBg: '#fee2e2',
  accentGradient: 'linear-gradient(to right, #FE2C55, #25F4EE)',
}

// ---------- Types (Updated) ----------
/** @typedef {Object} AgentOutput
 * @property {string} id
 * @property {('text-crawl'|'rev-search'|'censor') } agent
 * @property {string} summary
 * @property {number} risk // 0-100
 * @property {{label: string, url?: string}[]} artifacts // downloadable outputs
 * @property {('queued'|'running'|'done'|'error')} status
 */

/** @typedef {Object} Submission
 * @property {string} username
 * @property {string} text
 * @property {File | null} photo
 * @property {File | null} video
 */


// ---------- Utilities (Unchanged) ----------
const uid = () => Math.random().toString(36).slice(2)
const classNames = (...xs) => xs.filter(Boolean).join(' ')
const sleep = (ms) => new Promise(res => setTimeout(res, ms))

function combinedRisk(outputs /** @type {AgentOutput[]} */) {
  if (!outputs?.length) return 0
  const valid = outputs.filter(o => Number.isFinite(o.risk))
  if (!valid.length) return 0
  const weights = { 'text-crawl': 0.4, 'rev-search': 0.4, 'censor': 0.2 }
  let score = 0, wsum = 0;
  for (const o of valid) { score += (o.risk || 0) * (weights[o.agent] || 0.33); wsum += (weights[o.agent] || 0.33); }
  return Math.round(score / (wsum || 1))
}


// ---------- Mock Agent Implementations (Updated) ----------
async function callTextCrawlAPI(text) {
  await sleep(1200 + Math.random()*800)
  if (!text?.trim()) return null;
  const leakHits = Math.min(5, Math.floor(text.length / 80))
  const risk = Math.min(100, 10 + leakHits * 15 + (/[0-9]{3,}/.test(text) ? 20 : 0) + (/@/.test(text) ? 25 : 0))
  return /** @type {AgentOutput} */({
    id: uid(), agent: 'text-crawl', status: 'done',
    risk, summary: leakHits ? `Found ${leakHits} potential PII matches in text.` : 'No obvious public matches found.', artifacts: [],
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
    summary: redactions ? `Detected ${redactions} sensitive region(s).` : 'No sensitive regions detected.', artifacts: []
  })
}


// ---------- UI Components ----------

function ListItem({ icon, title, value, hasArrow = true, onClick }) {
    return (
        <div onClick={onClick} className={classNames("flex items-center justify-between py-3 border-b", onClick && 'cursor-pointer')} style={{borderColor: colors.border}}>
            <div className="flex items-center gap-3">
                {icon}
                <span className="font-medium" style={{color: colors.text}}>{title}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm" style={{color: colors.textMuted}}>{value}</span>
                {hasArrow && <ChevronRightIcon />}
            </div>
        </div>
    )
}

function PrivacyRiskWarning({ score }) {
    const riskLevel = score > 65 ? 'High' : score > 35 ? 'Medium' : 'Low';
    const riskColor = score > 65 ? colors.accentRed : score > 35 ? '#f59e0b' : '#10b981';

    if (score < 20) return (
         <div className="rounded-lg p-3 my-4 border" style={{borderColor: colors.border, backgroundColor: colors.bgSecondary}}>
            <div className="flex items-center gap-3">
                <ShieldCheckIcon color="#10b981" />
                <div>
                    <h3 className="font-bold" style={{color: '#10b981'}}>Low Privacy Risk</h3>
                    <p className="text-sm" style={{color: colors.textMuted}}>Our analysis found no major privacy concerns.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="rounded-lg p-3 my-4 border" style={{backgroundColor: colors.bgSecondary, borderColor: riskColor}}>
            <div className="flex items-center gap-2 mb-1">
                <AlertTriangleIcon color={riskColor} />
                <h3 className="font-bold" style={{color: riskColor}}>{riskLevel} Privacy Risk: {score}%</h3>
            </div>
            <p className="text-sm" style={{color: colors.textMuted, marginLeft: '32px'}}>
                Sensitive information may be exposed. Review the agent findings below before posting.
            </p>
        </div>
    )
}

const PostButton = ({ onClick, children, disabled=false }) => (
    <button onClick={onClick} disabled={disabled} className="w-full py-3 rounded-lg font-semibold text-center disabled:opacity-50 transition-colors" style={{backgroundColor: colors.accentRed, color: '#FFF'}}>
        {children}
    </button>
)

function AgentResult({ output }) {
    const agentNames = {'text-crawl': 'Text Analysis', 'rev-search': 'Reverse Media Search', 'censor': 'Sensitive Content Detection' };
    const riskColor = output.risk > 65 ? colors.accentRed : output.risk > 35 ? '#f59e0b' : colors.textMuted;
    
    return (
        <div className="py-2">
            <div className="flex justify-between items-center">
                <p className="font-semibold text-sm">{agentNames[output.agent] || 'Analysis'}</p>
                <p className="text-sm font-medium" style={{color: riskColor}}>{output.risk}% Risk</p>
            </div>
            <p className="text-sm mt-1" style={{color: colors.textMuted}}>{output.summary}</p>
            {output.artifacts.length > 0 && (
                <div className="mt-2 flex gap-2">
                    {output.artifacts.map(artifact => (
                        <a key={artifact.label} href={artifact.url} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded" style={{backgroundColor: colors.border, color: colors.textMuted}}>
                           {artifact.label} <LinkIcon width={12} height={12} />
                        </a>
                    ))}
                </div>
            )}
        </div>
    )
}

// ---------- Main App Screens ----------

export default function App() {
  const [view, setView] = useState('upload'); // 'upload' or 'post'
  const [submission, setSubmission] = useState(/** @type {Submission} */({ username: '', text: '', photo: null, video: null }));
  const [outputs, setOutputs] = useState(/** @type {AgentOutput[]} */([]));
  const [isProcessing, setIsProcessing] = useState(false);

  const score = useMemo(() => combinedRisk(outputs), [outputs]);
  const mediaFile = submission.photo || submission.video;

  async function runAnalysisAndProceed() {
    setIsProcessing(true);
    setOutputs([]);
    
    const media = [mediaFile].filter(Boolean);
    const fullText = `${submission.username} ${submission.text}`;

    // MOCK: Set up placeholders for immediate UI feedback
    const placeholders = [];
    if (fullText.trim()) placeholders.push({ id: uid(), agent: 'text-crawl', status: 'running', summary: 'Scanning for PII and sensitive data...', risk: 0, artifacts: []});
    if (media.length) {
        placeholders.push({ id: uid(), agent: 'rev-search', status: 'running', summary: 'Searching for similar images/videos online...', risk: 0, artifacts: [] });
        placeholders.push({ id: uid(), agent: 'censor', status: 'running', summary: 'Detecting redactable content...', risk: 0, artifacts: [] });
    }
    setOutputs(placeholders);
    setView('post');
    await sleep(500); // give time for screen transition

    const jobs = [];
    if (fullText.trim()) jobs.push(callTextCrawlAPI(fullText));
    if (media.length > 0) {
      jobs.push(callReverseSearchAPI(media));
      jobs.push(callCensorAPI(media));
    }

    const results = await Promise.allSettled(jobs);
    const validResults = results.filter(res => res.status === 'fulfilled' && res.value).map(res => res.value);
    
    setOutputs(validResults);
    setIsProcessing(false);
  }

  function handleReset() {
      setSubmission({ username: '', text: '', photo: null, video: null });
      setOutputs([]);
      setView('upload');
  }

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: colors.bg, color: colors.text }}>
      {view === 'upload' ? (
        <UploadScreen submission={submission} setSubmission={setSubmission} onNext={runAnalysisAndProceed} isProcessing={isProcessing} />
      ) : (
        <PostScreen submission={submission} score={score} outputs={outputs} onPost={() => alert('Posted!')} onBack={handleReset} mediaFile={mediaFile} />
      )}
    </div>
  )
}


function UploadScreen({ submission, setSubmission, onNext, isProcessing }) {
    const fileInputRef = useRef(null);
    const [isDragging, setIsDragging] = useState(false);
    const mediaFile = submission.photo || submission.video;
    
    const handleFileChange = (files) => {
        const file = files?.[0];
        if (!file) return;
        if (file.type.startsWith('image/')) {
            setSubmission(s => ({...s, photo: file, video: null}));
        } else if (file.type.startsWith('video/')) {
            setSubmission(s => ({...s, video: file, photo: null}));
        }
    }

    const handleDragEvents = (e, dragging) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(dragging);
    }

    const handleDrop = (e) => {
        handleDragEvents(e, false);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFileChange(e.dataTransfer.files);
            e.dataTransfer.clearData();
        }
    }
    
    const isReadyForAnalysis = mediaFile && submission.username.trim();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
            <div className="w-1/2 max-w-2xl text-center">
                <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">Post with Confidence.</h1>
                <p className="text-lg mb-8 max-w-xl mx-auto" style={{color: colors.textMuted}}>
                    Enter your content and upload your media. Our AI guard will scan for privacy risks before you share.
                </p>

                {/* Input Fields */}
                <div className="w-full max-w-lg mx-auto space-y-4 text-left">
                     <input
                        type="text"
                        placeholder="Username"
                        value={submission.username}
                        onChange={(e) => setSubmission(s => ({...s, username: e.target.value}))}
                        className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-colors"
                        style={{backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.text}}
                    />
                     <textarea
                        placeholder="Add a description..."
                        value={submission.text}
                        onChange={(e) => setSubmission(s => ({...s, text: e.target.value}))}
                        rows={3}
                        className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-cyan-400 focus:border-cyan-400 outline-none transition-colors"
                        style={{backgroundColor: colors.bgSecondary, borderColor: colors.border, color: colors.text}}
                    />
                </div>

                {/* Uploader */}
                <div className="w-full max-w-lg mx-auto mt-6">
                    <div className="p-4 rounded-xl" style={{backgroundColor: colors.bgSecondary}}>
                    {mediaFile ? (
                        <div className="w-full flex flex-col items-center">
                            <div className="w-full relative rounded-lg overflow-hidden border mb-4" style={{borderColor: colors.border}}>
                                <img src={URL.createObjectURL(mediaFile)} alt="Preview" className="w-full max-h-[40vh] object-contain" />
                                <button onClick={() => setSubmission(s => ({...s, photo: null, video: null}))} className="absolute top-2 right-2 p-1 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-75 transition-colors">
                                    <CloseIcon />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div
                            onDragEnter={(e) => handleDragEvents(e, true)}
                            onDragLeave={(e) => handleDragEvents(e, false)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={classNames("w-full h-48 flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed cursor-pointer transition-colors", isDragging && 'border-cyan-400')}
                            style={{borderColor: isDragging ? '#25F4EE' : colors.border}}
                        >
                            <UploadCloudIcon />
                            <p className="font-semibold">Drag & Drop or Click to Upload</p>
                            <p className="text-sm" style={{color: colors.textMuted}}>Supports Images and Videos</p>
                        </div>
                    )}
                    </div>
                </div>

                 {/* Action Button */}
                <div className="w-full max-w-lg mx-auto mt-6">
                    <button onClick={onNext} disabled={!isReadyForAnalysis || isProcessing} className="w-full px-6 py-4 rounded-lg font-semibold text-white transition-all duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.99]" style={{ background: colors.accentGradient }}>
                        {isProcessing ? 'Analyzing...' : 'Analyze & Continue'}
                    </button>
                    {!isReadyForAnalysis && <p className="text-xs mt-2" style={{color: colors.textMuted}}>Please provide a username and upload a file to continue.</p>}
                </div>
            </div>

            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={(e) => handleFileChange(e.target.files)} />
        </div>
    )
}


function PostScreen({ submission, score, outputs, onPost, onBack, mediaFile }) {
    const areAgentsRunning = outputs.some(o => o.status === 'running');

    return (
        <div className="w-full flex flex-col" style={{backgroundColor: colors.bg, color: colors.text}}>
            <div className="p-4 flex justify-between items-center border-b" style={{borderColor: colors.border}}>
                <button onClick={onBack} className="flex items-center gap-2 hover:opacity-80 transition-opacity"><ChevronLeftIcon /> Back to Edit</button>
                <h2 className="ml-4 font-bold text-lg">Review and Post</h2>
                <div className="w-full"></div>
            </div>
            
            <div className="max-w-7xl mx-auto p-4 sm:p-8 grid md:grid-cols-5 lg:grid-cols-3 gap-8">
                {/* Left Column: Media Preview */}
                <div className="md:col-span-3 lg:col-span-2 rounded-xl flex items-center justify-center" style={{backgroundColor: colors.bgSecondary}}>
                    {mediaFile && (
                        <img src={URL.createObjectURL(mediaFile)} alt="Post preview" className="max-h-[80vh] w-auto h-auto object-contain rounded-lg" />
                    )}
                </div>

                {/* Right Column: Details & Analysis */}
                <div className="md:col-span-2 lg:col-span-1 flex flex-col gap-4">
                    <div>
                        <label className="text-sm font-medium" style={{color: colors.textMuted}}>Username</label>
                        <div className="mt-1 p-3 rounded-lg w-full" style={{backgroundColor: colors.bgSecondary, borderColor: colors.border}}>@{submission.username}</div>
                    </div>
                    <div>
                        <label className="text-sm font-medium" style={{color: colors.textMuted}}>Description</label>
                        <div className="mt-1 p-3 rounded-lg w-full" style={{backgroundColor: colors.bgSecondary, borderColor: colors.border}}>
                            {submission.text || <span style={{color: colors.textMuted}}>No description provided.</span>}
                        </div>
                    </div>
                    
                    <div className="border-t" style={{borderColor: colors.border}} />

                    <div>
                       <h3 className="font-bold text-lg mb-2">Privacy Guard Analysis</h3>
                       {areAgentsRunning ? (
                           <div className="text-center py-4" style={{color: colors.textMuted}}>
                               <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400 mx-auto"></div>
                               <p className="mt-2 text-sm">Agents are running...</p>
                           </div>
                       ) : (
                           <PrivacyRiskWarning score={score} />
                       )}
                       
                       <div className="space-y-2 divide-y" style={{borderColor: colors.border}}>
                           {outputs.map(output => <AgentResult key={output.id} output={output} />)}
                       </div>
                    </div>
                    
                    <div className="border-t" style={{borderColor: colors.border}} />
                    
                    <div>
                        <ListItem icon={<UsersIcon />} title="Who can view this post" value="Everyone" hasArrow={false} />
                        <ListItem icon={<LocationPinIcon />} title="Location" value="Add Location" />
                    </div>

                    <div className="flex-grow"></div>

                    <div className="flex flex-col gap-3 pt-4">
                         <PostButton onClick={onPost} disabled={areAgentsRunning}>
                            {areAgentsRunning ? 'Please wait...' : `Post Anyway`}
                         </PostButton>
                         <button onClick={onBack} className="w-full py-2 text-center rounded-lg font-semibold hover:bg-gray-700 transition-colors" style={{color: colors.textMuted}}>
                             Cancel
                         </button>
                    </div>
                </div>
            </div>
        </div>
    )
}


// ---------- SVG Icons ----------
const ChevronRightIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
const LocationPinIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
const LinkIcon = ({width=24, height=24}) => <svg xmlns="http://www.w3.org/2000/svg" width={width} height={height} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block ml-1"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.72"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.72-1.72"></path></svg>
const UsersIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={colors.textMuted} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
const MoreOptionsIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"></circle><circle cx="19" cy="12" r="1"></circle><circle cx="5" cy="12" r="1"></circle></svg>
const AlertTriangleIcon = ({color = 'currentColor'}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
const ChevronLeftIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
const UploadCloudIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="none" viewBox="0 0 24 24" stroke={colors.textMuted} strokeWidth="1.5"><path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9" /><path strokeLinecap="round" strokeLinejoin="round" d="M16 16l-4-4-4 4" /></svg>
const ShieldCheckIcon = ({color='currentColor'}) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={color} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>