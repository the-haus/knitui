import * as React from "react";

import { Text, UnstyledButton } from "@knitui/components";
import { createStyledContext, type GetProps, styled, type TamaguiElement } from "@knitui/core";

import { type CalendarSize, CELL_FONT } from "../cell-metrics";
import { controlA11yProps } from "../internal/a11y";
import { hasPreventDefault } from "../internal/has-prevent-default";
import { webCursor } from "../internal/web-cursor";
import { padTime } from "../utils";

const controlFontVariant = {
  xxs: { fontSize: CELL_FONT.xxs },
  xs: { fontSize: CELL_FONT.xs },
  sm: { fontSize: CELL_FONT.sm },
  md: { fontSize: CELL_FONT.md },
  lg: { fontSize: CELL_FONT.lg },
  xl: { fontSize: CELL_FONT.xl },
  xxl: { fontSize: CELL_FONT.xxl },
} as const;

const TimeControlContext = createStyledContext<{ size: CalendarSize }>({ size: "sm" });

/**
 * A single selectable time-cell in a `TimeControlsList` dropdown column. Accent
 * comes from the active theme's palette ramp via the `theme` prop (no Mantine
 * `color` prop): the active control fills with `$color9`/`$color1` text — the
 * same convention as `PickerControl`/`TimeGridControl`. States use
 * `hoverStyle`/`pressStyle`, never a runtime hover flag.
 */
const TimeControlFrame = styled(UnstyledButton.Frame, {
  name: "TimeControl",
  context: TimeControlContext,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "$sm",
  paddingVertical: "$xs",
  paddingHorizontal: "$sm",
  backgroundColor: "transparent",
  ...webCursor("pointer"),
  hoverStyle: { backgroundColor: "$color2" },
  pressStyle: { backgroundColor: "$color3" },

  variants: {
    /** Active option — solid accent fill. */
    active: {
      true: {
        backgroundColor: "$color9",
        hoverStyle: { backgroundColor: "$color10" },
        pressStyle: { backgroundColor: "$color8" },
      },
    },
  } as const,
});

const TimeControlLabel = styled(Text, {
  name: "TimeControlLabel",
  context: TimeControlContext,
  userSelect: "none",
  variants: {
    size: controlFontVariant,
  } as const,

  defaultVariants: { size: "sm" },
});

/** Props for {@link TimeControl}; generic over the cell value (`number` columns or `string` am/pm). */
export interface TimeControlProps<Value extends number | string> extends Omit<
  GetProps<typeof TimeControlFrame>,
  "children" | "active" | "onPress"
> {
  /** Cell value — a clock number (padded for display) or an am/pm label. */
  value: Value;

  /** Whether this cell is the active selection. */
  active: boolean;

  /** Called with `value` when the cell is pressed. */
  onSelect: (value: Value) => void;

  /** Label font size. @default 'sm' */
  size?: CalendarSize;
}

/**
 * `TimeControl` — one selectable cell in the time dropdown. The `any`-free,
 * cross-platform port of Mantine's `TimeControl`: pressing it calls `onSelect`;
 * focus-stealing is prevented on web via `onPressIn` + the `has-prevent-default`
 * guard (NOT a DOM `onMouseDown`). Numeric values are zero-padded for display;
 * string values (am/pm) print verbatim. Folder-local to the `TimePicker` dropdown.
 */
function TimeControlImpl<Value extends number | string>(
  { value, active, onSelect, size = "sm", ...others }: TimeControlProps<Value>,
  ref: React.Ref<TamaguiElement>,
) {
  const label = typeof value === "number" ? padTime(value) : String(value);

  return (
    <TimeControlFrame
      ref={ref}
      role="button"
      aria-selected={active || undefined}
      {...controlA11yProps({ role: "button", label, selected: active })}
      active={active}
      tabIndex={-1}
      onPress={() => onSelect(value)}
      onPressIn={(event) => {
        // Web: keep focus on the segment inputs (don't steal it to the control).
        // No-op on native (no `preventDefault`).
        if (hasPreventDefault(event)) {
          event.preventDefault();
        }
      }}
      render="button"
      {...others}
    >
      <TimeControlLabel size={size} color={active ? "$color1" : "$color"}>
        {label}
      </TimeControlLabel>
    </TimeControlFrame>
  );
}

export const TimeControl = React.forwardRef(TimeControlImpl) as <Value extends number | string>(
  props: TimeControlProps<Value> & React.RefAttributes<TamaguiElement>,
) => React.ReactElement | null;
