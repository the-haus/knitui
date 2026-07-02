/**
 * Offset ↔ index math.
 *
 * The carousel is a function of one number — the signed scroll `offset` (px,
 * forward = negative). Index, progress, and the active item are all DERIVED
 * from it; none of them is ever an independent source of truth.
 *
 * All functions are marked `"worklet"` so the motion layer can call them on the
 * UI thread. Without the reanimated babel plugin (e.g. in jest) the directive is
 * an inert string and the functions behave as ordinary pure functions.
 */

/** Positive modulo: result is always in `[0, m)` for `m > 0`. */
export function mod(n: number, m: number): number {
  "worklet";
  return ((n % m) + m) % m;
}

/** Clamp `v` into `[lo, hi]`. */
export function clamp(v: number, lo: number, hi: number): number {
  "worklet";
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Normalize negative zero to positive zero. `-0` is a real footgun: it survives
 * arithmetic, fails `Object.is`/`toEqual`, and can leak into transforms and
 * SharedValues. The sign convention here (`-index * size`) produces `-0` at
 * index 0, so we scrub it at the source.
 */
export function noNegZero(n: number): number {
  "worklet";
  return n + 0;
}

/** Fractional item position for a given offset (forward = negative offset). */
export function rawIndex(offset: number, size: number): number {
  "worklet";
  return noNegZero(-offset / size);
}

/** The offset at which item `index` is centered. Inverse of {@link rawIndex}. */
export function offsetFor(index: number, size: number): number {
  "worklet";
  return noNegZero(-index * size);
}

/** Wrap an (integer or fractional) index onto the ring of `count` items. */
export function wrapIndex(i: number, count: number): number {
  "worklet";
  return mod(i, count);
}

/**
 * The integer active index for an offset. Wrapped onto the ring in loop mode,
 * clamped to `[0, count - 1]` otherwise.
 */
export function activeIndex(offset: number, size: number, count: number, loop: boolean): number {
  "worklet";
  const raw = Math.round(rawIndex(offset, size));
  return loop ? mod(raw, count) : clamp(raw, 0, count - 1);
}

/**
 * Fractional "absolute progress" in `[0, count)` (loop) or `[0, count - 1]`
 * (non-loop). This is the single value published to pagination indicators.
 */
export function progressFor(offset: number, size: number, count: number, loop: boolean): number {
  "worklet";
  const raw = rawIndex(offset, size);
  return loop ? mod(raw, count) : clamp(raw, 0, count - 1);
}
