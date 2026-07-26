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
 * Each variant exists in TWO forms: the readable object form ({@link VisualizerVariant},
 * the public contract) and a WRITER into a flat reusable buffer
 * ({@link VisualizerVariantWriter}), which is what the renderer calls 60 times a second
 * so a painted frame allocates nothing. The writer is the implementation; the object
 * form is a thin decoder over it, so the two cannot drift.
 *
 * Add your own: `registerVisualizerVariant("myviz", (levels, w, h, o) => { … })`
 * (mark the function body `"worklet"` if you want it to run on the native UI
 * thread), then pass `variant="myviz"` to `<AudioVisualizer>`. Custom variants use the
 * object form and are adapted for the renderer by {@link resolveVariantWriter}.
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

/* -------------------------------------------------------------------------- */
/* The flat shape buffer (the allocation-free representation)                  */
/* -------------------------------------------------------------------------- */

/**
 * The SAME shapes, encoded into one flat `Float64Array` instead of an array of
 * objects — this is what the renderer actually consumes, 60 times a second.
 *
 * The object form ({@link VisualizerShape}) is the public, readable contract; but
 * building it per frame meant `count` fresh objects plus a fresh array (48 + 1 at
 * the default `count`, ≈2,900 objects/second) whose only purpose was to be read
 * once by the path-building worklet in the very next statement. The flat form lets
 * the renderer hand each variant a buffer it OWNS and reuses forever, so the steady
 * state allocates nothing at all. `Float64Array` (not `Float32Array`) so the values
 * round-trip EXACTLY — the decoded objects are indistinguishable from the ones the
 * object variants build, and Skia receives the identical coordinates.
 *
 * Layout: a sequence of records, terminated by a {@link SHAPE_END} slot.
 *
 *   rect    `[1, x, y, w, h, r]`                         (6 slots)
 *   circle  `[2, x, y, r]`                               (4 slots)
 *   line    `[3, closed, strokeWidth, n, x0, y0, …]`     (4 + 2n slots)
 *
 * Reused buffers are never cleared, so readers MUST stop at the terminator.
 */
export const SHAPE_END = 0;
export const SHAPE_RECT = 1;
export const SHAPE_CIRCLE = 2;
export const SHAPE_LINE = 3;
/** Slots per record (a line's header, before its `2n` coordinates). */
export const RECT_SLOTS = 6;
export const CIRCLE_SLOTS = 4;
export const LINE_HEADER_SLOTS = 4;

/**
 * A buffer big enough for ANY built-in variant at `count` levels (the worst case is
 * `radial`'s `count` two-point lines, `8 · count`), plus the terminator.
 */
export function shapeBufferSize(count: number): number {
  "worklet";
  return 8 * count + 8;
}

/** `out` when it can hold `need` slots, else a fresh buffer that can. Worklet. */
function fitBuffer(out: Float64Array | undefined, need: number): Float64Array {
  "worklet";
  return out !== undefined && out.length >= need ? out : new Float64Array(need);
}

/**
 * A variant that writes its shapes into a caller-owned flat buffer (see
 * {@link SHAPE_END}) and returns the buffer it used — `out` itself whenever it fits,
 * so the per-frame path allocates nothing. The built-ins each have one; a foreign
 * variant is adapted by {@link resolveVariantWriter}.
 */
export type VisualizerVariantWriter = (
  levels: ArrayLike<number>,
  width: number,
  height: number,
  opts: VariantOptions,
  out?: Float64Array,
) => Float64Array;

/**
 * Decode a flat shape buffer back into the object form. Used by the object-shaped
 * variants below (which are thin wrappers over the writers, so there is exactly ONE
 * implementation of each variant's geometry) and by anything that wants to inspect
 * shapes. Allocates — the renderer never calls it. Worklet.
 */
export function decodeShapes(buffer: Float64Array): VisualizerShape[] {
  "worklet";
  const out: VisualizerShape[] = [];
  let i = 0;
  while (i < buffer.length) {
    const kind = buffer[i];
    if (kind === SHAPE_END) break;
    if (kind === SHAPE_RECT) {
      out.push({
        kind: "rect",
        x: buffer[i + 1],
        y: buffer[i + 2],
        w: buffer[i + 3],
        h: buffer[i + 4],
        r: buffer[i + 5],
      });
      i += RECT_SLOTS;
    } else if (kind === SHAPE_CIRCLE) {
      out.push({ kind: "circle", x: buffer[i + 1], y: buffer[i + 2], r: buffer[i + 3] });
      i += CIRCLE_SLOTS;
    } else {
      const pointCount = buffer[i + 3];
      const points: number[] = [];
      const base = i + LINE_HEADER_SLOTS;
      for (let k = 0; k < pointCount * 2; k++) points.push(buffer[base + k]);
      out.push({
        kind: "line",
        points,
        closed: buffer[i + 1] !== 0,
        strokeWidth: buffer[i + 2],
      });
      i += LINE_HEADER_SLOTS + pointCount * 2;
    }
  }
  return out;
}

