/**
 * A data-driven audio visualizer rendered entirely with Skia on BOTH web
 * (CanvasKit) and native — no HTML `<canvas>`. A reusable, controller-free engine:
 * feed it `0..1` levels (or raw FFT) from any source and it owns the rest.
 *
 * The split that makes it efficient (the whole point of the design):
 *
 *   - The caller only ever pushes new TARGET STATES — a row of `0..1` levels —
 *     either imperatively via the ref handle (`ref.push(levels)`, cheapest, no
 *     React render) or by writing a `target` SharedValue. New states can arrive at
 *     any irregular rate ("ticks").
 *   - The TRANSITION between states lives INSIDE the component: `useLevelTransition`
 *     eases the displayed levels toward the latest target on the display clock
 *     (`requestAnimationFrame`), double-buffered and self-suspending, and publishes
 *     them into one `levels` SharedValue (see `docs/skia-reanimated-animation.md`).
 *   - `useDerivedValue` worklets build the `SkPath`(s) from `levels` and are handed
 *     straight to the `<Path>` elements, so the per-frame paint never re-renders
 *     React. Skia re-records the picture when `levels` changes.
 *
 * Skia is the payoff: the shape can be filled with a `gradient` (linear/sweep
 * shader, in either direction), wrapped in a coloured `glow` (a separate blurred
 * halo layer), tinted with `opacity`, set on a `backgroundColor`, and shaped with
 * the `VisualizerEffects` knobs (`gain`, `floor`, `attack`/`release`, `reverse`) —
 * paint a plain `<canvas>`/`<View>` can't do cheaply. Size is read from the Skia
 * `<Canvas onSize>` SharedValue (cross-platform, no layout-measuring `View` and so
 * no `react-native`/`@knitui/components` dependency).
 *
 * Web: Storybook's Vite build does NOT run the reanimated/worklets Babel plugin, so
 * every `useDerivedValue` is given an explicit `dependencies` array and a `readyValue`
 * SharedValue mirrors CanvasKit readiness; until ready an inert placeholder renders
 * instead of touching `Skia.*`.
 */
import * as React from "react";
import { type SharedValue, useDerivedValue } from "react-native-reanimated";

import {
  BlurMask,
  Canvas,
  Group,
  LinearGradient,
  Path,
  Skia,
  type SkPath,
  SweepGradient,
} from "@shopify/react-native-skia";

import {
  resolveVariant,
  type VisualizerShape,
  type VisualizerVariant,
  type VisualizerVariantName,
} from "./geometry";
import { type SpectrumInput } from "./spectrum";
import { useVisualizerSource } from "./useVisualizerSource";

/** A Skia gradient fill for the shape. Overrides the solid `color`. */
export interface VisualizerGradient {
  /** Two or more colors painted across the shape. */
  colors: string[];
  /**
   * Shader type. `"linear"` (default) runs along `gradientDirection`; `"sweep"`
   * rotates around the center — a natural fit for the `radial` variant.
   */
  type?: "linear" | "sweep";
}

/**
 * Tunable effects shared by every visualizer (the generic component and its
 * presets). All optional — omit for sensible defaults.
 */
export interface VisualizerEffects {
  /** Multiply incoming levels (sensitivity), clamped to `0..1`. Default `1`. */
  gain?: number;
  /**
   * Resting baseline `0..1`: lifts every level so the shape never fully collapses
   * (`v → floor + (1 - floor) · v`). Default `0`.
   */
  floor?: number;
  /** Rise smoothing `0..1` override — lower = snappier peaks. Defaults to `smoothing`. */
  attack?: number;
  /** Fall smoothing `0..1` override — higher = a slower VU-meter tail. Defaults to `smoothing`. */
  release?: number;
  /**
   * Rise time constant in MILLISECONDS, overriding the `smoothing`→time mapping.
   * Rate-independent: the same value glides identically whether you push at 10 Hz
   * or 60 Hz — set it (e.g. `90`) to make a sparse/low-rate FFT feed smooth at
   * 60 fps. Release defaults to ~3× this unless `release` is given.
   */
  responseTime?: number;
  /** Linear-gradient orientation. Default `"vertical"` (top→bottom). */
  gradientDirection?: "vertical" | "horizontal";
  /** Canvas background color. Default transparent. */
  backgroundColor?: string;
  /** Overall opacity `0..1` of the shape. Default `1`. */
  opacity?: number;
  /**
   * Tint for the `glow` halo. When set, the shape stays crisp and a separate
   * blurred layer in this color sits behind it (a neon look). Requires `glow`.
   */
  glowColor?: string;
  /** Reverse the level order (mirror the data left↔right / around the ring). */
  reverse?: boolean;
}

