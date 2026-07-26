// ───────────────────────────────────────────────────────────────────────────
// Month — the calendar month day grid.
//
// Mirrors `@mantine/dates`' `Month` API (props, defaults, `__`-prefixed internal
// hooks) but is built on `@knitui/components` (`Box`/`Text`) + `@knitui/core`
// (`styled`/`createStyledContext`/slot sugar) + `@knitui/dates` `Day`/`WeekdaysRow`
// + dayjs — NEVER HTML `<table>`/`<tr>`/`<td>`, so it renders on web AND native
// from one source. Accent comes from the active Tamagui theme (`theme="red"`),
// never a Mantine-style `color` prop.
//
// This is a GRID component: per-cell sizing/colour/interaction (checklist #3/#4/
// #12) live in the `Day` leaf — Month just lays out the rows/cells and shares
// `size` down via context. Selection/range/today modifiers are computed here and
// handed to each `Day` as boolean props (which `Day` expresses as variants), so
// nothing in Month uses a dynamic `opacity`/`display` style prop (checklist #15):
// hiding an outside day is `Day`'s `hidden` variant (`display: none`), and
// `fullWidth` is a boolean VARIANT on the cell/frame, not a per-render spread.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";
import { useMemo } from "react";

import dayjs from "dayjs";

import { Box, Text } from "@knitui/components";
import {
  createStyledContext,
  type GetProps,
  slotStyles,
  type SlotStyles,
  styled,
  withStaticProperties,
} from "@knitui/core";
import { useCallbackRef } from "@knitui/hooks";

import { type CalendarSize, CELL_FONT, CELL_SPACING, CELL_WIDTH } from "../cell-metrics";
import { useDatesContext } from "../DatesProvider";
import { Day, type DayProps, type RenderDay } from "../Day";
import { areCellPropsEqual } from "../internal/are-cell-props-equal";
import { focusElement } from "../internal/focus-element";
import {
  hasPreventDefault,
  hasStopPropagation,
  isEscapeKey,
} from "../internal/has-prevent-default";
import { memoizeByDate } from "../internal/memoize-control-props";
import { getCachedMonthDays } from "../internal/month-days-cache";
import type { ControlKeydownPayload, DateLabelFormat, DateStringValue, DayOfWeek } from "../types";
import {
  type FocusableControl,
  getDateInTabOrder,
  getWeekNumber,
  isAfterMinDate,
  isBeforeMaxDate,
  isSameMonth,
  toDateString,
} from "../utils";
import { WeekdaysRow } from "../WeekdaysRow";

/**
 * The facts about one day cell that depend ONLY on the grid shape + provider
 * settings — no consumer callback, no selection. Derived once per grid shape and
 * cached for as long as that shape holds; this is where all the per-cell dayjs
 * work lives, so it is the layer that must never be invalidated by a consumer
 * handing us a fresh closure. See the two `useMemo`s in `Month` below.
 */
interface MonthBaseCellInfo {
  /** The cell's date, `YYYY-MM-DD`. */
  date: DateStringValue;
  /** Day falls outside the displayed month. */
  outside: boolean;
  /** Day is removed from layout (`hideOutsideDates` + `outside`). */
  hidden: boolean;
  /** Day is one of the configured weekend days. */
  weekend: boolean;
  /**
   * The locale-formatted fallback `aria-label` (`undefined` for a static grid) —
   * what a cell announces when no `getDayAriaLabel` supplies one.
   */
  defaultAriaLabel: string | undefined;
}

/** One week row's base cells plus its (optional) ISO week number. */
interface MonthBaseRowInfo {
  cells: MonthBaseCellInfo[];
  weekNumber: number | undefined;
}

/**
 * The SELECTION-INDEPENDENT facts about one day cell — {@link MonthBaseCellInfo}
 * with the two consumer callbacks (`excludeDate`/`getDayAriaLabel`) applied over
 * it. Derived once per grid shape + callback identity rather than once per
 * render — see the two `useMemo`s in `Month` below.
 */
