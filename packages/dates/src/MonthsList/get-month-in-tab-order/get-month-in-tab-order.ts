import dayjs from "dayjs";

import type { PickerControlProps } from "../../PickerControl";
import type { DateStringValue } from "../../types";
import { isMonthDisabled } from "../is-month-disabled/is-month-disabled";

interface GetMonthInTabOrderInput {
  months: DateStringValue[][];
  minDate: DateStringValue | undefined;
  maxDate: DateStringValue | undefined;
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

  const currentMonth = enabledMonths.find((month) => dayjs().isSame(month, "month"));

  if (currentMonth) {
    return currentMonth;
  }

  return enabledMonths[0];
}
