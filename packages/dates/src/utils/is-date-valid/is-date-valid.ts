import dayjs from "dayjs";

import type { DateStringValue } from "../../types";

/** Input for {@link isDateValid}. */
export interface IsDateValidInput {
  /** Date to validate (an already-parsed string or a `Date`). */
  date: DateStringValue | Date;

  /** Upper bound; `null`/`undefined` means no upper bound. */
  maxDate?: DateStringValue | Date | null;

  /** Lower bound; `null`/`undefined` means no lower bound. */
  minDate?: DateStringValue | Date | null;
}

/**
 * Whether `date` is a real date inside the optional `[minDate, maxDate]` window —
 * the `any`-free port of Mantine `DateInput/is-date-valid`. Promoted to shared
 * `utils/` (it overlaps {@link isAfterMinDate}/{@link isBeforeMaxDate} and the
 * datetime layer reuses it).
 *
 * `new Date(date)` here is a validity *check* on an already-parsed value (NOT
 * parsing of typed user input), so it stays as-is.
 */
export function isDateValid({ date, maxDate, minDate }: IsDateValidInput): boolean {
  if (date == null) {
    return false;
  }

  if (Number.isNaN(new Date(date).getTime())) {
    return false;
  }

  if (maxDate && dayjs(date).isAfter(maxDate, "date")) {
    return false;
  }

  if (minDate && dayjs(date).isBefore(minDate, "date")) {
    return false;
  }

  return true;
}
