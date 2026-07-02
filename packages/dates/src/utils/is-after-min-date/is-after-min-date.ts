import dayjs from "dayjs";

import type { DateStringValue } from "../../types";

/**
 * Whether `date` is on or after `minDate` (no lower bound when `minDate` is
 * absent). Mirrors @mantine/dates `isAfterMinDate`.
 */
export function isAfterMinDate(
  date: DateStringValue,
  minDate: DateStringValue | undefined,
): boolean {
  return minDate ? dayjs(date).isAfter(dayjs(minDate).subtract(1, "day"), "day") : true;
}
