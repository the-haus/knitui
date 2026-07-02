/**
 * Pure, platform-free drag-to-dismiss math — no React, reanimated, or DOM. Shared
 * by `Modal` and `Drawer` (and conceptually aligned with `@knitui/sheet`'s richer
 * snap engine, which this deliberately simplifies to a single dismiss threshold).
 *
 * `"worklet"`-tagged so the motion layer can call it on the UI thread; without the
 * reanimated babel plugin (jest/web) the directive is inert and it behaves as an
 * ordinary pure function.
 */

export interface DismissDecisionInput {
  /** Travel toward the dismiss edge (px; >= 0 toward dismissal, < 0 = rubber-band). */
  offset: number;
  /** Velocity along the dismiss direction (px/s; + toward dismissal). */
  velocity: number;
  /** Panel size along the drag axis (px). */
  extent: number;
  /** Fraction of `extent` past which a slow release dismisses. @default 0.3 */
  threshold?: number;
  /** |velocity| (px/s) that commits the release regardless of distance. @default 500 */
  flickVelocity?: number;
}

/**
 * Decide whether a released drag should dismiss (vs. spring back to rest):
 *  - a fling toward the edge (`velocity >= flickVelocity`) always dismisses,
 *  - a fling back (`velocity <= -flickVelocity`) always returns,
 *  - otherwise dismiss once dragged past `extent * threshold`.
 */
export function shouldDismiss(input: DismissDecisionInput): boolean {
  "worklet";
  const { offset, velocity, extent, threshold = 0.3, flickVelocity = 500 } = input;
  if (!(extent > 0)) return false;
  if (velocity >= flickVelocity) return true;
  if (velocity <= -flickVelocity) return false;
  return offset >= extent * threshold;
}

/**
 * Scrim opacity as the panel is dragged away: full (`maxOpacity`) at rest, fading
 * linearly to 0 once the panel has travelled its full `extent` toward the edge —
 * the same idea as `@knitui/sheet`'s `overlayOpacity`. Pure, `"worklet"`.
 */
export function dragOverlayOpacity(offset: number, extent: number, maxOpacity = 1): number {
  "worklet";
  if (!(extent > 0)) return maxOpacity;
  const t = 1 - offset / extent;
  return Math.min(1, Math.max(0, t)) * maxOpacity;
}
