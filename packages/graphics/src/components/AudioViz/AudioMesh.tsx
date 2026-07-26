/**
 * A flowing gradient-mesh audio visualizer: a full-bleed Skia `RuntimeEffect`
 * (SkSL) whose colour "blobs" swell and drift with the audio. The shader sibling
 * of the shape-based `AudioVisualizer` — it shares the same data head
 * (`useVisualizerSource`: ingestion, the eased `levels` transition, readiness and
 * sizing) and the same imperative `push`/`rest` handle, but instead of building a
 * `SkPath` it derives the shader's uniforms from the eased levels + a drift clock
 * and paints them across the whole canvas with `<Fill><Shader/></Fill>`.
 *
 * Why a separate component (not a `variant`): the variant registry maps levels to
 * `VisualizerShape[]` baked into one `SkPath` painted with a single gradient. A
 * mesh gradient is per-region colour interpolation across the canvas — not a
 * shape — so it needs its own renderer. See `mesh.ts` for the shader + the pure
 * `buildMeshUniformsInto` reducer (which writes into buffers this component owns, so
 * a painted frame allocates only the small record `<Shader>` reads).
 *
 * Web: Storybook's Vite build does NOT run the reanimated worklet Babel plugin, so
 * the uniforms `useDerivedValue` is given an explicit `dependencies` array and a
 * `readyValue` SharedValue mirrors CanvasKit readiness; the `RuntimeEffect` is only
 * compiled once `ready` (CanvasKit on the global), and an inert canvas renders
 * until then. Reduced motion (and `speed={0}`) freezes the idle drift — which also
 * stops the drift clock, so a frozen mesh does no per-frame work at all; audio
 * reactivity stays.
 */
import * as React from "react";
import {
  type SharedValue,
  useDerivedValue,
  useFrameCallback,
  useReducedMotion,
  useSharedValue,
} from "react-native-reanimated";

import {
  Canvas,
  Fill,
  Group,
  Shader,
  Skia,
  type SkRuntimeEffect,
} from "@shopify/react-native-skia";

import type { AudioVisualizerHandle } from "./AudioVisualizer";
import {
  buildMeshUniformsInto,
  createMeshUniformScratch,
  DEFAULT_MESH_PALETTE,
  DEFAULT_MESH_POINTS,
  DEFAULT_MESH_SOFTNESS,
  DEFAULT_MESH_SPEED,
  MAX_MESH_POINTS,
  MESH_GRADIENT_SKSL,
  type MeshOptions,
  type MeshUniformsFlat,
  resolveMeshColors,
} from "./mesh";
import type { SpectrumInput } from "./spectrum";
import { useVisualizerSource } from "./useVisualizerSource";

/** Stand-in for "no levels yet" (pre-layout / pre-CanvasKit) — never mutated. */
const EMPTY_LEVELS: number[] = [];

/** A mesh wants area to flow in — taller than the 48px bar default. */
export const DEFAULT_MESH_HEIGHT = 160;
export const DEFAULT_MESH_COUNT = 48;
export const DEFAULT_MESH_SMOOTHING = 0.3;

export interface AudioMeshProps {
  /** Number of spectrum bands tracked. Default 48. */
  count?: number;
  /** Fixed width in px. Omit for a responsive `width: "100%"` canvas. */
  width?: number;
  /** Canvas height in px. Default 160. */
  height?: number;
  /**
   * Palette spread across the control points — an array of hex colours
   * (`#rgb`/`#rrggbb`). Interpolated so each blob gets a distinct colour even when
   * the palette is short. Default cyan→indigo→pink.
   */
  colors?: string[];
  /** Colour control points (blobs), `1..6`. Default 5. */
  points?: number;
  /** Base blob radius in normalized canvas units before audio swell. Default 0.45. */
  softness?: number;
  /** Idle-drift rate multiplier. `0` freezes the orbit (blobs still pulse). Default 1. */
  speed?: number;
  /** Canvas background (shows through where the field is dark/translucent). */
  backgroundColor?: string;
  /** Overall opacity `0..1`. Default 1. */
  opacity?: number;
  /**
   * Attack/release smoothing, `0..1`. `0` snaps to each target; higher values let
   * the field glide and decay. Default 0.3. Forced to 0 under reduced motion.
   */
  smoothing?: number;
  /** Rise smoothing `0..1` override — lower = snappier. Defaults to `smoothing`. */
  attack?: number;
  /** Fall smoothing `0..1` override — higher = a slower tail. Defaults to `smoothing`. */
  release?: number;
  /** Rise time constant (ms) override; makes a sparse/low-rate FFT feed smooth at 60fps. */
  responseTime?: number;
  /** Accessible label. */
  label?: string;
  /** Optional external target SharedValue (continuous loop while mounted). */
  target?: SharedValue<number[]>;
  /** Declarative fallback: pushed whenever the value changes (re-renders per tick). */
  levels?: number[];
  /** What pushed data carries: final `"levels"` (default) or raw `"fft"` magnitudes. */
  input?: "levels" | "fft";
  /** How `input="fft"` magnitudes are scaled. Default `"byte"`. */
  fftScale?: SpectrumInput;
  /** `input="fft"`: dB mapped to `0` (floor). Default `-90`. */
  minDb?: number;
  /** `input="fft"`: dB mapped to `1` (ceiling). Default `-10`. */
  maxDb?: number;
  /** `input="fft"`: first magnitude bin to include (skip DC). Default `1`. */
  minBin?: number;
  /** `input="fft"`: last magnitude bin to include. Default = pushed length. */
  maxBin?: number;
}

