// ───────────────────────────────────────────────────────────────────────────
// YearsList — the year selection grid (the decade analogue of `MonthsList`).
//
// Mirrors `@mantine/dates`' `YearsList` API (props, defaults, `__`-prefixed
// internal hooks) but is built on `@knitui/components` (`Box`) + `@knitui/core`
// (`styled`/`createStyledContext`/slot sugar) + `@knitui/dates` `PickerControl`
// + dayjs — NEVER HTML `<table>`/`<tr>`/`<td>`, so it renders on web AND native
// from one source. Accent comes from the active Tamagui theme (`theme="red"`),
// never a Mantine-style `color` prop.
//
// This is a GRID component: per-cell sizing/colour/interaction (checklist #3/#4/
// #12) live in the `PickerControl` leaf — YearsList just lays out the ragged
// 3/3/3/1 rows/cells and shares `size` down via context. Selected/disabled/
// in-range state and each control's roving `tabIndex` (`getYearInTabOrder`) are
// computed here and handed to each `PickerControl` as boolean props (which it
// expresses as variants), so nothing in YearsList uses a dynamic `opacity`/
// `display` style prop (checklist #15): `fullWidth` is a boolean VARIANT on the
// frame/row/cell, not a per-render spread the optimiser could fold onto a whole
// cell.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";
import { useMemo } from "react";

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
import { useCallbackRef } from "@knitui/hooks";

import { type CalendarSize, CELL_SPACING } from "../cell-metrics";
import { useDatesContext } from "../DatesProvider";
import { areCellPropsEqual } from "../internal/are-cell-props-equal";
import { focusElement } from "../internal/focus-element";
import { hasPreventDefault } from "../internal/has-prevent-default";
import { memoizeByDate } from "../internal/memoize-control-props";
import { PickerControl, type PickerControlProps } from "../PickerControl";
import type {
  ControlKeyboardEvent,
  ControlPressEvent,
  ControlsGroupSettings,
  DateStringValue,
} from "../types";
import { toDateString } from "../utils";
import { getYearInTabOrder } from "./get-year-in-tab-order/get-year-in-tab-order";
import { getYearsData } from "./get-years-data/get-years-data";
import { isYearDisabled } from "./is-year-disabled/is-year-disabled";

/**
 * Cross-platform press-in event for a control, derived from `PickerControl`'s own
 * `onPressIn` prop signature — never a DOM `React.MouseEvent`. Used to port
 * Mantine's `preventFocus` (mousedown → preventDefault) guard.
 */
type ControlPressInEvent = Parameters<NonNullable<PickerControlProps["onPressIn"]>>[0];

// ── 2. Shared context ───────────────────────────────────────────────────────
// One `createStyledContext` carries `size` to the styled parts (frame/row/cell)
// so they share the SAME size the consumer set on the root without prop-drilling
// — the same mechanism `Month`/`PickerControl` use. The control cells themselves
// still take an explicit `size` prop (they own the `size` variant).
const YearsListContext = createStyledContext<{ size: CalendarSize }>({ size: "md" });

// ── 5. Styled parts ───────────────────────────────────────────────────────────

/** The grid container — a column of year rows (web `role="grid"`). */
const YearsListFrame = styled(Box, {
  name: "YearsList",
  context: YearsListContext,
  flexDirection: "column",

  variants: {
    /**
     * Stretch the grid to fill its container in BOTH axes: `width: "100%"`
     * horizontally and `flexGrow: 1` to fill a constrained calendar height (the
     * year rows below distribute it). `flexBasis: auto` keeps it content-height
     * when no height is set.
     */
    fullWidth: {
      true: { width: "100%", flexGrow: 1 },
    },
  } as const,
});

/** A single year row (web `role="row"`). */
const YearsListRow = styled(Box, {
  name: "YearsListRow",
  context: YearsListContext,
  flexDirection: "row",

  variants: {
    /**
     * Row fills the grid in both axes: `width: "100%"` horizontally and an equal
     * share of a constrained calendar's EXTRA height via `flexGrow: 1` (default
     * `flexBasis: auto` keeps each row at its content height — `flexBasis: 0`
     * would collapse the rows when no height is set, since RN/Tamagui flex items
     * default to `minHeight: 0`, not `auto`).
     */
    fullWidth: {
      true: { width: "100%", flexGrow: 1 },
    },
  } as const,
});

/**
 * A year-cell wrapper (web `role="cell"`). The `PickerControl` leaf inside owns
 * the cell's dimensions/colour/interaction; this wrapper only centres it and,
 * when `fullWidth`, grows to an equal share of the row (a boolean VARIANT — not a
 * per-render `flexGrow` spread — so the optimiser has nothing dynamic to fold).
 */
