import dayjs from "dayjs";

import { isCanonicalDateString } from "../../../internal/date-string-fast-path";
import type { DateStringValue } from "../../../types";

/**
 * Whether `date` falls within the inclusive `[start, end]` range, ported 1:1 from
 * Mantine's `is-in-range`. The pair is sorted first (so callers may pass the
 * endpoints in either order), then the bounds are widened by 1ms to the day's
 * edges so the comparison is inclusive of both endpoints. Pure dayjs — no DOM.
 *
 * The Mantine spelling is the most expensive per-cell call in a range picker:
 * `[...range].sort()` allocates an array and builds 2 dayjs instances inside the
 * comparator, then each bound costs an instance plus `startOf`/`endOf` and
 * `subtract`/`add` clones — ~11 instances per call, and `getControlProps` calls
 * it for every cell (up to 3× per cell across the range/first/last checks).
 *
 * The widened bounds exist purely to make the endpoint comparison inclusive at
 * DAY granularity, so for canonical zero-padded `YYYY-MM-DD` strings the whole
 * thing reduces to `min <= date <= max` on the date prefix — exact, and with no
 * sort, no clones and no allocations. Any non-canonical endpoint falls back to
 * the original dayjs path.
 */
export function isInRange(
  date: DateStringValue,
  range: [DateStringValue, DateStringValue],
): boolean {
  const [start, end] = range;

  if (isCanonicalDateString(date) && isCanonicalDateString(start) && isCanonicalDateString(end)) {
    const value = date.slice(0, 10);
    const from = start.slice(0, 10);
    const to = end.slice(0, 10);
    return from <= to ? value >= from && value <= to : value >= to && value <= from;
  }

  const _range = [...range].sort((a, b) => (dayjs(a).isAfter(dayjs(b)) ? 1 : -1));
  return (
    dayjs(_range[0]).startOf("day").subtract(1, "ms").isBefore(date) &&
    dayjs(_range[1]).endOf("day").add(1, "ms").isAfter(date)
  );
}
