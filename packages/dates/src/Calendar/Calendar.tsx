// ───────────────────────────────────────────────────────────────────────────
// Calendar — mirrors the `@mantine/dates` `Calendar` API, built on
// `@knitui/components` (`Box`) + `@knitui/core` (`styled`/`withStaticProperties`) +
// dayjs. It is the keystone LEVEL STATE MACHINE of the calendar family: it owns
// the displayed level (decade↔year↔month) and the displayed date, and renders
// exactly one of the three level groups for the active level.
//
// Cross-platform: web + native from this single source. The grid arrow-roving
// works everywhere (via the level groups); the enhanced Ctrl/Cmd+Arrow and `Y`
// shortcuts are web-only and live behind an `isWeb` guard (a no-op on native).
// The root is a `styled(Box)` frame (never an HTML element) and forwards its ref.
//
// On the kit checklist (see `_reference/README.md`): Calendar OWNS NO CELLS — it
// delegates every grid/control to the level groups, which carry their own
// `size` context, theme-ramp colors and `cell-metrics` sizing. So the leaf
// styling rules (shared `size` context, derived sizing, theme colors, per-slot
// `styles` sugar) are satisfied downstream and intentionally do NOT live here —
// the same call `LevelsGroup` documents. What Calendar DOES carry: provenance
// header (1), a styled `.Frame` part (5) exposed via `withStaticProperties` (14)
// and forwarded through `.styleable` (13), controlled/uncontrolled state (8),
// locale/min/max/a11y passthrough (9/10/11), per-item `getDayProps` /
// `getMonthControlProps` / `getYearControlProps` passthrough (7), and
// compiler-safe show/hide via conditional subtrees — never a dynamic `opacity`
// style prop (15).
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import dayjs from "dayjs";

import { Box } from "@knitui/components";
import {
  type GetProps,
  isWeb,
  styled,
  type TamaguiElement,
  withStaticProperties,
} from "@knitui/core";
import { useMergedRef, useUncontrolled } from "@knitui/hooks";

import { type CalendarSize } from "../cell-metrics";
import { type DecadeLevelSettings } from "../DecadeLevel";
import { DecadeLevelGroup } from "../DecadeLevelGroup";
import { useUncontrolledDates } from "../hooks";
import { type MonthLevelSettings } from "../MonthLevel";
import { MonthLevelGroup } from "../MonthLevelGroup";
import type { CalendarLevel, DateStringValue } from "../types";
import { toDateString } from "../utils";
import { type YearLevelSettings } from "../YearLevel";
import { YearLevelGroup } from "../YearLevelGroup";
import { clampLevel } from "./clamp-level/clamp-level";

/** `aria-label`s for the level / navigation controls across every calendar level. */
export interface CalendarAriaLabels {
  monthLevelControl?: string;
  yearLevelControl?: string;

  nextMonth?: string;
  previousMonth?: string;

  nextYear?: string;
  previousYear?: string;

  nextDecade?: string;
  previousDecade?: string;
}

// Calendar owns navigation + level zoom, so the per-level nav settings are not
// part of its public surface — they are derived internally per level.
type OmittedSettings =
  | "onNext"
  | "onPrevious"
  | "onLevelClick"
  | "withNext"
  | "withPrevious"
  | "nextDisabled"
  | "previousDisabled"
  | "hasNextLevel";

export interface CalendarSettings
  extends
    Omit<DecadeLevelSettings, OmittedSettings>,
    Omit<YearLevelSettings, OmittedSettings>,
    Omit<MonthLevelSettings, OmittedSettings> {
  /** Initial displayed level in uncontrolled mode. */
  defaultLevel?: CalendarLevel;

  /** Current displayed level in controlled mode. */
  level?: CalendarLevel;

  /** Called when the displayed level changes. */
  onLevelChange?: (level: CalendarLevel) => void;

  /** Called when the user selects a year. */
  onYearSelect?: (date: DateStringValue) => void;

  /** Called when the user selects a month. */
  onMonthSelect?: (date: DateStringValue) => void;

  /**
   * Called when the pointer enters a year control (web hover; used for range
   * preview). Cross-platform — the event type is opaque, never a DOM event.
   */
  onYearMouseEnter?: (event: unknown, date: DateStringValue) => void;

  /**
   * Called when the pointer enters a month control (web hover; used for range
   * preview). Cross-platform — the event type is opaque, never a DOM event.
   */
  onMonthMouseEnter?: (event: unknown, date: DateStringValue) => void;
}

