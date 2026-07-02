import * as React from "react";

import { SimpleGrid, Stack, Text } from "@knitui/components";
import {
  createStyledContext,
  type GetProps,
  slotStyles,
  type SlotStyles,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { type CalendarSize, CELL_FONT, CELL_SPACING } from "../cell-metrics";
import type { TimePickerAmPmLabels, TimePickerFormat, TimePickerPresetGroup } from "../types";
import { isSameTime } from "../utils";
import { TimePresetControl, type TimePresetControlProps } from "./TimePresetControl";

// ── 2. Shared context ───────────────────────────────────────────────────────
// One `createStyledContext` carries `size` to the label so it shares the SAME
// size the consumer set on the root without prop-drilling.
const TimePresetGroupContext = createStyledContext<{ size: CalendarSize }>({ size: "sm" });

// ── 3. Sizing derived from the shared ladder ─────────────────────────────────
// The group label is the smallest rung of the `cell-metrics` `CELL_FONT` ladder
// (no magic pixels), matching Mantine's small section label.
const labelFontVariant = {
  xxs: { fontSize: CELL_FONT.xxs },
  xs: { fontSize: CELL_FONT.xxs },
  sm: { fontSize: CELL_FONT.xxs },
  md: { fontSize: CELL_FONT.xs },
  lg: { fontSize: CELL_FONT.xs },
  xl: { fontSize: CELL_FONT.sm },
  xxl: { fontSize: CELL_FONT.sm },
} as const;

// ── 5. Styled parts ───────────────────────────────────────────────────────────

/** The group container: label above a grid of preset cells. */
const TimePresetGroupFrame = styled(Stack, {
  name: "TimePresetGroup",
  context: TimePresetGroupContext,
  gap: "$xs",
});

/** The group's section label. */
const TimePresetGroupLabel = styled(Text, {
  name: "TimePresetGroupLabel",
  context: TimePresetGroupContext,
  color: "$color11",

  variants: {
    size: labelFontVariant,
  } as const,

  defaultVariants: { size: "sm" },
});

// ── 7. Per-slot `styles` sugar + per-item passthrough ───────────────────────────

/** The named style slots and the styled part each targets. */
export interface TimePresetGroupStyles {
  /** Props for the group container (`.Frame`). */
  root?: GetProps<typeof TimePresetGroupFrame>;
  /** Props for the section label (`.Label`). */
  label?: GetProps<typeof TimePresetGroupLabel>;
  /** Props for the grid wrapping the preset cells (`.Grid`). */
  grid?: GetProps<typeof SimpleGrid>;
  /** Props for each preset cell (`.Control` — the `TimePresetControl` leaf). */
  control?: Partial<TimePresetControlProps>;
}

const TIME_PRESET_GROUP_SLOT_KEYS = [
  "root",
  "label",
  "grid",
  "control",
] as const satisfies readonly (keyof TimePresetGroupStyles)[];

type TimePresetGroupFrameProps = Omit<
  GetProps<typeof TimePresetGroupFrame>,
  "children" | "size" | "onChange" | "value"
>;

/** Props for {@link TimePresetGroup}. */
export interface TimePresetGroupProps extends TimePresetGroupFrameProps {
  /** Currently selected value in 24h format. */
  value: string;

  /** The labelled group of preset values. */
  data: TimePickerPresetGroup;

  /** Called with the pressed preset value. */
  onChange: (value: string) => void;

  /** Clock display mode. */
  format: TimePickerFormat;

  /** AM/PM labels for the `12h` mode. */
  amPmLabels: TimePickerAmPmLabels;

  /** Whether seconds are displayed. */
  withSeconds: boolean;

  /** Label font size. @default 'sm' */
  size?: CalendarSize;

  /** Passes props down to each preset cell, keyed by value (wins over `styles.control`). */
  getControlProps?: (value: string) => Partial<TimePresetControlProps>;

  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<TimePresetGroupStyles>;
}

/**
 * `TimePresetGroup` — a labelled section of preset cells inside the `TimePicker`
 * dropdown. The `any`-free, cross-platform port of Mantine's `TimePresetGroup`
 * (built from `Stack`/`Text`/`SimpleGrid` instead of bare `div`s). Per-cell
 * sizing/colour/interaction live in the `TimePresetControl` leaf (delegated); this
 * lays out the section, shares `size` via context, and offers `styles` sugar over
 * its parts plus a per-value `getControlProps` passthrough (explicit beats sugar).
 * Forwards its ref + style props to the group container.
 *
 * a11y: the container is `role="group"` labelled by the section text (`aria-label`),
 * each cell `role="option"`; native counterparts ride on each cell's own
 * `accessibility*` props. Folder-local to the `TimePicker` dropdown.
 */
const TimePresetGroupComponent = TimePresetGroupFrame.styleable<TimePresetGroupProps>(
  function TimePresetGroup(props, ref) {
    const {
      value,
      data,
      onChange,
      format,
      amPmLabels,
      withSeconds,
      size = "sm",
      getControlProps,
      styles,
      ...rest
    } = props;

    // 7. Typed per-slot accessor (dev-warns unknown keys against the known set).
    const s = slotStyles<TimePresetGroupStyles>(
      styles,
      TIME_PRESET_GROUP_SLOT_KEYS,
      "TimePresetGroup",
    );

    // `data.label` is a `ReactNode`; only forward it as an `aria-label` when it is a
    // plain string (the visible label covers the rest for the screen reader).
    const ariaLabel = typeof data.label === "string" ? data.label : undefined;

    return (
      <TimePresetGroupFrame
        ref={ref}
        role="group"
        aria-label={ariaLabel}
        {...s.get("root")}
        {...rest}
      >
        <TimePresetGroupLabel size={size} {...s.get("label")}>
          {data.label}
        </TimePresetGroupLabel>
        <SimpleGrid cols={withSeconds ? 2 : 3} spacing={CELL_SPACING * 2} {...s.get("grid")}>
          {data.values.map((item) => {
            const controlProps = getControlProps?.(item);
            return (
              <TimePresetControl
                key={item}
                value={item}
                format={format}
                amPmLabels={amPmLabels}
                withSeconds={withSeconds}
                active={isSameTime({ time: item, compare: value, withSeconds })}
                onChange={onChange}
                size={size}
                {...s.merge("control", controlProps)}
              />
            );
          })}
        </SimpleGrid>
      </TimePresetGroupFrame>
    );
  },
);

TimePresetGroupComponent.displayName = "@knitui/dates/TimePresetGroup";

// ── 14. Public surface ─────────────────────────────────────────────────────────
export const TimePresetGroup = withStaticProperties(TimePresetGroupComponent, {
  Frame: TimePresetGroupFrame,
  Label: TimePresetGroupLabel,
  Control: TimePresetControl,
});
