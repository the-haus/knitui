import dayjs from "dayjs";

import type { DateStringValue } from "../../types";

/**
 * The 10 years of `decade` (rounded to `year - year % 10`) laid out as a ragged
 * 4-row grid (3 / 3 / 3 / 1), each cell the first day of that year in
 * `YYYY-MM-DD`. 1:1 port of @mantine/dates.
 */
export function getYearsData(decade: DateStringValue): DateStringValue[][] {
  const year = dayjs(decade).year();

  const rounded = year - (year % 10);

  let currentYearIndex = 0;
  const results: DateStringValue[][] = [[], [], [], []];

  for (let i = 0; i < 4; i += 1) {
    const max = i === 3 ? 1 : 3;
    for (let j = 0; j < max; j += 1) {
      results[i]!.push(dayjs(new Date(rounded + currentYearIndex, 0)).format("YYYY-MM-DD"));
      currentYearIndex += 1;
    }
  }

  return results;
}
