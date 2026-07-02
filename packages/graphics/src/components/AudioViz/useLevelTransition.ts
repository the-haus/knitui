/**
 * The transition engine for the data-driven visualizers — the part the caller
 * never sees. An external driver supplies new TARGET states (rows of `0..1`
 * levels) at whatever irregular rate it likes (`push()`, or an external `target`
 * SharedValue); this hook eases the DISPLAYED levels toward that target on the
 * display clock and publishes them into ONE `levels` SharedValue, entirely off
 * the React render path. The renderer turns that into `SkPath`s in a
 * `useDerivedValue`.
 *
 * Why it's efficient (see `docs/skia-reanimated-animation.md`):
 *   - Rule 4 — paints are paced by a `requestAnimationFrame` loop (display clock),
 *     NOT by the bursty data clock, so jittery `push()` delivery never shows as
 *     jank. The loop self-suspends when everything is at rest and restarts on the
 *     next `push()`, so an idle visualizer costs ~0.
 *   - Rule 3 — each frame publishes a fresh `levels` array, so the assignment is a
 *     new reference reanimated detects. (A reused buffer can't be re-mutated once
 *     it's been assigned to a SharedValue under reanimated v4 — see the tick.)
 *   - Rule 1 — nothing here calls `setState`; the only output is a SharedValue write.
 *   - Rule 11 — reduced motion forces the smoothing to 0 (snap to each target).
 *
 * `target` SV mode: reanimated v4 can't portably listen to SharedValue writes from
 * the JS thread (see the `reanimated4-listener-platform-split` note), so when a
 * `target` SV is supplied the loop polls `target.value` each frame and runs
 * continuously while mounted — it trades the idle self-suspend for not needing a
 * listener. The `push()` path keeps the self-suspending optimization.
 */
import * as React from "react";
import { type SharedValue, useReducedMotion, useSharedValue } from "react-native-reanimated";

import { createTimeSmoother } from "@knitui/core";

/**
 * No `push()` for this long ⇒ the source went quiet: decay the levels to rest and
 * let the loop suspend. ~10 frames at 60 fps.
 */
const IDLE_MS = 160;
/** Levels below this (and a silent target) count as "at rest" — suspend the loop. */
const REST_EPS = 1e-3;

/** Monotonic clock for the paint loop; falls back when `performance` is absent. */
function nowMs(): number {
  const perf = (globalThis as { performance?: { now(): number } }).performance;
  return perf && typeof perf.now === "function" ? perf.now() : Date.now();
}

/** True if every entry of `a` is below `REST_EPS`. */
function atRest(a: ArrayLike<number>): boolean {
  for (let i = 0; i < a.length; i++) if (a[i] > REST_EPS) return false;
  return true;
}

export interface LevelTransition {
  /**
   * The eased levels (`0..1`), written off the React render path. Pass it to a
   * `useDerivedValue` that builds the `SkPath`(s) — never read it during render.
   */
  levels: SharedValue<number[]>;
  /** Push a new target state (a row of `count` levels). Cheap; no React render. */
  push: (next: ArrayLike<number>) => void;
  /** Decay to rest (silence) — e.g. on stop/unmount. */
  rest: () => void;
}

export interface LevelTransitionOptions {
  /** Number of levels (bars). Buffers + the smoother are sized to this. */
  count: number;
  /** Attack/release smoothing `0..1`. `0` snaps; forced to 0 under reduced motion. */
  smoothing: number;
  /**
   * Rise smoothing `0..1`, overriding the rising half of `smoothing`. Lower =
   * snappier attack (peaks pop). Defaults to the `smoothing`-derived value.
   */
  attack?: number | undefined;
  /**
   * Fall smoothing `0..1`, overriding the falling half of `smoothing`. Higher =
   * slower decay (a VU-meter tail). Defaults to the `smoothing`-derived value.
   */
  release?: number | undefined;
  /**
   * The rise time constant in MILLISECONDS, overriding the `smoothing`→time
   * mapping. The direct, rate-independent control: the same value glides the same
   * way whether you push targets at 10 Hz or 60 Hz. Release defaults to ~3× this
   * (or the explicit `release`). Use it to make a sparse FFT feed smooth.
   */
  responseTime?: number | undefined;
  /**
   * Optional external target. When provided, the loop polls `target.value` each
   * frame and runs continuously while mounted (no idle self-suspend).
   */
  target?: SharedValue<number[]> | undefined;
}

/** `0..1` amount → time constant (ms) at amount = 1. Attack peaks faster than release. */
const ATTACK_MAX_MS = 70;
const RELEASE_MAX_MS = 200;

