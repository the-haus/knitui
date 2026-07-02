// ───────────────────────────────────────────────────────────────────────────
// YearPickerInput — mirrors the `@mantine/dates` `YearPickerInput` API, built on
// `@knitui/components` (`InputBase`/`Popover` via `PickerInputBase`) + the calendar
// family (`YearPicker` + `useDatesInput`) + dayjs. It is a thin TRIGGER wrapper:
// it owns no styled parts and no cells of its own. It binds the shared
// `useDatesInput` machine (value + dropdown disclosure + clear) to a
// `PickerInputBase` trigger shell that holds an inline `YearPicker` in its
// dropdown — pressing the trigger opens the dropdown and year selection fills the
// trigger with the `valueFormat` string. Structurally identical to
// {@link MonthPickerInput} / `DatePickerInput`, differing only in the wrapped
// picker (`YearPicker`) and the `'YYYY'` default format. `YearPicker` is the
// bottom of the level stack (decade grid), so — unlike `MonthPickerInput` — there
// is no narrowed `onLevelChange` to pull out before `pickCalendarProps`.
//
// Cross-platform: web + native from this single source — every prop forwarded
// here is itself cross-platform (`PickerInputBase` toggles the dropdown via
// `Popover.Target`'s `onPress`, never a DOM `onClick`; `YearPicker` forwards
// cross-platform presses through `UnstyledButton`). No web-only API is reached.
//
// On the kit checklist (see `_reference/README.md`): like `YearPicker` and
// `Calendar`, YearPickerInput DELEGATES the leaf styling rules. Shared `size`
// context (2), derived `cell-metrics` sizing (3), theme-ramp colors (4), styled
// Frame + leaf parts (5), marker slots (6), the per-slot `styles` sugar (7) and
// `withStaticProperties` part exposure (14) all live DOWNSTREAM — the trigger
// chrome in `PickerInputBase`/`InputBase`, the year cells in the level groups.
// The public `size` is forwarded straight through to both, so re-declaring those
// here would reach no consumer (the same call `YearPicker` documents). Mantine's
// `styles`/`classNames`/`unstyled` styles-API is replaced kit-wide by that
// downstream per-slot `styles` sugar, so it is intentionally absent from the
// public surface.
//
// What YearPickerInput DOES carry: this provenance header (1),
// controlled/uncontrolled value via `useDatesInput` (8), locale forwarding into
// `YearPicker` (9), min/max bounds forwarded into `YearPicker` (10), a11y +
// trigger chrome (label/description/error/required/clearable) via
// `PickerInputBase` (11/12), and compiler-safe show/hide via the conditional
// dropdown subtree `PickerInputBase` owns — never a dynamic `opacity`/`display`
// style prop (15). The `<Type>` generic is preserved through `forwardRef` (which
// would otherwise pin it at `"default"`), so the ref is forwarded via a typed
// `forwardRef` rather than `.styleable` (13) — the documented sibling-picker
// pattern (`YearPicker` / `MonthPickerInput` / `DatePickerInput`).
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import { type TamaguiElement } from "@knitui/core";

import { pickCalendarProps } from "../Calendar";
import { type CalendarSize } from "../cell-metrics";
import { useDatesInput } from "../hooks";
import { getInputDefaultDate } from "../internal/get-input-default-date";
import { type DateInputSharedProps, PickerInputBase } from "../PickerInputBase";
import type { DatePickerType } from "../types";
import { YearPicker, type YearPickerBaseProps } from "../YearPicker";

export interface YearPickerInputProps<Type extends DatePickerType = "default">
  extends Omit<DateInputSharedProps, "size">, YearPickerBaseProps<Type> {
  /** `dayjs` format for the displayed value. @default 'YYYY' */
  valueFormat?: string;

  /** Trigger / control size. @default 'sm' */
  size?: CalendarSize;
}

/**
 * Preserves the `<Type>` generic through `forwardRef` (which would otherwise pin
 * `Type` at its `"default"` instantiation), mirroring the inline pickers'
 * `*Component` aliases — NOT Mantine's `factory`.
 */
type YearPickerInputComponent = <Type extends DatePickerType = "default">(
  props: YearPickerInputProps<Type> & { ref?: React.Ref<TamaguiElement> },
) => React.JSX.Element;

/**
 * `YearPickerInput` — the input-trigger year picker. Structurally identical to
 * {@link MonthPickerInput} but wraps an inline `YearPicker` and displays the
 * value with the `'YYYY'` format. Composes `useDatesInput` + `PickerInputBase`;
 * pressing the trigger opens the dropdown, selecting a year fills the trigger and
 * closes on change. The `any`-free port of Mantine's `YearPickerInput`; accent
 * comes from the active Tamagui theme.
 */
function YearPickerInputInner<Type extends DatePickerType = "default">(
  props: YearPickerInputProps<Type>,
  ref: React.ForwardedRef<TamaguiElement>,
): React.JSX.Element {
  const {
    type = "default",
    value,
    defaultValue,
    onChange,
    valueFormat = "YYYY",
    labelSeparator,
    locale,
    closeOnChange = true,
    size = "sm",
    dropdownType = "popover",
    sortDates = true,
    minDate,
    maxDate,
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
      <YearPicker
        {...calendarProps}
        size={size}
        type={type}
        value={_value}
        onChange={setValue}
        locale={locale}
        minDate={minDate}
        maxDate={maxDate}
        presets={presets}
        defaultDate={
          calendarProps.defaultDate ?? getInputDefaultDate({ value: _value, minDate, maxDate })
        }
        __stopPropagation={dropdownType === "popover"}
      />
    </PickerInputBase>
  );
}

/**
 * `YearPickerInput` — the input-trigger year picker. A `PickerInputBase` trigger
 * (`label`/`description`/`error`/`required`/`clearable` chrome) that opens an
 * inline `YearPicker` in a popover (or modal); picking a year fills the trigger
 * with the `valueFormat` string (`'YYYY'` by default). Values are `YYYY-MM-DD`
 * strings (the year's first day); selection is controlled (`value` + `onChange`)
 * or uncontrolled (`defaultValue`). `type="range"` renders `start – end` and
 * commits once both ends are picked; `type="multiple"` keeps the dropdown open
 * while toggling. Forwards its ref to the trigger and preserves the `<Type>`
 * generic. Accent comes from the active Tamagui theme. See
 * {@link YearPickerInputInner} and the file header for the implementation +
 * delegation notes.
 *
 * @example
 * <YearPickerInput label="Fiscal year" value={value} onChange={setValue} />
 */
export const YearPickerInput = React.forwardRef(
  YearPickerInputInner,
) as YearPickerInputComponent & { displayName?: string };

YearPickerInput.displayName = "@knitui/dates/YearPickerInput";
