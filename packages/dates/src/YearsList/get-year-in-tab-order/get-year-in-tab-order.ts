import dayjs from "dayjs";

import type { PickerControlProps } from "../../PickerControl";
import type { DateStringValue } from "../../types";
import { isYearDisabled } from "../is-year-disabled/is-year-disabled";

interface GetYearInTabOrderInput {
  years: DateStringValue[][];
  minDate: DateStringValue | undefined;
  maxDate: DateStringValue | undefined;
  getYearControlProps: ((year: DateStringValue) => Partial<PickerControlProps>) | undefined;
}

/**
 * The single year that holds the roving `tabIndex={0}`: the first enabled
 * selected year, else the current year, else the first enabled year. 1:1 port.
 */
export function getYearInTabOrder({
  years,
  minDate,
  maxDate,
  getYearControlProps,
}: GetYearInTabOrderInput): DateStringValue | undefined {
  const enabledYears = years
    .flat()
    .filter(
      (year) =>
        !isYearDisabled({ year, minDate, maxDate }) && !getYearControlProps?.(year)?.disabled,
    );

  const selectedYear = enabledYears.find((year) => getYearControlProps?.(year)?.selected);

  if (selectedYear) {
    return selectedYear;
  }

  const currentYear = enabledYears.find((year) => dayjs().isSame(year, "year"));

  if (currentYear) {
    return currentYear;
  }

  return enabledYears[0];
}
