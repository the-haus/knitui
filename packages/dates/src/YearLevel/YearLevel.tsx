// ───────────────────────────────────────────────────────────────────────────
// YearLevel — mirrors @mantine/dates' YearLevel API, rebuilt on
// @knitui/components (`Box`) + @knitui/core + dayjs. It is the month-grid calendar
// level: a `CalendarHeader` (year label + prev/next/level controls) atop a
// `MonthsList` 4×3 month grid.
//
// Cross-platform: one source renders on web + native. The level root is a styled
// `Box` column (NEVER an HTML element), so it themes via the active Tamagui theme
// ramp and carries `size` to its children.
//
// OWNS vs DELEGATES. This level OWNS only the composition: the year label
// (`yearLabelFormat` + locale), the auto-disable of the prev/next controls at
// the `minDate`/`maxDate` bounds, and the per-slot `styles` routing. Everything
// else is DELEGATED — header chrome/a11y/interaction to `CalendarHeader`, and
// per-cell sizing (#3), theme-ramp colors (#4), the month-grid a11y roles and
// cell a11y/interaction (#11/#12) to `MonthsList`/`PickerControl`. The numbered
// rules in `_reference/README.md` that apply here: #1 (this header), #2 (shared
// size context), #7 (`styles` sugar + `getMonthControlProps` passthrough — owned
// by `MonthsList`), #9 (locale), #10 (min/max bounds), #11 (delegated a11y),
// #13 (`.styleable` + typed ref), #14 (`withStaticProperties`), #15 (no dynamic
// hide styles — none used here). Unlike `DecadeLevel`, a year is NOT the top
// level: it zooms out to a decade, so the level control stays interactive
// (`onLevelClick`/`hasNextLevel`).
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
import { MonthsList, type MonthsListSettings } from "../MonthsList";
import type { DateLabelFormat, DateStringValue } from "../types";

export interface YearLevelBaseSettings extends MonthsListSettings {
  /** dayjs format for the year label, or a function returning it. @default 'YYYY' */
  yearLabelFormat?: DateLabelFormat;
}

export interface YearLevelSettings extends YearLevelBaseSettings, CalendarHeaderSettings {}

// ── 2. Shared context ─────────────────────────────────────────────────────────
// One `createStyledContext` carries `size` to the styled root so it shares the
// SAME axis the consumer set without a parallel `size` prop on the frame itself.
const YearLevelContext = createStyledContext<{ size: CalendarSize }>({ size: "md" });

// ── 5/13. Styled root ─────────────────────────────────────────────────────────
// The level root is a styled `Box` column (the dates norm: a real styled part so
// `.styleable` can forward a ref + style props onto it). It establishes the
// shared `size` context; the header and grid own the `size` variant themselves.
const YearLevelFrame = styled(Box, {
  name: "YearLevel",
  context: YearLevelContext,
  flexDirection: "column",

  variants: {
    /**
     * Stretch the level to an equal share of its `LevelsGroup` row when the
     * calendar is `fullWidth`. The header + months grid inside resolve
     * `width: 100%` against this frame, so without it the `fullWidth` chain
     * breaks here. `flexBasis: 0` shares multi-column rows equally.
     */
    fullWidth: {
      true: { flexGrow: 1, flexBasis: 0 },
    },
  } as const,
});

type YearLevelFrameProps = Omit<GetProps<typeof YearLevelFrame>, "size" | "children">;

// ── 7. Per-slot `styles` sugar ────────────────────────────────────────────────
// Mantine's `YearLevelStylesNames = MonthsListStylesNames | CalendarHeaderStylesNames`
// — its `styles` flows down to BOTH parts. The kit's analogue: a slot map whose
// header-named slots route straight into `CalendarHeader`'s own `styles` sugar,
// plus a `months` slot for the `MonthsList` grid frame (`MonthsList` exposes
// per-cell tuning via `getMonthControlProps`, not consumed here as a map). Precedence
// is fixed in one place by `slotStyles().merge` — `defaults < styles[slot] < explicit props`.

/** The named style slots and the part each targets. */
export interface YearLevelStyles {
  /** Props for the level root column (`.Frame`). */
  root?: GetProps<typeof YearLevelFrame>;
  /** Props for the `MonthsList` grid root (`.List`) — style props only; `year` is owned. */
  months?: Partial<GetProps<typeof MonthsList>>;
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

const YEAR_LEVEL_SLOT_KEYS = [
  "root",
  "months",
  "header",
  "headerControl",
  "headerLevel",
  "headerLevelLabel",
  "headerIcon",
] as const satisfies readonly (keyof YearLevelStyles)[];

export interface YearLevelProps extends YearLevelFrameProps, YearLevelSettings {
  /** Year that is currently displayed, any date within it (`YYYY-MM-DD`). */
  year: DateStringValue;

  /** Level control `aria-label`. */
  levelControlAriaLabel?: string;

  /** Stretch the level (and its grid) to the full width of its container. @default false */
  fullWidth?: boolean;

