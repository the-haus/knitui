// Internal cross-platform helper — NOT exported from the public `src/index.ts`
// barrel.
//
// The shared `React.memo` comparator for the grid CELL components of `Month`,
// `MonthsList` and `YearsList`. All three grids have the same shape of problem, so
// they share one implementation rather than each carrying a copy.

/** A plain (non-array, non-null) object — the shape {@link areCellPropsEqual} looks one level into. */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * One-level-deep `React.memo` comparator for a memoized grid cell.
 *
 * A plain shallow compare is not enough for these grids: a cell's per-item inputs
 * arrive as FRESHLY BUILT objects on every render — the per-item prop getter
 * (`getDayProps` / `getMonthControlProps` / `getYearControlProps`, which is
 * `useDatesState`'s `getControlProps`) returns a new object by design, and
 * `slotStyles().get()/merge()` likewise. Their CONTENTS, though, are stable
 * booleans for all but the two or three cells whose state actually moved.
 *
 * So: compare props shallowly, and where both sides are plain objects, compare one
 * level deeper. That is exactly deep enough to see "same selection state, new
 * object" and shallow enough to stay O(props) — and it degrades safely, since any
 * value it cannot prove equal (a nested object, a fresh function) reads as changed
 * and simply re-renders the cell.
 *
 * Generic over the cell's props so each grid keeps its own precise props type; the
 * comparator itself only ever reads keys and compares values.
 */
export function areCellPropsEqual<P extends object>(prev: P, next: P): boolean {
  const keys = Object.keys(prev) as (keyof P)[];

  if (keys.length !== Object.keys(next).length) {
    return false;
  }

  for (const key of keys) {
    const a: unknown = prev[key];
    const b: unknown = next[key];

    if (a === b) {
      continue;
    }

    if (!isPlainObject(a) || !isPlainObject(b)) {
      return false;
    }

    const innerKeys = Object.keys(a);
    if (innerKeys.length !== Object.keys(b).length) {
      return false;
    }
    for (const innerKey of innerKeys) {
      if (a[innerKey] !== b[innerKey]) {
        return false;
      }
    }
  }

  return true;
}