/** Slots a shape occupies in the flat buffer. Worklet. */
function slotsFor(shape: VisualizerShape): number {
  "worklet";
  if (shape.kind === "rect") return RECT_SLOTS;
  if (shape.kind === "circle") return CIRCLE_SLOTS;
  return LINE_HEADER_SLOTS + shape.points.length;
}

/**
 * Encode object-form shapes into a flat buffer — the compatibility bridge that lets
 * a variant registered through {@link registerVisualizerVariant} (which returns
 * objects) feed the flat renderer unchanged. Grows past `out` when the foreign
 * variant emits more than it can hold. Worklet.
 */
export function encodeShapes(shapes: VisualizerShape[], out?: Float64Array): Float64Array {
  "worklet";
  let need = 1;
  for (let s = 0; s < shapes.length; s++) need += slotsFor(shapes[s]);
  const buffer = fitBuffer(out, need);
  let i = 0;
  for (let s = 0; s < shapes.length; s++) {
    const shape = shapes[s];
    if (shape.kind === "rect") {
      buffer[i] = SHAPE_RECT;
      buffer[i + 1] = shape.x;
      buffer[i + 2] = shape.y;
      buffer[i + 3] = shape.w;
      buffer[i + 4] = shape.h;
      buffer[i + 5] = shape.r;
      i += RECT_SLOTS;
    } else if (shape.kind === "circle") {
      buffer[i] = SHAPE_CIRCLE;
      buffer[i + 1] = shape.x;
      buffer[i + 2] = shape.y;
      buffer[i + 3] = shape.r;
      i += CIRCLE_SLOTS;
    } else {
      const pointCount = shape.points.length / 2;
      buffer[i] = SHAPE_LINE;
      buffer[i + 1] = shape.closed ? 1 : 0;
      buffer[i + 2] = shape.strokeWidth;
      buffer[i + 3] = pointCount;
      for (let k = 0; k < shape.points.length; k++) {
        buffer[i + LINE_HEADER_SLOTS + k] = shape.points[k];
      }
      i += LINE_HEADER_SLOTS + shape.points.length;
    }
  }
  buffer[i] = SHAPE_END;
  return buffer;
}

/** The stroke width of the first open line in a flat buffer, or 0. Worklet. */
export function strokeWidthOf(buffer: Float64Array): number {
  "worklet";
  let i = 0;
  while (i < buffer.length) {
    const kind = buffer[i];
    if (kind === SHAPE_END) break;
    if (kind === SHAPE_RECT) i += RECT_SLOTS;
    else if (kind === SHAPE_CIRCLE) i += CIRCLE_SLOTS;
    else {
      if (buffer[i + 1] === 0) return buffer[i + 2];
      i += LINE_HEADER_SLOTS + buffer[i + 3] * 2;
    }
  }
  return 0;
}

/**
 * Each variant is written ONCE, as a flat-buffer writer (the form the renderer
 * consumes with zero per-frame allocation); the exported object-shaped variant right
 * below it is a thin `decodeShapes(writer(…))` wrapper, so there is a single
 * implementation of the geometry and the two forms cannot drift.
 */

/** Vertical bars growing from the bottom. Flat writer. */
export const barsInto: VisualizerVariantWriter = (levels, width, height, opts, out) => {
  "worklet";
  const n = levels.length;
  const buffer = fitBuffer(out, RECT_SLOTS * n + 1);
  if (n === 0 || width <= 0) {
    buffer[0] = SHAPE_END;
    return buffer;
  }
  const bw = Math.max(1, (width - opts.gap * (n - 1)) / n);
  const r = Math.min(opts.radius, bw / 2);
  let i = 0;
  for (let k = 0; k < n; k++) {
    const bh = Math.max(1, clamp01(levels[k]) * height);
    buffer[i] = SHAPE_RECT;
    buffer[i + 1] = k * (bw + opts.gap);
    buffer[i + 2] = height - bh;
    buffer[i + 3] = bw;
    buffer[i + 4] = bh;
    buffer[i + 5] = r;
    i += RECT_SLOTS;
  }
  buffer[i] = SHAPE_END;
  return buffer;
};

