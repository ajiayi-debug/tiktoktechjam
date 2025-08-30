import { createElement } from '@lynx-js/react';

/* ---------- Event helpers ---------- */

type LynxInputEvent = { detail?: { value?: string } };

type WebTextInputEvent = Event & {
  currentTarget: HTMLInputElement | HTMLTextAreaElement;
};

type WebFileChangeEvent = Event & {
  currentTarget: HTMLInputElement;
  target: HTMLInputElement;
};

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Normalize value from Lynx/web input events */
function getValue(e: LynxInputEvent | WebTextInputEvent): string {
  if (isObject(e) && 'detail' in e) {
    const d = (e as LynxInputEvent).detail;
    if (d && typeof d.value === 'string') return d.value;
  }
  if (isObject(e) && 'currentTarget' in e) {
    const ct = (e as WebTextInputEvent).currentTarget;
    return (ct as HTMLInputElement | HTMLTextAreaElement).value ?? '';
  }
  return '';
}

/* ---------- Style helpers ---------- */

type StyleObject = Record<string, string | number>;
type Style = StyleObject | string;

/** Convert a style object to a CSS string (safe for Lynx native nodes) */
function toStyleString(style: unknown): string | undefined {
  if (!isObject(style)) return typeof style === 'string' ? style : undefined;
  const entries = Object.entries(style as StyleObject)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${camelToKebab(k)}:${String(v)}`);
  return entries.length ? entries.join(';') : undefined;
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

/* ---------- Shared base props ---------- */

type BaseProps = {
  class?: string;
  className?: string; // tolerated; mapped to `class`
  style?: Style;
  ref?: unknown;
  [key: string]: unknown; // allow platform-specific props (bindtap, etc.)
};

type BindInput = (e: { detail?: { value?: string } }) => void;

/* ---------- <Input> ---------- */

type InputProps = BaseProps & {
  type?: string;
  value?: string;
  placeholder?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;

  /** Lynx-style text input binding */
  bindinput?: BindInput;

  /** Web-style text input event (for desktop preview) */
  onInput?: (e: WebTextInputEvent | LynxInputEvent) => void;

  /** Web-style file input change (so consumers get typed .files) */
  onChange?: (e: WebFileChangeEvent) => void;
};

export function Input(props: InputProps) {
  const { className, bindinput, onInput, onChange, style, ...rest } = props;

  const out: Record<string, unknown> = { ...rest };

  // Map className -> class
  if (className && out.class === undefined) out.class = className;

  // Coerce object style to string (prevents Lynx setStyle crashes on <input>)
  const s = toStyleString(style);
  if (s !== undefined) out.style = s;

  if (bindinput) {
    out.bindinput = (e: LynxInputEvent | WebTextInputEvent) =>
      bindinput({ detail: { value: getValue(e) } });
  }
  if (onInput) out.onInput = onInput as unknown as (e: unknown) => void;
  if (onChange) out.onChange = onChange as unknown as (e: unknown) => void;

  return createElement('input', out);
}

/* ---------- <Textarea> ---------- */

type TextareaProps = BaseProps & {
  value?: string;
  placeholder?: string;
  rows?: number;
  cols?: number;
  disabled?: boolean;

  bindinput?: BindInput;
  onInput?: (e: WebTextInputEvent | LynxInputEvent) => void;
};

export function Textarea(props: TextareaProps) {
  const { className, bindinput, onInput, style, ...rest } = props;

  const out: Record<string, unknown> = { ...rest };

  if (className && out.class === undefined) out.class = className;

  // Coerce object style to string for <textarea> as well (safer on device)
  const s = toStyleString(style);
  if (s !== undefined) out.style = s;

  if (bindinput) {
    out.bindinput = (e: LynxInputEvent | WebTextInputEvent) =>
      bindinput({ detail: { value: getValue(e) } });
  }
  if (onInput) out.onInput = onInput as unknown as (e: unknown) => void;

  return createElement('textarea', out);
}

/* ---------- <Video> ---------- */

type VideoProps = BaseProps & {
  src?: string;
  controls?: boolean;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
};

export function Video(props: VideoProps) {
  const { className, style, ...rest } = props;
  const out: Record<string, unknown> = { ...rest };

  if (className && out.class === undefined) out.class = className;

  // Coerce object style to string (prevents setStyle on <video>)
  const s = toStyleString(style);
  if (s !== undefined) out.style = s;

  return createElement('video', out);
}