interface MonthCellInfo {
  /** The cell's date, `YYYY-MM-DD`. */
  date: DateStringValue;
  /** Day falls outside the displayed month. */
  outside: boolean;
  /** Day is removed from layout (`hideOutsideDates` + `outside`). */
  hidden: boolean;
  /** Day is one of the configured weekend days. */
  weekend: boolean;
  /** Day is out of bounds or excluded. */
  disabled: boolean;
  /** Resolved `aria-label` for the cell (`undefined` for a static grid). */
  ariaLabel: string | undefined;
}

/** One week row's cells plus its (optional) ISO week number. */
interface MonthRowInfo {
  cells: MonthCellInfo[];
  weekNumber: number | undefined;
}

/** Props for the memoized day cell — see {@link MonthDayCell}. */
interface MonthDayCellProps {
  /** Selection-independent facts about this cell (spread from `MonthCellInfo`). */
  date: DateStringValue;
  outside: boolean;
  hidden: boolean;
  weekend: boolean;
  disabled: boolean | undefined;
  ariaLabel: string | undefined;

  /** Grid position, used for roving focus. */
  rowIndex: number;
  cellIndex: number;

  /** Roving tabindex for this cell. */
  tabIndex: number;

  size: MonthSize;
  isStatic: boolean;
  fullWidth: boolean;
  highlightToday: boolean;
  renderDay: RenderDay | undefined;
  stopPropagation: boolean | undefined;
  preventFocus: boolean | undefined;

  /** `styles.cell` props for the wrapper. */
  cellProps: GetProps<typeof MonthCell> | undefined;

  /** The raw `getDayProps(date)` result — the source of the consumer's own handlers. */
  dayProps: Partial<DayProps> | undefined;

  /** `styles.day` merged UNDER `dayProps` — spread onto the `Day` leaf. */
  mergedDayProps: Partial<DayProps>;

  /**
   * The `__`-prefixed grid callbacks, pre-stabilised by `Month` with
   * `useCallbackRef` — an unstable identity here would defeat the memo for every
   * cell on every render.
   */
  onDayMouseEnter: (event: unknown, date: DateStringValue) => void;
  onDayClick: (event: DayPressEvent, date: DateStringValue) => void;
  onDayKeyDown: (event: DayKeyboardEvent, payload: ControlKeydownPayload) => void;
  getDayRef: (rowIndex: number, cellIndex: number, control: FocusableControl) => void;
}

/**
 * One day cell, memoized.
 *
 * The grid re-renders for reasons that concern only one or two cells — most
 * sharply a web hover move, which updates `hoveredDate` and re-renders the whole
 * `DatePicker` subtree per cell crossed. Without a memo boundary that meant 42
 * `Day` leaves re-rendering (and 42 refs detaching/reattaching, re-running
 * `__getDayRef` and rebuilding the `daysRefs` matrix) for a change that moved two
 * cells' background colour.
 *
 * The boundary is deliberately here — an internal cell, the same pattern the kit
 * uses for `Combobox`'s `OptionRow` and `TagsInput`'s chips — and NOT on the public
 * `Day`, whose props contract stays exactly as it was. Tamagui's styled-context
 * and theme reads happen inside `Day` and still propagate past a memo, so cells
 * keep responding to theme/size changes.
 */
