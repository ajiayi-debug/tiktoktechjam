type Choice =
  | 'post-as-is'
  | 'apply-redactions'
  | 'discard-part'
  | 'discard-all';

export default function ActionBar(props: {
  disabled: boolean;
  onAction: (choice: Choice) => void;
}) {
  const { disabled, onAction } = props;

  const click = (choice: Choice) => {
    // eslint-disable-next-line no-unused-expressions
    'background only';
    if (disabled) return;
    onAction(choice);
  };

  // helper to apply a consistent disabled style on <view class="btn">
  const btnStyle = disabled
    ? { opacity: 0.6, pointerEvents: 'none' as const }
    : undefined;

  return (
    <view className="card">
      <text className="fs-18 fw-700" style={{ marginBottom: 6 }}>
        Next steps
      </text>
      <text className="muted small">
        Choose how to proceed based on the findings. You can post unchanged,
        auto-apply recommended censorship (where supported), discard some media,
        or discard the post entirely.
      </text>

      <view className="row" style={{ marginTop: 10 }}>
        <view className="btn" style={btnStyle} bindtap={() => click('post-as-is')}>
          <text>Post with no changes</text>
        </view>

        <view
          className="btn btn-primary"
          style={btnStyle}
          bindtap={() => click('apply-redactions')}
        >
          <text>Post with recommended censorship</text>
        </view>

        <view className="btn" style={btnStyle} bindtap={() => click('discard-part')}>
          <text>Discard some parts</text>
        </view>

        <view className="btn btn-warn" style={btnStyle} bindtap={() => click('discard-all')}>
          <text>Discard whole post</text>
        </view>
      </view>
    </view>
  );
}