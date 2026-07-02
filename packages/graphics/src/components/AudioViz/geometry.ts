/**
 * Audio-visualizer geometry: pure, worklet-safe functions that reduce a row of
 * levels (`0..1`) into abstract draw shapes. The Skia (`@knitui/graphics`) +
 * Reanimated worklet painter consumes these, so a variant is defined ONCE and
 * looks the same on web (CanvasKit) and native.
 *
 * Each variant carries a `"worklet"` directive so the Reanimated Babel plugin can
 * run it on the UI thread on native; on web it's an ordinary function (the
 * directive is an inert string there).
 *
 * This is pure data — no Skia, no React, no platform imports — so the renderer's
 * `useDerivedValue` worklet maps shapes → `SkPath` and nothing here ever touches
 * the CanvasKit runtime.
 *
 * Add your own: `registerVisualizerVariant("myviz", (levels, w, h, o) => { … })`
 * (mark the function body `"worklet"` if you want it to run on the native UI
 * thread), then pass `variant="myviz"` to `<AudioVisualizer>`.
 */

/** A filled rounded rectangle (bar). */
export interface VisualizerRect {
  kind: "rect";
  x: number;
  y: number;
  w: number;
  h: number;
  r: number;
}
/** A polyline. `closed` → filled area; otherwise stroked with `strokeWidth`. */
export interface VisualizerLine {
  kind: "line";
  /** Flat `[x0, y0, x1, y1, …]` point pairs (flat for worklet-friendliness). */
  points: number[];
  closed: boolean;
  strokeWidth: number;
}
/** A filled circle (dot). */
export interface VisualizerCircle {
  kind: "circle";
  x: number;
  y: number;
  r: number;
}

export type VisualizerShape = VisualizerRect | VisualizerLine | VisualizerCircle;

export interface VariantOptions {
  /** Gap between bars, px. */
  gap: number;
  /** Corner / dot radius, px. */
  radius: number;
}

/** A variant maps levels + canvas size + options to draw shapes. */
export type VisualizerVariant = (
  levels: number[],
  width: number,
  height: number,
  opts: VariantOptions,
) => VisualizerShape[];

/** Built-in variant names. */
export type VisualizerVariantName = "bars" | "mirror" | "wave" | "line" | "dots" | "radial";

function clamp01(v: number): number {
  "worklet";
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

/** Vertical bars growing from the bottom. */
export const bars: VisualizerVariant = (levels, width, height, opts) => {
  "worklet";
  const n = levels.length;
  if (n === 0 || width <= 0) return [];
  const bw = Math.max(1, (width - opts.gap * (n - 1)) / n);
  const out: VisualizerShape[] = [];
  for (let i = 0; i < n; i++) {
    const bh = Math.max(1, clamp01(levels[i]) * height);
    out.push({
      kind: "rect",
      x: i * (bw + opts.gap),
      y: height - bh,
      w: bw,
      h: bh,
      r: Math.min(opts.radius, bw / 2),
    });
  }
  return out;
};

/** Bars mirrored about the vertical center (classic waveform). */
export const mirror: VisualizerVariant = (levels, width, height, opts) => {
  "worklet";
  const n = levels.length;
  if (n === 0 || width <= 0) return [];
  const bw = Math.max(1, (width - opts.gap * (n - 1)) / n);
  const out: VisualizerShape[] = [];
  for (let i = 0; i < n; i++) {
    const bh = Math.max(1, clamp01(levels[i]) * height);
    out.push({
      kind: "rect",
      x: i * (bw + opts.gap),
      y: (height - bh) / 2,
      w: bw,
      h: bh,
      r: Math.min(opts.radius, bw / 2),
    });
  }
  return out;
};

/** A dot per bar at its level, centered vertically. */
export const dots: VisualizerVariant = (levels, width, height, _opts) => {
  "worklet";
  const n = levels.length;
  if (n === 0 || width <= 0) return [];
  const step = width / n;
  const maxR = Math.min(step / 2, height / 2);
  const out: VisualizerShape[] = [];
  for (let i = 0; i < n; i++) {
    const r = Math.max(1, clamp01(levels[i]) * maxR);
    out.push({ kind: "circle", x: i * step + step / 2, y: height / 2, r });
  }
  return out;
};

/** A single stroked polyline tracing the level at each bar. */
export const line: VisualizerVariant = (levels, width, height, opts) => {
  "worklet";
  const n = levels.length;
  if (n === 0 || width <= 0) return [];
  const step = n > 1 ? width / (n - 1) : width;
  const points: number[] = [];
  for (let i = 0; i < n; i++) {
    points.push(i * step, height - clamp01(levels[i]) * height);
  }
  return [{ kind: "line", points, closed: false, strokeWidth: Math.max(1.5, opts.radius) }];
};

/** A filled, mirrored envelope (smooth waveform area). */
export const wave: VisualizerVariant = (levels, width, height, _opts) => {
  "worklet";
  const n = levels.length;
  if (n === 0 || width <= 0) return [];
  const step = n > 1 ? width / (n - 1) : width;
  const mid = height / 2;
  const points: number[] = [];
  // Top edge, left → right.
  for (let i = 0; i < n; i++) points.push(i * step, mid - (clamp01(levels[i]) * height) / 2);
  // Bottom edge, right → left.
  for (let i = n - 1; i >= 0; i--) points.push(i * step, mid + (clamp01(levels[i]) * height) / 2);
  return [{ kind: "line", points, closed: true, strokeWidth: 0 }];
};

/** Bars radiating from the center as spokes around a circle. */
export const radial: VisualizerVariant = (levels, width, height, opts) => {
  "worklet";
  const n = levels.length;
  if (n === 0 || width <= 0 || height <= 0) return [];
  const cx = width / 2;
  const cy = height / 2;
  const base = Math.min(width, height) / 2;
  const r0 = base * 0.45;
  const r1 = base * 0.5;
  const sw = Math.max(1.5, (2 * Math.PI * r0) / n - opts.gap);
  const out: VisualizerShape[] = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const outer = r0 + clamp01(levels[i]) * r1;
    out.push({
      kind: "line",
      points: [cx + cos * r0, cy + sin * r0, cx + cos * outer, cy + sin * outer],
      closed: false,
      strokeWidth: sw,
    });
  }
  return out;
};

const BUILTIN: Record<VisualizerVariantName, VisualizerVariant> = {
  bars,
  mirror,
  wave,
  line,
  dots,
  radial,
};

const registry = new Map<string, VisualizerVariant>(Object.entries(BUILTIN));

/** Register a custom variant under `name` so `variant="name"` resolves to it. */
export function registerVisualizerVariant(name: string, variant: VisualizerVariant): void {
  registry.set(name, variant);
}

/** All registered variant names (built-in + custom). */
export function visualizerVariantNames(): string[] {
  return [...registry.keys()];
}

/** Resolve a variant name OR a function to a variant function (defaults to `bars`). */
export function resolveVariant(
  variant: VisualizerVariantName | string | VisualizerVariant | undefined,
): VisualizerVariant {
  if (typeof variant === "function") return variant;
  if (variant && registry.has(variant)) return registry.get(variant)!;
  return bars;
}
