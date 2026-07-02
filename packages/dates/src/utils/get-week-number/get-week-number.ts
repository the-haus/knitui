import dayjs from "dayjs";
import isoWeek from "dayjs/plugin/isoWeek.js";

import type { DateStringValue } from "../../types";

dayjs.extend(isoWeek);

/**
 * ISO week number of the week containing the given 7 dates, derived from its
 * Monday. Mirrors @mantine/dates `getWeekNumber`.
 */
export function getWeekNumber(week: DateStringValue[]): number {
  const monday = week.find((date) => dayjs(date).day() === 1);
  return dayjs(monday).isoWeek();
}
