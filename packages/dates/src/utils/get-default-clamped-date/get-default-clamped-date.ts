import dayjs from "dayjs";

import type { DateStringValue } from "../../types";
import { toDateString } from "../to-date-string/to-date-string";

interface GetDefaultClampedDate {
  minDate: DateStringValue | Date | undefined;
  maxDate: DateStringValue | Date | undefined;
}

/**
 * The date a calendar should open on by default: today, clamped into the
 * `[minDate, maxDate]` window. Returns a `YYYY-MM-DD` string.
 */
export function getDefaultClampedDate({
  minDate,
  maxDate,
}: GetDefaultClampedDate): DateStringValue {
  const today = dayjs();

  if (!minDate && !maxDate) {
    return toDateString(today);
  }

  if (minDate && dayjs(today).isBefore(minDate)) {
    return toDateString(minDate);
  }

  if (maxDate && dayjs(today).isAfter(maxDate)) {
    return toDateString(maxDate);
  }

  return toDateString(today);
}
