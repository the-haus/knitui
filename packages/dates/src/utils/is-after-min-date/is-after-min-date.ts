import dayjs from "dayjs";

import { isCanonicalDateString } from "../../internal/date-string-fast-path";
import type { DateStringValue } from "../../types";

/**
 * Whether `date` is on or after `minDate` (no lower bound when `minDate` is
 * absent). Mirrors @mantine/dates `isAfterMinDate`.
 *
 * The lower-bound twin of `isBeforeMaxDate` — the dayjs spelling
 * (`isAfter(minDate - 1 day, "day")`) is a day-granularity `>=`, exactly a
 * lexicographic `>=` for canonical zero-padded `YYYY-MM-DD` strings. Same hot
 * path (once per cell in `Month`, again in `getDateInTabOrder`), same fallback
 * for non-canonical input.
 */
export function isAfterMinDate(
  date: DateStringValue,
  minDate: DateStringValue | undefined,
): boolean {
  if (!minDate) {
    return true;
  }

  if (isCanonicalDateString(date) && isCanonicalDateString(minDate)) {
    return date.slice(0, 10) >= minDate.slice(0, 10);
  }

  return dayjs(date).isAfter(dayjs(minDate).subtract(1, "day"), "day");
}
