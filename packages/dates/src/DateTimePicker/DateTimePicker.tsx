// ───────────────────────────────────────────────────────────────────────────
// DateTimePicker — mirrors the `@mantine/dates` `DateTimePicker` API, built on
// the kit's date family: it composes `PickerInputBase` (the trigger/dropdown
// shell) wrapping an `InlineDateTimePicker` (the `DatePicker` + `TimePicker`
// composite). It owns NO cells, controls, or styled parts of its own — it is a
// thin input-trigger + commit wrapper that forwards the picker props straight
// through to the inline picker and the display props through to the trigger.
//
// Cross-platform: web + native from this single source. Every prop forwarded
// here is itself cross-platform — the dropdown is a `Popover` or `Modal`, presses
// go through `UnstyledButton`/`ActionIcon`, and `__stopPropagation` is a web-only
// refinement that is a no-op on native. No web-only API is reached.
//
// On the kit checklist (see `_reference/README.md`): like `Calendar` /
// `DatePicker`, DateTimePicker DELEGATES every leaf styling rule. Shared `size`
// context (2), derived `cell-metrics` sizing (3), theme-ramp colors (4), styled
// parts + marker slots (5/6/14) and the per-slot `styles` sugar (7) all live
// DOWNSTREAM in the `InlineDateTimePicker` → `DatePicker`/`TimePicker` →
// level-group / cell parts; re-declaring them here would reach no consumer (the
// same call `Calendar`/`DatePicker` document). What DateTimePicker DOES carry:
// this provenance header (1), controlled/uncontrolled selection via
// `useUncontrolledDates` (8), locale + value formatting via `useDatesContext` +
// dayjs (9), min/max bounds via the shared `clampDate` util applied on close (10),
// a11y delegated to the trigger `InputBase` (label/description/required) and the
// inline cells (11), interaction-in-style delegated downstream (12), per-item
// `timePickerProps` / `submitButtonProps` passthrough (the wrapper's flavour of
// "explicit beats sugar", 7), and compiler-safe show/hide via the conditional
// dropdown subtree + the `dropdownOpened` boolean — never a dynamic
// `opacity`/`display` style prop (15). The `<Type>` generic is preserved through
// `forwardRef` (which would otherwise pin it at `"default"`), so the ref is
// forwarded via a typed `forwardRef` rather than `.styleable` (13) — the
// documented sibling-picker pattern.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";
import { useState } from "react";

import dayjs from "dayjs";

import { type TamaguiElement } from "@knitui/core";
import { useDidUpdate, useDisclosure } from "@knitui/hooks";

import { pickCalendarProps } from "../Calendar";
import { type DatePickerBaseProps } from "../DatePicker";
import { useDatesContext } from "../DatesProvider";
import { useUncontrolledDates } from "../hooks";
import {
  InlineDateTimePicker,
  type InlineDateTimePickerSize,
  type InlineDateTimePickerSubmitButtonProps,
} from "../InlineDateTimePicker";
import { type DateInputSharedProps, PickerInputBase } from "../PickerInputBase";
import { type TimePickerProps } from "../TimePicker";
import type { DatePickerType, DatePickerValue, DatesRangeValue, DateStringValue } from "../types";
import { clampDate } from "../utils";

export interface DateTimePickerProps<Type extends DatePickerType = "default">
  extends Omit<DateInputSharedProps, "size">, DatePickerBaseProps<Type> {
  /**
   * `dayjs` format for the displayed value, or a function that receives the value
   * as a `YYYY-MM-DD HH:mm:ss` string and returns the formatted value.
   * @default "DD/MM/YYYY HH:mm"
   */
  valueFormat?: string | ((date: DateStringValue) => string);

  /** Default time value in `HH:mm` or `HH:mm:ss` format. Assigned to the time when a date is selected. */
  defaultTimeValue?: string;

  /** Props passed down to the `TimePicker` component. */
  timePickerProps?: Omit<TimePickerProps, "defaultValue" | "value">;

  /** Props passed down to the end time `TimePicker` component in range mode. */
  endTimePickerProps?: Omit<TimePickerProps, "defaultValue" | "value">;

  /** Props passed down to the submit button. */
  submitButtonProps?: InlineDateTimePickerSubmitButtonProps;

  /** Whether the seconds input is displayed. @default false */
  withSeconds?: boolean;

  /** Trigger / control size. @default 'sm' */
  size?: InlineDateTimePickerSize;
}

