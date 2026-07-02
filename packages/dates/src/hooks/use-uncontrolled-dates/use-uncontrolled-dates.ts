import { useRef } from "react";

import { useUncontrolled } from "@knitui/hooks";

import type { DatePickerType, DatePickerValue, DateStringValue } from "../../types";
import { toDateString, toDateTimeString } from "../../utils";

/**
 * The STORED (converted) value for a picker `type` — every date normalised to a
 * `YYYY-MM-DD` (or `YYYY-MM-DD HH:mm:ss` with `withTime`) string: `range` →
 * `[start, end]`, `multiple` → `string[]`, `default` → `string | null`.
 */
type DatesValue<Type extends DatePickerType> = DatePickerValue<Type, DateStringValue>;

/** Input options — mirrors Mantine's `UseUncontrolledDates`, but `any`-free. */
export interface UseUncontrolledDatesInput<Type extends DatePickerType = "default"> {
  /** Picker selection mode. */
  type: Type;

  /** Controlled value (raw `Date`/string), or `undefined` for uncontrolled. */
  value: DatePickerValue<Type> | undefined;

  /** Default value for uncontrolled mode (raw `Date`/string). */
  defaultValue: DatePickerValue<Type> | undefined;

  /** Called with the converted (string) value when it changes. */
  onChange: ((value: DatesValue<Type>) => void) | undefined;

  /** Convert to `YYYY-MM-DD HH:mm:ss` instead of `YYYY-MM-DD`. @default false */
  withTime?: boolean;
}

/** The empty value for a picker `type` (`[null, null]` / `[]` / `null`). */
const getEmptyValue = <Type extends DatePickerType>(type: Type): DatesValue<Type> =>
  (type === "range" ? [null, null] : type === "multiple" ? [] : null) as DatesValue<Type>;

/**
 * Normalise a raw picker value (scalar or array of `Date`/strings) to its stored
 * string form via the date/date-time converter. `undefined` passes through so
 * controlled/uncontrolled detection in `useUncontrolled` still works.
 */
export function convertDatesValue<Type extends DatePickerType>(
  value: DatePickerValue<Type> | undefined,
  withTime: boolean,
): DatesValue<Type> | undefined {
  if (value === undefined) {
    return undefined;
  }

  const converter = withTime ? toDateTimeString : toDateString;
  return (
    Array.isArray(value) ? value.map((item) => converter(item)) : converter(value)
  ) as DatesValue<Type>;
}

/**
 * Controlled/uncontrolled value state for the date pickers — the `any`-free port
 * of Mantine's `useUncontrolledDates`. Wraps `@knitui/hooks`' `useUncontrolled`,
 * converting raw `Date`/string inputs to canonical `YYYY-MM-DD` strings on the
 * way in (so stored state is always string-shaped) and resetting the value when
 * the picker `type` changes between renders.
 *
 * Returns `[value, setValue, controlled]` with `value` precisely typed by `type`.
 */
export function useUncontrolledDates<Type extends DatePickerType = "default">({
  type,
  value,
  defaultValue,
  onChange,
  withTime = false,
}: UseUncontrolledDatesInput<Type>): [
  DatesValue<Type>,
  (value: DatesValue<Type>) => void,
  boolean,
] {
  const storedType = useRef<Type>(type);
  const [_value, _setValue, controlled] = useUncontrolled<DatesValue<Type>>({
    value: convertDatesValue(value, withTime),
    defaultValue: convertDatesValue(defaultValue, withTime),
    finalValue: getEmptyValue(type),
    onChange,
  });

  let _finalValue = _value;

  if (storedType.current !== type) {
    storedType.current = type;

    if (value === undefined) {
      _finalValue =
        defaultValue !== undefined
          ? (convertDatesValue(defaultValue, withTime) ?? getEmptyValue(type))
          : getEmptyValue(type);
      _setValue(_finalValue);
    }
  }

  return [_finalValue, _setValue, controlled];
}
