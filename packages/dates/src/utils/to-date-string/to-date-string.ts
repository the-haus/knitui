import dayjs, { type Dayjs } from "dayjs";

import type { DateStringValue, DateTimeStringValue } from "../../types";

/**
 * Maps the input value's "emptiness" onto the return type: `undefined`/`null`
 * pass straight through (preserving the exact literal), anything else becomes
 * the formatted main type. Lets callers keep `toDateString(undefined)` typed as
 * `undefined` rather than `string | undefined`.
 */
type ExactOptionalReturn<T, MainType> = T extends undefined
  ? undefined
  : T extends null
    ? null
    : MainType;

/** Normalise any date-like value to a `YYYY-MM-DD` string (empty/null/undefined pass through). */
export function toDateString<T extends string | number | Date | Dayjs | undefined | null>(
  value: T,
): ExactOptionalReturn<T, DateStringValue> {
  return (
    value == null || value === "" ? value : dayjs(value).format("YYYY-MM-DD")
  ) as ExactOptionalReturn<T, DateStringValue>;
}

/** Normalise any date-like value to a `YYYY-MM-DD HH:mm:ss` string (empty/null/undefined pass through). */
export function toDateTimeString<T extends string | number | Date | Dayjs | undefined | null>(
  value: T,
): ExactOptionalReturn<T, DateTimeStringValue> {
  return (
    value == null || value === "" ? value : dayjs(value).format("YYYY-MM-DD HH:mm:ss")
  ) as ExactOptionalReturn<T, DateTimeStringValue>;
}
