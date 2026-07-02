// ───────────────────────────────────────────────────────────────────────────
// YearPicker — mirrors the `@mantine/dates` `YearPicker` API, built on
// `@knitui/components` (`Box`) + the calendar family (`Calendar` + `useDatesState`)
// + dayjs. Like `DatePicker` and its sibling `MonthPicker`, it is a thin SELECTION
// wrapper: it owns no cells of its own. It binds the shared `useDatesState`
// selection machine (`default` / `range` / `multiple`, with the live range
// hover-preview) to a `Calendar` pinned to the decade level (`minLevel="decade"`)
// so it selects YEARS.
//
// Cross-platform: web + native from this single source — every prop forwarded
// here is itself cross-platform (`onMouseLeave` is a Tamagui no-op on native,
// preset presses go through `UnstyledButton`). No web-only API is reached.
//
// On the kit checklist (see `_reference/README.md`): like `Calendar` and its
// sibling `MonthPicker`, YearPicker DELEGATES the leaf styling rules. Shared
// `size` context (2), derived `cell-metrics` sizing (3), theme-ramp colors (4),
// styled parts + marker slots (5/6/14) and the per-slot `styles` sugar (7) all
// live DOWNSTREAM in the decade-level group / year cells — YearPicker just
// forwards the public `size` straight through, so re-declaring them here would
// reach no consumer (the same call `Calendar` documents). What YearPicker DOES
// carry: this provenance header (1), controlled/uncontrolled selection via
// `useDatesState` (8), locale + min/max + a11y passthrough into `Calendar`
// (9/10/11), per-item `getYearControlProps` passthrough with "explicit beats
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

/** A predefined value the user can jump to from the preset list. */
export interface YearPickerPreset<Type extends DatePickerType> {
  /** Value applied when the preset is selected (shaped by the picker `type`). */
  value: DatePickerValue<Type, DateStringValue>;

  /** Preset label. */
  label: React.ReactNode;
}

export interface YearPickerBaseProps<Type extends DatePickerType = "default">
  extends
    PickerBaseProps<Type>,
    DecadeLevelBaseSettings,
    Omit<
      CalendarBaseProps,
      "onNextYear" | "onPreviousYear" | "onNextMonth" | "onPreviousMonth" | "hasNextLevel"
    > {
  /** Predefined values to pick from. */
  presets?: YearPickerPreset<Type>[];

  /** If defined, called with the preset value and suppresses the `onChange` call. */
  __onPresetSelect?: (preset: DatePickerValue<Type, DateStringValue>) => void;
}

type YearPickerFrameProps = Omit<
  GetProps<typeof Box>,
  "size" | "children" | "value" | "defaultValue" | "onChange" | "onMouseLeave"
>;

export interface YearPickerProps<Type extends DatePickerType = "default">
  extends YearPickerFrameProps, YearPickerBaseProps<Type> {
  /** Width/font of the controls. @default 'md' */
  size?: CalendarSize;

  /** Called when a year is selected. */
  onYearSelect?: (date: DateStringValue) => void;
}

/**
 * Preserves the `<Type>` generic through `forwardRef` (which would otherwise pin
 * `Type` at its `"default"` instantiation), mirroring Mantine's
 * `YearPickerComponent` minus the static-props intersection.
 */
type YearPickerComponent = <Type extends DatePickerType = "default">(
  props: YearPickerProps<Type> & { ref?: React.Ref<TamaguiElement> },
) => React.JSX.Element;

/**
 * `YearPicker` — the inline year-selection picker. Drives a `Calendar` pinned to
 * the decade level (`minLevel="decade"`) through the `useDatesState` selection
 * machine, so it selects years in `default` / `range` / `multiple` modes with a
 * live range hover-preview. Optional `presets` render a list of `UnstyledButton`s
 * that imperatively jump the displayed date + level via the Calendar's
 * `__setDateRef` / `__setLevelRef`. Accent comes from the active Tamagui theme.
 */
function YearPickerInner<Type extends DatePickerType = "default">(
  props: YearPickerProps<Type>,
  ref: React.ForwardedRef<TamaguiElement>,
): React.JSX.Element {
  const {
    type = "default",
    defaultValue,
    value,
    onChange,
    getYearControlProps,
    allowSingleDateInRange,
    allowDeselect,
    onMouseLeave,
    onYearSelect,
    __updateDateOnYearSelect,
    __onPresetSelect,
    __stopPropagation,
    presets,
    size,
    ...rest
  } = props;

  const { calendarProps, others } = pickCalendarProps(rest);
  const setDateRef = useRef<((date: DateStringValue) => void) | null>(null);
  const setLevelRef = useRef<((level: CalendarLevel) => void) | null>(null);

  const { onDateChange, onRootMouseLeave, onHoveredDateChange, getControlProps, setValue } =
    useDatesState({
      type: type as Type,
      level: "year",
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
      minLevel="decade"
      __updateDateOnYearSelect={__updateDateOnYearSelect ?? false}
      onMouseLeave={onRootMouseLeave}
      onYearMouseEnter={(_event, date) => onHoveredDateChange(date)}
      onYearSelect={(date) => {
        onDateChange(date);
        onYearSelect?.(date);
      }}
      getYearControlProps={(date) => ({
        ...getControlProps(date),
        ...getYearControlProps?.(date),
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
        level: "decade",
        setValue,
        __onPresetSelect,
      })}
      {calendar}
    </Box>
  );
}

/**
 * `YearPicker` — the inline year-selection picker. A `Calendar` pinned to the
 * decade level (`minLevel="decade"`) driven by the shared `useDatesState`
 * selection machine, so it selects YEARS in `default` / `range` / `multiple`
 * modes (with a live range hover-preview). Values are `YYYY-MM-DD` strings
 * normalised to January 1 of the year; selection is controlled (`value` +
 * `onChange`) or uncontrolled (`defaultValue`). Optional `presets` render
 * quick-jump buttons beside the calendar. Forwards its ref to the root and
 * preserves the `<Type>` generic. Accent comes from the active Tamagui theme.
 * See {@link YearPickerInner} for the implementation notes.
 *
 * @example
 * <YearPicker value={value} onChange={setValue} defaultDate="2026-01-01" />
 */
export const YearPicker = React.forwardRef(YearPickerInner) as YearPickerComponent & {
  displayName?: string;
};

YearPicker.displayName = "@knitui/dates/YearPicker";
