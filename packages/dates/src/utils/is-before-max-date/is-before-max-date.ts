import dayjs from "dayjs";

import type { DateStringValue } from "../../types";

/**
 * Whether `date` is on or before `maxDate` (no upper bound when `maxDate` is
 * absent). Mirrors @mantine/dates `isBeforeMaxDate`.
 */
export function isBeforeMaxDate(
  date: DateStringValue,
  maxDate: DateStringValue | undefined,
): boolean {
  return maxDate ? dayjs(date).isBefore(dayjs(maxDate).add(1, "day"), "day") : true;
}