const MonthDayCell = React.memo(function MonthDayCell({
  date,
  outside,
  hidden,
  weekend,
  disabled,
  ariaLabel,
  rowIndex,
  cellIndex,
  tabIndex,
  size,
  isStatic,
  fullWidth,
  highlightToday,
  renderDay,
  stopPropagation,
  preventFocus,
  cellProps,
  dayProps,
  mergedDayProps,
  onDayMouseEnter,
  onDayClick,
  onDayKeyDown,
  getDayRef,
}: MonthDayCellProps) {
  // Tamagui hover handlers are not part `Day`'s public prop type; attach them via
  // a precisely-typed object spread, the kit's pattern for web-only affordances
  // (see `@knitui/components` `hoverProps`). Native ignores it.
  const hoverHandlers: { onHoverIn?: (event: unknown) => void } = {
    onHoverIn: (event) => onDayMouseEnter(event, date),
  };

  return (
    <MonthCell role="cell" fullWidth={fullWidth} {...cellProps}>
      <Day
        highlightToday={highlightToday}
        renderDay={renderDay}
        date={date}
        size={size}
        weekend={weekend}
        outside={outside}
        hidden={hidden}
        aria-label={ariaLabel}
        static={isStatic}
        fullWidth={fullWidth}
        disabled={disabled}
        ref={(node) => {
          if (node) {
            getDayRef(rowIndex, cellIndex, {
              focus: () => focusElement(node),
              disabled,
              isHidden: hidden,
              isOutside: outside,
            });
          }
        }}
        // explicit beats sugar: the `day` slot sits UNDER per-item
        // `getDayProps`, and the consumer's own handlers are preserved
        // (called before ours).
        {...mergedDayProps}
        {...hoverHandlers}
        onKeyDown={(event) => {
          dayProps?.onKeyDown?.(event);
          onDayKeyDown(event, { rowIndex, cellIndex, date });
          // When nested inside an input-trigger dropdown (`__stopPropagation`,
          // driven by `DateTimePicker`), keep the calendar's Escape from
          // bubbling out and closing an outer picker — the cross-platform
          // replacement for Mantine's `data-mantine-stop-propagation`. No-op
          // on native (no DOM `stopPropagation`).
          if (stopPropagation && isEscapeKey(event) && hasStopPropagation(event)) {
            event.stopPropagation();
          }
        }}
        onPress={(event) => {
          dayProps?.onPress?.(event);
          onDayClick(event, date);
        }}
        onPressIn={(event: DayPressInEvent) => {
          dayProps?.onPressIn?.(event);
          if (preventFocus && hasPreventDefault(event)) {
            event.preventDefault();
          }
        }}
        tabIndex={tabIndex}
      />
    </MonthCell>
  );
}, areCellPropsEqual);

/** Month grid size — the kit's shared control size scale (mirrors `Day`). */
type MonthSize = CalendarSize;

// ── 2. Shared context ───────────────────────────────────────────────────────
// One `createStyledContext` carries `size` to the styled parts (frame/row/cell/
// week-number) so they share the SAME size the consumer set on the root without
// prop-drilling — the same mechanism `Day`/`WeekdaysRow` use. The day cells
// themselves still take an explicit `size` prop (they own the `size` variant).
const MonthContext = createStyledContext<{ size: MonthSize }>({ size: "md" });

// ── 3. Sizing derived from the shared ladders ─────────────────────────────────
// The week-number column matches `Day`'s square `CELL_WIDTH` ladder so it lines
// up with the day grid; its label tracks the same `CELL_FONT` ladder. Raw ladder
// values (resolve at module-load) — never `getTokenValue`, which needs live config.
const weekNumberWidthVariant = {
  xxs: { width: CELL_WIDTH.xxs },
  xs: { width: CELL_WIDTH.xs },
  sm: { width: CELL_WIDTH.sm },
  md: { width: CELL_WIDTH.md },
  lg: { width: CELL_WIDTH.lg },
  xl: { width: CELL_WIDTH.xl },
  xxl: { width: CELL_WIDTH.xxl },
} as const;

const weekNumberFontVariant = {
  xxs: { fontSize: CELL_FONT.xxs },
  xs: { fontSize: CELL_FONT.xs },
  sm: { fontSize: CELL_FONT.sm },
  md: { fontSize: CELL_FONT.md },
  lg: { fontSize: CELL_FONT.lg },
  xl: { fontSize: CELL_FONT.xl },
  xxl: { fontSize: CELL_FONT.xxl },
} as const;

// ── 5. Styled parts ───────────────────────────────────────────────────────────

/** The grid container — a column of week rows (web `role="grid"`). */
const MonthFrame = styled(Box, {
  name: "Month",
  context: MonthContext,
  flexDirection: "column",

  variants: {
    /**
     * Stretch the grid to fill its container in BOTH axes. `width: "100%"` fills
     * the level horizontally; `flexGrow: 1` lets the grid fill a constrained
     * calendar height (after the weekday header), with the week rows below
     * distributing that height. `flexBasis: auto` keeps it content-height when no
     * height is set (no collapse).
     */
    fullWidth: {
      true: { width: "100%", flexGrow: 1 },
    },
  } as const,
});