  /** Width/font of the header controls and month cells. @default 'md' */
  size?: CalendarSize;

  /** Per-slot style sugar — props spread onto the matching part (header + grid). */
  styles?: SlotStyles<YearLevelStyles>;
}

/**
 * `YearLevel` — the month-grid calendar level: a `CalendarHeader` (year label +
 * prev/next/level controls) atop a `MonthsList` 4×3 grid. A thin composition over
 * the already-built parts; the level root is a styled `Box` column (NEVER an HTML
 * element). Accent comes from the active Tamagui theme.
 *
 * A year is not the top level — it zooms OUT to a decade — so the header level
 * control stays interactive (`onLevelClick` + `hasNextLevel`). Next/previous
 * controls disable automatically at the year's bounds relative to
 * `minDate`/`maxDate` (unless `nextDisabled`/`previousDisabled` are given). The
 * label honours `yearLabelFormat` (string or function) and the `DatesProvider`
 * locale. All `__onControl*` / `__getControlRef` / `__preventFocus` /
 * `__stopPropagation` plumbing is forwarded straight to the `MonthsList`.
 *
 * Per-slot style sugar: `styles={{ headerControl: { borderRadius: "$lg" } }}` routes
 * onto the matching part; per-cell tuning stays on `getMonthControlProps(date)`. The
 * month grid's a11y/interaction/sizing are delegated to `MonthsList`/`PickerControl`
 * and the header to `CalendarHeader`. Forwards its ref + style props to the root.
 *
 * @example
 * <YearLevel year="2024-01-01" onNext={nextYear} onPrevious={prevYear} onLevelClick={zoomOut} />
 */
const YearLevelComponent = YearLevelFrame.styleable<YearLevelProps>(function YearLevel(props, ref) {
  const {
    // MonthsList settings
    year,
    locale,
    minDate,
    maxDate,
    monthsListFormat,
    getMonthControlProps,
    __getControlRef,
    __onControlKeyDown,
    __onControlClick,
    __onControlMouseEnter,
    withCellSpacing,

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
    yearLabelFormat = "YYYY",
    size = "md",
    fullWidth,
    styles,
    ...rest
  } = props;

  // 7. Typed per-slot accessor (dev-warns unknown keys against the known set).
  const s = slotStyles<YearLevelStyles>(styles, YEAR_LEVEL_SLOT_KEYS, "YearLevel");

  // 9. Locale comes from `DatesProvider` (consumer `locale` prop wins).
  const ctx = useDatesContext();

  // 10. Auto-disable the controls at the `minDate`/`maxDate` bounds (an explicit
  //     boolean override always wins).
  const _nextDisabled =
    typeof nextDisabled === "boolean"
      ? nextDisabled
      : maxDate
        ? !dayjs(year).endOf("year").isBefore(maxDate)
        : false;

  const _previousDisabled =
    typeof previousDisabled === "boolean"
      ? previousDisabled
      : minDate
        ? !dayjs(year).startOf("year").isAfter(minDate)
        : false;

  const label =
    typeof yearLabelFormat === "function"
      ? yearLabelFormat(year)
      : dayjs(year).locale(ctx.getLocale(locale)).format(yearLabelFormat);

  // 7. Route the header-named slots into `CalendarHeader`'s own `styles` map.
  const headerStyles: SlotStyles<CalendarHeaderStyles> = {
    root: s.get("header"),
    control: s.get("headerControl"),
    level: s.get("headerLevel"),
    levelLabel: s.get("headerLevelLabel"),
    icon: s.get("headerIcon"),
  };

  return (
    <YearLevelFrame ref={ref} fullWidth={fullWidth} {...s.merge("root", rest)}>
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

      <MonthsList
        year={year}
        locale={locale}
        minDate={minDate}
        maxDate={maxDate}
        monthsListFormat={monthsListFormat}
        getMonthControlProps={getMonthControlProps}
        __getControlRef={__getControlRef}
        __onControlKeyDown={__onControlKeyDown}
        __onControlClick={__onControlClick}
        __onControlMouseEnter={__onControlMouseEnter}
        __preventFocus={__preventFocus}
        __stopPropagation={__stopPropagation}
        withCellSpacing={withCellSpacing}
        size={size}
        fullWidth={fullWidth}
        {...s.get("months")}
      />
    </YearLevelFrame>
  );
});

// ── 14. Public surface ────────────────────────────────────────────────────────
// `withStaticProperties` exposes the styled root + the composed parts so consumers
// can target them via the `styles` sugar and extend them (`styled(YearLevel.Frame, …)`).
export const YearLevel = withStaticProperties(YearLevelComponent, {
  /** The level root column. */
  Frame: YearLevelFrame,
  /** The header bar (year label + prev/next/level controls). */
  Header: CalendarHeader,
  /** The month selection grid. */
  List: MonthsList,
});

YearLevel.displayName = "@knitui/dates/YearLevel";
