import dayjs from "dayjs";

import type { DateStringValue } from "../../types";

/** Whether two dates fall in the same calendar month. Mirrors @mantine/dates `isSameMonth`. */
export function isSameMonth(
  date: DateStringValue | Date,
  comparison: DateStringValue | Date,
): boolean {
  return dayjs(date).format("YYYY-MM") === dayjs(comparison).format("YYYY-MM");
}
