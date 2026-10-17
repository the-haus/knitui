// ───────────────────────────────────────────────────────────────────────────
// TimeGrid — a standalone grid of selectable time options.
//
// Mirrors `@mantine/dates`' `TimeGrid` API (props/defaults/behaviour) but is
// built on `@knitui/components` (`Box`/`SimpleGrid`/`Text`/`UnstyledButton`) +
// `@knitui/core` (`styled`/`createStyledContext`/slot sugar) + dayjs-free local
// `compare-time` comparators — NEVER `@mantine/core` — so it renders on web AND
// native from one source. Accent comes from the active Tamagui theme
// (`theme="red"`), never a Mantine-style `color`/`radius` prop (the kit styles
// from the theme ramp + tokens; that is why Mantine's `radius` CSS-var prop is
// intentionally absent, consistent with every dates sibling).
//
// Per-cell sizing/colour/interaction (checklist #3/#4/#12) live in the folder-
// local `TimeGridControl` leaf — TimeGrid lays out the grid, shares `size` down
// via context, offers `styles` sugar over its parts, and a per-time
// `getControlProps` passthrough (explicit beats sugar). The active/disabled
// state is a boolean the leaf expresses as a VARIANT (checklist #15), so nothing
// renders a dynamic `opacity`/`display` style prop the web optimiser could fold
// onto a whole cell.
// ───────────────────────────────────────────────────────────────────────────
import * as React from "react";

import { Box, SimpleGrid, Text, UnstyledButton } from "@knitui/components";
import {
  createStyledContext,
  type GetProps,
  slotStyles,
  type SlotStyles,
  styleable,
  styled,
  withStaticProperties,
} from "@knitui/core";
import { useCallbackRef, useUncontrolled } from "@knitui/hooks";

import { type CalendarSize, cellFontVariant, cellMinHeightVariant } from "../cell-metrics";
import { controlA11yProps } from "../internal/a11y";
import { areCellPropsEqual } from "../internal/are-cell-props-equal";
import type { TimePickerAmPmLabels, TimePickerFormat } from "../types";
import { getFormattedTime, isSameTime } from "../utils";
import { isTimeAfter, isTimeBefore } from "./compare-time/compare-time";

/* -------------------------------------------------------------------------- */
/* Shared context (#2)                                                         */
/* -------------------------------------------------------------------------- */
// One `createStyledContext` carries `size` to every styled part so they share
// the SAME size the consumer set on the root without prop-drilling — the same
// mechanism `MonthsList`/`TimeControlsList` use. The control cells still take an
// explicit `size` prop (they own the `size` variant).
const TimeGridContext = createStyledContext<{ size: CalendarSize }>({ size: "sm" });

/* -------------------------------------------------------------------------- */
/* Derived sizing (#3)                                                         */
/* -------------------------------------------------------------------------- */
// Never hard-code pixels. Scale on the shared `cell-metrics` ladders
// (`CELL_WIDTH`/`CELL_FONT`) — the calendar twin of components' `controlMetrics`
// — expressed with raw ladder values at module-load (NOT `getTokenValue`, which
// needs the live config).
/* -------------------------------------------------------------------------- */
/* Styled parts (#5)                                                           */
/* -------------------------------------------------------------------------- */

/** The host frame establishing the shared `size` context (web `role="group"`). */
const TimeGridFrame = styled(Box, {
  displayName: "TimeGrid",
  context: TimeGridContext,
});

/**
 * A single time-option button. Accent comes from the active theme's palette ramp
 * via the `theme` prop (no Mantine `color` prop): a selected control fills with
 * `color9` and prints `color1` text (checklist #4). States use
 * `hover:`/`press:` clauses + a `disabled` variant, never a runtime hover flag
 * (#12) — mirroring `PickerControl`.
 */
