import dayjs from "dayjs";

import { isCanonicalYearMonthString } from "../../internal/date-string-fast-path";
import type { DateStringValue } from "../../types";

/**
 * Whether two dates fall in the same calendar month. Mirrors @mantine/dates
 * `isSameMonth`.
 *
 * This is one of the hottest comparisons in the package — `Month` calls it once
 * per cell (42×) to decide `outside`, and `getDateInTabOrder` calls it again per
 * cell whenever `hideOutsideDates` is on (which `DatePicker` enables
 * automatically for multiple columns). The dayjs spelling cost 2 instances plus
 * 2 `format("YYYY-MM")` calls (locale lookup + regex replace) EACH TIME; for the
 * canonical `YYYY-MM-DD` strings that are the actual inputs, comparing the
 * `YYYY-MM` prefix is exact and allocates nothing. `Date` inputs (and any
 * non-canonical string) keep the original dayjs path.
 */
export function isSameMonth(
  date: DateStringValue | Date,
  comparison: DateStringValue | Date,
): boolean {
  if (isCanonicalYearMonthString(date) && isCanonicalYearMonthString(comparison)) {
    return date.slice(0, 7) === comparison.slice(0, 7);
  }

  return dayjs(date).format("YYYY-MM") === dayjs(comparison).format("YYYY-MM");
}
