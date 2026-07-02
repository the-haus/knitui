// ───────────────────────────────────────────────────────────────────────────
// MonthsList — the month selection grid (the year-level analogue of `Month`).
//
// Mirrors `@mantine/dates`' `MonthsList` API (props, defaults, `__`-prefixed
// internal hooks) but is built on `@knitui/components` (`Box`) + `@knitui/core`
// (`styled`/`createStyledContext`/slot sugar) + `@knitui/dates` `PickerControl`
// + dayjs — NEVER HTML `<table>`/`<tr>`/`<td>`, so it renders on web AND native
// from one source. Accent comes from the active Tamagui theme (`theme="red"`),
// never a Mantine-style `color` prop.
//
// This is a GRID component: per-cell sizing/colour/interaction (checklist #3/#4/
// #12) live in the `PickerControl` leaf — MonthsList just lays out the 4×3 rows/
// cells and shares `size` down via context. Selected/disabled/in-range state and
// each control's roving `tabIndex` (`getMonthInTabOrder`) are computed here and
// handed to each `PickerControl` as boolean props (which it expresses as
// variants), so nothing in MonthsList uses a dynamic `opacity`/`display` style
// prop (checklist #15): `fullWidth` is a boolean VARIANT on the frame/row/cell,
// not a per-render spread the optimiser could fold onto a whole cell.
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
import { getMonthInTabOrder } from "./get-month-in-tab-order/get-month-in-tab-order";
import { getMonthsData } from "./get-months-data/get-months-data";
import { isMonthDisabled } from "./is-month-disabled/is-month-disabled";

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
const MonthsListContext = createStyledContext<{ size: CalendarSize }>({ size: "md" });

// ── 5. Styled parts ───────────────────────────────────────────────────────────

/** The grid container — a column of month rows (web `role="grid"`). */
const MonthsListFrame = styled(Box, {
  name: "MonthsList",
  context: MonthsListContext,
  flexDirection: "column",

  variants: {
    /**
     * Stretch the grid to fill its container in BOTH axes: `width: "100%"`
     * horizontally and `flexGrow: 1` to fill a constrained calendar height (the
     * month rows below distribute it). `flexBasis: auto` keeps it content-height
     * when no height is set.
     */
    fullWidth: {
      true: { width: "100%", flexGrow: 1 },
    },
  } as const,
});