const TimeGridControlFrame = styled(UnstyledButton.Frame, {
  displayName: "TimeGridControl",
  context: TimeGridContext,
  alignItems: "center",
  justifyContent: "center",
  flexGrow: 1,
  flexBasis: 0,
  borderWidth: 1,
  borderColor: "borderColor",
  borderRadius: "sm",
  backgroundColor: "transparent hover:color2 press:color3",
  paddingVertical: "xs",
  paddingHorizontal: "sm",
  cursor: "web:pointer",

  variants: {
    size: cellMinHeightVariant,

    /** Selected option — solid accent fill. */
    selected: {
      true: {
        backgroundColor: "color9 hover:color10 press:color8",
        borderColor: "color9",
      },
    },

    /** Non-interactive + dimmed, no hover affordance (Mantine parity). */
    disabled: {
      true: {
        opacity: 0.5,
        pointerEvents: "none",
        cursor: "web:not-allowed",
        backgroundColor: "hover:transparent press:transparent",
      },
    },
  } as const,

  defaultVariants: { size: "sm" },
});

/**
 * The option label — shares `size` via context. The colour flips on the
 * `selected` variant (a pure boolean, never a dynamic style prop — #15), so the
 * web optimiser can never fold a hide-value class onto the whole cell.
 */
const TimeGridControlLabel = styled(Text, {
  displayName: "TimeGridControlLabel",
  context: TimeGridContext,
  userSelect: "none",
  color: "color",
  variants: {
    size: cellFontVariant,

    /** On the selected accent fill, the label flips to the contrast colour. */
    selected: { true: { color: "color1" } },
  } as const,

  defaultVariants: { size: "sm" },
});

/* -------------------------------------------------------------------------- */
/* TimeGridControl leaf                                                        */
/* -------------------------------------------------------------------------- */

/** Props passed to a single control via `getControlProps` / `styles.control`. */
type TimeGridControlPassthrough = Partial<GetProps<typeof UnstyledButton>>;

type TimeGridPressEvent = Parameters<NonNullable<TimeGridControlPassthrough["onPress"]>>[0];

interface TimeGridControlProps extends Omit<
  GetProps<typeof TimeGridControlFrame>,
  "children" | "selected" | "disabled" | "size" | "onPress"
> {
  /** Time value in 24h format (`"HH:mm[:ss]"`). */
  time: string;

  /** Whether this option is the active value. */
  active: boolean;

  /** Whether this option is disabled (bounds / `disableTime` / `disabled`). */
  disabled: boolean;

  /** Control size. */
  size: CalendarSize;

  /** Clock display mode. */
  format: TimePickerFormat;

  /** AM/PM labels for the `12h` mode. */
  amPmLabels: TimePickerAmPmLabels;

  /** Whether seconds are displayed. */
  withSeconds: boolean;

  /** Props spread onto the inner label (carries `styles.label`). */
  labelProps?: GetProps<typeof TimeGridControlLabel>;

  /** The consumer's own `getControlProps(time).onPress`, called before ours. */
  consumerOnPress?: TimeGridControlPassthrough["onPress"];

  /** Stable (grid-level) press handler — keeps the memo boundary intact. */
  onSelect: (time: string, active: boolean) => void;
}

/**
 * One time option, memoized. A selection change re-renders the grid, but only
 * the two cells whose `active` flag moved need to re-render: the press handler
 * is a stable grid-level callback (`onSelect`), and `areCellPropsEqual` looks one
 * level into the freshly built `labelProps` / slot objects.
 */
const TimeGridControl = React.memo(function TimeGridControl({
  time,
  active,
  format,
  amPmLabels,
  withSeconds,
  disabled,
  size,
  labelProps,
  consumerOnPress,
  onSelect,
  ...others
}: TimeGridControlProps) {
  const label = getFormattedTime({ value: time, format, amPmLabels, withSeconds });

  return (
    <TimeGridControlFrame
      // 11. Web a11y (role/aria) and native a11y (`accessibility*`) side-by-side
      //     — neither replaces the other. The spoken label is the formatted time.
      role="button"
      aria-selected={active || undefined}
      aria-disabled={disabled || undefined}
      {...controlA11yProps({
        role: "button",
        label: label ?? undefined,
        selected: active,
        disabled,
      })}
      selected={active}
      disabled={disabled}
      size={size}
      render="button"
      {...others}
      onPress={(event: TimeGridPressEvent) => {
        consumerOnPress?.(event);
        onSelect(time, active);
      }}
    >
      <TimeGridControlLabel size={size} selected={active} {...labelProps}>
        {label}
      </TimeGridControlLabel>
    </TimeGridControlFrame>
  );
}, areCellPropsEqual);

