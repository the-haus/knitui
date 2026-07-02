import type { ReactNode } from "react";

import dayjs from "dayjs";

import type { DateLabelFormat, DayOfWeek } from "../../types";

interface GetWeekdaysNamesInput {
  /** dayjs locale used to format the weekday labels. */
  locale: string;
  /** dayjs format string, or a custom renderer. @default 'dd' */
  format?: DateLabelFormat;
  /** First weekday of the row. @default 1 — Monday */
  firstDayOfWeek?: DayOfWeek;
}

/**
 * Produces the 7 weekday labels for a calendar header, starting at
 * `firstDayOfWeek`. A string `format` is passed to dayjs; a function `format`
 * receives each day as `YYYY-MM-DD` and returns custom content. Mirrors
 * @mantine/dates `getWeekdayNames`.
 */
export function getWeekdayNames({
  locale,
  format = "dd",
  firstDayOfWeek = 1,
}: GetWeekdaysNamesInput): ReactNode[] {
  const baseDate = dayjs().day(firstDayOfWeek);
  const labels: ReactNode[] = [];

  for (let i = 0; i < 7; i += 1) {
    if (typeof format === "string") {
      labels.push(dayjs(baseDate).add(i, "days").locale(locale).format(format));
    } else {
      labels.push(format(dayjs(baseDate).add(i, "days").format("YYYY-MM-DD")));
    }
  }

  return labels;
}
