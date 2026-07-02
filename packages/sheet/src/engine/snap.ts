/**
 * Snap-point geometry.
 *
 * A sheet is a function of one number — the panel's signed `offset` (px), the
 * vertical translation of a full-height panel pinned to the top of the viewport:
 *
 *   - `offset = 0`        → panel top at the viewport top → 100 % visible (fully open).
 *   - `offset = maxHeight`→ panel pushed entirely below the screen → 0 % (closed).
 *
 * A snap *point* is a percentage of the screen the sheet should occupy (0–100,
 * ordered most-visible → least-visible, matching the public API). Its *offset*
 * is therefore `maxHeight * (1 - point / 100)`.
 *
 * Everything here is a pure function over those numbers and is unit-tested in
 * `./__tests__`. All functions are `"worklet"`-tagged so the motion layer can
 * call them on the UI thread; without the reanimated babel plugin (jest/web) the
 * directive is an inert string and they behave as ordinary pure functions.
 */

/** Clamp `v` into `[lo, hi]`. */
export function clamp(v: number, lo: number, hi: number): number {
  "worklet";
  return Math.min(hi, Math.max(lo, v));
}

/** Normalize `-0` → `0` (it survives arithmetic but fails `Object.is`/`toEqual`). */
export function noNegZero(n: number): number {
  "worklet";
  return n + 0;
}

/**
 * The panel translateY at which a snap `point` (0–100 % visible) rests. Rounded
 * to whole px: snap offsets feed the build signature / paint, and sub-pixel
 * values defeat the web float guards (the carousel's documented sub-pixel loop).
 */
export function snapOffset(point: number, maxHeight: number): number {
  "worklet";
  return noNegZero(Math.round(maxHeight * (1 - clamp(point, 0, 100) / 100)));
}

/**
 * Map an ordered list of snap points (most-visible → least-visible) to panel
 * offsets sorted ascending (index 0 = most open). The returned array's index is
 * the public `position` index.
 */
export function snapOffsets(points: number[], maxHeight: number): number[] {
  "worklet";
  return points.map((p) => snapOffset(p, maxHeight)).sort((a, b) => a - b);
}

/** The fully-closed (off-screen) offset. */
export function closedOffset(maxHeight: number): number {
  "worklet";
  return noNegZero(maxHeight);
}

/** Index of the snap offset nearest to `offset` (ties → the more-open one). */
export function nearestSnapIndex(offset: number, offsets: number[]): number {
  "worklet";
  let best = 0;
  let bestDist = Infinity;
  for (let i = 0; i < offsets.length; i++) {
    const d = Math.abs(offsets[i] - offset);
    if (d < bestDist) {
      bestDist = d;
      best = i;
    }
  }
  return best;
}

/**
 * Constrain a live drag offset to the travel range, rubber-banding past either
 * edge at half rate (the carousel's `value * 0.5` damping). `minOffset` is the
 * most-open snap; `maxOffset` is the furthest the panel may travel (the
 * least-open snap, or the closed offset when the sheet is dismissible).
 */
export function clampOffset(
  offset: number,
  minOffset: number,
  maxOffset: number,
  overdrag = true,
): number {
  "worklet";
  if (!overdrag) return clamp(offset, minOffset, maxOffset);
  if (offset < minOffset) return minOffset + (offset - minOffset) * 0.5;
  if (offset > maxOffset) return maxOffset + (offset - maxOffset) * 0.5;
  return offset;
}
