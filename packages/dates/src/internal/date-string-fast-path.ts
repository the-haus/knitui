// Internal cross-platform helper — NOT exported from the public `src/index.ts`
// barrel.
//
// Most date comparisons in this package run over values that are ALREADY
// zero-padded `YYYY-MM-DD` strings — that is the package's canonical value shape
// (`DateStringValue`), and `getMonthDays` / `toDateString` emit nothing else. For
// those inputs a lexicographic string compare is EXACT: fixed-width, zero-padded,
// big-endian date strings sort in chronological order, so `a <= b` on the
// `YYYY-MM-DD` prefix is equivalent to a day-granularity dayjs comparison, and
// equality on the `YYYY-MM` prefix is equivalent to a month-granularity one.
//
// The dayjs spellings cost 2+ instances (each a `new Date` plus an object) and,
// for the month case, 2 `format()` calls that hit the locale table and run a
// regex replace — 42+ times per month grid render. The string spellings allocate
// nothing.
//
// The comparisons that use this all keep their dayjs path as a fallback for
// non-canonical input (`Date` objects, unpadded strings, other formats), so the
// fast path is a pure optimisation and never a narrowing of the accepted input.

/**
 * Matches a leading zero-padded `YYYY-MM-DD`, the package's canonical date
 * string. Anchored at the start and tolerant of a trailing time component, so
 * `DateTimeStringValue` (`YYYY-MM-DD HH:mm:ss`) also qualifies — its date part
 * is what every day-granularity comparison looks at.
 */
const CANONICAL_DATE = /^\d{4}-\d{2}-\d{2}/;

/**
 * Matches a leading zero-padded `YYYY-MM`. Accepts a bare year-month as well as
 * a full date, since month-granularity comparisons only read that prefix. An
 * UNPADDED month (`2026-6-15`) fails to match — `\d{2}` cannot consume `6-` — and
 * so falls through to the dayjs path, which is the point of the guard.
 */
const CANONICAL_YEAR_MONTH = /^\d{4}-\d{2}/;

/** Whether `value` is a canonical `YYYY-MM-DD…` string safe to compare as text. */
export function isCanonicalDateString(value: unknown): value is string {
  return typeof value === "string" && CANONICAL_DATE.test(value);
}

/** Whether `value` starts with a canonical zero-padded `YYYY-MM`. */
export function isCanonicalYearMonthString(value: unknown): value is string {
  return typeof value === "string" && CANONICAL_YEAR_MONTH.test(value);
}

/** Prefix length of a canonical date string that carries each granularity. */
const PREFIX_LENGTH = { year: 4, month: 7, day: 10 } as const;

/** The comparison granularities the pickers use (`useDatesState`'s `level`). */
export type DateGranularity = keyof typeof PREFIX_LENGTH;

/**
 * `dayjs(a).isSame(b, level)` for canonical date strings, as a prefix compare.
 *
 * Returns `null` when either side is NOT canonical, so callers can fall back to
 * the dayjs comparison rather than silently changing semantics — the same
 * belt-and-braces shape as the predicates above.
 *
 * This is the single hottest comparison in a range picker: `getControlProps`
 * runs it for `selected`, `firstInRange` and `lastInRange` on EVERY cell, so a
 * 42-cell grid pays for it well over a hundred times per render — and a web
 * hover move triggers a full re-render.
 */
export function isSameByPrefix(
  a: string | null | undefined,
  b: string | null | undefined,
  level: DateGranularity,
): boolean | null {
  if (!isCanonicalDateString(a) || !isCanonicalDateString(b)) {
    return null;
  }

  const length = PREFIX_LENGTH[level];
  return a.slice(0, length) === b.slice(0, length);
}

/**
 * `dayjs(a).isBefore(b)` for canonical date strings, as a prefix compare.
 *
 * Both sides parse to local midnight, so comparing the `YYYY-MM-DD` prefix
 * lexicographically is equivalent to dayjs' millisecond comparison. Returns
 * `null` when either side is not canonical.
 */
export function isBeforeByPrefix(
  a: string | null | undefined,
  b: string | null | undefined,
): boolean | null {
  if (!isCanonicalDateString(a) || !isCanonicalDateString(b)) {
    return null;
  }

  return a.slice(0, 10) < b.slice(0, 10);
}