/** Imperative handle: push new target states without re-rendering React. */
export interface AudioVisualizerHandle {
  /** Push a new target state (a row of `count` levels, `0..1`). */
  push(levels: ArrayLike<number>): void;
  /** Decay the visualizer to rest (silence). */
  rest(): void;
}

export interface AudioVisualizerProps extends VisualizerEffects {
  /**
   * The visual style: a built-in name (`"bars"`, `"mirror"`, `"wave"`, `"line"`,
   * `"dots"`, `"radial"`), a custom name registered via `registerVisualizerVariant`,
   * or a variant function. Default `"mirror"`.
   */
  variant?: VisualizerVariantName | string | VisualizerVariant;
  /** Number of levels (bars) to render. Default 48. */
  count?: number;
  /** Fixed width in px. Omit for a responsive `width: "100%"` canvas. */
  width?: number;
  /** Visualizer height in px. Default 48. */
  height?: number;
  /** Solid fill color (any CSS / RN / Skia color). Ignored when `gradient` is set. */
  color?: string;
  /**
   * A Skia gradient fill — the real payoff of rendering with Skia. Pass an array
   * of colors for a linear gradient, or `{ colors, type }` for control. Overrides
   * `color`.
   */
  gradient?: VisualizerGradient | string[];
  /**
   * A soft glow behind the shape (a Skia blur). `true` applies a tasteful default;
   * a number sets the blur radius in px. Pair with `glowColor` for a tinted halo.
   * Default off.
   */
  glow?: boolean | number;
  /**
   * Attack/release smoothing, `0..1`. `0` snaps to each target; higher values let
   * levels glide and decay. Default `0.3`. Forced to `0` under reduced motion.
   * Use `attack`/`release` to tune the rise/fall halves independently.
   */
  smoothing?: number;
  /** Gap between bars, px. Default 2. */
  gap?: number;
  /**
   * Shape rounding, px (default 2). Its effect is per-variant: corner radius for
   * `bars`/`mirror` rects, and the stroke width for `line`/`radial` (min 1.5).
   * The `dots` and `wave` variants ignore it — dot size tracks the level and the
   * wave envelope is filled, not stroked.
   */
  radius?: number;
  /** Accessible label. */
  label?: string;
  /**
   * Optional external target SharedValue. Write `target.value = levels` from your
   * data handler instead of using the ref handle; the loop eases toward it. While a
   * `target` is provided the display loop runs continuously (it can't listen to SV
   * writes portably), so prefer the ref `push()` for the self-suspending path.
   */
  target?: SharedValue<number[]>;
  /**
   * Declarative fallback: the component pushes this state whenever the value
   * changes. Convenient, but re-renders the component each tick — at high tick
   * rates prefer the ref `push()` handle (Skia Rule 1).
   */
  levels?: number[];
  /**
   * What the pushed data (`push()` / the `levels` prop) carries. The visualizer
   * keeps only the data its settings need:
   *   - `"levels"` (default) — already the final per-bar values.
   *   - `"fft"` — RAW FFT magnitudes; push the whole spectrum (256/512/1024 bins)
   *     and the component reduces it to `count` log-spaced, dB-normalized bands
   *     itself (a memoized `createSpectrumMapper`). Nothing larger than `count` is
   *     ever stored or animated.
   * The `target` SharedValue is always treated as final levels.
   */
  input?: "levels" | "fft";
  /** How `input="fft"` magnitudes are scaled. Default `"byte"` (`AnalyserNode` bytes). */
  fftScale?: SpectrumInput;
  /** `input="fft"`: dB mapped to `0` (floor). Default `-90`. Ignored for `"byte"`. */
  minDb?: number;
  /** `input="fft"`: dB mapped to `1` (ceiling). Default `-10`. Ignored for `"byte"`. */
  maxDb?: number;
  /** `input="fft"`: first magnitude bin to include (skip DC). Default `1`. */
  minBin?: number;
  /** `input="fft"`: last magnitude bin to include. Default = pushed length. */
  maxBin?: number;
}

