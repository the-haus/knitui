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

/**
 * Fields every motion accepts. `enabled` is the perf-critical one: a loop is a
 * PERMANENT animation (a compositor `@keyframes` on web, a `withRepeat` on
 * reanimated's UI thread on native), so an instance whose loop is never rendered
 * must not schedule one. Components declare their hooks unconditionally (stable
 * hook order across variant changes) — e.g. `Loader` declares a spin + three
 * pulses but renders only one of them, `Skeleton`/`Indicator` declare a pulse they
 * only use when `animate`/`processing` — so without this gate every instance paid
 * for up to four forever-running animations that nothing displays. Pass the same
 * condition that decides whether the returned `style` is actually spread.
 * @default true
 */
export interface LoopMotionBase {
  /** Schedule the loop at all. `false` → a static first frame, no animation. */
  enabled?: boolean;
}

/** A continuous 360° rotation (the `Loader` oval, `Indicator` processing ring). */
export interface SpinMotion extends LoopMotionBase {
  kind: "spin";
  /** One full revolution, ms. @default 1000 */
  durationMs?: number;
}

/**
 * An opacity throb between {@link PulseMotion.minOpacity} and `1` and back
 * (`Skeleton` shimmer-lite, `Indicator` processing dot). Alternates direction so
 * the loop is seamless without a snap.
 */
export interface PulseMotion extends LoopMotionBase {
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
export interface ShimmerMotion extends LoopMotionBase {
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

/**
 * Whether a resolved motion would actually MOVE anything. A zero-duration loop,
 * or a `shimmer` with no travel, paints an identical frame forever — scheduling it
 * costs a compositor animation (web) / a per-frame UI-thread worklet (native) for
 * no visual result, so both platform files treat it as static. This is why callers
 * can express "not animating right now" as `distance: 0` (`Progress`, `Marquee`
 * before measurement) and pay nothing for it.
 */
export function isMotionInert(motion: ResolvedMotion): boolean {
  if (motion.durationMs <= 0) return true;
  return motion.kind === "shimmer" && motion.distance === 0;
}

/** Whether the loop should be scheduled: explicitly enabled AND visually moving. */
export function isMotionActive(motion: LoopMotion, resolved: ResolvedMotion): boolean {
  return (motion.enabled ?? true) && !isMotionInert(resolved);
}
