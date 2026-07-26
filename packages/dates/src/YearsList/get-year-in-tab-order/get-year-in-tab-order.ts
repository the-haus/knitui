import dayjs from "dayjs";

import type { PickerControlProps } from "../../PickerControl";
import type { DateStringValue } from "../../types";
import { isYearDisabled } from "../is-year-disabled/is-year-disabled";

interface GetYearInTabOrderInput {
  years: DateStringValue[][];
  minDate: DateStringValue | undefined;
  maxDate: DateStringValue | undefined;
  /**
   * Consulted TWICE per year below (once for `disabled`, once for `selected`), so
   * callers should pass a getter wrapped in `memoizeByDate` — the same wrapper they
   * use for their own cell loop, so the whole render resolves each year's props
   * exactly once. See `internal/memoize-control-props.ts`.
   */
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

  // One formatted "today" instead of a fresh `dayjs()` (plus its `startOf`/`endOf`
  // clones) per candidate. `years` always comes from `getYearsData`, which emits
  // zero-padded `YYYY-MM-DD`, so comparing the `YYYY` prefix is exactly the
  // year-granularity `isSame` this replaces.
  const currentYearPrefix = dayjs().format("YYYY");
  const currentYear = enabledYears.find((year) => year.slice(0, 4) === currentYearPrefix);

  if (currentYear) {
    return currentYear;
  }

  return enabledYears[0];
}
