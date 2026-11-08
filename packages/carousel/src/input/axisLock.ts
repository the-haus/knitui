/**
 * Per-drag axis lock, shared by the single- and two-axis pan.
 *
 * A drag picks its axis ONCE, from the first {@link AXIS_LOCK_DISTANCE} px of
 * movement, and keeps it for the rest of the drag: a drag that starts sideways
 * and then turns stays sideways. Pure worklet, so it is unit-testable and runs
 * on the UI thread inside the gesture.
 */

/** Movement (px, along either axis) after which a drag commits to an axis. */
export const AXIS_LOCK_DISTANCE = 10;

/** Not decided yet: under {@link AXIS_LOCK_DISTANCE} (still a tap). */
export const LOCK_NONE = -1;
/** The carousel's own axis (`vertical` picks it). */
export const LOCK_MAIN = 0;
/** The other axis, on a two-axis deck. */
export const LOCK_CROSS = 1;
/** The other axis on a single-axis carousel: not ours, the drag is ignored. */
export const LOCK_REJECT = 2;

/**
 * Decide the axis of a drag from its translation so far.
 *
 * The dominant axis wins; an exact tie (a 45° diagonal) goes to the MAIN axis,
 * so the choice is deterministic. Under the lock distance it stays undecided.
 */
export function decideAxis(
  translationX: number,
  translationY: number,
  vertical: boolean,
  twoAxis: boolean,
): number {
  "worklet";
  const main = Math.abs(vertical ? translationY : translationX);
  const cross = Math.abs(vertical ? translationX : translationY);
  if (Math.max(main, cross) < AXIS_LOCK_DISTANCE) return LOCK_NONE;
  if (main >= cross) return LOCK_MAIN;
  return twoAxis ? LOCK_CROSS : LOCK_REJECT;
}
