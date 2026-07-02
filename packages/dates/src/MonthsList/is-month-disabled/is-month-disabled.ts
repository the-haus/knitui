import dayjs from "dayjs";

import type { DateStringValue } from "../../types";

interface IsMonthDisabledInput {
  month: DateStringValue;
  minDate: DateStringValue | undefined;
  maxDate: DateStringValue | undefined;
}

/** Whether `month` falls outside the `[minDate, maxDate]` bounds (month granularity). */
export function isMonthDisabled({ month, minDate, maxDate }: IsMonthDisabledInput): boolean {
  if (!minDate && !maxDate) {
    return false;
  }

  if (minDate && dayjs(month).isBefore(minDate, "month")) {
    return true;
  }

  if (maxDate && dayjs(month).isAfter(maxDate, "month")) {
    return true;
  }

  return false;
}
