import { clamp, noNegZero, offsetFor, rawIndex } from "./offset";
import type { SettleInput, SettleResult } from "./types";

/**
 * How far ahead a release velocity is projected when picking a landing page.
 * The reference uses `velocity * 2` (in offset space); we keep that constant.
 */
export const VELOCITY_PROJECTION = 2;

/**
 * Minimum |velocity| (px/s) that counts as a "flick" for paging. Below this a
 * paging release snaps to the nearest page instead of advancing.
 */
export const FLICK_VELOCITY_THRESHOLD = 300;

/**
 * Pure settle calculation: given where a drag/fling ended, decide where the
 * offset should come to rest. Returns a {@link SettleResult} the motion layer
 * turns into a concrete reanimated animation (`withDecay` / `withTiming` /
 * `withSpring`). This function performs NO animation and has no side effects.
 *
 * Semantics:
 * - `pagingEnabled`: advance at most ±1 page from where the drag left off. A
 *   flick past {@link FLICK_VELOCITY_THRESHOLD} commits one page in the flick
 *   direction even on a short drag; otherwise it snaps to the nearest page.
 * - `snapEnabled` (and not paging): snap to the velocity-projected nearest item
 *   (a hard flick can skip multiple items).
 * - neither: free inertial decay.
 *
 * `min`/`maxScrollDistancePerSwipe` clamp the per-swipe travel relative to
 * `startOffset` (the offset when the drag began); they are skipped if
 * `startOffset` is not supplied. Non-loop targets are clamped to
 * `[0, count - 1]`; loop targets are left un-wrapped (the ring math in
 * `itemProgress` handles wrapping) so the animation travels the short way.
 */
export function settle(input: SettleInput): SettleResult {
  "worklet";
  const {
    offset,
    velocity,
    size,
    count,
    loop,
    pagingEnabled,
    snapEnabled,
    startOffset,
    maxScrollDistancePerSwipe,
    minScrollDistancePerSwipe,
  } = input;

  if (!(size > 0) || count <= 0) {
    return { kind: "decay", velocity };
  }

  const current = rawIndex(offset, size); // fractional page we ended on
  // Velocity in INDEX space (rawIndex negates offset), so a forward fling
  // (negative offset velocity) yields a positive index velocity.
  const indexVelocity = -velocity;

  // Free inertial scroll: neither paging nor snapping.
  if (!pagingEnabled && !snapEnabled) {
    return { kind: "decay", velocity };
  }

  let page: number;

  if (pagingEnabled) {
    // Advance at most one page from the page we are leaving.
    const flick = Math.abs(velocity) >= FLICK_VELOCITY_THRESHOLD ? Math.sign(indexVelocity) : 0;
    if (flick > 0) page = Math.floor(current) + 1;
    else if (flick < 0) page = Math.ceil(current) - 1;
    else page = Math.round(current);
  } else {
    // snapEnabled: velocity-projected nearest item (can skip many on a flick).
    page = Math.round(rawIndex(offset + velocity * VELOCITY_PROJECTION, size));
  }

  // Per-swipe distance caps, measured from where the drag began. Skipped when
  // `startOffset` is not supplied (these are inherently swipe-relative).
  if (startOffset !== undefined && Number.isFinite(startOffset)) {
    const startPage = Math.round(rawIndex(startOffset, size));
    // Total projected travel from the swipe origin (finger drag + fling).
    const projectedTravel = offset + velocity * VELOCITY_PROJECTION - startOffset;

    if (
      minScrollDistancePerSwipe &&
      minScrollDistancePerSwipe > 0 &&
      Math.abs(projectedTravel) < minScrollDistancePerSwipe
    ) {
      page = startPage;
    }

    if (maxScrollDistancePerSwipe && maxScrollDistancePerSwipe > 0) {
      const maxPages = Math.max(1, Math.floor(maxScrollDistancePerSwipe / size));
      page = clamp(page, startPage - maxPages, startPage + maxPages);
    }
  }

  if (!loop) {
    page = clamp(page, 0, count - 1);
  }

  page = noNegZero(page);
  return { kind: "to", target: offsetFor(page, size), page };
}
