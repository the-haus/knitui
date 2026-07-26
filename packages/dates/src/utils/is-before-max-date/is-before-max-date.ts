import dayjs from "dayjs";

import { isCanonicalDateString } from "../../internal/date-string-fast-path";
import type { DateStringValue } from "../../types";

/**
 * Whether `date` is on or before `maxDate` (no upper bound when `maxDate` is
 * absent). Mirrors @mantine/dates `isBeforeMaxDate`.
 *
 * Called once per cell by `Month` and again by `getDateInTabOrder`. The dayjs
 * spelling (`isBefore(maxDate + 1 day, "day")`) is a day-granularity `<=`, which
 * for canonical zero-padded `YYYY-MM-DD` strings is exactly a lexicographic
 * `<=` — same answer, no `add`, no clones, no allocations. Non-canonical input
 * falls back to the original path.
 */
export function isBeforeMaxDate(
  date: DateStringValue,
  maxDate: DateStringValue | undefined,
): boolean {
  if (!maxDate) {
    return true;
  }

  if (isCanonicalDateString(date) && isCanonicalDateString(maxDate)) {
    return date.slice(0, 10) <= maxDate.slice(0, 10);
  }

  return dayjs(date).isBefore(dayjs(maxDate).add(1, "day"), "day");
}
