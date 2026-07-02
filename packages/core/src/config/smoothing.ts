/**
 * Per-channel attack/release smoother — the runtime easing primitive behind the
 * data-driven visualizers in `@knitui/graphics` (`AudioVisualizer`). It eases a row
 * of target levels toward a persistent state so values glide instead of snapping
 * each frame.
 *
 * It's a pure number cruncher (no platform imports, no React), so it runs
 * identically on web and native — in the JS reduction step before geometry, or
 * inside a display-clock loop. Allocation-free in steady state: it mutates and
 * returns its OWN buffer, and the caller hands that straight to a Reanimated
 * `SharedValue`, which clones on assignment, so the returned array is safe to
 * reuse next tick.
 *
 * Lives in `@knitui/core` (next to the motion tokens) so any consumer can share ONE
 * implementation without depending on a downstream rendering kit.
 */

/** A stateful smoother: call with the frame's targets, get the eased levels. */
export interface Smoother {
  (target: ArrayLike<number>): number[];
  /** Drop all history back to zero (e.g. on stop/seek). */
  reset(): void;
}

/**
 * Build a smoother over `count` channels. `attack`/`release` are per-frame easing
 * coefficients in `(0, 1]`: the fraction of the gap to the target closed each
 * tick when rising (`attack`) vs falling (`release`). `1` = instant. Rising is
 * usually faster than falling so peaks pop but decay gently.
 */
export function createSmoother(count: number, attack: number, release: number): Smoother {
  const state = new Array<number>(count).fill(0);
  const fn = ((target: ArrayLike<number>): number[] => {
    for (let i = 0; i < count; i++) {
      const t = target[i] ?? 0;
      const prev = state[i];
      const coef = t > prev ? attack : release;
      state[i] = prev + (t - prev) * coef;
    }
    return state;
  }) as Smoother;
  fn.reset = () => {
    state.fill(0);
  };
  return fn;
}

/**
 * Map a single `0..1` "smoothing" amount to attack/release coefficients.
 * `0` → instant (no smoothing); `1` → heavily smoothed. Attack always leads
 * release so the visualizer stays responsive to transients.
 */
export function smoothingCoefficients(amount: number): { attack: number; release: number } {
  const a = amount < 0 ? 0 : amount > 1 ? 1 : amount;
  return { attack: 1 - a * 0.65, release: 1 - a * 0.88 };
}

/**
 * A TIME-BASED smoother: like {@link Smoother}, but the easing is driven by the
 * real elapsed time `dtMs` rather than a fixed per-frame fraction. The fraction
 * closed each frame is `1 - e^(-dtMs / τ)`, where `τ` (the time constant, in ms)
 * is how long it takes to close ~63% of the gap.
 *
 * Why it matters: a per-frame coefficient ties "how smooth" to the display frame
 * rate AND the data tick rate, so a sparse feed (say 10 ticks/s) needs different
 * tuning than a 60 Hz one. A time constant is independent of both — the SAME `τ`
 * gives the same glide whether you push targets at 10 Hz or 60 Hz, so a low-rate
 * source still yields smooth 60 fps motion with no retuning. `τ = 0` snaps.
 */
export interface TimeSmoother {
  (target: ArrayLike<number>, dtMs: number): number[];
  /** Drop all history back to zero. */
  reset(): void;
}

/**
 * Build a time-based smoother over `count` channels. `attackTauMs`/`releaseTauMs`
 * are the rising/falling time constants in ms (`0` = instant). Like
 * {@link createSmoother} it mutates and returns its own buffer (allocation-free in
 * steady state). Reuses one `Math.exp` per channel per call — negligible.
 */
export function createTimeSmoother(
  count: number,
  attackTauMs: number,
  releaseTauMs: number,
): TimeSmoother {
  const state = new Array<number>(count).fill(0);
  const fn = ((target: ArrayLike<number>, dtMs: number): number[] => {
    for (let i = 0; i < count; i++) {
      const t = target[i] ?? 0;
      const prev = state[i];
      const tau = t > prev ? attackTauMs : releaseTauMs;
      // `1 - e^(-dt/τ)` is the fraction of the remaining gap to close this frame.
      const coef = tau <= 0 ? 1 : 1 - Math.exp(-dtMs / tau);
      state[i] = prev + (t - prev) * coef;
    }
    return state;
  }) as TimeSmoother;
  fn.reset = () => {
    state.fill(0);
  };
  return fn;
}
