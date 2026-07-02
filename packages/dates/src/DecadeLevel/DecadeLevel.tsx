// ───────────────────────────────────────────────────────────────────────────
// DecadeLevel — mirrors @mantine/dates' DecadeLevel API, rebuilt on
// @knitui/components (`Box`) + @knitui/core + dayjs. It is the TOP calendar level: a
// `CalendarHeader` (decade label + prev/next controls) atop a `YearsList` ragged
// 3/3/3/1 year grid.
//
// Cross-platform: one source renders on web + native. The level root is a styled
// `Box` column (NEVER an HTML element), so it themes via the active Tamagui theme
// ramp and carries `size` to its children.
//
// OWNS vs DELEGATES. This level OWNS only the composition: the decade label
// (`decadeLabelFormat` + locale), the auto-disable of the prev/next controls at
// the `minDate`/`maxDate` bounds, and the per-slot `styles` routing. Everything
// else is DELEGATED — header chrome/a11y/interaction to `CalendarHeader`, and
// per-cell sizing (#3), theme-ramp colors (#4) and cell a11y/interaction
// (#11/#12) to `YearsList`/`PickerControl`. The numbered rules in
// `_reference/README.md` that apply here: #1 (this header), #2 (shared size
// context), #7 (`styles` sugar + `getYearControlProps` passthrough), #9 (locale),
// #10 (min/max bounds), #11 (delegated a11y), #13 (`.styleable` + typed ref),
// #14 (`withStaticProperties`), #15 (no dynamic hide styles — none used here).
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
import type { DateStringValue } from "../types";
import { YearsList, type YearsListSettings } from "../YearsList";
import { getDecadeRange } from "./get-decade-range/get-decade-range";

/** Two-arg decade label format — receives the start and end of the decade. */
export type DecadeLabelFormat =
  | string
  | ((startOfDecade: DateStringValue, endOfDecade: DateStringValue) => React.ReactNode);

export interface DecadeLevelBaseSettings extends YearsListSettings {
  /** dayjs format for the decade label, or a function returning it. @default 'YYYY' */
  decadeLabelFormat?: DecadeLabelFormat;
}

export interface DecadeLevelSettings
  extends DecadeLevelBaseSettings, Omit<CalendarHeaderSettings, "onLevelClick" | "hasNextLevel"> {}

// ── 2. Shared context ─────────────────────────────────────────────────────────
// One `createStyledContext` carries `size` to the styled root so it shares the
// SAME axis the consumer set without a parallel `size` prop on the frame itself.
const DecadeLevelContext = createStyledContext<{ size: CalendarSize }>({ size: "md" });

// ── 5/13. Styled root ───────────────────────────────────────────────────────
// The level root is a styled `Box` column (the dates norm: a real styled part so
// `.styleable` can forward a ref + style props onto it). It establishes the
// shared `size` context; the header and grid own the `size` variant themselves.
const DecadeLevelFrame = styled(Box, {
  name: "DecadeLevel",
  context: DecadeLevelContext,
  flexDirection: "column",

  variants: {
    /**
     * Stretch the level to an equal share of its `LevelsGroup` row when the
     * calendar is `fullWidth`. The header + years grid inside resolve
     * `width: 100%` against this frame, so without it the `fullWidth` chain
     * breaks here. `flexBasis: 0` shares multi-column rows equally.
     */
    fullWidth: {
      true: { flexGrow: 1, flexBasis: 0 },
    },
  } as const,
});

type DecadeLevelFrameProps = Omit<GetProps<typeof DecadeLevelFrame>, "size" | "children">;

// ── 7. Per-slot `styles` sugar ──────────────────────────────────────────────
// Mantine's `DecadeLevelStylesNames = YearsListStylesNames | CalendarHeaderStylesNames`
// — its `styles` flows down to BOTH parts. The kit's analogue: a slot map whose
// header-named slots route straight into `CalendarHeader`'s own `styles` sugar,
// plus a `list` slot for the `YearsList` frame (`YearsList` exposes per-cell
// tuning via `getYearControlProps`, not a `styles` map). Precedence is fixed in
// one place by `slotStyles().merge` — `defaults < styles[slot] < explicit props`.

/** The named style slots and the part each targets. */
export interface DecadeLevelStyles {
  /** Props for the level root column (`.Frame`). */
  root?: GetProps<typeof DecadeLevelFrame>;
  /** Props for the `YearsList` grid root (`.List`) — style props only; `decade` is owned. */
  list?: Partial<GetProps<typeof YearsList>>;
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

const DECADE_LEVEL_SLOT_KEYS = [
  "root",
  "list",
  "header",
  "headerControl",
  "headerLevel",
  "headerLevelLabel",
  "headerIcon",
] as const satisfies readonly (keyof DecadeLevelStyles)[];

export interface DecadeLevelProps extends DecadeLevelFrameProps, DecadeLevelSettings {
  /** Decade that is currently displayed, any date within it (`YYYY-MM-DD`). */
  decade: DateStringValue;

  /** Level control `aria-label`. */
  levelControlAriaLabel?: string;

  /** Stretch the level (and its grid) to the full width of its container. @default false */
  fullWidth?: boolean;

  /** Width/font of the header controls and year cells. @default 'md' */
  size?: CalendarSize;