/** A single week row (web `role="row"`). */
const MonthRow = styled(Box, {
  name: "MonthRow",
  context: MonthContext,
  flexDirection: "row",

  variants: {
    /**
     * Week rows share the grid's EXTRA height equally when `fullWidth` fills a
     * constrained calendar height. `flexGrow: 1` with the default `flexBasis:
     * auto` keeps each row at its content height (the cells' square `minHeight`)
     * and only distributes surplus — using `flexBasis: 0` here would collapse the
     * rows to nothing when no height is set (RN/Tamagui default `minHeight: 0`,
     * not `auto`, so there is no content floor on the flex item itself).
     */
    fullWidth: {
      true: { flexGrow: 1 },
    },
  } as const,
});

/**
 * A day-cell wrapper (web `role="cell"`). The `Day` leaf inside owns the cell's
 * dimensions/colour/interaction; this wrapper only centres it and, when
 * `fullWidth`, grows to an equal share of the row (a boolean VARIANT — not a
 * per-render `flexGrow` spread — so the optimiser has nothing dynamic to fold).
 */
const MonthCell = styled(Box, {
  name: "MonthCell",
  context: MonthContext,
  alignItems: "center",
  justifyContent: "center",

  variants: {
    /** Cell grows to an equal share of the row width. */
    fullWidth: {
      true: { flexGrow: 1, flexBasis: 0 },
    },
  } as const,
});

/** The leading week-number cell (web `role="rowheader"`). */
const MonthWeekNumber = styled(Box, {
  name: "MonthWeekNumber",
  context: MonthContext,
  alignItems: "center",
  justifyContent: "center",

  variants: {
    size: weekNumberWidthVariant,
  } as const,

  defaultVariants: { size: "md" },
});

/** The week-number label — muted accent text (`$color11`). */
const MonthWeekNumberLabel = styled(Text, {
  name: "MonthWeekNumberLabel",
  context: MonthContext,
  color: "$color11",
  userSelect: "none",

  variants: {
    size: weekNumberFontVariant,
  } as const,

  defaultVariants: { size: "md" },
});

/*
 * Cross-platform re-typing of Mantine's DOM-typed day callbacks. The event types
 * are DERIVED from `Day`'s own (already cross-platform) prop signatures — never
 * `React.MouseEvent<HTMLButtonElement>` — and refs are descriptor-based. The
 * `__`-prefixed names are preserved so the Calendar layer can wire navigation,
 * range-hover preview and roving focus on top of `Month`.
 */
type DayPressEvent = Parameters<NonNullable<DayProps["onPress"]>>[0];
type DayPressInEvent = Parameters<NonNullable<DayProps["onPressIn"]>>[0];
type DayKeyboardEvent = Parameters<NonNullable<DayProps["onKeyDown"]>>[0];

// ── 7. Per-slot `styles` sugar ──────────────────────────────────────────────
// The kit's ONE styling model is props on the parts. `styles` is thin sugar over
// that: a map from named slot → that part's props, resolved through
// `slotStyles().merge` so precedence is fixed in one place —
//   defaults < styles[slot] < explicit xxxProps < inline props.
// Per-day dynamics that a static map can't express (a different prop per date)
// stay on the `getDayProps(date)` callback (Mantine parity); it wins over the
// `day` slot — explicit beats sugar.

/** The named style slots and the styled part each targets. */
export interface MonthStyles {
  /** Props for the grid container (`.Frame`). */
  root?: GetProps<typeof MonthFrame>;
  /** Props for each week row (`.Row`). */
  row?: GetProps<typeof MonthRow>;
  /** Props for each day-cell wrapper (`.Cell`). */
  cell?: GetProps<typeof MonthCell>;
  /** Props for each day inside a cell (`.Day` — the `Day` leaf). */
  day?: Partial<DayProps>;
  /** Props for each week-number cell (`.WeekNumber`). */
  weekNumber?: GetProps<typeof MonthWeekNumber>;
  /** Props for each week-number label (`.WeekNumberLabel`). */
  weekNumberLabel?: GetProps<typeof MonthWeekNumberLabel>;
}