export const DEFAULT_VARIANT = "mirror" as const;
export const DEFAULT_COUNT = 48;
export const DEFAULT_HEIGHT = 48;
export const DEFAULT_COLOR = "rgba(120,120,130,0.9)";
export const DEFAULT_GAP = 2;
export const DEFAULT_RADIUS = 2;
export const DEFAULT_SMOOTHING = 0.3;
/** Blur radius used when `glow` is `true`. */
export const DEFAULT_GLOW_BLUR = 8;

/**
 * Apply the per-level effects (`gain`, `floor`, `reverse`) to the eased levels
 * before geometry. A small fresh (pre-sized) array per evaluation — cheap next to
 * the shape build, and it keeps the registered variants oblivious to the effects.
 * Only called when at least one effect is active (see the `shapes` worklet); the
 * default no-effects path skips it and lets the variant's own `clamp01` do the
 * clamping, avoiding an allocation per frame. Worklet.
 */
function applyLevels(src: number[], gain: number, floor: number, reverse: boolean): number[] {
  "worklet";
  const n = src.length;
  const out = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    let v = src[reverse ? n - 1 - i : i] * gain;
    v = v < 0 ? 0 : v > 1 ? 1 : v;
    if (floor > 0) v = floor + (1 - floor) * v;
    out[i] = v;
  }
  return out;
}

/**
 * Build the fill path (bars / dots / closed polylines) from shapes. Worklet.
 *
 * The `PathBuilder` (not the deprecated mutable `SkPath.add*`/`moveTo`/`lineTo`;
 * `detach()` returns the finished `SkPath`) is created LAZILY — only once a fill
 * shape is actually seen. Each variant emits either fill OR stroke shapes, so for
 * a stroke-only variant (`line`/`radial`) this returns `""` without ever touching
 * CanvasKit, saving a native path alloc + `detach()` every frame.
 */
function buildFill(shapes: VisualizerShape[]): SkPath | "" {
  "worklet";
  let p: ReturnType<typeof Skia.PathBuilder.Make> | null = null;
  for (const s of shapes) {
    if (s.kind === "rect") {
      if (!p) p = Skia.PathBuilder.Make();
      p.addRRect(Skia.RRectXY(Skia.XYWHRect(s.x, s.y, s.w, s.h), s.r, s.r));
    } else if (s.kind === "circle") {
      if (!p) p = Skia.PathBuilder.Make();
      p.addCircle(s.x, s.y, s.r);
    } else if (s.closed && s.points.length >= 6) {
      if (!p) p = Skia.PathBuilder.Make();
      p.moveTo(s.points[0], s.points[1]);
      for (let i = 2; i < s.points.length; i += 2) p.lineTo(s.points[i], s.points[i + 1]);
      p.close();
    }
  }
  return p ? p.detach() : "";
}

/**
 * Build the stroke path (open polylines / radial spokes) from shapes. Worklet.
 * Lazy `PathBuilder` like `buildFill`: a fill-only variant (`bars`/`mirror`/
 * `dots`/`wave`) returns `""` without allocating a native path.
 */
function buildStroke(shapes: VisualizerShape[]): SkPath | "" {
  "worklet";
  let p: ReturnType<typeof Skia.PathBuilder.Make> | null = null;
  for (const s of shapes) {
    if (s.kind === "line" && !s.closed && s.points.length >= 4) {
      if (!p) p = Skia.PathBuilder.Make();
      p.moveTo(s.points[0], s.points[1]);
      for (let i = 2; i < s.points.length; i += 2) p.lineTo(s.points[i], s.points[i + 1]);
    }
  }
  return p ? p.detach() : "";
}

