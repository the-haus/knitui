import dayjs from "dayjs";

import type { DateStringValue, DateTimeStringValue } from "../../types";

/**
 * Assigns the time portion (`HH:mm:ss`) onto a date value, returning a
 * `YYYY-MM-DD HH:mm:ss` string.
 *
 * - When `dateValue` is `null` the current date is used as the date base.
 * - When `timeString` is `""` the existing/current time is preserved (no
 *   time portion is overwritten).
 * - Milliseconds are always zeroed out.
 */
export function assignTime(
  dateValue: DateStringValue | null,
  timeString: string,
): DateTimeStringValue | null {
  let date = dateValue ? dayjs(dateValue) : dayjs();

  if (timeString === "") {
    return date.format("YYYY-MM-DD HH:mm:ss");
  }

  const parts = timeString.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  const seconds = parts[2] !== undefined ? Number(parts[2]) : 0;

  date = date.set("hour", hours);
  date = date.set("minute", minutes);
  date = date.set("second", seconds);
  date = date.set("millisecond", 0);

  return date.format("YYYY-MM-DD HH:mm:ss");
}
