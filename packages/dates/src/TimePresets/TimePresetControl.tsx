import * as React from "react";

import { Text, UnstyledButton } from "@knitui/components";
import {
  createStyledContext,
  type GetProps,
  styled,
  type TamaguiElement,
  withStaticProperties,
} from "@knitui/core";

import { type CalendarSize, cellFontVariant } from "../cell-metrics";
import { controlA11yProps } from "../internal/a11y";
import { hasPreventDefault } from "../internal/has-prevent-default";
import type { TimePickerAmPmLabels, TimePickerFormat } from "../types";
import { getFormattedTime } from "../utils";

// ── 2. Shared context ───────────────────────────────────────────────────────
// One `createStyledContext` carries `size` to the styled parts so the cell and
// its label share the SAME size without prop-drilling — the same mechanism
// `TimeControl`/`MonthsList` use.
const TimePresetControlContext = createStyledContext<{ size: CalendarSize }>({ size: "sm" });

// ── 3. Sizing derived from the shared ladder ─────────────────────────────────
// Never hard-code pixels. The label font scales on the `cell-metrics` `CELL_FONT`
// ladder (the calendar twin of components' `controlMetrics`), expressed with raw
// values that resolve at module-load — NOT `getTokenValue`, which needs the live
// config.
// ── 5. Styled parts ───────────────────────────────────────────────────────────

/**
 * One preset time-cell. Accent comes from the active theme's palette ramp via
 * the `theme` prop (no Mantine `color` prop): the active preset fills with
 * `color9`/`color1` text — the `PickerControl`/`TimeGridControl` convention.
 *
 * 12. Interaction lives in real Tamagui pseudo-state (`hover:`/`press:` clauses)
 *     and the `active` variant, never a runtime hover state machine.
 * 15. The active highlight is a boolean VARIANT, never a dynamic
 *     `opacity`/`display` style prop the web optimiser could fold onto the cell.
 */
const TimePresetControlFrame = styled(UnstyledButton.Frame, {
  displayName: "TimePresetControl",
  context: TimePresetControlContext,
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "borderColor",
  borderRadius: "sm",
  paddingVertical: "xs",
  paddingHorizontal: "sm",
  backgroundColor: "transparent hover:color2 press:color3",
  cursor: "web:pointer",

  variants: {
    /** Active preset — solid accent fill. */
    active: {
      true: {
        backgroundColor: "color9 hover:color10 press:color8",
        borderColor: "color9",
      },
    },
  } as const,
});

/**
 * The preset's formatted-time label.
 *
 * 4. Idle text is the neutral `color`; on the active accent fill it flips to the
 *    contrast `color1`. No hex, no Mantine `color` prop.
 */
// A styled `Text` (NOT `styled(TimeValue)`): in v3, `styled()` over a plain
// React component hands it a resolved inline `style` and DROPS theme-name
// values (`color: "color1"` never reached the DOM), so the label is a real
// Tamagui leaf and the time is formatted with the same `getFormattedTime`
// `TimeValue` uses.
const TimePresetControlLabel = styled(Text, {
  displayName: "TimePresetControlLabel",
  context: TimePresetControlContext,
  userSelect: "none",
  color: "color",

  variants: {
    size: cellFontVariant,

    /** On the active accent fill, the label flips to the contrast color. */
    active: { true: { color: "color1" } },
  } as const,

  defaultVariants: { size: "sm" },
});

/** Props for {@link TimePresetControl}. */
export interface TimePresetControlProps extends Omit<
  GetProps<typeof TimePresetControlFrame>,
  "children" | "active" | "onPress" | "onChange" | "value" | "size"
> {
  /** Preset value in 24h `"HH:mm[:ss]"` format. */
  value: string;

  /** Whether this preset is the active value. */
  active: boolean;

  /** Called with `value` when the preset is pressed. */
  onChange: (value: string) => void;

  /** Clock display mode. */
  format: TimePickerFormat;

  /** AM/PM labels for the `12h` mode. */
  amPmLabels: TimePickerAmPmLabels;

  /** Whether seconds are displayed. */
  withSeconds: boolean;

  /** Label font size. @default 'sm' */
  size?: CalendarSize;
}

/**
 * `TimePresetControl` — one selectable preset in the `TimePicker` dropdown,
 * rendering its time through the shared `getFormattedTime` formatter (`TimeValue`'s). The `any`-free,
 * cross-platform port of Mantine's `TimePresetControl`; focus-stealing is
 * prevented on web via `onPressIn` + the `has-prevent-default` guard. Forwards
 * its ref to the cell. Folder-local to the `TimePicker` dropdown.
 */
function TimePresetControlImpl(
  {
    value,
    active,
    onChange,
    format,
    amPmLabels,
    withSeconds,
    size = "sm",
    ...others
  }: TimePresetControlProps,
  ref: React.Ref<TamaguiElement>,
) {
  const label = `${value}`;

  return (
    <TimePresetControlFrame
      ref={ref}
      // 11. Web a11y (role/aria) and native a11y (`accessibility*`) side-by-side.
      role="option"
      aria-selected={active || undefined}
      {...controlA11yProps({ role: "button", label, selected: active })}
      active={active}
      onPress={() => onChange(value)}
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
      <TimePresetControlLabel size={size} active={active}>
        {getFormattedTime({ value, format, amPmLabels, withSeconds })}
      </TimePresetControlLabel>
    </TimePresetControlFrame>
  );
}

const TimePresetControlComponent = React.forwardRef(TimePresetControlImpl);

TimePresetControlComponent.displayName = "@knitui/dates/TimePresetControl";

// ── 14. Public surface ─────────────────────────────────────────────────────────
// `withStaticProperties` exposes the styled parts so consumers can target/extend
// them (`styled(TimePresetControl.Frame, …)`) — the single source of truth for the
// cell parts.
export const TimePresetControl = withStaticProperties(TimePresetControlComponent, {
  Frame: TimePresetControlFrame,
  Label: TimePresetControlLabel,
});
