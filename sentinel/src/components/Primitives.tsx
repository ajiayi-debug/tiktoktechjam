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
    // HTMLInputElement & HTMLTextAreaElement both have .value
    return (ct as HTMLInputElement | HTMLTextAreaElement).value ?? '';
  }
  return '';
}

/* ---------- Shared base props ---------- */

type Style = Record<string, string | number> | string;

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
  const { className, bindinput, onInput, onChange, ...rest } = props;

  const out: Record<string, unknown> = { ...rest };
  if (className && out.class === undefined) out.class = className;

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
  const { className, bindinput, onInput, ...rest } = props;

  const out: Record<string, unknown> = { ...rest };
  if (className && out.class === undefined) out.class = className;

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
  const { className, ...rest } = props;
  const out: Record<string, unknown> = { ...rest };
  if (className && out.class === undefined) out.class = className;
  return createElement('video', out);
}