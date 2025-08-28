import { createElement } from '@lynx-js/react';

/** Normalize value from Lynx/web input events */
function getValue(e: unknown): string {
  const ev = e as {
    detail?: { value?: string };
    currentTarget?: { value?: string; files?: FileList | null };
    target?: { value?: string; files?: FileList | null };
  } | undefined;

  return (
    ev?.detail?.value ??
    ev?.currentTarget?.value ??
    ev?.target?.value ??
    ''
  );
}

type Style = Record<string, unknown> | string;

type BaseProps = {
  class?: string;
  className?: string;         // tolerated; mapped to `class`
  style?: Style;
  ref?: unknown;
  [key: string]: unknown;     // allows bindinput, etc.
};

type BindInput = (e: { detail?: { value?: string } }) => void;

/** <Input> wrapper – renders a native 'input' node */
type InputProps = BaseProps & {
  type?: string;
  value?: string;
  placeholder?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  bindinput?: BindInput;
  onInput?: (e: unknown) => void;   // web fallback
  onChange?: (e: unknown) => void;  // for file inputs
};

export function Input(props: InputProps) {
  const { className, bindinput, onInput, onChange, ...rest } = props;

  const out: Record<string, unknown> = { ...rest };
  if (className && out.class === undefined) out.class = className;

  if (bindinput) {
    out.bindinput = (e: unknown) => bindinput({ detail: { value: getValue(e) } });
  }
  if (onInput) out.onInput = onInput;
  if (onChange) out.onChange = onChange;

  return createElement('input', out);
}

/** <Textarea> wrapper – renders a native 'textarea' node */
type TextareaProps = BaseProps & {
  value?: string;
  placeholder?: string;
  rows?: number;
  cols?: number;
  disabled?: boolean;
  bindinput?: BindInput;
  onInput?: (e: unknown) => void;   // web fallback
};

export function Textarea(props: TextareaProps) {
  const { className, bindinput, onInput, ...rest } = props;

  const out: Record<string, unknown> = { ...rest };
  if (className && out.class === undefined) out.class = className;

  if (bindinput) {
    out.bindinput = (e: unknown) => bindinput({ detail: { value: getValue(e) } });
  }
  if (onInput) out.onInput = onInput;

  return createElement('textarea', out);
}

/** Optional: <Video> wrapper (keeps typing consistent) */
type VideoProps = BaseProps & {
  src?: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
};

export function Video(props: VideoProps) {
  const { className, ...rest } = props;
  const out: Record<string, unknown> = { ...rest };
  if (className && out.class === undefined) out.class = className;
  return createElement('video', out);
}