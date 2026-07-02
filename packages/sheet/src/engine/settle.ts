import { nearestSnapIndex, noNegZero } from "./snap";
import type { SettleInput, SettleResult } from "./types";

/** Seconds of velocity projected past the release point when picking a landing. */
export const VELOCITY_PROJECTION = 0.2;

/** |velocity| (px/s) above which a release commits in the fling direction. */
export const FLICK_VELOCITY_THRESHOLD = 300;

/**
 * Pure settle calculation: given where a drag/fling ended, decide which snap the
 * panel should come to rest at (or whether it should dismiss). Returns a
 * {@link SettleResult} the motion layer turns into a concrete reanimated
 * animation. Performs NO animation and has no side effects.
 *
 * Semantics:
 *  - The release point is projected forward by `velocity * projection`, so a
 *    hard flick can skip past intermediate snaps — matching native sheet feel.
 *  - The projected point snaps to the nearest target. When `dismissible`, the
 *    closed offset is one of the candidates, so a strong downward fling (or a
 *    slow drag past the lowest snap) lands on it and dismisses.
 *  - A flick faster than {@link FLICK_VELOCITY_THRESHOLD} biases at least one
 *    step in the fling direction even on a short drag, so a quick flick is never
 *    swallowed by proximity to the starting snap.
 */
export function settle(input: SettleInput): SettleResult {
  "worklet";
  const {
    offset,
    velocity,
    offsets,
    dismissOffset,
    dismissible,
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

  const projected = offset + velocity * projection;

  // Nearest candidate to the projected point.
  let landing = 0;
  let bestDist = Infinity;
  for (let i = 0; i < candidates.length; i++) {
    const d = Math.abs(candidates[i] - projected);
    if (d < bestDist) {
      bestDist = d;
      landing = i;
    }
  }

  // Flick bias: a fast release nudges at least one candidate in its direction,
  // so a quick flick from rest still advances. (down = +velocity = higher index.)
  if (Math.abs(velocity) >= flickThreshold) {
    const from = nearestSnapIndex(offset, candidates);
    if (velocity > 0 && landing <= from) landing = Math.min(candidates.length - 1, from + 1);
    else if (velocity < 0 && landing >= from) landing = Math.max(0, from - 1);
  }

  if (landing === dismissCandidate) {
    return { index: -1, offset: dismissOffset, dismiss: true };
  }
  return { index: landing, offset: noNegZero(offsets[landing]), dismiss: false };
}
