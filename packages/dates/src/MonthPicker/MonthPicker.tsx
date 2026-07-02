// ───────────────────────────────────────────────────────────────────────────
// MonthPicker — mirrors the `@mantine/dates` `MonthPicker` API, built on
// `@knitui/components` (`Box`) + the calendar family (`Calendar` + `useDatesState`)
// + dayjs. Like `DatePicker`, it is a thin SELECTION wrapper: it owns no cells of
// its own. It binds the shared `useDatesState` selection machine (`default` /
// `range` / `multiple`, with the live range hover-preview) to a `Calendar` pinned
// to the year level (`minLevel="year"`) so it selects MONTHS while the level still
// zooms year↔decade.
//
// Cross-platform: web + native from this single source — every prop forwarded
// here is itself cross-platform (`onMouseLeave` is a Tamagui no-op on native,
// preset presses go through `UnstyledButton`). No web-only API is reached.
//
// On the kit checklist (see `_reference/README.md`): like `Calendar` and its
// sibling `DatePicker`, MonthPicker DELEGATES the leaf styling rules. Shared
// `size` context (2), derived `cell-metrics` sizing (3), theme-ramp colors (4),
// styled parts + marker slots (5/6/14) and the per-slot `styles` sugar (7) all
// live DOWNSTREAM in the level groups / month cells — MonthPicker just forwards
// the public `size` straight through, so re-declaring them here would reach no
// consumer (the same call `Calendar` documents). What MonthPicker DOES carry:
// this provenance header (1), controlled/uncontrolled selection via
// `useDatesState` (8), locale + min/max + a11y passthrough into `Calendar`
// (9/10/11), per-item `getMonthControlProps` passthrough with "explicit beats
// sugar" precedence (7), and compiler-safe show/hide via the conditional preset
// subtree — never a dynamic `opacity`/`display` style prop (15). The `<Type>`
// generic is preserved through `forwardRef` (which would otherwise pin it at
// `"default"`), so the ref is forwarded via a typed `forwardRef` rather than
// `.styleable` (13) — the documented sibling-picker pattern.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";
import { useRef } from "react";

import { Box } from "@knitui/components";
import { type GetProps, type TamaguiElement } from "@knitui/core";

import { Calendar, type CalendarBaseProps, pickCalendarProps } from "../Calendar";
import { type CalendarSize } from "../cell-metrics";
import { type DecadeLevelBaseSettings } from "../DecadeLevel";
import { useDatesState } from "../hooks";
import { renderPresetList } from "../internal/picker-presets";
import type {
  CalendarLevel,
  DatePickerType,
  DatePickerValue,
  DateStringValue,
  PickerBaseProps,
} from "../types";
import { type YearLevelBaseSettings } from "../YearLevel";

/** A predefined value the user can jump to from the preset list. */
export interface MonthPickerPreset<Type extends DatePickerType> {
  /** Value applied when the preset is selected (shaped by the picker `type`). */
  value: DatePickerValue<Type, DateStringValue>;

  /** Preset label. */
  label: React.ReactNode;
}

/** The levels a `MonthPicker` can display — every calendar level except `month`. */
export type MonthPickerLevel = Exclude<CalendarLevel, "month">;

export interface MonthPickerBaseProps<Type extends DatePickerType = "default">
  extends
    PickerBaseProps<Type>,
    DecadeLevelBaseSettings,
    YearLevelBaseSettings,
    Omit<CalendarBaseProps, "onNextMonth" | "onPreviousMonth" | "hasNextLevel"> {
  /** Max level the user can zoom out to. @default 'decade' */
  maxLevel?: CalendarLevel;

  /** Initial displayed level in uncontrolled mode. */
  defaultLevel?: CalendarLevel;

  /** Current displayed level in controlled mode. */
  level?: CalendarLevel;

  /** Called when the displayed level changes. */
  onLevelChange?: (level: MonthPickerLevel) => void;

  /** Predefined values to pick from. */
  presets?: MonthPickerPreset<Type>[];

  /** If defined, called with the preset value and suppresses the `onChange` call. */
  __onPresetSelect?: (preset: DatePickerValue<Type, DateStringValue>) => void;
}

type MonthPickerFrameProps = Omit<
  GetProps<typeof Box>,
  "size" | "children" | "value" | "defaultValue" | "onChange" | "onMouseLeave"
>;

