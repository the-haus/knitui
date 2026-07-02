import { mod } from "./offset";

/**
 * Per-item progress — the conceptual heart of the loop redesign.
 *
 * Returns item `i`'s signed position (in PAGES) relative to the centered slot:
 * `0` = centered/active, `+1` = the next item (sits one page to the right /
 * below), `-1` = the previous item (one page to the left / above). This is
 * exactly the value fed to a layout worklet (`(progress, index) => ViewStyle`),
 * and matches the reference's convention (`value = index - rawIndex`, so the
 * next item interpolates to `+size`).
 *
 * - Non-loop: a plain line — `i - scroll`.
 * - Loop: the SHORTEST signed distance to item `i` on a ring of `count` items,
 *   so an item is never rendered more than `count / 2` pages from center; it
 *   "teleports" to the near side automatically. This single formula replaces
 *   the reference library's 7-point `interpolate` seam math AND its physical
 *   `autoFillData` array duplication — it is correct for every `count ≥ 1`.
 *
 * The returned value lies in `[-count/2, count/2)` for the loop case (an item
 * exactly opposite the center resolves to the negative side, a deterministic
 * tie-break).
 *
 * @param scroll fractional scroll position = `rawIndex(offset, size)`
 * @param i      item index (0-based, into the real data array)
 * @param count  number of real items
 * @param loop   whether the ring wraps
 */
export function itemProgress(scroll: number, i: number, count: number, loop: boolean): number {
  "worklet";
  if (!loop) return i - scroll;
  if (count <= 0) return 0;
  const half = count / 2;
  return mod(i - scroll + half, count) - half;
}