/** Vertical bars growing from the bottom. */
export const bars: VisualizerVariant = (levels, width, height, opts) => {
  "worklet";
  return decodeShapes(barsInto(levels, width, height, opts));
};

/** Bars mirrored about the vertical center (classic waveform). Flat writer. */
export const mirrorInto: VisualizerVariantWriter = (levels, width, height, opts, out) => {
  "worklet";
  const n = levels.length;
  const buffer = fitBuffer(out, RECT_SLOTS * n + 1);
  if (n === 0 || width <= 0) {
    buffer[0] = SHAPE_END;
    return buffer;
  }
  const bw = Math.max(1, (width - opts.gap * (n - 1)) / n);
  const r = Math.min(opts.radius, bw / 2);
  let i = 0;
  for (let k = 0; k < n; k++) {
    const bh = Math.max(1, clamp01(levels[k]) * height);
    buffer[i] = SHAPE_RECT;
    buffer[i + 1] = k * (bw + opts.gap);
    buffer[i + 2] = (height - bh) / 2;
    buffer[i + 3] = bw;
    buffer[i + 4] = bh;
    buffer[i + 5] = r;
    i += RECT_SLOTS;
  }
  buffer[i] = SHAPE_END;
  return buffer;
};

/** Bars mirrored about the vertical center (classic waveform). */
export const mirror: VisualizerVariant = (levels, width, height, opts) => {
  "worklet";
  return decodeShapes(mirrorInto(levels, width, height, opts));
};

/** A dot per bar at its level, centered vertically. Flat writer. */
export const dotsInto: VisualizerVariantWriter = (levels, width, height, _opts, out) => {
  "worklet";
  const n = levels.length;
  const buffer = fitBuffer(out, CIRCLE_SLOTS * n + 1);
  if (n === 0 || width <= 0) {
    buffer[0] = SHAPE_END;
    return buffer;
  }
  const step = width / n;
  const maxR = Math.min(step / 2, height / 2);
  let i = 0;
  for (let k = 0; k < n; k++) {
    buffer[i] = SHAPE_CIRCLE;
    buffer[i + 1] = k * step + step / 2;
    buffer[i + 2] = height / 2;
    buffer[i + 3] = Math.max(1, clamp01(levels[k]) * maxR);
    i += CIRCLE_SLOTS;
  }
  buffer[i] = SHAPE_END;
  return buffer;
};

/** A dot per bar at its level, centered vertically. */
export const dots: VisualizerVariant = (levels, width, height, opts) => {
  "worklet";
  return decodeShapes(dotsInto(levels, width, height, opts));
};

/** A single stroked polyline tracing the level at each bar. Flat writer. */
export const lineInto: VisualizerVariantWriter = (levels, width, height, opts, out) => {
  "worklet";
  const n = levels.length;
  const buffer = fitBuffer(out, LINE_HEADER_SLOTS + 2 * n + 1);
  if (n === 0 || width <= 0) {
    buffer[0] = SHAPE_END;
    return buffer;
  }
  const step = n > 1 ? width / (n - 1) : width;
  buffer[0] = SHAPE_LINE;
  buffer[1] = 0; // open
  buffer[2] = Math.max(1.5, opts.radius);
  buffer[3] = n;
  for (let k = 0; k < n; k++) {
    buffer[LINE_HEADER_SLOTS + 2 * k] = k * step;
    buffer[LINE_HEADER_SLOTS + 2 * k + 1] = height - clamp01(levels[k]) * height;
  }
  buffer[LINE_HEADER_SLOTS + 2 * n] = SHAPE_END;
  return buffer;
};

/** A single stroked polyline tracing the level at each bar. */
export const line: VisualizerVariant = (levels, width, height, opts) => {
  "worklet";
  return decodeShapes(lineInto(levels, width, height, opts));
};

