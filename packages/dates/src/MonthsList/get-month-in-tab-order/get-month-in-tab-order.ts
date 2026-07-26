import dayjs from "dayjs";

import type { PickerControlProps } from "../../PickerControl";
import type { DateStringValue } from "../../types";
import { isMonthDisabled } from "../is-month-disabled/is-month-disabled";

interface GetMonthInTabOrderInput {
  months: DateStringValue[][];
  minDate: DateStringValue | undefined;
  maxDate: DateStringValue | undefined;
  /**
   * Consulted TWICE per month below (once for `disabled`, once for `selected`),
   * so callers should pass a getter wrapped in `memoizeByDate` — the same wrapper
   * they use for their own cell loop, so the whole render resolves each month's
   * props exactly once. See `internal/memoize-control-props.ts`.
   */
  getMonthControlProps: ((month: DateStringValue) => Partial<PickerControlProps>) | undefined;
}

/**
 * The single month that holds the roving `tabIndex={0}`: the first enabled
 * selected month, else the current month, else the first enabled month. 1:1 port.
 */
export function getMonthInTabOrder({
  months,
  minDate,
  maxDate,
  getMonthControlProps,
}: GetMonthInTabOrderInput): DateStringValue | undefined {
  const enabledMonths = months
    .flat()
    .filter(
      (month) =>
        !isMonthDisabled({ month, minDate, maxDate }) && !getMonthControlProps?.(month)?.disabled,
    );

  const selectedMonth = enabledMonths.find((month) => getMonthControlProps?.(month)?.selected);

  if (selectedMonth) {
    return selectedMonth;
  }

  // One formatted "today" instead of a fresh `dayjs()` (plus its `startOf`/`endOf`
  // clones) per candidate. `months` always comes from `getMonthsData`, which emits
  // zero-padded `YYYY-MM-DD`, so comparing the `YYYY-MM` prefix is exactly the
  // month-granularity `isSame` this replaces.
  const currentMonthPrefix = dayjs().format("YYYY-MM");
  const currentMonth = enabledMonths.find((month) => month.slice(0, 7) === currentMonthPrefix);

  if (currentMonth) {
    return currentMonth;
  }

  return enabledMonths[0];
}
