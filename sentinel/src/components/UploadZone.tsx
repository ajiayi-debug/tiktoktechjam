import { useCallback, useRef, useState } from '@lynx-js/react'
import type { UploadedMedia } from '../types.ts'

export default function UploadZone(props: {
  onSubmit: (text: string, media: UploadedMedia[]) => void
}) {
  const [text, setText] = useState('')
  const [media, setMedia] = useState<UploadedMedia[]>([])
  const inputRef = useRef<HTMLInputElement | null>(null)

  const pickFiles = useCallback(() => { 'background only'; inputRef.current?.click() }, [])
  const onFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const items: UploadedMedia[] = Array.from(files).map((file) => {
      const kind = file.type.startsWith('video/') ? 'video' : 'image'
      return { id: crypto.randomUUID(), file, kind, previewUrl: URL.createObjectURL(file) }
    })
    setMedia((m) => [...m, ...items])
  }, [])
  const clearAll = useCallback(() => { 'background only'; setText(''); setMedia([]) }, [])
  const submit = useCallback(() => { 'background only'; props.onSubmit(text, media) }, [props, text, media])
  const onTextInput = (e: any) => setText(e?.detail?.value ?? e?.currentTarget?.value ?? '')

  return (
    <view className="card">
      <text className="fs-18 fw-700" style={{ marginBottom: 8 }}>Compose your post</text>
      <text className="muted small">Paste text and tap to add images/videos. Nothing is uploaded until you run the scan.</text>

      <view style={{ display: 'grid', gap: 12, marginTop: 12 }}>
        <text
          className="textarea"
          placeholder="Write your caption / text here (emails, NRIC, addresses will be auto-masked for scanning)"
          {...({ bindinput: onTextInput } as any)}
          onInput={onTextInput}
          value={text}
        />

        <view className="dropzone" bindtap={pickFiles}>
          <view>
            <text className="fw-700">Tap to select images/videos</text>
            <view />
            <text className="muted small">You can add multiple files</text>
          </view>
          <input
            ref={inputRef}
            type="file"
            accept="image/*,video/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => onFiles((e.target as HTMLInputElement).files)}
          />
        </view>

        {media.length > 0 && (
          <view className="grid two">
            {media.map((m) => (
              <view className="result-item" key={m.id}>
                <view className="row" style={{ alignItems: 'center' }}>
                  <view className="pill"><text>{m.kind.toUpperCase()}</text></view>
                  <text className="muted small" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginLeft: 8 }}>
                    {m.file.name}
                  </text>
                  <view className="btn btn-ghost" bindtap={() => setMedia((all) => all.filter((x) => x.id !== m.id))}>
                    <text>Remove</text>
                  </view>
                </view>

                <view style={{ marginTop: 8 }}>
                  {m.kind === 'image'
                    ? <image src={m.previewUrl} style={{ width: '100%', borderRadius: 8, border: '1px solid #1e2a3a' }} />
                    : <video  src={m.previewUrl} style={{ width: '100%', borderRadius: 8, border: '1px solid #1e2a3a' }} controls muted />
                  }
                </view>
              </view>
            ))}
          </view>
        )}

        <view style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <view className="btn" bindtap={clearAll}><text>Clear</text></view>
          <view className={`btn ${text || media.length ? 'btn-primary' : ''}`} bindtap={submit}>
            <text>Scan for risks</text>
          </view>
        </view>
      </view>
    </view>
  )
}