import dayjs from "dayjs";

import type { DateStringValue } from "../../types";

/**
 * The 12 months of `year` laid out as a 4-row × 3-column grid, each cell the
 * first day of that month in `YYYY-MM-DD`. 1:1 port of @mantine/dates.
 */
export function getMonthsData(year: DateStringValue): DateStringValue[][] {
  const startOfYear = dayjs(year).startOf("year").toDate();

  const results: DateStringValue[][] = [[], [], [], []];
  let currentMonthIndex = 0;

  for (let i = 0; i < 4; i += 1) {
    for (let j = 0; j < 3; j += 1) {
      results[i]!.push(dayjs(startOfYear).add(currentMonthIndex, "months").format("YYYY-MM-DD"));
      currentMonthIndex += 1;
    }
  }

  return results;
}
