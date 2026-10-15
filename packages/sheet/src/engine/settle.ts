import { nearestSnapIndex, noNegZero } from "./snap";
import type { SettleInput, SettleResult } from "./types";

/** Seconds of velocity projected past the release point when picking a landing. */
export const VELOCITY_PROJECTION = 0.2;

/**
 * |velocity| (px/s) at or above which a release counts as a fling. 300 was low
 * enough that the release velocity of an unhurried touch drag crossed it, so
 * a drag meant to stop at a snap was treated as a flick (KIT-09).
 */
export const FLICK_VELOCITY_THRESHOLD = 500;

/**
 * Pure settle calculation: given where a drag/fling ended, decide which snap the
 * panel should come to rest at (or whether it should dismiss). Returns a
 * {@link SettleResult} the motion layer turns into a concrete reanimated
 * animation. Performs NO animation and has no side effects.
 *
 * Semantics:
 *  - A SLOW release (|velocity| under the flick threshold) lands on the snap
 *    nearest the release point. Nothing else moves it.
 *  - A FLING projects the release point forward by `velocity * projection` and
 *    takes the nearest candidate to that, so a quick flick carries on past the
 *    midpoint it was released short of.
 *  - A fling that would land back on the snap the drag STARTED from (and was
 *    released nearest that snap) advances one step in the fling direction, so a
 *    quick flick from rest is never swallowed by proximity to where it began.
 *    The bias is relative to the START snap (`startOffset`), never the release
 *    point: measured from the release point, a drag from peek released just past
 *    half — fast enough to cross the threshold, slow by any reading — was
 *    "advanced" from half to full (KIT-09).
 *  - A fling never lands more than ONE snap past the snap nearest the release
 *    point, in its direction: a flick goes to the next detent, it does not jump
 *    the whole sheet.
 *  - When `dismissible`, the closed offset is one more candidate below the
 *    lowest snap, so a slow drag past it or a fling down from it dismisses.
 */
export function settle(input: SettleInput): SettleResult {
  "worklet";
  const {
    offset,
    velocity,
    offsets,
    dismissOffset,
    dismissible,
    startOffset,
    flickThreshold = FLICK_VELOCITY_THRESHOLD,
    projection = VELOCITY_PROJECTION,
  } = input;

  if (offsets.length === 0) {
    return { index: -1, offset: dismissOffset, dismiss: dismissible };
  }

  // Candidate landings: the snaps, plus the closed offset when dismissible.
  // Track which candidate is the dismiss target by index sentinel.
  const candidates = dismissible ? [...offsets, dismissOffset] : offsets.slice();
  const dismissCandidate = dismissible ? candidates.length - 1 : -1;
  const last = candidates.length - 1;

  const released = nearestSnapIndex(offset, candidates);
  let landing = released;

  if (Math.abs(velocity) >= flickThreshold) {
    landing = nearestSnapIndex(offset + velocity * projection, candidates);
    // Without a start offset (a caller that doesn't track one) the release
    // snap stands in for it — a flick then advances from where it let go.
    const from = startOffset == null ? released : nearestSnapIndex(startOffset, candidates);
    // (down = +velocity = higher index.)
    if (velocity > 0) {
      if (landing <= from && released === from) landing = Math.min(last, from + 1);
      landing = Math.min(landing, released + 1);
    } else {
      if (landing >= from && released === from) landing = Math.max(0, from - 1);
      landing = Math.max(landing, released - 1);
    }
  }

  if (landing === dismissCandidate) {
    return { index: -1, offset: dismissOffset, dismiss: true };
  }
  return { index: landing, offset: noNegZero(offsets[landing]), dismiss: false };
}
