import dayjs from "dayjs";

import type { DayProps } from "../../Day";
import type { DateStringValue } from "../../types";
import { isAfterMinDate } from "../is-after-min-date/is-after-min-date";
import { isBeforeMaxDate } from "../is-before-max-date/is-before-max-date";
import { isSameMonth } from "../is-same-month/is-same-month";

interface GetDateInTabOrderInput {
  /** The month grid as weeks of `YYYY-MM-DD` strings (from `getMonthDays`). */
  dates: DateStringValue[][];
  /** Lower bound, `YYYY-MM-DD`. */
  minDate: DateStringValue | undefined;
  /** Upper bound, `YYYY-MM-DD`. */
  maxDate: DateStringValue | undefined;
  /** Per-day prop getter — its `disabled`/`selected` participate in the choice. */
  getDayProps: ((date: DateStringValue) => Partial<DayProps>) | undefined;
  /** Predicate marking a day disabled. */
  excludeDate: ((date: DateStringValue) => boolean) | undefined;
  /** Whether outside-month days are hidden (excluded from candidacy). */
  hideOutsideDates: boolean | undefined;
  /** The displayed month, `YYYY-MM-DD`. */
  month: DateStringValue;
}

/**
 * Picks the single date that should carry `tabIndex={0}` (roving tabindex):
 * the selected enabled day, else today, else the first enabled day. Mirrors
 * @mantine/dates `getDateInTabOrder`. Returns `undefined` when no day qualifies.
 */
export function getDateInTabOrder({
  dates,
  minDate,
  maxDate,
  getDayProps,
  excludeDate,
  hideOutsideDates,
  month,
}: GetDateInTabOrderInput): DateStringValue | undefined {
  const enabledDates = dates
    .flat()
    .filter(
      (date) =>
        isBeforeMaxDate(date, maxDate) &&
        isAfterMinDate(date, minDate) &&
        !excludeDate?.(date) &&
        !getDayProps?.(date)?.disabled &&
        (!hideOutsideDates || isSameMonth(date, month)),
    );

  const selectedDate = enabledDates.find((date) => getDayProps?.(date)?.selected);

  if (selectedDate) {
    return selectedDate;
  }

  const currentDate = enabledDates.find((date) => dayjs().isSame(date, "date"));

  if (currentDate) {
    return currentDate;
  }

  return enabledDates[0];
}
