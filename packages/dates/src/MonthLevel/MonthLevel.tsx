// ───────────────────────────────────────────────────────────────────────────
// MonthLevel — mirrors @mantine/dates' MonthLevel API, rebuilt on
// @knitui/components (`Box`) + @knitui/core + dayjs. It is the day-grid calendar
// level: a `CalendarHeader` (month label + prev/next/level controls) atop a
// `Month` day grid.
//
// Cross-platform: one source renders on web + native. The level root is a styled
// `Box` column (NEVER an HTML element), so it themes via the active Tamagui theme
// ramp and carries `size` to its children.
//
// OWNS vs DELEGATES. This level OWNS only the composition: the month label
// (`monthLabelFormat` + locale), the auto-disable of the prev/next controls at
// the `minDate`/`maxDate` bounds, and the per-slot `styles` routing. Everything
// else is DELEGATED — header chrome/a11y/interaction to `CalendarHeader`, and
// per-cell sizing (#3), theme-ramp colors (#4), the day-grid a11y roles and cell
// a11y/interaction (#11/#12) to `Month`/`Day`. The numbered rules in
// `_reference/README.md` that apply here: #1 (this header), #2 (shared size
// context), #7 (`styles` sugar + `getDayProps` passthrough — owned by `Month`),
// #9 (locale), #10 (min/max bounds), #11 (delegated a11y), #13 (`.styleable` +
// typed ref), #14 (`withStaticProperties`), #15 (no dynamic hide styles — none
// used here). Unlike `DecadeLevel`, a month is NOT the top level: it zooms out to
// a year, so the level control stays interactive (`onLevelClick`/`hasNextLevel`).
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import dayjs from "dayjs";

import { Box } from "@knitui/components";
import {
  createStyledContext,
  type GetProps,
  slotStyles,
  type SlotStyles,
  styled,
  withStaticProperties,
} from "@knitui/core";

import {
  CalendarHeader,
  type CalendarHeaderSettings,
  type CalendarHeaderStyles,
} from "../CalendarHeader";
import { type CalendarSize } from "../cell-metrics";
import { useDatesContext } from "../DatesProvider";
import { Month, type MonthSettings } from "../Month";
import type { DateLabelFormat, DateStringValue } from "../types";

export interface MonthLevelBaseSettings extends MonthSettings {
  /** dayjs format for the month label, or a function returning it. @default 'MMMM YYYY' */
  monthLabelFormat?: DateLabelFormat;
}

export interface MonthLevelSettings extends MonthLevelBaseSettings, CalendarHeaderSettings {}

// ── 2. Shared context ─────────────────────────────────────────────────────────
// One `createStyledContext` carries `size` to the styled root so it shares the
// SAME axis the consumer set without a parallel `size` prop on the frame itself.
const MonthLevelContext = createStyledContext<{ size: CalendarSize }>({ size: "md" });

// ── 5/13. Styled root ─────────────────────────────────────────────────────────
// The level root is a styled `Box` column (the dates norm: a real styled part so
// `.styleable` can forward a ref + style props onto it). It establishes the
// shared `size` context; the header and grid own the `size` variant themselves.
const MonthLevelFrame = styled(Box, {
  name: "MonthLevel",
  context: MonthLevelContext,
  flexDirection: "column",

  variants: {
    /**
     * Stretch the level to an equal share of its `LevelsGroup` row when the
     * calendar is `fullWidth`. The header + grid inside resolve `width: 100%`
     * against this frame, so without it the level stays content-sized and the
     * `fullWidth` chain breaks here. `flexBasis: 0` makes multi-column groups
     * share the row equally (the same idiom as `MonthCell`).
     */
    fullWidth: {
      true: { flexGrow: 1, flexBasis: 0 },
    },
  } as const,
});

type MonthLevelFrameProps = Omit<GetProps<typeof MonthLevelFrame>, "size" | "children">;

// ── 7. Per-slot `styles` sugar ────────────────────────────────────────────────
// Mantine's `MonthLevelStylesNames = MonthStylesNames | CalendarHeaderStylesNames`
// — its `styles` flows down to BOTH parts. The kit's analogue: a slot map whose
// header-named slots route straight into `CalendarHeader`'s own `styles` sugar,
// plus a `month` slot for the `Month` grid frame (`Month` exposes per-cell tuning
// via `getDayProps`, not a `styles` map). Precedence is fixed in one place by
// `slotStyles().merge` — `defaults < styles[slot] < explicit props`.

