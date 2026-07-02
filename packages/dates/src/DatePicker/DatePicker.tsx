// ───────────────────────────────────────────────────────────────────────────
// DatePicker — mirrors the `@mantine/dates` `DatePicker` API, built on
// `@knitui/components` (`Box`) + the calendar family (`Calendar` + `useDatesState`)
// + dayjs. It is a thin SELECTION wrapper: it owns no cells of its own. It binds
// the shared `useDatesState` selection machine (`default` / `range` / `multiple`,
// with the live range hover-preview) to a full day-level `Calendar` and lets the
// level still zoom month↔year↔decade.
//
// Cross-platform: web + native from this single source — every prop forwarded
// here is itself cross-platform (`onMouseLeave` is a Tamagui no-op on native,
// preset presses go through `UnstyledButton`). No web-only API is reached.
//
// On the kit checklist (see `_reference/README.md`): like `Calendar`, DatePicker
// DELEGATES the leaf styling rules. Shared `size` context (2), derived
// `cell-metrics` sizing (3), theme-ramp colors (4), styled parts + marker slots
// (5/6/14) and the per-slot `styles` sugar (7) all live DOWNSTREAM in the level
// groups / cells — DatePicker just forwards the public `size` straight through,
// so re-declaring them here would reach no consumer (the same call `Calendar`
// documents). What DatePicker DOES carry: this provenance header (1),
// controlled/uncontrolled selection via `useDatesState` (8), locale + min/max +
// a11y passthrough into `Calendar` (9/10/11), per-item `getDayProps` /
// `getMonthControlProps` / `getYearControlProps` passthrough with "explicit beats
// sugar" precedence (7), and compiler-safe show/hide via the conditional preset
// subtree — never a dynamic `opacity`/`display` style prop (15). The `<Type>`
// generic is preserved through `forwardRef` (which would otherwise pin it at
// `"default"`), so the ref is forwarded via a typed `forwardRef` rather than
// `.styleable` (13) — the documented sibling-picker pattern.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";
import { useRef } from "react";

import dayjs from "dayjs";

import { Box } from "@knitui/components";
import { type GetProps, type TamaguiElement } from "@knitui/core";

import {
  Calendar,
  type CalendarBaseProps,
  type CalendarProps,
  type CalendarSettings,
  pickCalendarProps,
} from "../Calendar";
import { type CalendarSize } from "../cell-metrics";
import { type DecadeLevelBaseSettings } from "../DecadeLevel";
import { useDatesState } from "../hooks";
import { renderPresetList } from "../internal/picker-presets";
import { type MonthLevelBaseSettings } from "../MonthLevel";
import type {
  CalendarLevel,
  DatePickerType,
  DatePickerValue,
  DateStringValue,
  PickerBaseProps,
} from "../types";
import { isSameMonth } from "../utils";
import { type YearLevelBaseSettings } from "../YearLevel";

/** A predefined value the user can jump to from the preset list. */
export interface DatePickerPreset<Type extends DatePickerType> {
  /** Value applied when the preset is selected (shaped by the picker `type`). */
  value: DatePickerValue<Type, DateStringValue>;

  /** Preset label. */
  label: React.ReactNode;
}

export interface DatePickerBaseProps<Type extends DatePickerType = "default">
  extends
    PickerBaseProps<Type>,
    DecadeLevelBaseSettings,
    YearLevelBaseSettings,
    MonthLevelBaseSettings,
    CalendarBaseProps,
    Omit<CalendarSettings, "hasNextLevel">,
    Pick<CalendarProps, "enableKeyboardNavigation"> {
  /** Max level the user can zoom out to. @default 'decade' */
  maxLevel?: CalendarLevel;

  /** Initial displayed level in uncontrolled mode. @default 'month' */
  defaultLevel?: CalendarLevel;

  /** Current displayed level in controlled mode. */
  level?: CalendarLevel;

  /** Called when the displayed level changes. */
  onLevelChange?: (level: CalendarLevel) => void;

  /** Predefined values to pick from. */
  presets?: DatePickerPreset<Type>[];

  /** If defined, called with the preset value and suppresses the `onChange` call. */
  __onPresetSelect?: (preset: DatePickerValue<Type, DateStringValue>) => void;
}

type DatePickerFrameProps = Omit<
  GetProps<typeof Box>,
  "size" | "children" | "value" | "defaultValue" | "onChange" | "onMouseLeave"
>;

export interface DatePickerProps<Type extends DatePickerType = "default">
  extends DatePickerFrameProps, DatePickerBaseProps<Type> {
  /** Width/font of the controls. @default 'md' */
  size?: CalendarSize;
}

/**
 * Preserves the `<Type>` generic through `forwardRef` (which would otherwise pin
 * `Type` at its `"default"` instantiation), mirroring Mantine's
 * `DatePickerComponent` minus the static-props intersection.
 */