function AudioMeshImpl(
  props: AudioMeshProps,
  ref: React.Ref<AudioVisualizerHandle>,
): React.ReactElement {
  const {
    count = DEFAULT_MESH_COUNT,
    width,
    height = DEFAULT_MESH_HEIGHT,
    colors,
    points = DEFAULT_MESH_POINTS,
    softness = DEFAULT_MESH_SOFTNESS,
    speed = DEFAULT_MESH_SPEED,
    backgroundColor,
    opacity = 1,
    smoothing = DEFAULT_MESH_SMOOTHING,
    attack,
    release,
    responseTime,
    label = "Audio gradient mesh",
    target,
    levels: levelsProp,
    input = "levels",
    fftScale = "byte",
    minDb,
    maxDb,
    minBin,
    maxBin,
  } = props;

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

  // Resolve the hex palette into per-point rgb floats ONCE (hex parsing can't run
  // in a worklet); the worklet just copies them into the fixed-length uniform.
  const activePoints = Math.max(1, Math.min(MAX_MESH_POINTS, Math.round(points)));
  const meshColors = React.useMemo(
    () => resolveMeshColors(colors ?? DEFAULT_MESH_PALETTE, activePoints),
    [colors, activePoints],
  );
  const meshOpts = React.useMemo<MeshOptions>(
    () => ({ points: activePoints, softness, colors: meshColors }),
    [activePoints, softness, meshColors],
  );

  // The drift clock (elapsed ms). Reduced motion freezes drift at t=0 (blobs still
  // pulse with the audio); otherwise scale by `speed`.
  //
  // It is OUR clock rather than Skia's `useClock()` because that one runs its frame
  // callback for as long as the component is mounted, and every tick dirties the
  // uniforms mapper below — so a mesh whose drift is frozen (`prefers-reduced-motion`,
  // or `speed={0}`) still rebuilt its uniforms and repainted a full-canvas fragment
  // shader 60 times a second to produce pixel-identical output. Stopping the frame
  // callback stops the writes, which stops the mapper, which stops the repaint: with
  // the drift frozen the mesh now only repaints when the AUDIO moves it.
  const reducedMotion = useReducedMotion();
  const clock = useSharedValue(0);
  const drifting = !reducedMotion && speed !== 0;
  const frame = useFrameCallback((info) => {
    "worklet";
    clock.value = info.timeSinceFirstFrame;
  }, false);
  React.useEffect(() => {
    frame.setActive(drifting);
  }, [drifting, frame]);

  // Compile the effect once CanvasKit is ready (web must wait; native is always
  // ready). `Make` returns null on a compile error → inert canvas below.
  const effect = React.useMemo<SkRuntimeEffect | null>(
    () => (ready ? Skia.RuntimeEffect.Make(MESH_GRADIENT_SKSL) : null),
    [ready],
  );

  // Per-frame uniforms from the eased levels + the clock, written into buffers this
  // instance owns (only the small record wrapping them is fresh each frame — it has
  // to be, or reanimated skips the SharedValue write and `<Shader>` never updates).
  // Explicit `dependencies` REQUIRED on web (no worklet Babel plugin under Vite).
  const scratch = React.useMemo(createMeshUniformScratch, []);
  const uniforms = useDerivedValue<MeshUniformsFlat>(() => {
    "worklet";
    const w = size.value.width;
    const h = size.value.height;
    if (!readyValue.value || w <= 0 || h <= 0) {
      return buildMeshUniformsInto(EMPTY_LEVELS, w, h, 0, meshOpts, scratch);
    }
    const t = drifting ? (clock.value / 1000) * speed : 0;
    return buildMeshUniformsInto(levels.value, w, h, t, meshOpts, scratch);
  }, [levels, size, clock, readyValue, meshOpts, speed, drifting, scratch]);

  const style = React.useMemo(
    () => ({ width: width ?? ("100%" as const), height, backgroundColor }),
    [width, height, backgroundColor],
  );

  if (!ready || !effect) {
    return (
      <Canvas style={style} onSize={size} accessibilityRole="image" accessibilityLabel={label} />
    );
  }

  const body = (
    <Fill>
      <Shader source={effect} uniforms={uniforms} />
    </Fill>
  );
  return (
    <Canvas style={style} onSize={size} accessibilityRole="image" accessibilityLabel={label}>
      {opacity < 1 ? <Group opacity={opacity}>{body}</Group> : body}
    </Canvas>
  );
}

/**
 * The flowing gradient-mesh audio visualizer. Drive it with the ref handle
 * (`ref.push(levels)`) or a `target` SharedValue, exactly like `AudioVisualizer`.
 */
export const AudioMesh = React.forwardRef(AudioMeshImpl);
AudioMesh.displayName = "AudioMesh";