  /** Per-slot style sugar — props spread onto the matching part (header + grid). */
  styles?: SlotStyles<DecadeLevelStyles>;
}

/**
 * `DecadeLevel` — the year-grid calendar level: a `CalendarHeader` (decade label +
 * prev/next controls) atop a `YearsList` ragged 3/3/3/1 grid. A thin composition
 * over the already-built parts; the level root is a styled `Box` column (NEVER an
 * HTML element). Accent comes from the active Tamagui theme.
 *
 * This is the TOP level — there is no level above a decade, so the header level
 * control is non-interactive (`hasNextLevel={false}`) and `onLevelClick` is not
 * accepted. Next/previous controls disable automatically at the decade's bounds
 * relative to `minDate`/`maxDate`. The label honours `decadeLabelFormat` (a string
 * formats both ends as `start – end`, or a two-arg function override) and the
 * `DatesProvider` locale. All `__onControl*` / `__getControlRef` / `__preventFocus`
 * / `__stopPropagation` plumbing is forwarded straight to the `YearsList`.
 *
 * Per-slot style sugar: `styles={{ headerControl: { borderRadius: "$lg" } }}` routes
 * onto the matching part; per-cell tuning stays on `getYearControlProps(date)`.
 * a11y/interaction/sizing for the cells are delegated to `YearsList`/`PickerControl`
 * and the header to `CalendarHeader`. Forwards its ref + style props to the root.
 *
 * @example
 * <DecadeLevel decade="2024-01-01" onNext={nextDecade} onPrevious={prevDecade} />
 */
const DecadeLevelComponent = DecadeLevelFrame.styleable<DecadeLevelProps>(
  function DecadeLevel(props, ref) {
    const {
      // YearsList settings
      decade,
      locale,
      minDate,
      maxDate,
      yearsListFormat,
      getYearControlProps,
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
      nextDisabled,
      previousDisabled,
      levelControlAriaLabel,
      withNext,
      withPrevious,
      headerControlsOrder,

      // Level-specific
      decadeLabelFormat = "YYYY",
      size = "md",
      fullWidth,
      styles,
      ...rest
    } = props;

    // Typed per-slot accessor (dev-warns unknown keys against the known set).
    const s = slotStyles<DecadeLevelStyles>(styles, DECADE_LEVEL_SLOT_KEYS, "DecadeLevel");

    // 9. Locale comes from `DatesProvider` (consumer `locale` prop wins).
    const ctx = useDatesContext();
    const [startOfDecade, endOfDecade] = getDecadeRange(decade);

    // 10. Auto-disable the controls at the `minDate`/`maxDate` bounds (an explicit
    //     boolean override always wins).
    const _nextDisabled =
      typeof nextDisabled === "boolean"
        ? nextDisabled
        : maxDate
          ? !dayjs(endOfDecade).endOf("year").isBefore(maxDate)
          : false;

    const _previousDisabled =
      typeof previousDisabled === "boolean"
        ? previousDisabled
        : minDate
          ? !dayjs(startOfDecade).startOf("year").isAfter(minDate)
          : false;

    const formatDecade = (date: DateStringValue, format: string) =>
      dayjs(date).locale(ctx.getLocale(locale)).format(format);

    const label =
      typeof decadeLabelFormat === "function"
        ? decadeLabelFormat(startOfDecade, endOfDecade)
        : `${formatDecade(startOfDecade, decadeLabelFormat)} – ${formatDecade(
            endOfDecade,
            decadeLabelFormat,
          )}`;

    // 7. Route the header-named slots into `CalendarHeader`'s own `styles` map.
    const headerStyles: SlotStyles<CalendarHeaderStyles> = {
      root: s.get("header"),
      control: s.get("headerControl"),
      level: s.get("headerLevel"),
      levelLabel: s.get("headerLevelLabel"),
      icon: s.get("headerIcon"),
    };

    return (
      <DecadeLevelFrame ref={ref} fullWidth={fullWidth} {...s.merge("root", rest)}>
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
          nextDisabled={_nextDisabled}
          previousDisabled={_previousDisabled}
          hasNextLevel={false}
          levelControlAriaLabel={levelControlAriaLabel}
          withNext={withNext}
          withPrevious={withPrevious}
          headerControlsOrder={headerControlsOrder}
          size={size}
          fullWidth={fullWidth}
          styles={headerStyles}
        />

        <YearsList
          decade={decade}
          locale={locale}
          minDate={minDate}
          maxDate={maxDate}
          yearsListFormat={yearsListFormat}
          getYearControlProps={getYearControlProps}
          __getControlRef={__getControlRef}
          __onControlKeyDown={__onControlKeyDown}
          __onControlClick={__onControlClick}
          __onControlMouseEnter={__onControlMouseEnter}
          __preventFocus={__preventFocus}
          __stopPropagation={__stopPropagation}
          withCellSpacing={withCellSpacing}
          size={size}
          fullWidth={fullWidth}
          {...s.get("list")}
        />
      </DecadeLevelFrame>
    );
  },
);

// ── 14. Public surface ──────────────────────────────────────────────────────
// `withStaticProperties` exposes the styled root + the composed parts so consumers
// can target them via the `styles` sugar and extend them (`styled(DecadeLevel.Frame, …)`).
export const DecadeLevel = withStaticProperties(DecadeLevelComponent, {
  /** The level root column. */
  Frame: DecadeLevelFrame,
  /** The header bar (decade label + prev/next controls). */
  Header: CalendarHeader,
  /** The year selection grid. */
  List: YearsList,
});

DecadeLevel.displayName = "@knitui/dates/DecadeLevel";
