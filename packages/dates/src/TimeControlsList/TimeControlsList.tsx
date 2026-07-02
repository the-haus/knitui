// ───────────────────────────────────────────────────────────────────────────
// TimeControlsList — one scrollable dropdown column of `TimeControl`s (hours,
// minutes or seconds) for the `TimePicker` dropdown.
//
// Mirrors `@mantine/dates`' `TimeControlsList` API (props/defaults) but is built
// on `@knitui/components` (`Box`/`ScrollArea`) + `@knitui/core`
// (`styled`/`createStyledContext`/slot sugar) + the folder-local `TimeControl`
// leaf — NEVER `@mantine/core` — so it renders on web AND native from one source.
// Accent comes from the active Tamagui theme (`theme="red"`), never a Mantine-
// style `color` prop. Folder-local to the `TimePicker` dropdown — NOT re-exported
// from the public `src/index.ts` barrel (Mantine keeps it private too).
//
// This is a LIST component: per-cell sizing/colour/interaction (checklist #3/#4/
// #12) live in the `TimeControl` leaf — TimeControlsList just lays out the column,
// shares `size` down via context, and reveals the active control. The active
// state is a boolean prop the leaf expresses as a VARIANT (checklist #15), so
// nothing here uses a dynamic `opacity`/`display` style prop the web optimiser
// could fold onto a whole cell.
//
// Active-control reveal (preserve this — see prior native-measure work): on web
// the DOM node carries `scrollIntoView`; on native — where the kit `ScrollArea`
// handle deliberately leaves measure-based reveal to the caller — the control's
// offset within the viewport is measured (`measureLayout`) and the column is
// scrolled to centre it. Every step is feature-detected so a missing API is a
// safe no-op.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import { Box, ScrollArea, type ScrollAreaHandle, type ScrollAreaProps } from "@knitui/components";
import {
  createStyledContext,
  type GetProps,
  isWeb,
  slotStyles,
  type SlotStyles,
  styled,
  type TamaguiElement,
  withStaticProperties,
} from "@knitui/core";

import { type CalendarSize, CELL_SPACING } from "../cell-metrics";
import { TimeControl, type TimeControlProps } from "./TimeControl";

/** Default maximum column height in px before it scrolls (Mantine parity). */
const DEFAULT_MAX_HEIGHT = 200;

/** Build an inclusive `[min, max]` numeric range stepped by `step`. */
function getValuesRange(min: number, max: number, step: number): number[] {
  const range: number[] = [];
  for (let i = min; i <= max; i += step) {
    range.push(i);
    if (step <= 0) {
      break;
    }
  }
  return range;
}

// ── 11. Native measure narrowing ────────────────────────────────────────────
// The RN `measureLayout` signature isn't on `TamaguiElement`; narrow to it with a
// structural type guard (NO `as unknown as` cast — the kit's strict gate forbids
// escape hatches). `relativeTo` is `unknown` because the viewport host is a
// `TamaguiElement`, which RN accepts as a measure target at runtime.
type MeasureLayout = (
  relativeTo: unknown,
  onSuccess: (left: number, top: number, width: number, height: number) => void,
  onFail?: () => void,
) => void;

function getMeasureLayout(node: TamaguiElement | null): MeasureLayout | null {
  if (node === null) {
    return null;
  }
  const candidate: { measureLayout?: unknown } = node;
  return typeof candidate.measureLayout === "function"
    ? (candidate.measureLayout.bind(node) as MeasureLayout)
    : null;
}

// ── 2. Shared context ───────────────────────────────────────────────────────
// One `createStyledContext` carries `size` to the styled parts so they share the
// SAME size the consumer set on the root without prop-drilling — the same
// mechanism `MonthsList`/`TimeControl` use. The control cells still take an
// explicit `size` prop (they own the `size` variant).
const TimeControlsListContext = createStyledContext<{ size: CalendarSize }>({ size: "sm" });

// ── 5. Styled parts ───────────────────────────────────────────────────────────
// The scroll viewport is the kit's own `ScrollArea` (exposed as `.Frame` so it can
// still be targeted), NOT a `styled(ScrollArea)` wrapper: wrapping it re-types
// `ScrollArea`'s `shadowColor?: string` own-prop as a theme-token value, which
// collides with the inherited `string` (the documented ScrollArea shadowColor
// trap). The styled part that carries the shared context is the inner Column.

/** The inner column of controls (web `role="list"`). */
const TimeControlsListColumn = styled(Box, {
  name: "TimeControlsListColumn",
  context: TimeControlsListContext,
  gap: CELL_SPACING,
  paddingHorizontal: CELL_SPACING,
});

// ── 7. Per-slot `styles` sugar + per-item passthrough ───────────────────────────
// The kit's ONE styling model is props on the parts. `styles` is thin sugar over
// that: a map from named slot → that part's props, resolved through
// `slotStyles().merge` so precedence is fixed in one place —
//   defaults < styles[slot] < explicit xxxProps < inline props.
// Per-control dynamics that a static map can't express stay on the
// `getControlProps(value)` callback; it wins over the `control` slot — explicit
// beats sugar.

/** The named style slots and the styled part each targets. */
export interface TimeControlsListStyles {
  /** Props for the scroll viewport (`.Frame`). */
  root?: ScrollAreaProps;
  /** Props for the inner column (`.Column`). */
  column?: GetProps<typeof TimeControlsListColumn>;
  /** Props for each control inside the column (`.Control` — the `TimeControl` leaf). */
  control?: Partial<TimeControlProps<number>>;
}