const MONTH_SLOT_KEYS = [
  "root",
  "row",
  "cell",
  "day",
  "weekNumber",
  "weekNumberLabel",
] as const satisfies readonly (keyof MonthStyles)[];

export interface MonthSettings {
  /** Whether propagation for the `Escape` key should be stopped (forwarded to days). */
  __stopPropagation?: boolean;

  /** Prevent focus shift when a day is pressed (calls `preventDefault` on press-in). */
  __preventFocus?: boolean;

  /** Called when a day is pressed, with the press event and the day's date. */
  __onDayClick?: (event: DayPressEvent, date: DateStringValue) => void;

  /** Called when the pointer enters a day (web hover); used for range preview. */
  __onDayMouseEnter?: (event: unknown, date: DateStringValue) => void;

  /** Called on a day keydown, used for arrow-key navigation. */
  __onDayKeyDown?: (event: DayKeyboardEvent, payload: ControlKeydownPayload) => void;

  /**
   * Receives a `FocusableControl` descriptor for each day by grid position, used
   * for arrow-key roving focus. The grid builds the descriptor from the host node
   * plus the cell's own disabled/hidden/outside modifiers so the navigation engine
   * can skip non-focusable cells cross-platform.
   */
  __getDayRef?: (rowIndex: number, cellIndex: number, control: FocusableControl) => void;

  /** dayjs locale; falls back to `DatesProvider`. */
  locale?: string;

  /** First weekday of each row, `0` (Sunday) … `6` (Saturday). @default `DatesProvider` (1) */
  firstDayOfWeek?: DayOfWeek;

  /** dayjs format for weekday names, or a custom renderer. @default 'dd' */
  weekdayFormat?: DateLabelFormat;

  /** Indices of weekend days. @default `DatesProvider` ([0, 6]) */
  weekendDays?: DayOfWeek[];

  /** Passes props down to every `Day` (wins over `styles.day`). */
  getDayProps?: (date: DateStringValue) => Partial<DayProps>;

  /** Predicate marking a day disabled. */
  excludeDate?: (date: DateStringValue) => boolean;

  /** Minimum selectable date. */
  minDate?: DateStringValue | Date;

  /** Maximum selectable date. */
  maxDate?: DateStringValue | Date;

  /** Custom renderer for each day's content. */
  renderDay?: RenderDay;

  /** Hide days outside the current month. @default false */
  hideOutsideDates?: boolean;

  /** Hide the weekday header row. @default false */
  hideWeekdays?: boolean;

  /** Assigns each `Day` an `aria-label` based on its date. */
  getDayAriaLabel?: (date: DateStringValue) => string;

  /** Width/font of the grid cells. @default 'md' */
  size?: MonthSize;

  /** Separate cells/rows with spacing. @default true */
  withCellSpacing?: boolean;

  /** Highlight today with a border. @default false */
  highlightToday?: boolean;

  /** Display a leading week-number column. @default false */
  withWeekNumbers?: boolean;

  /** Stretch the grid (and its columns) to the full width of its container. @default false */
  fullWidth?: boolean;
}

type MonthFrameProps = Omit<GetProps<typeof MonthFrame>, "size" | "children" | "fullWidth">;

export interface MonthProps extends MonthFrameProps, MonthSettings {
  /** Month to display, any date within it, `YYYY-MM-DD`. */
  month: DateStringValue;

  /** Render days as static (non-interactive) display cells. @default false */
  static?: boolean;

  /**
   * Per-slot style sugar — props spread onto the matching styled part. Lives on
   * `MonthProps` (not the inherited `MonthSettings`) so Month's `styles` shape
   * does not flow up the shared Calendar settings chain and collide with
   * sibling components' own `styles` props.
   */
  styles?: SlotStyles<MonthStyles>;
}

