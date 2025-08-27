export default function ActionBar(props: {
  disabled: boolean
  onAction: (choice: 'post-as-is' | 'apply-redactions' | 'discard-part' | 'discard-all') => void
}) {
  const click = (choice: Parameters<typeof props.onAction>[0]) => { if (!props.disabled) props.onAction(choice) }

  return (
    <view className="card">
      <text className="fs-18 fw-700" style={{ marginBottom: 6 }}>Next steps</text>
      <text className="muted small">
        Choose how to proceed based on the findings. You can post unchanged, auto-apply recommended censorship (where supported), discard some media, or discard the post entirely.
      </text>

      <view className="row" style={{ marginTop: 10 }}>
        <view className="btn" bindtap={() => click('post-as-is')}><text>Post with no changes</text></view>
        <view className="btn btn-primary" bindtap={() => click('apply-redactions')}><text>Post with recommended censorship</text></view>
        <view className="btn" bindtap={() => click('discard-part')}><text>Discard some parts</text></view>
        <view className="btn btn-warn" bindtap={() => click('discard-all')}><text>Discard whole post</text></view>
      </view>
    </view>
  )
}