export interface CalendarBaseProps {
  /** Prevents focus shift when controls are clicked. */
  __preventFocus?: boolean;

  /** Stops Escape-key propagation from the calendar controls (input-picker parity). */
  __stopPropagation?: boolean;

  /**
   * Called when the pointer leaves the calendar root (web hover; used by range
   * pickers to clear the hover preview). Cross-platform — the event type is opaque,
   * never a DOM event; Tamagui no-ops it on native.
   */
  onMouseLeave?: (event: unknown) => void;

  /** Whether the displayed date should update when a year control is clicked. @default true */
  __updateDateOnYearSelect?: boolean;

  /** Whether the displayed date should update when a month control is clicked. @default true */
  __updateDateOnMonthSelect?: boolean;

  /** Receives a function that imperatively sets the displayed date. */
  __setDateRef?: React.RefObject<((date: DateStringValue) => void) | null>;

  /** Receives a function that imperatively sets the displayed level. */
  __setLevelRef?: React.RefObject<((level: CalendarLevel) => void) | null>;

  /** Initial displayed date in uncontrolled mode. */
  defaultDate?: DateStringValue | Date;

  /** Displayed date in controlled mode. */
  date?: DateStringValue | Date;

  /** Called when the displayed date changes. */
  onDateChange?: (date: DateStringValue) => void;

  /** Number of columns displayed next to each other. @default 1 */
  numberOfColumns?: number;

  /** Number of columns to scroll with the next/prev buttons. @default `numberOfColumns` */
  columnsToScroll?: number;

  /** `aria-label`s for the controls on the different levels. */
  ariaLabels?: CalendarAriaLabels;

  /** Next-button `aria-label`. */
  nextLabel?: string;

  /** Previous-button `aria-label`. */
  previousLabel?: string;

  /** Stretch the calendar to the full width of its container. @default false */
  fullWidth?: boolean;

  /** Called when the next-decade button is clicked. */
  onNextDecade?: (date: DateStringValue) => void;

  /** Called when the previous-decade button is clicked. */
  onPreviousDecade?: (date: DateStringValue) => void;

  /** Called when the next-year button is clicked. */
  onNextYear?: (date: DateStringValue) => void;

  /** Called when the previous-year button is clicked. */
  onPreviousYear?: (date: DateStringValue) => void;

  /** Called when the next-month button is clicked. */
  onNextMonth?: (date: DateStringValue) => void;

  /** Called when the previous-month button is clicked. */
  onPreviousMonth?: (date: DateStringValue) => void;
}

/**
 * The calendar root frame. A `styled(Box)` (never an HTML `<div>`) so it renders
 * identically on web + native and is a stable extension point
 * (`styled(Calendar.Frame, …)`). It is deliberately layout-neutral and carries
 * no `size` variant or `createStyledContext`: Calendar owns no cells of its own —
 * each level group is sized by the explicit `size` prop Calendar forwards to it,
 * so a shared context here would reach no consumer (same call `LevelsGroup`
 * documents). It DOES carry the `fullWidth` boolean variant: the stretch chain
 * below resolves `width: 100%` against this root, so the root itself must opt in.
 */
const CalendarFrame = styled(Box, {
  name: "Calendar",

  variants: {
    /**
     * Stretch the calendar root to fill its container in BOTH axes. `width: 100%`
     * fills the width (the level groups / levels / grid below resolve their own
     * `width: 100%` against this frame); `flexGrow: 1` lets it fill the height of
     * a sized flex parent, which the grid then distributes across the week rows.
     * Both are no-ops without a constraining container — the default `flexBasis:
     * auto` keeps the calendar at its content size when there is no extra space.
     */
    fullWidth: {
      true: { width: "100%", flexGrow: 1 },
    },
  } as const,
});

// `onMouseLeave` is omitted from the frame (which types it as a web-only
// `MouseEventHandler`) so `CalendarBaseProps` can re-declare it cross-platform.
type CalendarFrameProps = Omit<
  GetProps<typeof CalendarFrame>,
  "size" | "children" | "onMouseLeave"
