/**
 * Pure swipe-decision math for the deck. No React / DOM / reanimated imports, so
 * every function here is directly unit-testable (mirrors `src/engine`). Each
 * carries a `"worklet"` directive so it can also run inside a gesture worklet on
 * the UI thread; without the reanimated babel plugin (jest) the directive is an
 * inert string and the function is an ordinary pure function.
 */
import { clamp } from "../engine";
import type { SwipeDirection } from "./types";

/** Default release velocity (px/s) that commits a swipe regardless of distance. */
export const DEFAULT_FLICK_VELOCITY = 800;

export interface DecideInput {
  /** Release translation from the card's rest position, px. */
  dx: number;
  dy: number;
  /** Release velocity, px/s. */
  vx: number;
  vy: number;
  /** Card size, px. */
  width: number;
  height: number;
  /** Commit distance as a fraction of the size, 0..1. */
  threshold: number;
  /** Allowed commit directions. */
  directions: SwipeDirection[];
  /** Velocity (px/s) that commits regardless of distance. */
  velocityThreshold?: number;
}

/** Per-axis commitment: did the drag pass the distance OR velocity threshold? */
function axisCommit(
  pos: number,
  vel: number,
  size: number,
  threshold: number,
  flick: number,
): { sign: number; strength: number } | null {
  "worklet";
  const distance = size * threshold;
  const past = distance > 0 && Math.abs(pos) >= distance;
  const fling = Math.abs(vel) >= flick;
  if (!past && !fling) return null;
  // Direction from displacement when it cleared the distance gate, else from the
  // fling velocity (a fast flick with little travel still commits its way).
  const sign = Math.sign(past ? pos : vel);
  if (sign === 0) return null;
  const strength = Math.max(distance > 0 ? Math.abs(pos) / distance : 0, Math.abs(vel) / flick);
  return { sign, strength };
}

/**
 * Decide whether a released drag commits a swipe, and in which direction.
 * Returns the committed {@link SwipeDirection} (the strongest allowed axis) or
 * `null` to snap the card back. Screen coords: `+dy` is down, `-dy` is up.
 */
export function decideSwipe(input: DecideInput): SwipeDirection | null {
  "worklet";
  const { dx, dy, vx, vy, width, height, threshold, directions } = input;
  const flick = input.velocityThreshold ?? DEFAULT_FLICK_VELOCITY;

  const h = axisCommit(dx, vx, width, threshold, flick);
  const v = axisCommit(dy, vy, height, threshold, flick);

  const candidates: { dir: SwipeDirection; strength: number }[] = [];
  if (h) candidates.push({ dir: h.sign > 0 ? "right" : "left", strength: h.strength });
  if (v) candidates.push({ dir: v.sign > 0 ? "down" : "up", strength: v.strength });

  let best: { dir: SwipeDirection; strength: number } | null = null;
  for (const c of candidates) {
    if (directions.indexOf(c.dir) === -1) continue;
    if (!best || c.strength > best.strength) best = c;
  }
  return best ? best.dir : null;
}

/**
 * How lit a direction's stamp should be for the current drag, 0..1 (1 at the
 * commit threshold). Drives the LIKE / NOPE overlay opacity.
 */
export function stampOpacityFor(
  direction: SwipeDirection,
  dx: number,
  dy: number,
  width: number,
  height: number,
  threshold: number,
): number {
  "worklet";
  const hDist = width * threshold;
  const vDist = height * threshold;
  let raw = 0;
  if (direction === "right") raw = hDist > 0 ? dx / hDist : 0;
  else if (direction === "left") raw = hDist > 0 ? -dx / hDist : 0;
  else if (direction === "up") raw = vDist > 0 ? -dy / vDist : 0;
  else raw = vDist > 0 ? dy / vDist : 0; // down
  return clamp(raw, 0, 1);
}

/**
 * Where the flung card should travel to as it leaves — well off-screen along the
 * committed axis, keeping the drag it already had on the other axis so the exit
 * follows the toss angle rather than snapping straight.
 */
export function exitVectorFor(
  direction: SwipeDirection,
  width: number,
  height: number,
  dx: number,
  dy: number,
): { x: number; y: number } {
  "worklet";
  const outX = width * 1.5;
  const outY = height * 1.5;
  switch (direction) {
    case "right":
      return { x: outX, y: dy };
    case "left":
      return { x: -outX, y: dy };
    case "up":
      return { x: dx, y: -outY };
    default:
      return { x: dx, y: outY }; // down
  }
}