/** The named style slots and the part each targets. */
export interface MonthLevelStyles {
  /** Props for the level root column (`.Frame`). */
  root?: GetProps<typeof MonthLevelFrame>;
  /** Props for the `Month` grid root (`.Month`) — style props only; `month` is owned. */
  month?: Partial<GetProps<typeof Month>>;
  /** Props for the header bar (`CalendarHeader` `root` slot). */
  header?: CalendarHeaderStyles["root"];
  /** Props for each header prev/next control (`CalendarHeader` `control` slot). */
  headerControl?: CalendarHeaderStyles["control"];
  /** Props for the header level (label) control (`CalendarHeader` `level` slot). */
  headerLevel?: CalendarHeaderStyles["level"];
  /** Props for the header level label text (`CalendarHeader` `levelLabel` slot). */
  headerLevelLabel?: CalendarHeaderStyles["levelLabel"];
  /** Props for the header chevron glyphs (`CalendarHeader` `icon` slot). */
  headerIcon?: CalendarHeaderStyles["icon"];
}

const MONTH_LEVEL_SLOT_KEYS = [
  "root",
  "month",
  "header",
  "headerControl",
  "headerLevel",
  "headerLevelLabel",
  "headerIcon",
] as const satisfies readonly (keyof MonthLevelStyles)[];

export interface MonthLevelProps extends MonthLevelFrameProps, MonthLevelSettings {
  /** Month that is currently displayed, any date within it (`YYYY-MM-DD`). */
  month: DateStringValue;

  /** Level control `aria-label`. */
  levelControlAriaLabel?: string;

  /** Render days as static (non-interactive) display cells. @default false */
  static?: boolean;

  /** Stretch the level (and its grid) to the full width of its container. @default false */
  fullWidth?: boolean;

  /** Width/font of the header controls and day cells. @default 'md' */
  size?: CalendarSize;

  /** Per-slot style sugar — props spread onto the matching part (header + grid). */
  styles?: SlotStyles<MonthLevelStyles>;
}

/**
 * `MonthLevel` — the day-grid calendar level: a `CalendarHeader` (month label +
 * prev/next/level controls) atop a `Month` day grid. A thin composition over the
 * already-built parts; the level root is a styled `Box` column (NEVER an HTML
 * element). Accent comes from the active Tamagui theme.
 *
 * A month is not the top level — it zooms OUT to a year — so the header level
 * control stays interactive (`onLevelClick` + `hasNextLevel`). Next/previous
 * controls disable automatically at the month's bounds relative to
 * `minDate`/`maxDate` (unless `nextDisabled`/`previousDisabled` are given). The
 * label honours `monthLabelFormat` (string or function) and the `DatesProvider`
 * locale. All `__onDay*` / `__getDayRef` / `__preventFocus` / `__stopPropagation`
 * plumbing is forwarded straight to the `Month`.
 *
 * Per-slot style sugar: `styles={{ headerControl: { borderRadius: "$lg" } }}` routes
 * onto the matching part; per-cell tuning stays on `getDayProps(date)`. The day
 * grid's a11y/interaction/sizing are delegated to `Month`/`Day` and the header to
 * `CalendarHeader`. Forwards its ref + style props to the root.
 *
 * @example
 * <MonthLevel month="2024-01-01" onNext={nextMonth} onPrevious={prevMonth} onLevelClick={zoomOut} />
 */