const YearsListCell = styled(Box, {
  name: "YearsListCell",
  context: YearsListContext,
  alignItems: "center",
  justifyContent: "center",

  variants: {
    /** Cell grows to an equal share of the row width. */
    fullWidth: {
      true: { flexGrow: 1, flexBasis: 0 },
    },
  } as const,
});

/** Props for the memoized year cell — see {@link YearsListControlCell}. */
interface YearsListControlCellProps {
  /** The cell's year, `YYYY-MM-DD`. */
  year: DateStringValue;
  /** Localized year label (resolved once per decade in the grid memo). */
  label: string;
  /** Resolved disabled state (bounds ∪ the per-year getter's own flag). */
  disabled: boolean | undefined;

  /** Grid position, used for roving focus. */
  rowIndex: number;
  cellIndex: number;

  /** Roving tabindex for this cell. */
  tabIndex: number;

  size: CalendarSize;
  fullWidth: boolean;
  preventFocus: boolean | undefined;

  /** `styles.cell` props for the wrapper. */
  cellProps: GetProps<typeof YearsListCell> | undefined;

  /** The raw `getYearControlProps(year)` result — source of the consumer's handlers. */
  controlProps: Partial<PickerControlProps> | undefined;

  /** `styles.control` merged UNDER `controlProps` — spread onto the leaf. */
  mergedControlProps: Partial<PickerControlProps>;

  /**
   * The `__`-prefixed grid callbacks, pre-stabilised by `YearsList` with
   * `useCallbackRef` — an unstable identity here would defeat the memo for every
   * cell on every render.
   */
  onControlMouseEnter: (event: unknown, date: DateStringValue) => void;
  onControlClick: (event: ControlPressEvent, date: DateStringValue) => void;
  onControlKeyDown: (
    event: ControlKeyboardEvent,
    payload: { rowIndex: number; cellIndex: number; date: DateStringValue },
  ) => void;
  getControlRef: (
    rowIndex: number,
    cellIndex: number,
    control: { focus: () => void; disabled: boolean | undefined },
  ) => void;
}

/**
 * One year cell, memoized — the `YearsList` twin of `Month`'s `MonthDayCell` and
 * `MonthsList`'s `MonthsListControlCell`.
 *
 * A RANGE year picker updates `hoveredDate` on every web hover move, re-rendering
 * the whole picker subtree; without this boundary all 10 `PickerControl` leaves
 * re-rendered (and 10 refs detached/reattached, re-running `__getControlRef`) for a
 * change that moved two cells' background colour.
 *
 * The boundary is deliberately an INTERNAL cell, not the public `PickerControl`.
 * Tamagui's styled-context and theme reads happen inside the leaf and still
 * propagate past a memo, so cells keep responding to theme/size changes.
 */
const YearsListControlCell = React.memo(function YearsListControlCell({
  year,
  label,
  disabled,
  rowIndex,
  cellIndex,
  tabIndex,
  size,
  fullWidth,
  preventFocus,
  cellProps,
  controlProps,
  mergedControlProps,
  onControlMouseEnter,
  onControlClick,
  onControlKeyDown,
  getControlRef,
}: YearsListControlCellProps) {
  // Tamagui hover handlers are not part of `PickerControl`'s public prop type;
  // attach them via a precisely-typed object spread, the kit's pattern for web-only
  // affordances (see `Month`). Native never fires it.
  const hoverHandlers: { onHoverIn?: (event: unknown) => void } = {
    onHoverIn: (event) => onControlMouseEnter(event, year),
  };

  return (
    <YearsListCell role="cell" fullWidth={fullWidth} {...cellProps}>
      <PickerControl
        size={size}
        fullWidth={fullWidth}
        // explicit beats sugar: the `control` slot sits UNDER per-year
        // `getYearControlProps`, and the consumer's own handlers are
        // preserved (called before ours).
        {...mergedControlProps}
        disabled={disabled}
        ref={(node) => {
          if (node) {
            getControlRef(rowIndex, cellIndex, {
              focus: () => focusElement(node),
              disabled,
            });
          }
        }}
        onKeyDown={(event: ControlKeyboardEvent) => {
          controlProps?.onKeyDown?.(event);
          onControlKeyDown(event, { rowIndex, cellIndex, date: year });
        }}
        onPress={(event: ControlPressEvent) => {
          controlProps?.onPress?.(event);
          onControlClick(event, year);
        }}
        onPressIn={(event: ControlPressInEvent) => {
          controlProps?.onPressIn?.(event);
          if (preventFocus && hasPreventDefault(event)) {
            event.preventDefault();
          }
        }}
        tabIndex={tabIndex}
        {...hoverHandlers}
      >
        {controlProps?.children ?? label}
      </PickerControl>
    </YearsListCell>
  );
}, areCellPropsEqual);