>;

export interface CalendarProps extends CalendarFrameProps, CalendarSettings, CalendarBaseProps {
  /** Max level the user can zoom out to. @default 'decade' */
  maxLevel?: CalendarLevel;

  /** Min level the user can zoom in to. @default 'month' */
  minLevel?: CalendarLevel;

  /** Render days as static (non-interactive) display cells. @default false */
  static?: boolean;

  /**
   * Enable enhanced keyboard navigation (web only): Ctrl/Cmd+Arrow steps a year,
   * Ctrl/Cmd+Shift+Arrow steps a decade, `Y` opens the year view. @default true
   */
  enableKeyboardNavigation?: boolean;

  /** Width/font of the header controls and cells. @default 'md' */
  size?: CalendarSize;
}

/**
 * `Calendar` — the keystone level state machine. Owns the displayed level
 * (decade↔year↔month) and the displayed date, and renders exactly one of the
 * three level groups for the active level. Selecting a month or year on an outer
 * level zooms back in (clamped to `[minLevel, maxLevel]`); the level control
 * zooms out. Next/previous step by `columnsToScroll` (falling back to
 * `numberOfColumns`).
 *
 * Cross-platform: grid arrow-roving works everywhere via the groups; the
 * enhanced Ctrl/Cmd+Arrow and `Y` shortcuts are web-only and live behind an
 * `isWeb` guard (a no-op on native). The root is a `styled(Box)` frame (never an
 * HTML element), exposed as `Calendar.Frame` and forwarding its ref + style
 * props via `.styleable`. Accent comes from the active Tamagui theme.
 */