export function useLevelTransition(opts: LevelTransitionOptions): LevelTransition {
  const { count, smoothing, attack, release, responseTime, target } = opts;

  // The ONE animated input: the eased bar levels (0..1), written by the rAF loop.
  const levels = useSharedValue<number[]>(new Array<number>(count).fill(0));

  // Reduced motion disables easing (snap to each target); otherwise glide.
  const reducedMotion = useReducedMotion();

  // A TIME-BASED smoother, rebuilt only when count or timing changes. Easing is
  // keyed on real elapsed time (a time constant in ms), NOT a per-frame fraction —
  // so the same settings give the same glide at 10 Hz or 60 Hz, letting a sparse
  // feed still produce smooth 60 fps motion. `smoothing` (0..1) sets both halves;
  // `attack`/`release` (0..1) override them; `responseTime` (ms) sets them directly.
  // Reduced motion snaps everything (τ = 0).
  const smoother = React.useMemo(() => {
    if (reducedMotion) return createTimeSmoother(count, 0, 0);
    let attackTau = (attack ?? smoothing) * ATTACK_MAX_MS;
    let releaseTau = (release ?? smoothing) * RELEASE_MAX_MS;
    if (responseTime != null) {
      attackTau = responseTime;
      if (release == null) releaseTau = responseTime * (RELEASE_MAX_MS / ATTACK_MAX_MS);
    }
    return createTimeSmoother(count, attackTau, releaseTau);
  }, [count, reducedMotion, smoothing, attack, release, responseTime]);

  // Loop state: the latest reduced TARGET (data rate) plus idle bookkeeping. Each
  // frame publishes a FRESH `levels` array (see the tick). A reused ping-pong
  // buffer can't be used here: reanimated v4 converts an array assigned to a
  // SharedValue into a serializable and flags any later mutation of it ("Tried to
  // modify key N of an object which has been already passed to a worklet"). A
  // `count`-length array per frame is negligible and the loop self-suspends idle.
  const targetRef = React.useRef<Float32Array>(new Float32Array(count));
  const runningRef = React.useRef(false);
  const rafRef = React.useRef(0);
  const lastSampleMsRef = React.useRef(0);

  // `push`/`rest` are stable across renders but must reach the CURRENT loop, so
  // they route through refs the loop effect keeps fresh.
  const countRef = React.useRef(count);
  countRef.current = count;
  const startLoopRef = React.useRef<() => void>(() => {});

  const push = React.useCallback((next: ArrayLike<number>) => {
    const n = countRef.current;
    const t = targetRef.current;
    for (let i = 0; i < n; i++) t[i] = i < next.length ? next[i] : 0;
    lastSampleMsRef.current = nowMs();
    startLoopRef.current();
  }, []);

  const rest = React.useCallback(() => {
    targetRef.current.fill(0);
    // Leave `lastSampleMs` stale so the idle gate keeps the target at zero; start
    // the loop so the smoother animates the decay down to rest, then suspends.
    startLoopRef.current();
  }, []);

  React.useEffect(() => {
    // (Re)size the buffers for the current count and clear history.
    smoother.reset();
    targetRef.current = new Float32Array(count);

    const raf = (globalThis as { requestAnimationFrame?: (cb: () => void) => number })
      .requestAnimationFrame;
    const caf = (globalThis as { cancelAnimationFrame?: (id: number) => void })
      .cancelAnimationFrame;
    const hasTarget = !!target;
    // Real elapsed time per frame drives the time-based easing (frame-rate
    // independent). Clamped so a tab-switch / long stall doesn't snap in one jump.
    let lastFrameMs = nowMs();

    // DISPLAY-paced loop: ease toward the latest target and publish the eased
    // levels into the `levels` SharedValue (a fresh ping-ponged buffer so the
    // change is detected). No push for IDLE_MS ⇒ the source went quiet, so decay
    // to zero and, once at rest, suspend (unless externally target-driven).
    const tick = (): void => {
      const frameMs = nowMs();
      let dt = frameMs - lastFrameMs;
      lastFrameMs = frameMs;
      if (dt < 1) dt = 1;
      else if (dt > 64) dt = 64;

      const t = targetRef.current;
      if (target) {
        // Poll the external target SV (we can't listen to its writes portably).
        const ext = target.value;
        for (let i = 0; i < count; i++) t[i] = i < ext.length ? ext[i] : 0;
        if (!atRest(t)) lastSampleMsRef.current = frameMs;
      }
      if (frameMs - lastSampleMsRef.current > IDLE_MS) t.fill(0);
      const eased = smoother(t, dt);
      // Fresh array each frame — must NOT reuse/mutate one already assigned to the
      // SharedValue: reanimated v4 serializes it on assignment and warns on any
      // later mutation. The smoother's own buffer is reused too, so copy out of it.
      const out = new Array<number>(count);
      for (let i = 0; i < count; i++) out[i] = eased[i];
      levels.value = out;
      if (!hasTarget && atRest(t) && atRest(eased)) {
        runningRef.current = false;
        return;
      }
      rafRef.current = raf ? raf(tick) : 0;
    };
    const startLoop = (): void => {
      if (runningRef.current || !raf) return;
      runningRef.current = true;
      lastFrameMs = nowMs();
      rafRef.current = raf(tick);
    };
    startLoopRef.current = startLoop;

    // Externally target-driven ⇒ run continuously from mount.
    if (hasTarget) startLoop();

    return () => {
      if (caf && rafRef.current) caf(rafRef.current);
      runningRef.current = false;
      rafRef.current = 0;
      startLoopRef.current = () => {};
      smoother.reset();
      levels.value = new Array<number>(count).fill(0);
    };
  }, [count, smoother, target, levels]);

  return { levels, push, rest };
}
