import { clamp, mod } from "./offset";

/**
 * Compute which item indices should be mounted for the current scroll position.
 *
 * Returns a list of concrete (0-based, real-data) indices — `windowSize` items
 * centered on the active index. Items not in the list are unmounted by the
 * renderer; that is safe because every item is absolutely positioned and placed
 * purely by its transform, so removing one leaves no gap.
 *
 * Because looping is virtual (see `itemProgress`), the loop branch is a simple
 * mod-wrapped span — no duplicated data, no split-range bookkeeping.
 *
 * @param scroll     fractional scroll position = `rawIndex(offset, size)`
 * @param count      number of real items
 * @param windowSize max items to mount; `<= 0` or non-finite means "all"
 * @param loop       whether the ring wraps
 */
export function visibleWindow(
  scroll: number,
  count: number,
  windowSize: number,
  loop: boolean,
): number[] {
  "worklet";
  if (count <= 0) return [];

  const w =
    Number.isFinite(windowSize) && windowSize > 0 ? Math.min(Math.floor(windowSize), count) : count;

  const rounded = Math.round(scroll);
  const center = loop ? mod(rounded, count) : clamp(rounded, 0, count - 1);
  const back = Math.floor((w - 1) / 2);

  const result: number[] = [];

  if (loop) {
    const start = center - back;
    for (let k = 0; k < w; k++) result.push(mod(start + k, count));
    return result;
  }

  // Non-loop: a contiguous clamped span of `w` indices around `center`.
  let start = center - back;
  let end = start + w - 1;
  if (start < 0) {
    start = 0;
    end = Math.min(count - 1, w - 1);
  }
  if (end > count - 1) {
    end = count - 1;
    start = Math.max(0, end - w + 1);
  }
  for (let i = start; i <= end; i++) result.push(i);
  return result;
}

/**
 * Indices a data source should be asked to *load* — the visible window plus a
 * `lead` of extra items in the direction of travel. The mounted window stays
 * tight (only what's drawn), but prefetching ahead means an async source's pages
 * are already in cache by the time those slides scroll into view, so the user
 * never sees a placeholder flash while moving in one direction.
 *
 * Returns a superset of {@link visibleWindow}: the same mounted indices, then up
 * to `lead` more beyond the window's leading edge (`direction >= 0` → ahead,
 * `< 0` → behind). Capped at `count` distinct indices; a no-op extension when
 * `lead <= 0` (returns the plain visible window).
 *
 * @param scroll     fractional scroll position = `rawIndex(offset, size)`
 * @param count      number of real items
 * @param windowSize mounted window size (see {@link visibleWindow})
 * @param loop       whether the ring wraps
 * @param direction  travel sign: `>= 0` forward, `< 0` backward
 * @param lead       extra items to load ahead in the travel direction
 */
export function prefetchWindow(
  scroll: number,
  count: number,
  windowSize: number,
  loop: boolean,
  direction: number,
  lead: number,
): number[] {
  "worklet";
  const win = visibleWindow(scroll, count, windowSize, loop);
  if (lead <= 0 || win.length === 0 || win.length >= count) return win;

  const result = win.slice();
  const seen = new Set(win);
  const dir = direction < 0 ? -1 : 1;

  if (loop) {
    // Loop never shifts the window, so its edges sit at center ± back/front.
    const w = win.length;
    const rounded = Math.round(scroll);
    const center = mod(rounded, count);
    const back = Math.floor((w - 1) / 2);
    const front = w - 1 - back;
    for (let k = 1; k <= lead && seen.size < count; k++) {
      const idx = mod(dir > 0 ? center + front + k : center - back - k, count);
      if (!seen.has(idx)) {
        seen.add(idx);
        result.push(idx);
      }
    }
  } else {
    // Non-loop windows are clamped/ascending, so extend from the real edges.
    const min = win[0];
    const max = win[win.length - 1];
    for (let k = 1; k <= lead; k++) {
      const idx = dir > 0 ? max + k : min - k;
      if (idx < 0 || idx > count - 1 || seen.has(idx)) continue;
      seen.add(idx);
      result.push(idx);
    }
  }
  return result;
}