/** The stroke width to use (first open line's, or 0). Size-invariant. Worklet. */
function firstStrokeWidth(shapes: VisualizerShape[]): number {
  "worklet";
  for (const s of shapes) if (s.kind === "line" && !s.closed) return s.strokeWidth;
  return 0;
}

/** Normalize the `gradient` prop to a `{ colors, type }` with ≥2 colors, or null. */
function normalizeGradient(
  gradient: AudioVisualizerProps["gradient"],
): Required<VisualizerGradient> | null {
  if (!gradient) return null;
  if (Array.isArray(gradient)) {
    return gradient.length >= 2 ? { colors: gradient, type: "linear" } : null;
  }
  return gradient.colors.length >= 2
    ? { colors: gradient.colors, type: gradient.type ?? "linear" }
    : null;
}

function AudioVisualizerImpl(
  props: AudioVisualizerProps,
  ref: React.Ref<AudioVisualizerHandle>,
): React.ReactElement {
  const {
    variant = DEFAULT_VARIANT,
    count = DEFAULT_COUNT,
    width,
    height = DEFAULT_HEIGHT,
    color = DEFAULT_COLOR,
    gradient,
    glow = false,
    smoothing = DEFAULT_SMOOTHING,
    gap = DEFAULT_GAP,
    radius = DEFAULT_RADIUS,
    label = "Audio visualizer",
    target,
    levels: levelsProp,
    // data input / reduction
    input = "levels",
    fftScale = "byte",
    minDb,
    maxDb,
    minBin,
    maxBin,
    // effects
    gain = 1,
    floor = 0,
    attack,
    release,
    responseTime,
    gradientDirection = "vertical",
    backgroundColor,
    opacity = 1,
    glowColor,
    reverse = false,
  } = props;

  const variantFn = React.useMemo(() => resolveVariant(variant), [variant]);

  // The shared data head: readiness, the eased `levels` transition, FFT ingestion,
  // and the canvas `size` SharedValue (see `useVisualizerSource`).
  const { levels, push, rest, ready, readyValue, size } = useVisualizerSource({
    count,
    smoothing,
    attack,
    release,
    responseTime,
    target,
    levels: levelsProp,
    input,
    fftScale,
    minDb,
    maxDb,
    minBin,
    maxBin,
  });
  React.useImperativeHandle(ref, () => ({ push, rest }), [push, rest]);

  const grad = React.useMemo(() => normalizeGradient(gradient), [gradient]);
  // `glow` adds a blurred halo — a separate GPU pass, the priciest option here.
  // Opt-in, off by default; keep the radius modest.
  const glowBlur = glow === true ? DEFAULT_GLOW_BLUR : typeof glow === "number" ? glow : 0;

  const opts = React.useMemo(() => ({ gap, radius }), [gap, radius]);

  // The variant shapes for this frame, built ONCE from `levels` (+ size + effects).
  // Both the fill and stroke paths derive from this, so `variantFn`/`applyLevels`
  // run a single time per frame instead of once per path (most variants emit only
  // fill OR stroke shapes, so the other path was pure waste). Shapes are plain data
  // (no `SkPath`/CanvasKit host objects), which is safe to hold in a derived value
  // on web. Explicit `dependencies` are REQUIRED on web (no Babel worklet plugin
  // under Vite). `[]` before ready/layout yields the empty `""` paths below.
  const shapes = useDerivedValue<VisualizerShape[]>(() => {
    "worklet";
    const w = size.value.width;
    const h = size.value.height;
    if (!readyValue.value || w <= 0 || h <= 0) return [];
    // No-effects fast path (the default): pass the eased levels straight to the
    // variant — `gain=1`/`floor=0`/`reverse=false` makes `applyLevels` a no-op
    // beyond a clamp the variant already does, so skip its per-frame allocation.
    const lv =
      gain === 1 && floor === 0 && !reverse
        ? levels.value
        : applyLevels(levels.value, gain, floor, reverse);
    return variantFn(lv, w, h, opts);
  }, [levels, readyValue, size, variantFn, opts, gain, floor, reverse]);

  // Fill / stroke paths from the shared shapes. Each `build*` returns `""` (a valid
  // empty path) when the variant emits no shapes of that kind, allocating no path.
  const fillPath = useDerivedValue<SkPath | string>(() => {
    "worklet";
    return buildFill(shapes.value);
  }, [shapes]);

  const strokePath = useDerivedValue<SkPath | string>(() => {
    "worklet";
    return buildStroke(shapes.value);
  }, [shapes]);

  // Stroke width depends only on size/variant (not levels). A derived value so it
  // tracks resize without a layout-measured number.
  const strokeWidth = useDerivedValue<number>(() => {
    "worklet";
    const w = size.value.width;
    const h = size.value.height;
    if (w <= 0 || h <= 0) return 0;
    const zeros: number[] = [];
    for (let i = 0; i < count; i++) zeros.push(0);
    return firstStrokeWidth(variantFn(zeros, w, h, opts));
  }, [size, variantFn, opts, count]);

  // Sweep gradient pivots on the canvas center.
  const sweepCenter = useDerivedValue<{ x: number; y: number }>(() => {
    "worklet";
    return { x: size.value.width / 2, y: size.value.height / 2 };
  }, [size]);

  // Linear gradient end point — along the chosen direction, tracking resize.
  const gradEnd = useDerivedValue<{ x: number; y: number }>(() => {
    "worklet";
    return gradientDirection === "horizontal"
      ? { x: size.value.width, y: 0 }
      : { x: 0, y: size.value.height };
  }, [size, gradientDirection]);

  const style = React.useMemo(
    () => ({ width: width ?? ("100%" as const), height, backgroundColor }),
    [width, height, backgroundColor],
  );

  if (!ready) {
    return (
      <Canvas style={style} onSize={size} accessibilityRole="image" accessibilityLabel={label} />
    );
  }

  // The gradient shader for a Path (fresh fragment per call so element instances
  // aren't shared across parents). `null` when there's no gradient (solid `color`).
  const gradientNode = (): React.ReactNode =>
    grad ? (
      grad.type === "sweep" ? (
        <SweepGradient c={sweepCenter} colors={grad.colors} />
      ) : (
        <LinearGradient start={{ x: 0, y: 0 }} end={gradEnd} colors={grad.colors} />
      )
    ) : null;

  return (
    <Canvas style={style} onSize={size} accessibilityRole="image" accessibilityLabel={label}>
      {/* Glow: a separate blurred layer behind the crisp shape. When `glowColor` is
          set it's a solid tinted halo (neon); otherwise it mirrors the fill. */}
      {glowBlur > 0 ? (
        <Group opacity={0.7 * opacity}>
          <Path path={fillPath} color={glowColor ?? color} style="fill">
            {glowColor ? null : gradientNode()}
            <BlurMask blur={glowBlur} style="solid" />
          </Path>
          <Path
            path={strokePath}
            color={glowColor ?? color}
            style="stroke"
            strokeWidth={strokeWidth}
            strokeCap="round"
            strokeJoin="round"
          >
            {glowColor ? null : gradientNode()}
            <BlurMask blur={glowBlur} style="solid" />
          </Path>
        </Group>
      ) : null}
      <Path path={fillPath} color={color} style="fill" opacity={opacity}>
        {gradientNode()}
      </Path>
      <Path
        path={strokePath}
        color={color}
        style="stroke"
        strokeWidth={strokeWidth}
        strokeCap="round"
        strokeJoin="round"
        opacity={opacity}
      >
        {gradientNode()}
      </Path>
    </Canvas>
  );
}

/**
 * The data-driven Skia audio visualizer. Drive it with the ref handle
 * (`ref.push(levels)`) or a `target` SharedValue; the easing transition is internal.
 */
export const AudioVisualizer = React.forwardRef(AudioVisualizerImpl);
AudioVisualizer.displayName = "AudioVisualizer";
