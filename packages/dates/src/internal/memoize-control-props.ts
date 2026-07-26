// Internal cross-platform helper — NOT exported from the public `src/index.ts`
// barrel.
//
// The grid components (`Month`, `MonthsList`, `YearsList`) each consult their
// per-item prop getter (`getDayProps` / `getMonthControlProps` /
// `getYearControlProps`) from MORE THAN ONE place in a single render: once from
// the `…InTabOrder` helper's "which cell is enabled" filter, again from its
// "which cell is selected" scan, and a third time in the cell loop itself.
//
// Those getters are NOT cheap. `DatePicker` wires `getDayProps` to
// `useDatesState`'s `getControlProps`, which for `type="range"` runs
// `rangeView.some(isSame)` + `isDateInRange` + `isFirstInRange` +
// `isLastInRange` — on the order of 20 dayjs instances and 2 array allocations
// per call. Three calls × 42 cells is ~2,500 dayjs instances spent re-deriving
// the SAME answer.
//
// Wrapping the getter in a per-render `Map` collapses that to one real call per
// date. The cache MUST be per render (created during render, discarded with it):
// the getters close over live selection/hover state and their identity changes
// every render, so a cache that outlived the render would serve stale props.

import type { DateStringValue } from "../types";

/**
 * Wrap a per-date prop getter so each distinct date is resolved at most once.
 *
 * Returns `undefined` when `getter` is `undefined`, preserving the optionality
 * of the original prop so call sites keep their `getter?.(date)` shape and their
 * result stays `T | undefined`. Call this ONCE PER RENDER and share the result
 * with every consumer in that render — see the note above on why the cache must
 * not be memoized across renders.
 */
export function memoizeByDate<T>(
  getter: ((date: DateStringValue) => T) | undefined,
): ((date: DateStringValue) => T) | undefined {
  if (!getter) {
    return undefined;
  }

  const cache = new Map<DateStringValue, T>();

  return (date: DateStringValue): T => {
    const cached = cache.get(date);
    // `has` (not a truthiness test) so a getter legitimately returning
    // `undefined`/`false` is still cached rather than recomputed every hit.
    if (cached !== undefined || cache.has(date)) {
      return cached as T;
    }

    const value = getter(date);
    cache.set(date, value);
    return value;
  };
}
