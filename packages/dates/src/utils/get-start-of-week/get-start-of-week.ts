import dayjs from "dayjs";

import type { DateStringValue, DayOfWeek } from "../../types";

/**
 * Walks backwards from `date` to the first preceding day whose weekday matches
 * `firstDayOfWeek`, returning it as a `YYYY-MM-DD` string. Mirrors
 * @mantine/dates `getStartOfWeek`.
 */
export function getStartOfWeek(
  date: DateStringValue,
  firstDayOfWeek: DayOfWeek = 1,
): DateStringValue {
  let value = dayjs(date);
  while (value.day() !== firstDayOfWeek) {
    value = value.subtract(1, "day");
  }

  return value.format("YYYY-MM-DD");
}