const CalendarComponent = CalendarFrame.styleable<CalendarProps>(function Calendar(props, ref) {
  const {
    // Level / navigation owned by Calendar
    maxLevel = "decade",
    minLevel = "month",
    defaultLevel,
    level,
    onLevelChange,
    date,
    defaultDate,
    onDateChange,
    numberOfColumns,
    columnsToScroll,
    ariaLabels,
    nextLabel,
    previousLabel,
    onYearSelect,
    onMonthSelect,
    onYearMouseEnter,
    onMonthMouseEnter,
    headerControlsOrder,
    __updateDateOnYearSelect = true,
    __updateDateOnMonthSelect = true,
    __setDateRef,
    __setLevelRef,

    // MonthLevelGroup settings
    firstDayOfWeek,
    weekdayFormat,
    weekendDays,
    getDayProps,
    excludeDate,
    renderDay,
    hideOutsideDates,
    hideWeekdays,
    getDayAriaLabel,
    monthLabelFormat,
    nextIcon,
    previousIcon,
    __onDayClick,
    __onDayMouseEnter,
    withCellSpacing,
    highlightToday,
    withWeekNumbers,

    // YearLevelGroup settings
    monthsListFormat,
    getMonthControlProps,
    yearLabelFormat,

    // DecadeLevelGroup settings
    yearsListFormat,
    getYearControlProps,
    decadeLabelFormat,

    // Other
    minDate,
    maxDate,
    locale,
    size,
    __preventFocus,
    __stopPropagation,
    onNextDecade,
    onPreviousDecade,
    onNextYear,
    onPreviousYear,
    onNextMonth,
    onPreviousMonth,
    static: isStatic,
    enableKeyboardNavigation = true,
    fullWidth,
    onMouseLeave,
    ...others
  } = props;

  const [_level, _setLevel] = useUncontrolled<CalendarLevel>({
    value: level ? clampLevel(level, minLevel, maxLevel) : undefined,
    defaultValue: defaultLevel ? clampLevel(defaultLevel, minLevel, maxLevel) : undefined,
    finalValue: clampLevel("month", minLevel, maxLevel),
    onChange: onLevelChange,
  });

  // Always clamp the next level into the [minLevel, maxLevel] window.
  const setLevel = (next: CalendarLevel) => _setLevel(clampLevel(next, minLevel, maxLevel));

  const [_date, setDate] = useUncontrolledDates({
    type: "default",
    value: date && toDateString(date),
    defaultValue: defaultDate && toDateString(defaultDate),
    // The displayed date is never cleared in `default` mode, so narrow the
    // `string | null` stored value back to `DateStringValue` for the callback.
    onChange: onDateChange ? (value) => value !== null && onDateChange(value) : undefined,
  });

  React.useImperativeHandle(__setDateRef, () => (next: DateStringValue) => {
    setDate(next);
  });

  React.useImperativeHandle(__setLevelRef, () => (next: CalendarLevel) => {
    setLevel(next);
  });

  const _columnsToScroll = columnsToScroll ?? numberOfColumns ?? 1;

  const fallbackDateRef = React.useRef<DateStringValue | null>(null);
  if (fallbackDateRef.current === null) {
    const now = new Date();
    fallbackDateRef.current =
      minDate && dayjs(now).isAfter(minDate) ? toDateString(minDate) : toDateString(now);
  }
  const currentDate = _date || fallbackDateRef.current;

  const handleNextMonth = () => {
    const nextDate = dayjs(currentDate).add(_columnsToScroll, "month").format("YYYY-MM-DD");
    onNextMonth?.(nextDate);
    setDate(nextDate);
  };

  const handlePreviousMonth = () => {
    const nextDate = dayjs(currentDate).subtract(_columnsToScroll, "month").format("YYYY-MM-DD");
    onPreviousMonth?.(nextDate);
    setDate(nextDate);
  };

  const handleNextYear = () => {
    const nextDate = dayjs(currentDate).add(_columnsToScroll, "year").format("YYYY-MM-DD");
    onNextYear?.(nextDate);
    setDate(nextDate);
  };

  const handlePreviousYear = () => {
    const nextDate = dayjs(currentDate).subtract(_columnsToScroll, "year").format("YYYY-MM-DD");
    onPreviousYear?.(nextDate);
    setDate(nextDate);
  };

  const handleNextDecade = () => {
    const nextDate = dayjs(currentDate)
      .add(10 * _columnsToScroll, "year")
      .format("YYYY-MM-DD");
    onNextDecade?.(nextDate);
    setDate(nextDate);
  };

  const handlePreviousDecade = () => {
    const nextDate = dayjs(currentDate)
      .subtract(10 * _columnsToScroll, "year")
      .format("YYYY-MM-DD");
    onPreviousDecade?.(nextDate);
    setDate(nextDate);
  };

  const calendarRef = React.useRef<TamaguiElement>(null);
  const mergedRef = useMergedRef(calendarRef, ref);

  React.useEffect(() => {
    // Enhanced keyboard navigation is web-only: it reads the DOM focus + key
    // modifiers. On native it is a no-op (grid arrow-roving still works via the
    // groups). The whole effect bails before touching any DOM API on native.
    if (!isWeb || !enableKeyboardNavigation || isStatic) {
      return;
    }

    const node = calendarRef.current;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(node instanceof HTMLElement) || !node.contains(document.activeElement)) {
        return;
      }

      const isCtrlOrCmd = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;

      switch (event.key) {
        case "ArrowUp":
          if (isCtrlOrCmd && isShift) {
            event.preventDefault();
            handlePreviousDecade();
          } else if (isCtrlOrCmd) {
            event.preventDefault();
            handlePreviousYear();
          }
          break;

        case "ArrowDown":
          if (isCtrlOrCmd && isShift) {
            event.preventDefault();
            handleNextDecade();
          } else if (isCtrlOrCmd) {
            event.preventDefault();
            handleNextYear();
          }
          break;

        case "y":
        case "Y":
          if (_level === "month") {
            event.preventDefault();
            setLevel("year");
          }
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableKeyboardNavigation, isStatic, _level, _columnsToScroll, currentDate]);

  return (
    <CalendarFrame ref={mergedRef} fullWidth={fullWidth} onMouseLeave={onMouseLeave} {...others}>
      {_level === "month" && (
        <MonthLevelGroup
          month={currentDate}
          minDate={minDate}
          maxDate={maxDate}
          firstDayOfWeek={firstDayOfWeek}
          weekdayFormat={weekdayFormat}
          weekendDays={weekendDays}
          getDayProps={getDayProps}
          excludeDate={excludeDate}
          renderDay={renderDay}
          hideOutsideDates={hideOutsideDates}
          hideWeekdays={hideWeekdays}
          getDayAriaLabel={getDayAriaLabel}
          onNext={handleNextMonth}
          onPrevious={handlePreviousMonth}
          hasNextLevel={maxLevel !== "month"}
          onLevelClick={() => setLevel("year")}
          numberOfColumns={numberOfColumns}
          locale={locale}
          levelControlAriaLabel={ariaLabels?.monthLevelControl}
          nextLabel={ariaLabels?.nextMonth ?? nextLabel}
          nextIcon={nextIcon}
          previousLabel={ariaLabels?.previousMonth ?? previousLabel}
          previousIcon={previousIcon}
          monthLabelFormat={monthLabelFormat}
          __onDayClick={__onDayClick}
          __onDayMouseEnter={__onDayMouseEnter}
          __preventFocus={__preventFocus}
          __stopPropagation={__stopPropagation}
          static={isStatic}
          withCellSpacing={withCellSpacing}
          highlightToday={highlightToday}
          withWeekNumbers={withWeekNumbers}
          headerControlsOrder={headerControlsOrder}
          fullWidth={fullWidth}
          size={size}
        />
      )}

      {_level === "year" && (
        <YearLevelGroup
          year={currentDate}
          numberOfColumns={numberOfColumns}
          minDate={minDate}
          maxDate={maxDate}
          monthsListFormat={monthsListFormat}
          getMonthControlProps={getMonthControlProps}
          locale={locale}
          onNext={handleNextYear}
          onPrevious={handlePreviousYear}
          hasNextLevel={maxLevel !== "month" && maxLevel !== "year"}
          onLevelClick={() => setLevel("decade")}
          levelControlAriaLabel={ariaLabels?.yearLevelControl}
          nextLabel={ariaLabels?.nextYear ?? nextLabel}
          nextIcon={nextIcon}
          previousLabel={ariaLabels?.previousYear ?? previousLabel}
          previousIcon={previousIcon}
          yearLabelFormat={yearLabelFormat}
          __onControlMouseEnter={onMonthMouseEnter}
          __onControlClick={(_event, payload) => {
            if (__updateDateOnMonthSelect) {
              setDate(payload);
            }
            setLevel(clampLevel("month", minLevel, maxLevel));
            onMonthSelect?.(payload);
          }}
          __preventFocus={__preventFocus}
          __stopPropagation={__stopPropagation}
          withCellSpacing={withCellSpacing}
          headerControlsOrder={headerControlsOrder}
          fullWidth={fullWidth}
          size={size}
        />
      )}

      {_level === "decade" && (
        <DecadeLevelGroup
          decade={currentDate}
          minDate={minDate}
          maxDate={maxDate}
          yearsListFormat={yearsListFormat}
          getYearControlProps={getYearControlProps}
          locale={locale}
          onNext={handleNextDecade}
          onPrevious={handlePreviousDecade}
          numberOfColumns={numberOfColumns}
          nextLabel={ariaLabels?.nextDecade ?? nextLabel}
          nextIcon={nextIcon}
          previousLabel={ariaLabels?.previousDecade ?? previousLabel}
          previousIcon={previousIcon}
          decadeLabelFormat={decadeLabelFormat}
          __onControlMouseEnter={onYearMouseEnter}
          __onControlClick={(_event, payload) => {
            if (__updateDateOnYearSelect) {
              setDate(payload);
            }
            setLevel(clampLevel("year", minLevel, maxLevel));
            onYearSelect?.(payload);
          }}
          __preventFocus={__preventFocus}
          __stopPropagation={__stopPropagation}
          withCellSpacing={withCellSpacing}
          headerControlsOrder={headerControlsOrder}
          fullWidth={fullWidth}
          size={size}
        />
      )}
    </CalendarFrame>
  );
});

CalendarComponent.displayName = "@knitui/dates/Calendar";

/**
 * `withStaticProperties` attaches the styled root frame as `Calendar.Frame`, the
 * single extension point so consumers can `styled(Calendar.Frame, …)`. Calendar
 * owns no other styled parts — every cell/control lives in the level groups.
 */
export const Calendar = withStaticProperties(CalendarComponent, {
  Frame: CalendarFrame,
});
