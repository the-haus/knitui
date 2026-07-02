import dayjs from "dayjs";

import type { DateStringValue, DayOfWeek } from "../../types";

/**
 * Walks forwards from `date` to the last day of its week (the day before
 * `firstDayOfWeek`), returning it as a `YYYY-MM-DD` string. An invalid input is
 * passed straight back. Mirrors @mantine/dates `getEndOfWeek`.
 */
export function getEndOfWeek(
  date: DateStringValue,
  firstDayOfWeek: DayOfWeek = 1,
): DateStringValue {
  let value = dayjs(date);

  if (!value.isValid()) {
    return date;
  }

  const lastDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
  while (value.day() !== lastDayOfWeek) {
    value = value.add(1, "day");
  }

  return value.format("YYYY-MM-DD");
}
