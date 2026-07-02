// Internal cross-platform helper — NOT exported from the public `src/index.ts`
// barrel (same discipline as `web-cursor`/`focus-element`/`picker-presets`).
// Shared by the `*PickerInput` wrappers so the inline picker's `defaultDate`
// computation lives in one place instead of being copied per wrapper.

import type { DatePickerType, DatePickerValue, DateStringValue } from "../types";
import { getDefaultClampedDate, toDateString } from "../utils";

interface GetInputDefaultDate {
  /** The wrapper's current stored (string) value, in any picker shape. */
  value: DatePickerValue<DatePickerType, DateStringValue>;

  /** Explicit `defaultDate` the caller passed through (day-level pickers). */
  defaultDate?: DateStringValue | Date;

  /** Lower clamp bound. */
  minDate?: DateStringValue | Date;

  /** Upper clamp bound. */
  maxDate?: DateStringValue | Date;
}

/**
 * The date an input-trigger picker should open on: the first selected date (or
 * the single value), falling back to the caller's `defaultDate`, then to today
 * clamped into `[minDate, maxDate]`. Mirrors Mantine's
 * `Array.isArray(_value) ? _value[0] || fallback : _value || fallback` with
 * `fallback = getDefaultClampedDate({ minDate, maxDate })`. Always returns a
 * `YYYY-MM-DD` string.
 */
export function getInputDefaultDate({
  value,
  defaultDate,
  minDate,
  maxDate,
}: GetInputDefaultDate): DateStringValue {
  const fromValue = Array.isArray(value) ? value[0] : value;
  const resolved = fromValue ?? defaultDate;

  return resolved ? toDateString(resolved) : getDefaultClampedDate({ minDate, maxDate });
}