type DatePickerComponent = <Type extends DatePickerType = "default">(
  props: DatePickerProps<Type> & { ref?: React.Ref<TamaguiElement> },
) => React.JSX.Element;

/**
 * `DatePicker` — the inline day-selection picker. Drives a full `Calendar`
 * (day level, `minLevel="month"`) through the shared `useDatesState` selection
 * machine, so it selects DATES in `default` / `range` / `multiple` modes with a
 * live range hover-preview, while the level still zooms month↔year↔decade. The
 * zoomed-out month/year controls highlight the selected date's month/year.
 * Optional `presets` render a list of `UnstyledButton`s that imperatively jump
 * the displayed date + level (to `month`) via the Calendar's
 * `__setDateRef` / `__setLevelRef`. Accent comes from the active Tamagui theme.
 */
function DatePickerInner<Type extends DatePickerType = "default">(
  props: DatePickerProps<Type>,
  ref: React.ForwardedRef<TamaguiElement>,
): React.JSX.Element {
  const {
    type = "default",
    defaultValue,
    value,
    onChange,
    allowSingleDateInRange,
    allowDeselect,
    onMouseLeave,
    __onDayClick,
    __onDayMouseEnter,
    __onPresetSelect,
    __stopPropagation,
    presets,
    size,
    numberOfColumns = 1,
    defaultLevel = "month",
    ...rest
  } = props;

  const { calendarProps, others } = pickCalendarProps(rest);
  const setDateRef = useRef<((date: DateStringValue) => void) | null>(null);
  const setLevelRef = useRef<((level: CalendarLevel) => void) | null>(null);

  const { onDateChange, onRootMouseLeave, onHoveredDateChange, getControlProps, _value, setValue } =
    useDatesState({
      type: type as Type,
      level: "day",
      allowDeselect,
      allowSingleDateInRange,
      value,
      defaultValue,
      onChange,
      onMouseLeave,
    });

  // The single-date view of the current selection, used to highlight the matching
  // month/year on the zoomed-out levels. A `typeof` test narrows even the opaque
  // generic `_value` to `string`, so no cast is needed (it is `null` for the
  // `range` / `multiple` shapes, which have no single month/year to highlight).
  const selectedSingle: DateStringValue | null = typeof _value === "string" ? _value : null;

  const calendar = (
    <Calendar
      size={size}
      onMouseLeave={onRootMouseLeave}
      {...calendarProps}
      {...(!presets ? others : {})}
      numberOfColumns={numberOfColumns}
      defaultLevel={defaultLevel}
      minLevel={calendarProps.minLevel ?? "month"}
      hideOutsideDates={calendarProps.hideOutsideDates ?? numberOfColumns !== 1}
      __onDayMouseEnter={(event, date) => {
        onHoveredDateChange(date);
        __onDayMouseEnter?.(event, date);
      }}
      __onDayClick={(event, date) => {
        onDateChange(date);
        __onDayClick?.(event, date);
      }}
      getDayProps={(date) => ({
        ...getControlProps(date),
        ...calendarProps.getDayProps?.(date),
      })}
      getMonthControlProps={(date) => ({
        selected: selectedSingle ? isSameMonth(date, selectedSingle) : false,
        ...calendarProps.getMonthControlProps?.(date),
      })}
      getYearControlProps={(date) => ({
        selected: selectedSingle ? dayjs(date).isSame(selectedSingle, "year") : false,
        ...calendarProps.getYearControlProps?.(date),
      })}
      __setDateRef={setDateRef}
      __setLevelRef={setLevelRef}
      __stopPropagation={__stopPropagation}
      ref={!presets ? ref : undefined}
    />
  );

  if (!presets) {
    return calendar;
  }

  return (
    <Box {...others} ref={ref}>
      {renderPresetList({
        presets,
        setDateRef,
        setLevelRef,
        level: "month",
        setValue,
        __onPresetSelect,
      })}
      {calendar}
    </Box>
  );
}

/**
 * `DatePicker` — the inline day-selection picker. A full day-level `Calendar`
 * driven by the shared `useDatesState` selection machine, so it selects DATES in
 * `default` / `range` / `multiple` modes (with a live range hover-preview) while
 * the level still zooms month↔year↔decade. Values are `YYYY-MM-DD` strings;
 * selection is controlled (`value` + `onChange`) or uncontrolled (`defaultValue`).
 * Optional `presets` render quick-jump buttons beside the calendar. Forwards its
 * ref to the root and preserves the `<Type>` generic. Accent comes from the
 * active Tamagui theme. See {@link DatePickerInner} for the implementation notes.
 *
 * @example
 * <DatePicker value={value} onChange={setValue} defaultDate="2026-06-15" />
 */
export const DatePicker = React.forwardRef(DatePickerInner) as DatePickerComponent & {
  displayName?: string;
};

DatePicker.displayName = "@knitui/dates/DatePicker";