// ── 7. Per-slot `styles` sugar + per-item passthrough ───────────────────────────
// The kit's ONE styling model is props on the parts. `styles` is thin sugar over
// that: a map from named slot → that part's props, resolved through
// `slotStyles().merge` so precedence is fixed in one place —
//   defaults < styles[slot] < explicit xxxProps < inline props.
// Per-year dynamics that a static map can't express (a different prop per date)
// stay on the `getYearControlProps(date)` callback (Mantine parity); it wins
// over the `control` slot — explicit beats sugar.

/** The named style slots and the styled part each targets. */
export interface YearsListStyles {
  /** Props for the grid container (`.Frame`). */
  root?: GetProps<typeof YearsListFrame>;
  /** Props for each year row (`.Row`). */
  row?: GetProps<typeof YearsListRow>;
  /** Props for each year-cell wrapper (`.Cell`). */
  cell?: GetProps<typeof YearsListCell>;
  /** Props for each control inside a cell (`.Control` — the `PickerControl` leaf). */
  control?: Partial<PickerControlProps>;
}

const YEARS_LIST_SLOT_KEYS = [
  "root",
  "row",
  "cell",
  "control",
] as const satisfies readonly (keyof YearsListStyles)[];

export interface YearsListSettings extends ControlsGroupSettings {
  /** dayjs format for the year labels. @default 'YYYY' */
  yearsListFormat?: string;

  /** Passes props down to each year `PickerControl`, keyed by date (wins over `styles.control`). */
  getYearControlProps?: (date: DateStringValue) => Partial<PickerControlProps>;

  /** Separate controls/rows with spacing. @default true */
  withCellSpacing?: boolean;

  /** Stretch the list (and its controls) to the full width of its container. @default false */
  fullWidth?: boolean;
}

type YearsListFrameProps = Omit<GetProps<typeof YearsListFrame>, "size" | "children" | "fullWidth">;

export interface YearsListProps extends YearsListFrameProps, YearsListSettings {
  /** Prevent focus shift when a control is pressed (calls `preventDefault` on press-in). */
  __preventFocus?: boolean;

  /** Whether propagation for the `Escape` key should be stopped (reserved, API parity). */
  __stopPropagation?: boolean;

  /** Decade for which the years list is displayed, any date within it (`YYYY-MM-DD`). */
  decade: DateStringValue;

  /** Width/font of the controls. @default 'md' */
  size?: CalendarSize;

  /**
   * Per-slot style sugar — props spread onto the matching styled part. Lives on
   * `YearsListProps` (not the inherited `YearsListSettings`) so the `styles`
   * shape does not flow up the shared Calendar settings chain and collide with
   * sibling components' own `styles` props.
   */
  styles?: SlotStyles<YearsListStyles>;
}

/**
 * The year selection grid — the decade analogue of `MonthsList`: a ragged
 * 3/3/3/1 grid of `PickerControl`s built from `Box` rows/cells (NEVER HTML
 * `<table>`/`<tr>`/`<td>`), so it renders on web AND native. The last row holds a
 * single year and is rendered as such. Each control's selected/in-range/disabled
 * state and roving `tabIndex` (`getYearInTabOrder`) are derived from
 * `getYearControlProps` + the min/max bounds; accent comes from the active
 * Tamagui theme. The `__onControl*` callbacks + `__getControlRef` are wired
 * cross-platform so the level groups can drive arrow-key navigation.
 *
 * Per-cell sizing/colour/interaction live in the `PickerControl` leaf (delegated);
 * YearsList only lays out rows/cells, shares `size` via context, and offers
 * `styles` sugar over its parts plus the per-year `getYearControlProps`
 * passthrough (explicit beats sugar). Forwards its ref + style props to the grid
 * host (the dates norm).
 *
 * a11y: the root is `role="grid"`, each row `role="row"`, each cell `role="cell"`
 * wrapping a `role="button"` control. (ARIA's `gridcell` would be the ideal child
 * of `role="grid"`, but the cross-platform `Role` type has no `gridcell` member.)
 */
