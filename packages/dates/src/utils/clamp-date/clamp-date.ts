import dayjs from "dayjs";

import type { DateStringValue } from "../../types";
import { toDateTimeString } from "../to-date-string/to-date-string";

/**
 * Clamp `date` into the `[minDate, maxDate]` window, returning a
 * `YYYY-MM-DD HH:mm:ss` string. With no bounds the date is returned as-is
 * (normalised); below `minDate` returns `minDate`, above `maxDate` returns
 * `maxDate`.
 */
export function clampDate(
  minDate: DateStringValue | Date | undefined,
  maxDate: DateStringValue | Date | undefined,
  date: DateStringValue | Date,
): DateStringValue {
  if (!minDate && !maxDate) {
    return toDateTimeString(date);
  }

  if (minDate && dayjs(date).isBefore(minDate)) {
    return toDateTimeString(minDate);
  }

  if (maxDate && dayjs(date).isAfter(maxDate)) {
    return toDateTimeString(maxDate);
  }

  return toDateTimeString(date);
}
