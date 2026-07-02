/**
 * The shared data "head" of the data-driven visualizers — everything between the
 * caller's pushed data and the renderer's `useDerivedValue`. Both the shape-based
 * `AudioVisualizer` and the shader-based `AudioMesh` consume it so the tuned
 * ingestion + transition + readiness + sizing logic lives in ONE place.
 *
 * It owns:
 *   - readiness (`useGraphicsReady()` + CanvasKit-on-`globalThis` on web), mirrored
 *     into a `readyValue` SharedValue so path/uniform worklets recompute once
 *     CanvasKit finishes loading on web;
 *   - the easing transition (`useLevelTransition`) and its `levels` SharedValue;
 *   - the ingestion reducer: with `input="fft"` a (possibly large) magnitude row is
 *     reduced to `count` log-bands by a memoized `createSpectrumMapper` writing into
 *     a reused scratch buffer (zero per-frame allocation, only `count` values kept);
 *   - the canvas `size` SharedValue, populated by Skia's `<Canvas onSize>` (so
 *     geometry reacts to resize without a layout-measuring `react-native` `View`).
 *
 * The renderer supplies the `<Canvas onSize={size}>` and turns `levels` into Skia.
 */
import * as React from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";

import { isWeb } from "@knitui/core";

import { useGraphicsReady } from "../../provider";
import { createSpectrumMapper, type SpectrumInput, type SpectrumMapper } from "./spectrum";
import { useLevelTransition } from "./useLevelTransition";

/** Web needs CanvasKit on the global before any Skia call. Native is always ready. */
export function canvasKitReady(): boolean {
  if (!isWeb) return true;
  return typeof (globalThis as { CanvasKit?: unknown }).CanvasKit !== "undefined";
}

/** Inputs to the source hook — the data/transition/reduction knobs the renderers share. */
export interface VisualizerSourceOptions {
  /** Number of levels (bars/bands). */
  count: number;
  /** Attack/release smoothing, `0..1`. */
  smoothing: number;
  /** Rise smoothing `0..1` override. */
  attack?: number | undefined;
  /** Fall smoothing `0..1` override. */
  release?: number | undefined;
  /** Rise time constant (ms) override. */
  responseTime?: number | undefined;
  /** Optional external target SharedValue (continuous loop while mounted). */
  target?: SharedValue<number[]> | undefined;
  /** Declarative fallback levels — pushed whenever the value changes. */
  levels?: number[] | undefined;
  /** What pushed data carries: final `"levels"` or raw `"fft"` magnitudes. */
  input: "levels" | "fft";
  /** How `input="fft"` magnitudes are scaled. */
  fftScale: SpectrumInput;
  minDb?: number | undefined;
  maxDb?: number | undefined;
  minBin?: number | undefined;
  maxBin?: number | undefined;
}

export interface VisualizerSource {
  /** The eased levels (`0..1`), written off the React render path. */
  levels: SharedValue<number[]>;
  /** Push a new target state (raw FFT or final levels per `input`). */
  push: (data: ArrayLike<number>) => void;
  /** Decay to rest (silence). */
  rest: () => void;
  /** Whether the graphics runtime + CanvasKit are ready (JS boolean). */
  ready: boolean;
  /** `ready` mirrored into a SharedValue so worklets recompute when it flips. */
  readyValue: SharedValue<boolean>;
  /** Canvas size — wire to `<Canvas onSize={size}>`. */
  size: SharedValue<{ width: number; height: number }>;
}

/**
 * The shared transition + ingestion + readiness + sizing head. Pass the result's
 * `size` to `<Canvas onSize>` and read `levels`/`readyValue` from a renderer
 * `useDerivedValue`. Returns `push`/`rest` for the imperative handle.
 */
export function useVisualizerSource(opts: VisualizerSourceOptions): VisualizerSource {
  const {
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
  } = opts;

  const ready = useGraphicsReady() && canvasKitReady();

  // The eased levels + the imperative push/rest — the transition lives in here.
  const {
    levels,
    push: pushLevels,
    rest,
  } = useLevelTransition({ count, smoothing, attack, release, responseTime, target });

  // Ingestion reducer: keep ONLY the data the visualization needs. With
  // `input="fft"` a (potentially large) magnitude row is reduced to `count`
  // log-bands by a `createSpectrumMapper` configured from the current settings —
  // memoized (rebuilt only when the settings or pushed length change) and writing
  // into a reused scratch buffer, so a low-rate producer pushes the whole spectrum
  // with zero per-frame allocation and only `count` values are ever kept.
  const mapperRef = React.useRef<{ mapper: SpectrumMapper; key: string } | null>(null);
  const scratchRef = React.useRef<number[]>([]);
  const reduce = React.useCallback(
    (data: ArrayLike<number>): ArrayLike<number> => {
      if (input !== "fft") return data;
      const key = `${count}|${fftScale}|${minDb}|${maxDb}|${minBin}|${maxBin}|${data.length}`;
      let entry = mapperRef.current;
      if (!entry || entry.key !== key) {
        entry = {
          key,
          mapper: createSpectrumMapper({
            bins: data.length,
            bands: count,
            input: fftScale,
            minDb,
            maxDb,
            minBin,
            maxBin,
          }),
        };
        mapperRef.current = entry;
      }
      return entry.mapper(data, scratchRef.current);
    },
    [input, count, fftScale, minDb, maxDb, minBin, maxBin],
  );

  const push = React.useCallback(
    (data: ArrayLike<number>) => pushLevels(reduce(data)),
    [pushLevels, reduce],
  );

  // Declarative fallback: push whenever the `levels` prop changes.
  React.useEffect(() => {
    if (levelsProp) push(levelsProp);
  }, [levelsProp, push]);

  // Mirror `ready` into a SharedValue so the worklets recompute when CanvasKit
  // finishes loading on web (a plain JS boolean wouldn't re-run them).
  const readyValue = useSharedValue(false);
  React.useEffect(() => {
    readyValue.value = ready;
  }, [ready, readyValue]);

  // Canvas size, populated by Skia's `onSize` on both platforms. A `{ width, height }`
  // SharedValue, so geometry can react to resize from inside the worklets without a
  // layout-measuring `View` (keeps `@knitui/graphics` free of `react-native` here).
  const size = useSharedValue<{ width: number; height: number }>({ width: 0, height: 0 });

  return { levels, push, rest, ready, readyValue, size };
}