const YearsListComponent = YearsListFrame.styleable<YearsListProps>(function YearsList(props, ref) {
  const {
    decade,
    yearsListFormat = "YYYY",
    locale,
    minDate,
    maxDate,
    getYearControlProps,
    __getControlRef,
    __onControlKeyDown,
    __onControlClick,
    __onControlMouseEnter,
    __preventFocus,
    __stopPropagation,
    withCellSpacing = true,
    fullWidth = false,
    size = "md",
    styles,
    ...rest
  } = props;

  // `__stopPropagation` is accepted for Mantine API parity; the cross-platform
  // Escape handling lives at the picker/popover layer, so it is a no-op here
  // (the same reservation `CalendarHeader`/`Month` make for it).
  void __stopPropagation;

  const ctx = useDatesContext();

  const minDateString = minDate == null ? undefined : toDateString(minDate);
  const maxDateString = maxDate == null ? undefined : toDateString(maxDate);

  // 7. Typed per-slot accessor (dev-warns unknown keys against the known set).
  const s = slotStyles<YearsListStyles>(styles, YEARS_LIST_SLOT_KEYS, "YearsList");

  const resolvedLocale = ctx.getLocale(locale);

  // The 10 cells' grid, bounds and LABELS depend only on the decade, the locale,
  // the format and the min/max bounds — never on the selection — yet they were
  // rebuilt every render, each cell paying a `dayjs(year).locale(…).format(…)`
  // (parse + locale clone + locale-table format) for a label fixed for the decade.
  const yearsInfo = useMemo(() => {
    const grid = getYearsData(decade);
    return {
      grid,
      cells: grid.map((row) =>
        row.map((year) => ({
          year,
          disabled: isYearDisabled({ year, minDate: minDateString, maxDate: maxDateString }),
          label: dayjs(year).locale(resolvedLocale).format(yearsListFormat),
        })),
      ),
    };
  }, [decade, minDateString, maxDateString, resolvedLocale, yearsListFormat]);

  // ONE per-render cache shared by `getYearInTabOrder` (which consults the getter
  // twice per year) and the cell loop below (a third time). Not memoized across
  // renders — the getter closes over live selection state.
  const resolveControlProps = memoizeByDate(getYearControlProps);

  const yearInTabOrder = getYearInTabOrder({
    years: yearsInfo.grid,
    minDate: minDateString,
    maxDate: maxDateString,
    getYearControlProps: resolveControlProps,
  });

  const cellGap = withCellSpacing ? CELL_SPACING : 0;

  // The cell memo can only bail out if every function prop it receives keeps a
  // stable identity. All four of these arrive freshly built each render (the level
  // group builds them per decade, `YearPicker` per render), so they are wrapped once
  // here rather than being stabilised at each of their many call sites.
  const onControlMouseEnter = useCallbackRef(__onControlMouseEnter);
  const onControlClick = useCallbackRef(__onControlClick);
  const onControlKeyDown = useCallbackRef(__onControlKeyDown);
  const getControlRef = useCallbackRef(__getControlRef);

  const cellSlotProps = s.get("cell");

  const rows = yearsInfo.cells.map((yearsRow, rowIndex) => {
    const cells = yearsRow.map(({ year, disabled: outOfBounds, label }, cellIndex) => {
      const controlProps = resolveControlProps?.(year);
      // Both sides come from `getYearsData`'s canonical `YYYY-MM-DD`, so the `YYYY`
      // prefix compare is exactly the year-granularity `isSame` it replaces.
      const isYearInTabOrder =
        yearInTabOrder !== undefined && year.slice(0, 4) === yearInTabOrder.slice(0, 4);
      const disabled = outOfBounds || controlProps?.disabled;

      return (
        <YearsListControlCell
          key={year}
          year={year}
          label={label}
          disabled={disabled}
          rowIndex={rowIndex}
          cellIndex={cellIndex}
          tabIndex={__preventFocus || !isYearInTabOrder ? -1 : 0}
          size={size}
          fullWidth={fullWidth}
          preventFocus={__preventFocus}
          cellProps={cellSlotProps}
          controlProps={controlProps}
          mergedControlProps={s.merge("control", controlProps)}
          onControlMouseEnter={onControlMouseEnter}
          onControlClick={onControlClick}
          onControlKeyDown={onControlKeyDown}
          getControlRef={getControlRef}
        />
      );
    });

    return (
      <YearsListRow
        key={rowIndex}
        role="row"
        columnGap={cellGap}
        fullWidth={fullWidth}
        {...s.get("row")}
      >
        {cells}
      </YearsListRow>
    );
  });

  return (
    // The grid CONTAINER roles (`grid`/`row`/`cell`) are WEB-ONLY: React-Native's
    // `accessibilityRole` has no `grid`/`row`/`gridcell` member (same root cause
    // as the closed `role="cell"`→`gridcell` question), so there is no native
    // counterpart to add here. Per-cell native announcement is instead carried
    // by each `PickerControl`'s own `accessibilityRole`/`accessibilityState`.
    <YearsListFrame
      ref={ref}
      role="grid"
      rowGap={cellGap}
      fullWidth={fullWidth}
      {...s.get("root")}
      {...rest}
    >
      {rows}
    </YearsListFrame>
  );
});

YearsListComponent.displayName = "@knitui/dates/YearsList";

// ── 14. Public surface ─────────────────────────────────────────────────────────
// `withStaticProperties` exposes the styled parts so consumers can target/extend
// them (`styled(YearsList.Cell, …)`) — the single source of truth for the grid
// parts.
export const YearsList = withStaticProperties(YearsListComponent, {
  Frame: YearsListFrame,
  Row: YearsListRow,
  Cell: YearsListCell,
});