/* -------------------------------------------------------------------------- */
/* TimeGrid                                                                    */
/* -------------------------------------------------------------------------- */

// ── 7. Per-slot `styles` sugar + per-item passthrough ───────────────────────
// The kit's ONE styling model is props on the parts. `styles` is thin sugar over
// that: a map from named slot → that part's props, resolved through
// `slotStyles().merge` so precedence is fixed in one place —
//   defaults < styles[slot] < explicit getControlProps < inline props.
// Per-control dynamics a static map can't express stay on `getControlProps(time)`;
// it wins over the `control` slot — explicit beats sugar.

/** The named style slots and the styled part each targets. */
export interface TimeGridStyles {
  /** Props for the host frame (`.Frame`). */
  root?: GetProps<typeof TimeGridFrame>;
  /** Props for the underlying `SimpleGrid` (`.Grid`) — wins over `simpleGridProps`. */
  grid?: GetProps<typeof SimpleGrid>;
  /** Props for each control button (`.Control`). */
  control?: TimeGridControlPassthrough;
  /** Props for each control's text label (`.ControlLabel`). */
  label?: GetProps<typeof TimeGridControlLabel>;
}

const TIME_GRID_SLOT_KEYS = [
  "root",
  "grid",
  "control",
  "label",
] as const satisfies readonly (keyof TimeGridStyles)[];

// The Frame's own style props flow through, minus the ones we own or rename.
type TimeGridFrameProps = Omit<
  GetProps<typeof TimeGridFrame>,
  "value" | "defaultValue" | "onChange" | "size" | "children"
>;

export interface TimeGridProps extends TimeGridFrameProps {
  /** Time data in 24h format to display, e.g. `['10:00', '18:30', '22:00']`. Values must be unique. */
  data: string[];

  /** Controlled component value. */
  value?: string | null;

  /** Uncontrolled component default value. */
  defaultValue?: string | null;

  /** Called when the value changes. */
  onChange?: (value: string | null) => void;

  /** Whether the active option can be deselected by clicking it again. @default false */
  allowDeselect?: boolean;

  /** Time format displayed in the grid. @default '24h' */
  format?: TimePickerFormat;

  /** Whether the seconds part is displayed. @default false */
  withSeconds?: boolean;

  /** Labels used for am/pm values. @default { am: 'AM', pm: 'PM' } */
  amPmLabels?: TimePickerAmPmLabels;

  /** Props passed down to the underlying `SimpleGrid`. @default { cols: 3, spacing: 'xs' } */
  simpleGridProps?: GetProps<typeof SimpleGrid>;

  /** A function to pass props down to a control based on its time value (wins over `styles.control`). */
  getControlProps?: (time: string) => TimeGridControlPassthrough;

  /** Control size — the kit size scale. @default 'sm' */
  size?: CalendarSize;

  /** All controls before this time are disabled. */
  minTime?: string;

  /** All controls after this time are disabled. */
  maxTime?: string;

  /** Array of time values, or a predicate, used to disable controls. */
  disableTime?: string[] | ((time: string) => boolean);

  /** If set, all controls are disabled. */
  disabled?: boolean;

  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<TimeGridStyles>;
}

const DEFAULT_AM_PM_LABELS: TimePickerAmPmLabels = { am: "AM", pm: "PM" };

