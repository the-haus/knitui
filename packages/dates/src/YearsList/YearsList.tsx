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

import { type CalendarSize, CELL_SPACING } from "../cell-metrics";
import { useDatesContext } from "../DatesProvider";
import { focusElement } from "../internal/focus-element";
import { hasPreventDefault } from "../internal/has-prevent-default";
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

  const years = getYearsData(decade);

  const yearInTabOrder = getYearInTabOrder({
    years,
    minDate: minDateString,
    maxDate: maxDateString,
    getYearControlProps,
  });

  const cellGap = withCellSpacing ? CELL_SPACING : 0;

  const rows = years.map((yearsRow, rowIndex) => {
    const cells = yearsRow.map((year, cellIndex) => {
      const controlProps = getYearControlProps?.(year);
      const isYearInTabOrder = dayjs(year).isSame(yearInTabOrder, "year");
      const disabled =
        isYearDisabled({ year, minDate: minDateString, maxDate: maxDateString }) ||
        controlProps?.disabled;

      // Tamagui hover handlers are not part of `PickerControl`'s public prop
      // type; attach them via a precisely-typed object spread, the kit's pattern
      // for web-only affordances (see `Month`). Native never fires it.
      const hoverHandlers: { onHoverIn?: (event: unknown) => void } = {
        onHoverIn: (event) => __onControlMouseEnter?.(event, year),
      };

      return (
        <YearsListCell key={year} role="cell" fullWidth={fullWidth} {...s.get("cell")}>
          <PickerControl
            size={size}
            fullWidth={fullWidth}
            // explicit beats sugar: the `control` slot sits UNDER per-year
            // `getYearControlProps`, and the consumer's own handlers are
            // preserved (called before ours).
            {...s.merge("control", controlProps)}
            disabled={disabled}
            ref={(node) => {
              if (node) {
                __getControlRef?.(rowIndex, cellIndex, {
                  focus: () => focusElement(node),
                  disabled,
                });
              }
            }}
            onKeyDown={(event: ControlKeyboardEvent) => {
              controlProps?.onKeyDown?.(event);
              __onControlKeyDown?.(event, { rowIndex, cellIndex, date: year });
            }}
            onPress={(event: ControlPressEvent) => {
              controlProps?.onPress?.(event);
              __onControlClick?.(event, year);
            }}
            onPressIn={(event: ControlPressInEvent) => {
              controlProps?.onPressIn?.(event);
              if (__preventFocus && hasPreventDefault(event)) {
                event.preventDefault();
              }
            }}
            tabIndex={__preventFocus || !isYearInTabOrder ? -1 : 0}
            {...hoverHandlers}
          >
            {controlProps?.children ??
              dayjs(year).locale(ctx.getLocale(locale)).format(yearsListFormat)}
          </PickerControl>
        </YearsListCell>
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