/**
 * Preserves the `<Type>` generic through `forwardRef` (which would otherwise pin
 * `Type` at its `"default"` instantiation), mirroring the other pickers'
 * `*Component` aliases — NOT Mantine's `genericFactory`.
 */
type DateTimePickerComponent = <Type extends DatePickerType = "default">(
  props: DateTimePickerProps<Type> & { ref?: React.Ref<TamaguiElement> },
) => React.JSX.Element;

/**
 * `DateTimePicker` — the input-trigger date + time picker. Composes
 * `PickerInputBase` (the trigger/dropdown shell) wrapping an
 * `InlineDateTimePicker`; pressing the trigger opens the popover/modal, picking a
 * date + time fills the trigger, and the submit button (or Enter in a time input)
 * commits and closes. Each open mounts a fresh inline picker (`inlineKey`) so its
 * level/time state resets. On close an incomplete range is cleared and the value
 * is clamped to `min`/`max`. The `any`-free, cross-platform port of Mantine's
 * `DateTimePicker`; accent comes from the active Tamagui theme.
 *
 * `dropdownType === "popover"` drives `__stopPropagation` — the first real
 * consumer of the flag — so the popover's Escape/dismiss key doesn't bubble out.
 */
function DateTimePickerInner<Type extends DatePickerType = "default">(
  props: DateTimePickerProps<Type>,
  ref: React.ForwardedRef<TamaguiElement>,
): React.JSX.Element {
  const {
    type = "default",
    value,
    defaultValue,
    onChange,
    valueFormat,
    locale,
    timePickerProps,
    endTimePickerProps,
    submitButtonProps,
    withSeconds,
    level,
    defaultLevel,
    size = "sm",
    dropdownType = "popover",
    minDate,
    maxDate,
    defaultDate,
    defaultTimeValue,
    presets,
    onDropdownClose,
    labelSeparator,
    allowSingleDateInRange,
    ...rest
  } = props;

  const isRange = type === "range";

  const { calendarProps, others } = pickCalendarProps(rest);

  const ctx = useDatesContext();
  const _labelSeparator = ctx.getLabelSeparator(labelSeparator);

  const _withSeconds = withSeconds || timePickerProps?.withSeconds;
  const _valueFormat = valueFormat || (_withSeconds ? "DD/MM/YYYY HH:mm:ss" : "DD/MM/YYYY HH:mm");

  const [_value, setValue] = useUncontrolledDates<Type>({
    type: type as Type,
    value,
    defaultValue,
    onChange,
    withTime: true,
  });

  const [dropdownOpened, dropdownHandlers] = useDisclosure(false);
  const [inlineKey, setInlineKey] = useState(0);

  // The current selection split into the two shapes the component cares about
  // (range needs a cast — the generic `_value` is an unresolved conditional).
  const rangeValue: DatesRangeValue<DateStringValue> | null =
    isRange && Array.isArray(_value) ? (_value as DatesRangeValue<DateStringValue>) : null;
  const singleValue: DateStringValue | null =
    !isRange && typeof _value === "string" ? _value : null;

  const formatDate = (v: DateStringValue | null): string => {
    if (!v) {
      return "";
    }
    if (typeof _valueFormat === "function") {
      return _valueFormat(v);
    }
    return dayjs(v).locale(ctx.getLocale(locale)).format(_valueFormat);
  };

  const getFormattedValue = (): string => {
    if (isRange && rangeValue) {
      const start = formatDate(rangeValue[0]);
      const end = formatDate(rangeValue[1]);
      if (start && end) {
        return `${start} ${_labelSeparator} ${end}`;
      }
      if (start) {
        return `${start} ${_labelSeparator} ...`;
      }
      return "";
    }

    return formatDate(singleValue);
  };

  const formattedValue = getFormattedValue();

  useDidUpdate(() => {
    if (dropdownOpened) {
      setInlineKey((k) => k + 1);
    }
  }, [dropdownOpened]);

  const __stopPropagation = dropdownType === "popover";

  const handleDropdownClose = (): void => {
    if (isRange && rangeValue) {
      // Clear an incomplete range (start without end).
      if (rangeValue[0] && !rangeValue[1]) {
        setValue([null, null] as DatePickerValue<Type, DateStringValue>);
      } else {
        const clampedStart = rangeValue[0] ? clampDate(minDate, maxDate, rangeValue[0]) : null;
        const clampedEnd = rangeValue[1] ? clampDate(minDate, maxDate, rangeValue[1]) : null;
        if (
          (rangeValue[0] && rangeValue[0] !== clampedStart) ||
          (rangeValue[1] && rangeValue[1] !== clampedEnd)
        ) {
          setValue([clampedStart, clampedEnd] as DatePickerValue<Type, DateStringValue>);
        }
      }
    } else if (singleValue) {
      const clamped = clampDate(minDate, maxDate, singleValue);
      if (singleValue !== clamped) {
        setValue(clamped as DatePickerValue<Type, DateStringValue>);
      }
    }
    onDropdownClose?.();
  };

  const handleSubmitOrEnter = (): void => {
    handleDropdownClose();
    dropdownHandlers.close();
  };

  const onClear = (): void => {
    if (isRange) {
      setValue([null, null] as DatePickerValue<Type, DateStringValue>);
    } else {
      setValue(null as DatePickerValue<Type, DateStringValue>);
    }
  };

  const shouldClear = isRange ? !!rangeValue && !!rangeValue[0] : !!singleValue;

  // `setValue` matches the inline picker's `__onPresetSelect` signature exactly,
  // so no cast is needed; only `default` mode applies presets directly.
  const handlePresetSelect = !isRange ? setValue : undefined;

  return (
    <PickerInputBase
      {...others}
      ref={ref}
      formattedValue={formattedValue}
      dropdownOpened={!rest.disabled ? dropdownOpened : false}
      dropdownHandlers={dropdownHandlers}
      value={_value}
      type={type}
      onClear={onClear}
      shouldClear={shouldClear}
      size={size}
      dropdownType={dropdownType}
      onDropdownClose={handleDropdownClose}
      withTime
    >
      <InlineDateTimePicker
        key={inlineKey}
        {...calendarProps}
        fullWidth={false}
        type={type as Type}
        value={_value}
        onChange={setValue}
        minDate={minDate}
        maxDate={maxDate}
        size={size}
        locale={locale}
        level={level}
        defaultLevel={defaultLevel}
        defaultDate={defaultDate}
        defaultTimeValue={defaultTimeValue}
        presets={presets}
        allowSingleDateInRange={allowSingleDateInRange}
        timePickerProps={timePickerProps}
        endTimePickerProps={endTimePickerProps}
        submitButtonProps={submitButtonProps}
        withSeconds={withSeconds}
        valueFormat={valueFormat}
        labelSeparator={labelSeparator}
        onSubmit={handleSubmitOrEnter}
        __stopPropagation={__stopPropagation}
        __onEnter={handleSubmitOrEnter}
        __onPresetSelect={handlePresetSelect}
      />
    </PickerInputBase>
  );
}

export const DateTimePicker = React.forwardRef(DateTimePickerInner) as DateTimePickerComponent & {
  displayName?: string;
};

DateTimePicker.displayName = "@knitui/dates/DateTimePicker";