/**
 * `TimeGrid` — a standalone grid of selectable time options rendered from a
 * `data` list of 24h `"HH:mm[:ss]"` strings. The `any`-free, cross-platform port
 * of Mantine's `TimeGrid`: value is controlled/uncontrolled via the kit's
 * `useUncontrolled`; each option is labelled through the shared `getFormattedTime`
 * (so `12h` shows AM/PM and `withSeconds` adds `:ss`); `minTime`/`maxTime`/
 * `disableTime`/`disabled` gate the controls; selection is styled from the active
 * Tamagui theme ramp (`color9`/`color1`).
 *
 * Per-control sizing/colour/interaction live in the folder-local `TimeGridControl`
 * leaf (delegated); this lays out the grid, shares `size` via context, and offers
 * `styles` sugar over its parts (`root`/`grid`/`control`/`label`) plus a per-time
 * `getControlProps` passthrough (explicit beats sugar). Forwards its ref + style
 * props to the host `Box`.
 *
 * @example
 * <TimeGrid data={["10:00", "12:30", "18:00"]} defaultValue="10:00" onChange={setValue} />
 */
const TimeGridComponent = styleable<TimeGridProps>(TimeGridFrame, function TimeGrid(props, ref) {
  const {
    data,
    value,
    defaultValue,
    onChange,
    allowDeselect = false,
    format = "24h",
    withSeconds = false,
    amPmLabels = DEFAULT_AM_PM_LABELS,
    simpleGridProps,
    getControlProps,
    size = "sm",
    minTime,
    maxTime,
    disableTime,
    disabled,
    styles,
    ...rest
  } = props;

  // 8. One source of truth for the selection across controlled + uncontrolled.
  const [_value, setValue] = useUncontrolled<string | null>({
    value,
    defaultValue,
    finalValue: null,
    onChange,
  });

  // 7. Typed per-slot accessor (dev-warns unknown keys against the known set).
  const s = slotStyles<TimeGridStyles>(styles, TIME_GRID_SLOT_KEYS, "TimeGrid");
  const labelStyles = s.get("label");

  // One stable press handler for every control (reads the live value through
  // the ref), so a selection change only re-renders the cells whose state moved.
  const onSelect = useCallbackRef((time: string, active: boolean) => {
    const nextValue = allowDeselect && active ? null : time;
    if (nextValue !== _value) {
      setValue(nextValue);
    }
  });

  const controls = data.map((time) => {
    // 10. Bounds + per-time disabling gate each control.
    const isDisabled =
      disabled ||
      (!!minTime && isTimeBefore(time, minTime)) ||
      (!!maxTime && isTimeAfter(time, maxTime)) ||
      (Array.isArray(disableTime)
        ? disableTime.some((t) => isSameTime({ time, compare: t, withSeconds }))
        : !!disableTime?.(time));

    const active = _value !== null && isSameTime({ time, compare: _value, withSeconds });
    const controlProps = getControlProps?.(time);

    return (
      <TimeGridControl
        key={time}
        time={time}
        active={active}
        format={format}
        amPmLabels={amPmLabels}
        withSeconds={withSeconds}
        disabled={isDisabled}
        size={size}
        labelProps={labelStyles}
        // explicit beats sugar: the `control` slot sits UNDER per-item
        // `getControlProps`, and the consumer's own `onPress` is preserved
        // (called before ours, inside the leaf).
        {...s.merge("control", controlProps)}
        consumerOnPress={controlProps?.onPress}
        onSelect={onSelect}
      />
    );
  });

  return (
    <TimeGridFrame ref={ref} role="group" {...s.get("root")} {...rest}>
      <SimpleGrid cols={3} spacing="xs" {...simpleGridProps} {...s.get("grid")}>
        {controls}
      </SimpleGrid>
    </TimeGridFrame>
  );
});

TimeGridComponent.displayName = "@knitui/dates/TimeGrid";

// ── 14. Public surface ───────────────────────────────────────────────────────
// `withStaticProperties` exposes the styled parts so consumers can target/extend
// them (`styled(TimeGrid.Control, …)`) — the single source of truth for the grid
// parts. `.Grid` is the kit `SimpleGrid` (not a styled wrapper) so its own props
// stay intact.
export const TimeGrid = withStaticProperties(TimeGridComponent, {
  Frame: TimeGridFrame,
  Grid: SimpleGrid,
  Control: TimeGridControlFrame,
  ControlLabel: TimeGridControlLabel,
});
