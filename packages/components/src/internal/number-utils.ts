/**
 * Tiny shared numeric helpers. These were independently re-implemented in a
 * half-dozen components (Rating, Slider, ScrollArea, Progress, NumberInput,
 * Input autosize); collapsing them here keeps the behaviour identical and the
 * edge cases (optional bounds, float-safe rounding) defined exactly once.
 *
 * NOTE: `floating/core.ts` keeps its OWN `clamp` on purpose — it has bespoke
 * NaN-avoidance semantics (pins to `min` when `max < min`) that differ from the
 * plain clamp below, so it is not one of the duplicates folded in here.
 */

/** Clamp `value` into the inclusive `[min, max]` range. */
export const clamp = (value: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, value));

/**
 * Clamp with OPTIONAL bounds — an `undefined` bound means "unbounded on that
 * side". Mirrors NumberInput's `clampNumber`.
 */
export const clampOptional = (value: number, min?: number, max?: number): number => {
  let result = value;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) result = max;
  return result;
};

/**
 * Round `value` to `decimals` decimal places (default 0), scaling through an
 * integer to dodge binary-float drift (`roundTo(1.005, 2) === 1.01`). Mirrors
 * NumberInput's `roundTo(n, scale)`.
 */
export const roundTo = (value: number, decimals = 0): number => {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
};
