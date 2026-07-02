import type { DateStringValue } from "../../types";
import { getYearsData } from "../../YearsList/get-years-data/get-years-data";

/**
 * The `[startOfDecade, endOfDecade]` bounds for `decade`, each the first day of
 * that year in `YYYY-MM-DD`. Derived from `getYearsData`'s ragged 3/3/3/1 grid:
 * the first cell of the first row and the single cell of the last row. 1:1 port
 * of @mantine/dates. Private to the `DecadeLevel/` folder.
 */
export function getDecadeRange(
  decade: DateStringValue,
): readonly [DateStringValue, DateStringValue] {
  const years = getYearsData(decade);
  return [years[0]![0]!, years[3]![0]!] as const;
}