/**
 * The month grid — a full calendar month built from `Box`/`Text` + `Day` +
 * `WeekdaysRow` (NEVER HTML `<table>`/`<tr>`/`<td>`). Days are enumerated with
 * `getMonthDays` (honouring `DatesProvider`'s `firstDayOfWeek`/`consistentWeeks`),
 * each computing its own outside/weekend/disabled/hidden state and a roving
 * `tabIndex` (`getDateInTabOrder`). Accent comes from the active Tamagui theme.
 *
 * Per-cell sizing/colour/interaction live in the `Day` leaf (delegated); Month
 * only lays out rows/cells, shares `size` via context, and offers `styles` sugar
 * over its parts plus the per-day `getDayProps` passthrough (explicit beats
 * sugar). Forwards its ref + style props to the grid host (the dates norm).
 *
 * a11y: the root is `role="grid"`, each week `role="row"`, each day cell
 * `role="cell"`, the week-number cell `role="rowheader"`. (ARIA's `gridcell`
 * would be the ideal child of `role="grid"`, but the cross-platform `Role` type
 * has no `gridcell` member — only `cell` — so we use the portable value.)
 */
const MonthComponent = MonthFrame.styleable<MonthProps>(function Month(props, ref) {
  const {
    __stopPropagation,
    __preventFocus,
    __onDayClick,
    __onDayMouseEnter,
    __onDayKeyDown,
    __getDayRef,
    locale,
    firstDayOfWeek,
    weekdayFormat,
    month,
    weekendDays,
    getDayProps,
    excludeDate,
    minDate,
    maxDate,
    renderDay,
    hideOutsideDates = false,
    hideWeekdays = false,
    getDayAriaLabel,
    static: isStatic = false,
    withCellSpacing = true,
    size = "md",
    highlightToday = false,
    withWeekNumbers = false,
    fullWidth = false,
    styles,
    ...rest
  } = props;

  const ctx = useDatesContext();

  const minDateString = minDate == null ? undefined : toDateString(minDate);
  const maxDateString = maxDate == null ? undefined : toDateString(maxDate);
  const weekendDaysList = ctx.getWeekendDays(weekendDays);
  const resolvedLocale = locale || ctx.locale;
  // The weekend set is depended on by VALUE below, not by identity: a consumer
  // inlining `weekendDays={[0, 6]}` hands us a fresh array every render, which
  // would defeat the grid memo while never changing the answer.
  const weekendDaysKey = weekendDaysList.join(",");

  // 7. Typed per-slot accessor (dev-warns unknown keys against the known set).
  const s = slotStyles<MonthStyles>(styles, MONTH_SLOT_KEYS, "Month");

  // Memoized on the three primitives the grid shape depends on, so navigating
  // back to an already-visited month replays the cached weeks instead of walking
  // the calendar day by day again (~70 dayjs instances + 35 `format` calls). Also
  // gives `dates` a STABLE identity per month, which is what lets it be used as a
  // `useMemo` dependency below.
  const dates = getCachedMonthDays({
    month,
    firstDayOfWeek: ctx.getFirstDayOfWeek(firstDayOfWeek),
    consistentWeeks: ctx.consistentWeeks,
  });

  // ── The per-cell derivation, hoisted out of the render loop ────────────────
  // Everything here is SELECTION-INDEPENDENT: which days are outside the month,
  // hidden, weekend, out of bounds, and what each announces. None of it can change
  // when the selection or the hovered day changes — yet it was all re-derived for
  // 42 cells on every render, including the renders caused by nothing but a hover
  // moving one cell over. `dayjs(date)` + `format("D MMMM YYYY")` per cell was the
  // bulk of it.
  //
  // The selection-DEPENDENT parts (`getDayProps`, the roving `tabIndex`) are
  // deliberately left in the loop below: they read live state, so memoizing them
  // would need a selection signature that is easy to get subtly wrong. Splitting
  // at the selection boundary gets the same win with none of that risk.
  //
  // The derivation is split across TWO memos, at the consumer-callback boundary.
  // `excludeDate`/`getDayAriaLabel` arrive straight from consumer props, and an app
  // that writes `excludeDate={(d) => …}` inline hands us a new function on every
  // render — which invalidated the single combined memo on every hover frame, so
  // the 42 dayjs instances + 42 `format("D MMMM YYYY")` calls were paid anyway.
  // Stabilising those identities (`useCallbackRef`) is NOT an option: a predicate
  // legitimately closes over live state, and a memo that cannot see it change would
  // silently show stale disabled days. So instead the EXPENSIVE half — everything
  // that touches dayjs — is memoized WITHOUT them, and only the cheap half (calling
  // the consumer's two functions and assembling the result) recomputes when their
  // identity moves. Both memos still bail out entirely in the common case, so the
  // stable-callback path is unchanged.
  const baseRows = useMemo<MonthBaseRowInfo[]>(
    () =>
      dates.map((week) => ({
        weekNumber: withWeekNumbers ? getWeekNumber(week) : undefined,
        cells: week.map((date) => {
          const outside = !isSameMonth(date, month);
          // ONE dayjs per cell, shared by the weekend test and the fallback label.
          // `weekendDaysList.some((wd) => wd === dayjs(date).day())` built an
          // instance PER WEEKEND DAY TESTED — 2 with the default `[0, 6]`, i.e. 84
          // per grid — and the label built a third. `.day()` is a plain field read
          // and `.locale()` returns a clone, so sharing the instance is safe.
          const day = dayjs(date);
          const dayOfWeek = day.day();
          return {
            date,
            outside,
            hidden: hideOutsideDates ? outside : false,
            weekend: weekendDaysList.some((wd) => wd === dayOfWeek),
            // Computed up front rather than lazily behind `getDayAriaLabel`'s `||`:
            // being independent of the consumer's getter is exactly what makes this
            // layer cacheable, and the resolved label is identical either way.
            defaultAriaLabel: isStatic
              ? undefined
              : day.locale(resolvedLocale).format("D MMMM YYYY"),
          };
        }),
      })),
    // `weekendDaysList` is depended on via `weekendDaysKey` (its value) rather than
    // its identity — see the note where that key is built.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dates, month, hideOutsideDates, weekendDaysKey, isStatic, resolvedLocale, withWeekNumbers],
  );

  const rowsInfo = useMemo<MonthRowInfo[]>(
    () =>
      baseRows.map((row) => ({
        weekNumber: row.weekNumber,
        cells: row.cells.map((cell) => ({
          date: cell.date,
          outside: cell.outside,
          hidden: cell.hidden,
          weekend: cell.weekend,
          disabled:
            excludeDate?.(cell.date) ||
            !isBeforeMaxDate(cell.date, maxDateString) ||
            !isAfterMinDate(cell.date, minDateString),
          ariaLabel: getDayAriaLabel?.(cell.date) || cell.defaultAriaLabel,
        })),
      })),
    [baseRows, excludeDate, minDateString, maxDateString, getDayAriaLabel],
  );

  // ONE per-render cache shared by `getDateInTabOrder` (which consults the getter
  // twice per date) and the cell loop below (a third time) — so each date's props
  // are derived exactly once instead of three times. `getDayProps` is typically
  // `useDatesState`'s `getControlProps`, ~20 dayjs instances per call for a range
  // picker, which made those redundant calls the single largest cost in the grid.
  // Deliberately NOT memoized across renders: the getter closes over live
  // selection/hover state (see `memoizeByDate`).
  const resolveDayProps = memoizeByDate(getDayProps);

  const dateInTabOrder = getDateInTabOrder({
    dates,
    minDate: minDateString,
    maxDate: maxDateString,
    getDayProps: resolveDayProps,
    excludeDate,
    hideOutsideDates,
    month,
  });

  const cellGap = withCellSpacing ? CELL_SPACING : 0;

  // The cell memo can only bail out if every function prop it receives keeps a
  // stable identity. All four of these arrive freshly built each render (the level
  // group builds them per month, `DatePicker` per render), so they are wrapped
  // once here rather than being stabilised at each of their many call sites.
  const onDayMouseEnter = useCallbackRef(__onDayMouseEnter);
  const onDayClick = useCallbackRef(__onDayClick);
  const onDayKeyDown = useCallbackRef(__onDayKeyDown);
  const getDayRef = useCallbackRef(__getDayRef);

  const cellSlotProps = s.get("cell");

  const rows = rowsInfo.map((row, rowIndex) => {
    const cells = row.cells.map((info, cellIndex) => {
      const dayProps = resolveDayProps?.(info.date);
      // `dateInTabOrder` comes from the same `getMonthDays` output as `date`, so
      // both are canonical `YYYY-MM-DD` — string equality is exactly the
      // day-granularity `isSame` this used to spend a dayjs instance (plus its
      // `startOf`/`endOf` clones) on, per cell, per render.
      const isDateInTabOrder = dateInTabOrder !== undefined && info.date === dateInTabOrder;

      return (
        <MonthDayCell
          key={info.date}
          date={info.date}
          outside={info.outside}
          hidden={info.hidden}
          weekend={info.weekend}
          disabled={info.disabled}
          ariaLabel={info.ariaLabel}
          rowIndex={rowIndex}
          cellIndex={cellIndex}
          tabIndex={__preventFocus || !isDateInTabOrder ? -1 : 0}
          size={size}
          isStatic={isStatic}
          fullWidth={fullWidth}
          highlightToday={highlightToday}
          renderDay={renderDay}
          stopPropagation={__stopPropagation}
          preventFocus={__preventFocus}
          cellProps={cellSlotProps}
          dayProps={dayProps}
          mergedDayProps={s.merge("day", dayProps)}
          onDayMouseEnter={onDayMouseEnter}
          onDayClick={onDayClick}
          onDayKeyDown={onDayKeyDown}
          getDayRef={getDayRef}
        />
      );
    });

    return (
      <MonthRow
        key={rowIndex}
        role="row"
        fullWidth={fullWidth}
        columnGap={cellGap}
        {...s.get("row")}
      >
        {withWeekNumbers && (
          <MonthWeekNumber size={size} role="rowheader" {...s.get("weekNumber")}>
            <MonthWeekNumberLabel size={size} {...s.get("weekNumberLabel")}>
              {row.weekNumber}
            </MonthWeekNumberLabel>
          </MonthWeekNumber>
        )}
        {cells}
      </MonthRow>
    );
  });

  return (
    // The grid CONTAINER roles (`grid`/`row`/`cell`/`rowheader`) are WEB-ONLY:
    // React-Native's `accessibilityRole` has no `grid`/`row`/`gridcell` member
    // (same root cause as the closed `role="cell"`→`gridcell` question), so there
    // is no native counterpart to add here. Per-cell native announcement is
    // instead carried by each `Day`'s own `accessibilityRole`/`accessibilityState`.
    <MonthFrame
      ref={ref}
      role="grid"
      rowGap={cellGap}
      fullWidth={fullWidth}
      {...s.get("root")}
      {...rest}
    >
      {!hideWeekdays && (
        <WeekdaysRow
          locale={locale}
          firstDayOfWeek={firstDayOfWeek}
          weekdayFormat={weekdayFormat}
          withWeekNumbers={withWeekNumbers}
          size={size}
          fullWidth={fullWidth}
          columnGap={cellGap}
        />
      )}
      {rows}
    </MonthFrame>
  );
});

MonthComponent.displayName = "@knitui/dates/Month";

// ── 14. Public surface ─────────────────────────────────────────────────────────
// `withStaticProperties` exposes the styled parts so consumers can target/extend
// them (`styled(Month.Cell, …)`) — the single source of truth for the grid parts.
export const Month = withStaticProperties(MonthComponent, {
  Frame: MonthFrame,
  Row: MonthRow,
  Cell: MonthCell,
  WeekNumber: MonthWeekNumber,
  WeekNumberLabel: MonthWeekNumberLabel,
});

export type { MonthSize };
