// ───────────────────────────────────────────────────────────────────────────
// DatePickerInput — mirrors the `@mantine/dates` `DatePickerInput` API, built on
// `@knitui/components` (`InputBase`/`Popover` via `PickerInputBase`) + the calendar
// family (`DatePicker` + `useDatesInput`) + dayjs. It is a thin TRIGGER wrapper:
// it owns no styled parts and no cells of its own. It binds the shared
// `useDatesInput` machine (value + dropdown disclosure + clear) to a
// `PickerInputBase` trigger shell that holds an inline `DatePicker` in its
// dropdown — pressing the trigger opens the dropdown and day selection fills the
// trigger with the `valueFormat` string.
//
// Cross-platform: web + native from this single source — every prop forwarded
// here is itself cross-platform (`PickerInputBase` toggles the dropdown via
// `Popover.Target`'s `onPress`, never a DOM `onClick`; `DatePicker` forwards
// cross-platform presses through `UnstyledButton`). No web-only API is reached.
//
// On the kit checklist (see `_reference/README.md`): like `DatePicker` and
// `Calendar`, DatePickerInput DELEGATES the leaf styling rules. Shared `size`
// context (2), derived `cell-metrics` sizing (3), theme-ramp colors (4), styled
// Frame + leaf parts (5), marker slots (6), the per-slot `styles` sugar (7) and
// `withStaticProperties` part exposure (14) all live DOWNSTREAM — the trigger
// chrome in `PickerInputBase`/`InputBase`, the calendar cells in the level
// groups. The public `size` is forwarded straight through to both, so
// re-declaring those here would reach no consumer (the same call `DatePicker`
// documents). Mantine's `styles`/`classNames`/`unstyled` styles-API is replaced
// kit-wide by that downstream per-slot `styles` sugar, so it is intentionally
// absent from the public surface.
//
// What DatePickerInput DOES carry: this provenance header (1),
// controlled/uncontrolled value via `useDatesInput` (8), locale forwarding into
// `DatePicker` (9), min/max bounds forwarded into `DatePicker` (10), a11y +
// trigger chrome (label/description/error/required/clearable) via
// `PickerInputBase` (11/12), and compiler-safe show/hide via the conditional
// dropdown subtree `PickerInputBase` owns — never a dynamic `opacity`/`display`
// style prop (15). The `<Type>` generic is preserved through `forwardRef` (which
// would otherwise pin it at `"default"`), so the ref is forwarded via a typed
// `forwardRef` rather than `.styleable` (13) — the documented sibling-picker
// pattern (`DatePicker` / `MonthPickerInput` / `YearPickerInput`).
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import { type TamaguiElement } from "@knitui/core";

import { pickCalendarProps } from "../Calendar";
import { type CalendarSize } from "../cell-metrics";
import { DatePicker, type DatePickerBaseProps } from "../DatePicker";
import { useDatesInput } from "../hooks";
import { getInputDefaultDate } from "../internal/get-input-default-date";
import { type DateInputSharedProps, PickerInputBase } from "../PickerInputBase";
import type { DatePickerType } from "../types";

export interface DatePickerInputProps<Type extends DatePickerType = "default">
  extends Omit<DateInputSharedProps, "size">, DatePickerBaseProps<Type> {
  /** `dayjs` format for the displayed value. @default 'MMMM D, YYYY' */
  valueFormat?: string;

  /** Trigger / control size. @default 'sm' */
  size?: CalendarSize;
}

/**
 * Preserves the `<Type>` generic through `forwardRef` (which would otherwise pin
 * `Type` at its `"default"` instantiation), mirroring the inline pickers'
 * `*Component` aliases — NOT Mantine's `factory`.
 */
type DatePickerInputComponent = <Type extends DatePickerType = "default">(
  props: DatePickerInputProps<Type> & { ref?: React.Ref<TamaguiElement> },
) => React.JSX.Element;

/**
 * `DatePickerInput` — the input-trigger day picker. Composes `useDatesInput` +
 * `PickerInputBase` wrapping an inline `DatePicker`; pressing the trigger opens
 * the dropdown and day selection fills the trigger with the `'MMMM D, YYYY'`
 * value. `type="range"` renders `start – end` and (via `PickerInputBase`'s
 * `handleClose`) only commits once both ends are picked; `type="multiple"` keeps
 * the dropdown open while toggling days. The `any`-free port of Mantine's
 * `DatePickerInput`; accent comes from the active Tamagui theme.
 */
function DatePickerInputInner<Type extends DatePickerType = "default">(
  props: DatePickerInputProps<Type>,
  ref: React.ForwardedRef<TamaguiElement>,
): React.JSX.Element {
  const {
    type = "default",
    value,
    defaultValue,
    onChange,
    valueFormat = "MMMM D, YYYY",
    labelSeparator,
    locale,
    closeOnChange = true,
    size = "sm",
    dropdownType = "popover",
    sortDates = true,
    minDate,
    maxDate,
    defaultDate,
    clearable,
    valueFormatter,
    presets,
    ...rest
  } = props;

  const { calendarProps, others } = pickCalendarProps(rest);

  const {
    _value,
    setValue,
    formattedValue,
    dropdownOpened,
    dropdownHandlers,
    onClear,
    shouldClear,
  } = useDatesInput({
    // `type` widens to `DatePickerType` via the literal default (the prop is
    // `DatePickerType | Type`); narrow it back to `Type` the same way the
    // inline pickers narrow it for `useDatesState` — never `as any`.
    type: type as Type,
    value,
    defaultValue,
    onChange,
    locale,
    format: valueFormat,
    labelSeparator,
    closeOnChange,
    sortDates,
    clearable,
    valueFormatter,
  });

  return (
    <PickerInputBase
      {...others}
      ref={ref}
      formattedValue={formattedValue}
      dropdownOpened={dropdownOpened}
      dropdownHandlers={dropdownHandlers}
      value={_value}
      type={type}
      onClear={onClear}
      shouldClear={shouldClear}
      clearable={clearable}
      size={size}
      dropdownType={dropdownType}
    >
      <DatePicker
        {...calendarProps}
        size={size}
        type={type}
        value={_value}
        onChange={setValue}
        locale={locale}
        minDate={minDate}
        maxDate={maxDate}
        presets={presets}
        defaultDate={getInputDefaultDate({ value: _value, defaultDate, minDate, maxDate })}
        __stopPropagation={dropdownType === "popover"}
      />
    </PickerInputBase>
  );
}

/**
 * `DatePickerInput` — the input-trigger day picker. A `PickerInputBase` trigger
 * (`label`/`description`/`error`/`required`/`clearable` chrome) that opens an
 * inline `DatePicker` in a popover (or modal); picking a day fills the trigger
 * with the `valueFormat` string. Values are `YYYY-MM-DD` strings; selection is
 * controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 * `type="range"` renders `start – end` and commits once both ends are picked;
 * `type="multiple"` keeps the dropdown open while toggling. Forwards its ref to
 * the trigger and preserves the `<Type>` generic. Accent comes from the active
 * Tamagui theme. See {@link DatePickerInputInner} and the file header for the
 * implementation + delegation notes.
 *
 * @example
 * <DatePickerInput label="Event date" value={value} onChange={setValue} />
 */
export const DatePickerInput = React.forwardRef(
  DatePickerInputInner,
) as DatePickerInputComponent & { displayName?: string };

DatePickerInput.displayName = "@knitui/dates/DatePickerInput";
