// Internal cross-platform helper — NOT exported from the public `src/index.ts`
// barrel.
//
// `getMonthDays` is the grid's enumerator, and it is not cheap: it walks the
// month day by day, so a 5-week grid costs ~70 dayjs instances (the running
// cursor plus dayjs' internal clones) and 35 `format("YYYY-MM-DD")` calls. The
// answer, though, is a PURE function of three primitives — the month, the first
// weekday, and whether the grid is padded to 6 weeks — and it is re-derived on
// every single `Month` render, including the ones triggered by nothing but a web
// hover moving one cell over.
//
// A small module-level LRU makes month navigation free after the first visit:
// stepping back and forth across a few months (or re-rendering the same month
// for any other reason) replays cached arrays instead of re-walking the calendar.
// The cap is generous enough to hold a couple of years of browsing yet bounded so
// a long-lived app cannot grow the map without limit.
//
// This deliberately wraps the public `getMonthDays` rather than caching inside
// it: the public util keeps returning a FRESH array per call, so an external
// consumer that mutates the result cannot corrupt a shared cache entry. Inside
// this package the arrays are only read (`.flat()`, `.filter()`, `.find()`,
// `.map()`), so sharing them is safe — and it additionally gives the grid a
// STABLE array identity per month, which is what lets `Month` use it directly as
// a `useMemo` dependency.

import type { DateStringValue, DayOfWeek } from "../types";
import { getMonthDays } from "../utils";

/** How many distinct month grids to retain (~2 years of navigation). */
const MAX_ENTRIES = 32;

const cache = new Map<string, DateStringValue[][]>();

interface CachedMonthDaysInput {
  /** Any date within the month to enumerate, `YYYY-MM-DD`. */
  month: DateStringValue;
  /** First weekday of each row. */
  firstDayOfWeek: DayOfWeek;
  /** Pad to a fixed 6 weeks so the grid height never shifts. */
  consistentWeeks: boolean | undefined;
}

/**
 * `getMonthDays` memoized on its three primitive inputs.
 *
 * The returned weeks array is SHARED — treat it as read-only. Callers also get a
 * stable identity for a given key, so it can be passed straight to `useMemo` as a
 * dependency.
 */
export function getCachedMonthDays({
  month,
  firstDayOfWeek,
  consistentWeeks,
}: CachedMonthDaysInput): DateStringValue[][] {
  const key = `${month}|${firstDayOfWeek}|${consistentWeeks ? 1 : 0}`;
  const cached = cache.get(key);

  if (cached) {
    // Re-insert so the most recently used key is last, making the first map key
    // the least recently used one for eviction below.
    cache.delete(key);
    cache.set(key, cached);
    return cached;
  }

  const weeks = getMonthDays({ month, firstDayOfWeek, consistentWeeks });
  cache.set(key, weeks);

  if (cache.size > MAX_ENTRIES) {
    const oldest = cache.keys().next();
    if (!oldest.done) {
      cache.delete(oldest.value);
    }
  }

  return weeks;
}
