import dayjs from "dayjs";

import { useDisclosure, type UseDisclosureHandlers } from "@knitui/hooks";

import { useDatesContext } from "../../DatesProvider";
import type { DatePickerType, DatePickerValue, DateStringValue } from "../../types";
import { type DateFormatter, getFormattedDate } from "../../utils";
import { useUncontrolledDates } from "../use-uncontrolled-dates/use-uncontrolled-dates";

/**
 * The STORED (converted) value for a picker `type` — every date normalised to a
 * `YYYY-MM-DD` (or `YYYY-MM-DD HH:mm:ss` with `withTime`) string, exactly as the
 * on-disk {@link useUncontrolledDates} hook keeps it.
 */
type DatesValue<Type extends DatePickerType> = DatePickerValue<Type, DateStringValue>;

/**
 * Input options for {@link useDatesInput} — the `any`-free port of Mantine's
 * `UseDatesInput<Type>`, with the DOM/styles bits dropped. `format` is the dayjs
 * display format the wrapping picker passes (its `valueFormat`).
 */
export interface UseDatesInput<Type extends DatePickerType = "default"> {
  /** Picker selection mode. */
  type: Type;

  /** Controlled value (raw `Date`/string), or `undefined` for uncontrolled. */
  value: DatePickerValue<Type> | undefined;

  /** Default value for uncontrolled mode (raw `Date`/string). */
  defaultValue: DatePickerValue<Type> | undefined;

  /** Called with the converted (string) value when it changes. */
  onChange: ((value: DatesValue<Type>) => void) | undefined;

  /** dayjs locale; falls back to the value defined in `DatesProvider`. */
  locale?: string;

  /** dayjs display format used to render {@link UseDatesInputReturn.formattedValue}. */
  format: string;

  /** Separator rendered between the two dates of a range value. */
  labelSeparator: string | undefined;

  /** Close the dropdown when the value changes (not applicable to `multiple`). */
  closeOnChange: boolean | undefined;

  /** Sort the selected dates before `onChange` — `multiple` only. */
  sortDates?: boolean;

  /** Whether the field shows a clear button when it has a value. */
  clearable: boolean | undefined;

  /** Override the default value formatter. */
  valueFormatter?: DateFormatter;

  /** Convert to `YYYY-MM-DD HH:mm:ss` instead of `YYYY-MM-DD`. @default false */
  withTime?: boolean;
}

/** Return shape of {@link useDatesInput} — all seven fields precisely typed. */
export interface UseDatesInputReturn<Type extends DatePickerType = "default"> {
  /** Current stored (string) value, typed by `type`. */
  _value: DatesValue<Type>;

  /** Set the value, closing the dropdown per `closeOnChange` and sorting per `sortDates`. */
  setValue: (value: DatesValue<Type>) => void;

  /** The value rendered in the input trigger (empty string when there is no value). */
  formattedValue: string;

  /** Whether the dropdown is open. */
  dropdownOpened: boolean;

  /** Open/close/toggle handlers for the dropdown. */
  dropdownHandlers: UseDisclosureHandlers;

  /** Reset the value to its empty shape for `type`. */
  onClear: () => void;

  /** Whether the clear button should be shown (`clearable` and a value is present). */
  shouldClear: boolean;
}

/**
 * Shared value/dropdown state for every input-trigger picker (`*PickerInput`),
 * the `any`-free port of Mantine's `useDatesInput`. Wraps the on-disk
 * {@link useUncontrolledDates} value machine, derives the trigger's
 * {@link UseDatesInputReturn.formattedValue} via the locale/format from
 * `DatesProvider`, and owns the dropdown open state plus the clear affordance.
 */
export function useDatesInput<Type extends DatePickerType = "default">({
  type,
  value,
  defaultValue,
  onChange,
  locale,
  format,
  labelSeparator,
  closeOnChange,
  sortDates,
  clearable,
  valueFormatter,
  withTime,
}: UseDatesInput<Type>): UseDatesInputReturn<Type> {
  const ctx = useDatesContext();

  const [dropdownOpened, dropdownHandlers] = useDisclosure(false);

  const [_value, _setValue] = useUncontrolledDates<Type>({
    type,
    value,
    defaultValue,
    onChange,
    withTime,
  });

  const formattedValue = getFormattedDate({
    type,
    date: _value as DatePickerValue<DatePickerType>,
    locale: ctx.getLocale(locale),
    format,
    labelSeparator: ctx.getLabelSeparator(labelSeparator),
    formatter: valueFormatter,
  });

  /** The empty value for the active `type` (`[null, null]` / `[]` / `null`). */
  const getEmptyValue = (): DatesValue<Type> =>
    (type === "range" ? [null, null] : type === "multiple" ? [] : null) as DatesValue<Type>;

  const setValue = (val: DatesValue<Type>) => {
    // A single array view of the value (range/multiple) for the narrowing below —
    // the opaque generic can't be `typeof`-narrowed, so inspect it through the
    // concrete element union the stored shapes use.
    const arrayValue = Array.isArray(val) ? (val as (DateStringValue | null)[]) : null;

    if (closeOnChange) {
      if (type === "default") {
        dropdownHandlers.close();
      }

      if (type === "range" && arrayValue && arrayValue[0] && arrayValue[1]) {
        dropdownHandlers.close();
      }
    }

    if (sortDates && type === "multiple" && arrayValue) {
      const sorted = [...arrayValue].sort((a, b) => (dayjs(a).isAfter(dayjs(b)) ? 1 : -1));
      _setValue(sorted as DatesValue<Type>);
    } else {
      _setValue(val);
    }
  };

  const onClear = () => setValue(getEmptyValue());

  const valueArray = Array.isArray(_value) ? (_value as (DateStringValue | null)[]) : null;
  const shouldClear = Boolean(
    clearable &&
    (type === "range"
      ? valueArray && !!valueArray[0]
      : type === "multiple"
        ? valueArray && valueArray.length > 0
        : _value !== null),
  );

  return {
    _value,
    setValue,
    formattedValue,
    dropdownOpened,
    dropdownHandlers,
    onClear,
    shouldClear,
  };
}
