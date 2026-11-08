import { itemProgress } from "../engine";
import type { AnimationStyle } from "../types";

/** One mounted slide with its settled paint rank. */
export interface PaintSlot {
  index: number;
  /**
   * The layout's `zIndex` at the settled position, or `undefined` when the layout
   * sets none (normal / scale / rotate): such slides never overlap, so they keep
   * their mount order and get no React-level `zIndex`.
   */
  z: number | undefined;
  /** Position in paint order, 0 = painted first (bottom). */
  rank: number;
}

/** The layout's settled `zIndex` for `index`, or undefined if it sets none. */
function settledZ(
  style: AnimationStyle,
  center: number,
  index: number,
  count: number,
  loop: boolean,
): number | undefined {
  try {
    const z = style(itemProgress(center, index, count, loop), index).zIndex;
    return typeof z === "number" && Number.isFinite(z) ? Math.round(z) : undefined;
  } catch {
    // A custom worklet that can't run on the JS thread: fall back to mount order.
    return undefined;
  }
}

/**
 * The mounted window in PAINT order (bottom first), ranked by the layout's
 * `zIndex` at the settled centre.
 *
 * Why this exists: on Android a `ReactViewGroup` orders its children from the
 * `zIndex` PROP it receives on a React commit. Reanimated's UI-thread style
 * updates change the value without re-sorting, so an animated `zIndex` alone
 * left slides painting in mount order: after one step the card behind painted
 * over the new front card. The track therefore re-renders on every centre change
 * (it already does, for the virtualization window) and hands each slide this
 * settled rank as a real prop — and, on native, renders the children in this
 * order so the view order matches the stacking order outright.
 *
 * The settled order is the right order for the whole drag, not just at rest:
 * the stack's `zIndex` falls monotonically with progress, so its order never
 * changes mid-drag, and the centre-out layouts (fade, depth, flip, cube,
 * coverflow, parallax) only swap two slides at the half-way point, which is
 * exactly when the centre — and with it this order — changes.
 *
 * The sort is stable: equal ranks keep their mount order.
 */
export function paintOrder(
  mounted: readonly number[],
  center: number,
  count: number,
  loop: boolean,
  style: AnimationStyle,
): PaintSlot[] {
  const slots = mounted.map((index, i) => ({
    index,
    z: settledZ(style, center, index, count, loop),
    i,
  }));
  if (slots.every((s) => s.z === undefined)) {
    return slots.map(({ index, z }, rank) => ({ index, z, rank }));
  }
  slots.sort((a, b) => (a.z ?? 0) - (b.z ?? 0) || a.i - b.i);
  return slots.map(({ index, z }, rank) => ({ index, z, rank }));
}
