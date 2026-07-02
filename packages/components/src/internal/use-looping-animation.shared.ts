import { DURATIONS } from "@knitui/core";

/**
 * Shared types + timing math for the cross-platform looping-animation primitive
 * (`use-looping-animation` web / `.native`). Continuous, compositor/UI-thread
 * driven loops — spin, pulse, shimmer — with NO `setInterval` and NO per-frame
 * React re-render. The two platform files implement the same {@link LoopMotion}
 * vocabulary: web injects `@keyframes` once + an inline `animation*` style; native
 * drives a reanimated `useSharedValue` + `withRepeat`. Reduced motion renders a
 * static first frame on both.
 *
 * This is the single source of truth for the motion union + its defaults so the
 * two implementations can never drift.
 */

/** A continuous 360° rotation (the `Loader` oval, `Indicator` processing ring). */
export interface SpinMotion {
  kind: "spin";
  /** One full revolution, ms. @default 1000 */
  durationMs?: number;
}

/**
 * An opacity throb between {@link PulseMotion.minOpacity} and `1` and back
 * (`Skeleton` shimmer-lite, `Indicator` processing dot). Alternates direction so
 * the loop is seamless without a snap.
 */
export interface PulseMotion {
  kind: "pulse";
  /** One half-cycle (full→min OR min→full), ms. @default 600 */
  durationMs?: number;
  /** Dimmest opacity at the trough. @default 0.4 */
  minOpacity?: number;
}

/**
 * A repeating translate offset — the `Marquee` scroll and `Progress`/`Skeleton`
 * stripe shimmer. Slides from `0` to ±{@link ShimmerMotion.distance} along one
 * axis, then snaps back (the repeated copies make the snap invisible). Linear so
 * the speed is constant.
 */
export interface ShimmerMotion {
  kind: "shimmer";
  /** One full slide of `distance`, ms. @default 1000 */
  durationMs?: number;
  /** Travel along the axis, px. Negative reverses direction. @default 0 */
  distance?: number;
  /** Translate axis. @default "x" */
  axis?: "x" | "y";
}

/** The motion the loop plays. Discriminated on `kind`. */
export type LoopMotion = SpinMotion | PulseMotion | ShimmerMotion;

/** Resolved (defaults applied) motion config — internal to the platform files. */
export type ResolvedMotion =
  | { kind: "spin"; durationMs: number }
  | { kind: "pulse"; durationMs: number; minOpacity: number }
  | { kind: "shimmer"; durationMs: number; distance: number; axis: "x" | "y" };

/** Apply the documented defaults to a {@link LoopMotion}. */
export function resolveMotion(motion: LoopMotion): ResolvedMotion {
  switch (motion.kind) {
    case "spin":
      return { kind: "spin", durationMs: motion.durationMs ?? DURATIONS.loop };
    case "pulse":
      return {
        kind: "pulse",
        durationMs: motion.durationMs ?? DURATIONS.ambient,
        minOpacity: motion.minOpacity ?? 0.4,
      };
    case "shimmer":
      return {
        kind: "shimmer",
        durationMs: motion.durationMs ?? DURATIONS.loop,
        distance: motion.distance ?? 0,
        axis: motion.axis ?? "x",
      };
  }
}