const MonthLevelComponent = MonthLevelFrame.styleable<MonthLevelProps>(
  function MonthLevel(props, ref) {
    const {
      // Month settings
      month,
      locale,
      firstDayOfWeek,
      weekdayFormat,
      weekendDays,
      getDayProps,
      excludeDate,
      minDate,
      maxDate,
      renderDay,
      hideOutsideDates,
      hideWeekdays,
      getDayAriaLabel,
      __getDayRef,
      __onDayKeyDown,
      __onDayClick,
      __onDayMouseEnter,
      withCellSpacing,
      highlightToday,
      withWeekNumbers,

      // CalendarHeader settings
      __preventFocus,
      __stopPropagation,
      nextIcon,
      previousIcon,
      nextLabel,
      previousLabel,
      onNext,
      onPrevious,
      onLevelClick,
      nextDisabled,
      previousDisabled,
      hasNextLevel,
      levelControlAriaLabel,
      withNext,
      withPrevious,
      headerControlsOrder,

      // Level-specific
      monthLabelFormat = "MMMM YYYY",
      size = "md",
      static: isStatic,
      fullWidth,
      styles,
      ...rest
    } = props;

    // 7. Typed per-slot accessor (dev-warns unknown keys against the known set).
    const s = slotStyles<MonthLevelStyles>(styles, MONTH_LEVEL_SLOT_KEYS, "MonthLevel");

    // 9. Locale comes from `DatesProvider` (consumer `locale` prop wins).
    const ctx = useDatesContext();

    // 10. Auto-disable the controls at the `minDate`/`maxDate` bounds (an explicit
    //     boolean override always wins).
    const _nextDisabled =
      typeof nextDisabled === "boolean"
        ? nextDisabled
        : maxDate
          ? !dayjs(month).endOf("month").isBefore(maxDate)
          : false;

    const _previousDisabled =
      typeof previousDisabled === "boolean"
        ? previousDisabled
        : minDate
          ? !dayjs(month).startOf("month").isAfter(minDate)
          : false;

    const label =
      typeof monthLabelFormat === "function"
        ? monthLabelFormat(month)
        : dayjs(month).locale(ctx.getLocale(locale)).format(monthLabelFormat);

    // 7. Route the header-named slots into `CalendarHeader`'s own `styles` map.
    const headerStyles: SlotStyles<CalendarHeaderStyles> = {
      root: s.get("header"),
      control: s.get("headerControl"),
      level: s.get("headerLevel"),
      levelLabel: s.get("headerLevelLabel"),
      icon: s.get("headerIcon"),
    };

    return (
      <MonthLevelFrame ref={ref} fullWidth={fullWidth} {...s.merge("root", rest)}>
        <CalendarHeader
          label={label}
          __preventFocus={__preventFocus}
          __stopPropagation={__stopPropagation}
          nextIcon={nextIcon}
          previousIcon={previousIcon}
          nextLabel={nextLabel}
          previousLabel={previousLabel}
          onNext={onNext}
          onPrevious={onPrevious}
          onLevelClick={onLevelClick}
          nextDisabled={_nextDisabled}
          previousDisabled={_previousDisabled}
          hasNextLevel={hasNextLevel}
          levelControlAriaLabel={levelControlAriaLabel}
          withNext={withNext}
          withPrevious={withPrevious}
          headerControlsOrder={headerControlsOrder}
          size={size}
          fullWidth={fullWidth}
          styles={headerStyles}
        />

        <Month
          month={month}
          locale={locale}
          firstDayOfWeek={firstDayOfWeek}
          weekdayFormat={weekdayFormat}
          weekendDays={weekendDays}
          getDayProps={getDayProps}
          excludeDate={excludeDate}
          minDate={minDate}
          maxDate={maxDate}
          renderDay={renderDay}
          hideOutsideDates={hideOutsideDates}
          hideWeekdays={hideWeekdays}
          getDayAriaLabel={getDayAriaLabel}
          __getDayRef={__getDayRef}
          __onDayKeyDown={__onDayKeyDown}
          __onDayClick={__onDayClick}
          __onDayMouseEnter={__onDayMouseEnter}
          __preventFocus={__preventFocus}
          __stopPropagation={__stopPropagation}
          static={isStatic}
          withCellSpacing={withCellSpacing}
          highlightToday={highlightToday}
          withWeekNumbers={withWeekNumbers}
          size={size}
          fullWidth={fullWidth}
          {...s.get("month")}
        />
      </MonthLevelFrame>
    );
  },
);

// ── 14. Public surface ────────────────────────────────────────────────────────
// `withStaticProperties` exposes the styled root + the composed parts so consumers
// can target them via the `styles` sugar and extend them (`styled(MonthLevel.Frame, …)`).
export const MonthLevel = withStaticProperties(MonthLevelComponent, {
  /** The level root column. */
  Frame: MonthLevelFrame,
  /** The header bar (month label + prev/next/level controls). */
  Header: CalendarHeader,
  /** The day selection grid. */
  Month,
});

MonthLevel.displayName = "@knitui/dates/MonthLevel";