const TIME_CONTROLS_LIST_SLOT_KEYS = [
  "root",
  "column",
  "control",
] as const satisfies readonly (keyof TimeControlsListStyles)[];

/** Props for {@link TimeControlsList}. */
export interface TimeControlsListProps {
  /** Smallest value in the column. */
  min: number;

  /** Largest value in the column. */
  max: number;

  /** Step between successive values. */
  step: number;

  /** Currently selected value, or `null`. */
  value: number | null;

  /** Called with the pressed value. */
  onSelect: (value: number) => void;

  /** Render the column in descending order. @default false */
  reversed: boolean | undefined;

  /** Maximum column height in px before it scrolls. @default 200 */
  maxHeight?: number;

  /** Label font size. @default 'sm' */
  size?: CalendarSize;

  /** Props forwarded to the underlying `ScrollArea` (wins over `styles.root`). */
  scrollAreaProps?: ScrollAreaProps;

  /** Passes props down to each `TimeControl`, keyed by value (wins over `styles.control`). */
  getControlProps?: (value: number) => Partial<TimeControlProps<number>>;

  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<TimeControlsListStyles>;
}

/**
 * `TimeControlsList` — one scrollable dropdown column of `TimeControl`s (hours,
 * minutes or seconds). The `any`-free, cross-platform port of Mantine's
 * `TimeControlsList`: when the dropdown opens (or the value changes) the active
 * control is revealed. On web that's the DOM `scrollIntoView`; on native — where
 * the kit `ScrollArea` handle leaves measure-based reveal to the caller — the
 * active control's offset is measured within the viewport (`measureLayout`) and
 * the column is scrolled to centre it. Every step is feature-detected so a
 * missing API is a safe no-op. Uses the kit `ScrollArea` (`scrollbars="y"`,
 * `type="never"`), never `@mantine/core`.
 *
 * Per-control sizing/colour/interaction live in the `TimeControl` leaf
 * (delegated); this lays out the column, shares `size` via context, and offers
 * `styles` sugar over its parts plus a per-value `getControlProps` passthrough
 * (explicit beats sugar).
 *
 * a11y: the inner column is `role="list"` (the ARIA `listbox` role is absent from
 * the cross-platform `Role` union, the same gap as MonthsList's `gridcell`), each
 * control `role="option"`; the native counterparts ride on each `TimeControl`'s
 * own `accessibility*` props. Folder-local to the `TimePicker` dropdown.
 */
function TimeControlsListComponent({
  min,
  max,
  step,
  value,
  onSelect,
  reversed,
  maxHeight = DEFAULT_MAX_HEIGHT,
  size = "sm",
  scrollAreaProps,
  getControlProps,
  styles,
}: TimeControlsListProps) {
  const activeRef = React.useRef<TamaguiElement | null>(null);
  const scrollRef = React.useRef<ScrollAreaHandle | null>(null);

  // 7. Typed per-slot accessor (dev-warns unknown keys against the known set).
  const s = slotStyles<TimeControlsListStyles>(
    styles,
    TIME_CONTROLS_LIST_SLOT_KEYS,
    "TimeControlsList",
  );

  const range = getValuesRange(min, max, step);
  const ordered = reversed ? [...range].reverse() : range;

  React.useEffect(() => {
    if (value === null) {
      return;
    }
    const node = activeRef.current;
    if (!node) {
      return;
    }

    // Web: the DOM node carries `scrollIntoView`.
    if (isWeb) {
      if ("scrollIntoView" in node && typeof node.scrollIntoView === "function") {
        node.scrollIntoView({ block: "nearest" });
      }
      return;
    }

    // Native: the handle's `scrollIntoView` is a deliberate no-op, so measure the
    // active control's top within the viewport and scroll to centre it.
    const handle = scrollRef.current;
    const viewport = handle?.getViewport();
    const measureLayout = getMeasureLayout(node);
    if (handle && viewport && measureLayout) {
      measureLayout(
        viewport,
        (_left, top, _width, height) => {
          handle.scrollTo({ y: Math.max(0, top - (maxHeight - height) / 2), animated: false });
        },
        () => {},
      );
    }
  }, [value, maxHeight]);

  return (
    <ScrollArea
      ref={scrollRef}
      height={maxHeight}
      scrollbars="y"
      type="never"
      flexShrink={1}
      {...s.get("root")}
      {...scrollAreaProps}
    >
      <TimeControlsListColumn role="list" {...s.get("column")}>
        {ordered.map((control) => {
          const active = value === control;
          const controlProps = getControlProps?.(control);
          return (
            <TimeControl
              key={control}
              ref={active ? activeRef : undefined}
              value={control}
              active={active}
              onSelect={onSelect}
              size={size}
              role="option"
              {...s.merge("control", controlProps)}
            />
          );
        })}
      </TimeControlsListColumn>
    </ScrollArea>
  );
}

TimeControlsListComponent.displayName = "@knitui/dates/TimeControlsList";

// ── 14. Public surface ─────────────────────────────────────────────────────────
// `withStaticProperties` exposes the parts so consumers can target/extend them
// (`styled(TimeControlsList.Column, …)`) — the single source of truth for the
// list parts. `.Frame` is the kit `ScrollArea` (not a styled wrapper — see the
// styled-parts note above).
export const TimeControlsList = withStaticProperties(TimeControlsListComponent, {
  Frame: ScrollArea,
  Column: TimeControlsListColumn,
  Control: TimeControl,
});