/** A filled, mirrored envelope (smooth waveform area). Flat writer. */
export const waveInto: VisualizerVariantWriter = (levels, width, height, _opts, out) => {
  "worklet";
  const n = levels.length;
  const buffer = fitBuffer(out, LINE_HEADER_SLOTS + 4 * n + 1);
  if (n === 0 || width <= 0) {
    buffer[0] = SHAPE_END;
    return buffer;
  }
  const step = n > 1 ? width / (n - 1) : width;
  const mid = height / 2;
  buffer[0] = SHAPE_LINE;
  buffer[1] = 1; // closed → filled envelope
  buffer[2] = 0;
  buffer[3] = 2 * n;
  let i = LINE_HEADER_SLOTS;
  // Top edge, left → right.
  for (let k = 0; k < n; k++) {
    buffer[i] = k * step;
    buffer[i + 1] = mid - (clamp01(levels[k]) * height) / 2;
    i += 2;
  }
  // Bottom edge, right → left.
  for (let k = n - 1; k >= 0; k--) {
    buffer[i] = k * step;
    buffer[i + 1] = mid + (clamp01(levels[k]) * height) / 2;
    i += 2;
  }
  buffer[i] = SHAPE_END;
  return buffer;
};

/** A filled, mirrored envelope (smooth waveform area). */
export const wave: VisualizerVariant = (levels, width, height, opts) => {
  "worklet";
  return decodeShapes(waveInto(levels, width, height, opts));
};

/** Bars radiating from the center as spokes around a circle. Flat writer. */
export const radialInto: VisualizerVariantWriter = (levels, width, height, opts, out) => {
  "worklet";
  const n = levels.length;
  const buffer = fitBuffer(out, (LINE_HEADER_SLOTS + 4) * n + 1);
  if (n === 0 || width <= 0 || height <= 0) {
    buffer[0] = SHAPE_END;
    return buffer;
  }
  const cx = width / 2;
  const cy = height / 2;
  const base = Math.min(width, height) / 2;
  const r0 = base * 0.45;
  const r1 = base * 0.5;
  const sw = Math.max(1.5, (2 * Math.PI * r0) / n - opts.gap);
  let i = 0;
  for (let k = 0; k < n; k++) {
    const a = (k / n) * Math.PI * 2 - Math.PI / 2;
    const cos = Math.cos(a);
    const sin = Math.sin(a);
    const outer = r0 + clamp01(levels[k]) * r1;
    buffer[i] = SHAPE_LINE;
    buffer[i + 1] = 0; // open → stroked spoke
    buffer[i + 2] = sw;
    buffer[i + 3] = 2;
    buffer[i + 4] = cx + cos * r0;
    buffer[i + 5] = cy + sin * r0;
    buffer[i + 6] = cx + cos * outer;
    buffer[i + 7] = cy + sin * outer;
    i += LINE_HEADER_SLOTS + 4;
  }
  buffer[i] = SHAPE_END;
  return buffer;
};

/** Bars radiating from the center as spokes around a circle. */
export const radial: VisualizerVariant = (levels, width, height, opts) => {
  "worklet";
  return decodeShapes(radialInto(levels, width, height, opts));
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

/**
 * The flat writer for each built-in, keyed on the object variant's identity — so a
 * `variant="bars"` name, a `variant={bars}` function reference, and the default all
 * land on the allocation-free path.
 */
const BUILTIN_WRITERS = new Map<VisualizerVariant, VisualizerVariantWriter>([
  [bars, barsInto],
  [mirror, mirrorInto],
  [wave, waveInto],
  [line, lineInto],
  [dots, dotsInto],
  [radial, radialInto],
]);

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

/**
 * Resolve a variant to its FLAT writer — what the renderer actually calls, once per
 * frame, into a buffer it owns.
 *
 * A built-in resolves to its writer (allocation-free). Anything registered through
 * {@link registerVisualizerVariant}, or passed as a bare function, keeps working
 * untouched: it is wrapped in a shim that runs the object-shaped variant and encodes
 * the result, so a foreign variant pays exactly the allocation it paid before and the
 * public {@link VisualizerVariant} contract is unchanged.
 */
export function resolveVariantWriter(
  variant: VisualizerVariantName | string | VisualizerVariant | undefined,
): VisualizerVariantWriter {
  const resolved = resolveVariant(variant);
  const writer = BUILTIN_WRITERS.get(resolved);
  if (writer) return writer;
  return (levels, width, height, opts, out) => {
    "worklet";
    return encodeShapes(resolved(toLevelArray(levels), width, height, opts), out);
  };
}

/** A plain `number[]` view of levels, for handing to a foreign variant. Worklet. */
function toLevelArray(levels: ArrayLike<number>): number[] {
  "worklet";
  if (Array.isArray(levels)) return levels as number[];
  const n = levels.length;
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) out[i] = levels[i];
  return out;
}