export interface MonthPickerProps<Type extends DatePickerType = "default">
  extends MonthPickerFrameProps, MonthPickerBaseProps<Type> {
  /** Width/font of the controls. @default 'md' */
  size?: CalendarSize;

  /** Called when a month is selected. */
  onMonthSelect?: (date: DateStringValue) => void;
}

/**
 * Preserves the `<Type>` generic through `forwardRef` (which would otherwise pin
 * `Type` at its `"default"` instantiation), mirroring Mantine's
 * `MonthPickerComponent` minus the static-props intersection.
 */
type MonthPickerComponent = <Type extends DatePickerType = "default">(
  props: MonthPickerProps<Type> & { ref?: React.Ref<TamaguiElement> },
) => React.JSX.Element;

/**
 * `MonthPicker` — the inline month-selection picker. Drives a `Calendar` pinned to
 * the year level (`minLevel="year"`) through the `useDatesState` selection machine,
 * so it selects months in `default` / `range` / `multiple` modes with a live range
 * hover-preview, and the level still zooms year↔decade. Optional `presets` render a
 * list of `UnstyledButton`s that imperatively jump the displayed date to the year
 * level via the Calendar's `__setDateRef` / `__setLevelRef`. Accent comes from the
 * active Tamagui theme.
 */
function MonthPickerInner<Type extends DatePickerType = "default">(
  props: MonthPickerProps<Type>,
  ref: React.ForwardedRef<TamaguiElement>,
): React.JSX.Element {
  const {
    type = "default",
    defaultValue,
    value,
    onChange,
    getMonthControlProps,
    allowSingleDateInRange,
    allowDeselect,
    onMouseLeave,
    onMonthSelect,
    __updateDateOnMonthSelect,
    __onPresetSelect,
    __stopPropagation,
    presets,
    size,
    onLevelChange,
    ...rest
  } = props;

  const { calendarProps, others } = pickCalendarProps(rest);
  const setDateRef = useRef<((date: DateStringValue) => void) | null>(null);
  const setLevelRef = useRef<((level: CalendarLevel) => void) | null>(null);

  const { onDateChange, onRootMouseLeave, onHoveredDateChange, getControlProps, setValue } =
    useDatesState({
      type: type as Type,
      level: "month",
      allowDeselect,
      allowSingleDateInRange,
      value,
      defaultValue,
      onChange,
      onMouseLeave,
    });

  const calendar = (
    <Calendar
      size={size}
      {...calendarProps}
      {...(!presets ? others : {})}
      minLevel="year"
      __updateDateOnMonthSelect={__updateDateOnMonthSelect ?? false}
      onMouseLeave={onRootMouseLeave}
      onMonthMouseEnter={(_event, date) => onHoveredDateChange(date)}
      onMonthSelect={(date) => {
        onDateChange(date);
        onMonthSelect?.(date);
      }}
      getMonthControlProps={(date) => ({
        ...getControlProps(date),
        ...getMonthControlProps?.(date),
      })}
      onLevelChange={(level) => {
        // The grid is pinned to the year level, so `month` never surfaces here;
        // narrow it out so the handler keeps its `MonthPickerLevel` contract.
        if (level !== "month") {
          onLevelChange?.(level);
        }
      }}
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
        level: "year",
        setValue,
        __onPresetSelect,
      })}
      {calendar}
    </Box>
  );
}

/**
 * `MonthPicker` — the inline month-selection picker. A `Calendar` pinned to the
 * year level (`minLevel="year"`) driven by the shared `useDatesState` selection
 * machine, so it selects MONTHS in `default` / `range` / `multiple` modes (with a
 * live range hover-preview) while the level still zooms year↔decade. Values are
 * `YYYY-MM-DD` strings normalised to the first of the month; selection is
 * controlled (`value` + `onChange`) or uncontrolled (`defaultValue`). Optional
 * `presets` render quick-jump buttons beside the calendar. Forwards its ref to the
 * root and preserves the `<Type>` generic. Accent comes from the active Tamagui
 * theme. See {@link MonthPickerInner} for the implementation notes.
 *
 * @example
 * <MonthPicker value={value} onChange={setValue} defaultDate="2026-06-01" />
 */
export const MonthPicker = React.forwardRef(MonthPickerInner) as MonthPickerComponent & {
  displayName?: string;
};

MonthPicker.displayName = "@knitui/dates/MonthPicker";
