import dayjs from "dayjs";

import type { DateStringValue, DayOfWeek } from "../../types";
import { getEndOfWeek } from "../get-end-of-week/get-end-of-week";
import { getStartOfWeek } from "../get-start-of-week/get-start-of-week";

interface GetMonthDaysInput {
  /** Any date within the month to enumerate, `YYYY-MM-DD`. */
  month: DateStringValue;
  /** First weekday of each row. @default 1 — Monday */
  firstDayOfWeek?: DayOfWeek;
  /** Pad to a fixed 6 weeks so the grid height never shifts. */
  consistentWeeks?: boolean;
}

/**
 * Builds the calendar grid for `month` as an array of weeks (each 7
 * `YYYY-MM-DD` strings), including the trailing/leading days needed to fill
 * whole weeks. With `consistentWeeks`, pads to 6 weeks. Mirrors @mantine/dates
 * `getMonthDays`.
 */
export function getMonthDays({
  month,
  firstDayOfWeek = 1,
  consistentWeeks,
}: GetMonthDaysInput): DateStringValue[][] {
  const day = dayjs(month).subtract(dayjs(month).date() - 1, "day");
  const start = dayjs(day.format("YYYY-M-D"));
  const startOfMonth = start.format("YYYY-MM-DD");
  const endOfMonth = start.add(+start.daysInMonth() - 1, "day").format("YYYY-MM-DD");
  const endDate = getEndOfWeek(endOfMonth, firstDayOfWeek);
  const weeks: DateStringValue[][] = [];

  let date = dayjs(getStartOfWeek(startOfMonth, firstDayOfWeek));

  while (date.isBefore(endDate, "day")) {
    const days: DateStringValue[] = [];

    for (let i = 0; i < 7; i += 1) {
      days.push(date.format("YYYY-MM-DD"));
      date = date.add(1, "day");
    }

    weeks.push(days);
  }

  if (consistentWeeks && weeks.length < 6) {
    const lastWeek = weeks[weeks.length - 1];
    const lastDay = lastWeek[lastWeek.length - 1];
    let nextDay = dayjs(lastDay).add(1, "day");

    while (weeks.length < 6) {
      const days: DateStringValue[] = [];

      for (let i = 0; i < 7; i += 1) {
        days.push(nextDay.format("YYYY-MM-DD"));
        nextDay = nextDay.add(1, "day");
      }

      weeks.push(days);
    }
  }

  return weeks;
}