/** A single month row (web `role="row"`). */
const MonthsListRow = styled(Box, {
  name: "MonthsListRow",
  context: MonthsListContext,
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
 * A month-cell wrapper (web `role="cell"`). The `PickerControl` leaf inside owns
 * the cell's dimensions/colour/interaction; this wrapper only centres it and,
 * when `fullWidth`, grows to an equal share of the row (a boolean VARIANT — not a
 * per-render `flexGrow` spread — so the optimiser has nothing dynamic to fold).
 */
const MonthsListCell = styled(Box, {
  name: "MonthsListCell",
  context: MonthsListContext,
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
// Per-month dynamics that a static map can't express (a different prop per date)
// stay on the `getMonthControlProps(date)` callback (Mantine parity); it wins
// over the `control` slot — explicit beats sugar.

/** The named style slots and the styled part each targets. */
export interface MonthsListStyles {
  /** Props for the grid container (`.Frame`). */
  root?: GetProps<typeof MonthsListFrame>;
  /** Props for each month row (`.Row`). */
  row?: GetProps<typeof MonthsListRow>;
  /** Props for each month-cell wrapper (`.Cell`). */
  cell?: GetProps<typeof MonthsListCell>;
  /** Props for each control inside a cell (`.Control` — the `PickerControl` leaf). */
  control?: Partial<PickerControlProps>;
}

const MONTHS_LIST_SLOT_KEYS = [
  "root",
  "row",
  "cell",
  "control",
] as const satisfies readonly (keyof MonthsListStyles)[];

export interface MonthsListSettings extends ControlsGroupSettings {
  /** dayjs format for the month labels. @default 'MMM' */
  monthsListFormat?: string;

  /** Passes props down to each month `PickerControl`, keyed by date (wins over `styles.control`). */
  getMonthControlProps?: (date: DateStringValue) => Partial<PickerControlProps>;

  /** Separate controls/rows with spacing. @default true */
  withCellSpacing?: boolean;

  /** Stretch the list (and its controls) to the full width of its container. @default false */
  fullWidth?: boolean;
}

type MonthsListFrameProps = Omit<
  GetProps<typeof MonthsListFrame>,
  "size" | "children" | "fullWidth"
>;

export interface MonthsListProps extends MonthsListFrameProps, MonthsListSettings {
  /** Prevent focus shift when a control is pressed (calls `preventDefault` on press-in). */
  __preventFocus?: boolean;

  /** Whether propagation for the `Escape` key should be stopped (reserved, API parity). */
  __stopPropagation?: boolean;

  /** Year for which the months list is displayed, any date within it (`YYYY-MM-DD`). */
  year: DateStringValue;

  /** Width/font of the controls. @default 'md' */
  size?: CalendarSize;

  /**
   * Per-slot style sugar — props spread onto the matching styled part. Lives on
   * `MonthsListProps` (not the inherited `MonthsListSettings`) so the `styles`
   * shape does not flow up the shared Calendar settings chain and collide with
   * sibling components' own `styles` props.
   */
  styles?: SlotStyles<MonthsListStyles>;
}

/**
 * The month selection grid — a 4×3 grid of `PickerControl`s built from `Box`
 * rows/cells (NEVER HTML `<table>`/`<tr>`/`<td>`), so it renders on web AND
 * native. Each control's selected/in-range/disabled state and roving `tabIndex`
 * (`getMonthInTabOrder`) are derived from `getMonthControlProps` + the min/max
 * bounds; accent comes from the active Tamagui theme. The `__onControl*`
 * callbacks + `__getControlRef` are wired cross-platform so the level groups can
 * drive arrow-key navigation.
 *
 * Per-cell sizing/colour/interaction live in the `PickerControl` leaf (delegated);
 * MonthsList only lays out rows/cells, shares `size` via context, and offers
 * `styles` sugar over its parts plus the per-month `getMonthControlProps`
 * passthrough (explicit beats sugar). Forwards its ref + style props to the grid
 * host (the dates norm).
 *
 * a11y: the root is `role="grid"`, each row `role="row"`, each cell `role="cell"`
 * wrapping a `role="button"` control. (ARIA's `gridcell` would be the ideal child
 * of `role="grid"`, but the cross-platform `Role` type has no `gridcell` member.)
 */
const MonthsListComponent = MonthsListFrame.styleable<MonthsListProps>(
  function MonthsList(props, ref) {
    const {
      year,
      monthsListFormat = "MMM",
      locale,
      minDate,
      maxDate,
      getMonthControlProps,
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
    const s = slotStyles<MonthsListStyles>(styles, MONTHS_LIST_SLOT_KEYS, "MonthsList");

    const months = getMonthsData(year);

    const monthInTabOrder = getMonthInTabOrder({
      months,
      minDate: minDateString,
      maxDate: maxDateString,
      getMonthControlProps,
    });

    const cellGap = withCellSpacing ? CELL_SPACING : 0;

    const rows = months.map((monthsRow, rowIndex) => {
      const cells = monthsRow.map((month, cellIndex) => {
        const controlProps = getMonthControlProps?.(month);
        const isMonthInTabOrder = dayjs(month).isSame(monthInTabOrder, "month");
        const disabled =
          isMonthDisabled({ month, minDate: minDateString, maxDate: maxDateString }) ||
          controlProps?.disabled;

        // Tamagui hover handlers are not part of `PickerControl`'s public prop
        // type; attach them via a precisely-typed object spread, the kit's pattern
        // for web-only affordances (see `Month`). Native never fires it.
        const hoverHandlers: { onHoverIn?: (event: unknown) => void } = {
          onHoverIn: (event) => __onControlMouseEnter?.(event, month),
        };

        return (
          <MonthsListCell key={month} role="cell" fullWidth={fullWidth} {...s.get("cell")}>
            <PickerControl
              size={size}
              fullWidth={fullWidth}
              // explicit beats sugar: the `control` slot sits UNDER per-month
              // `getMonthControlProps`, and the consumer's own handlers are
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
                __onControlKeyDown?.(event, { rowIndex, cellIndex, date: month });
              }}
              onPress={(event: ControlPressEvent) => {
                controlProps?.onPress?.(event);
                __onControlClick?.(event, month);
              }}
              onPressIn={(event: ControlPressInEvent) => {
                controlProps?.onPressIn?.(event);
                if (__preventFocus && hasPreventDefault(event)) {
                  event.preventDefault();
                }
              }}
              tabIndex={__preventFocus || !isMonthInTabOrder ? -1 : 0}
              {...hoverHandlers}
            >
              {controlProps?.children ??
                dayjs(month).locale(ctx.getLocale(locale)).format(monthsListFormat)}
            </PickerControl>
          </MonthsListCell>
        );
      });

      return (
        <MonthsListRow
          key={rowIndex}
          role="row"
          columnGap={cellGap}
          fullWidth={fullWidth}
          {...s.get("row")}
        >
          {cells}
        </MonthsListRow>
      );
    });

    return (
      // The grid CONTAINER roles (`grid`/`row`/`cell`) are WEB-ONLY: React-Native's
      // `accessibilityRole` has no `grid`/`row`/`gridcell` member (same root cause
      // as the closed `role="cell"`→`gridcell` question), so there is no native
      // counterpart to add here. Per-cell native announcement is instead carried
      // by each `PickerControl`'s own `accessibilityRole`/`accessibilityState`.
      <MonthsListFrame
        ref={ref}
        role="grid"
        rowGap={cellGap}
        fullWidth={fullWidth}
        {...s.get("root")}
        {...rest}
      >
        {rows}
      </MonthsListFrame>
    );
  },
);

MonthsListComponent.displayName = "@knitui/dates/MonthsList";

// ── 14. Public surface ─────────────────────────────────────────────────────────
// `withStaticProperties` exposes the styled parts so consumers can target/extend
// them (`styled(MonthsList.Cell, …)`) — the single source of truth for the grid
// parts.
export const MonthsList = withStaticProperties(MonthsListComponent, {
  Frame: MonthsListFrame,
  Row: MonthsListRow,
  Cell: MonthsListCell,
});
