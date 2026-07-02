import * as React from "react";

import { type GetProps, styled, type TamaguiElement, withStaticProperties } from "@knitui/core";
import { useId, useKeyboardActions, useUncontrolled } from "@knitui/hooks";

import { Box } from "../Box";
import { controlMetrics as M } from "../internal/control-metrics";
import {
  INLINE_CONTROL_SLOTS,
  InlineControl,
  type InlineControlProps,
  type InlineControlSlots,
} from "../internal/InlineControl";
import { useReducedTransition } from "../internal/motion";
import {
  animateOnlyProps,
  FOCUS_RING,
  fontSizeVariant,
  radiusVariant,
  type SizeKey,
  transitionProps,
  webCursor,
} from "../internal/style-props";
import { pick, slotStyles, type SlotStyles } from "../internal/styles";
import { Text } from "../Text";

export type SwitchSize = SizeKey;

/* -------------------------------------------------------------------------- */
/* Group context                                                              */
/* -------------------------------------------------------------------------- */

interface SwitchGroupContextValue {
  value: string[];
  onChange: (itemValue: string) => void;
  size?: SwitchSize;
  isDisabled: (itemValue: string) => boolean;
}

const SwitchGroupContext = React.createContext<SwitchGroupContextValue | null>(null);

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Switch geometry. The Switch is a small control, so its TRACK height is the
 * canonical `controlMetrics` height for each size key (a `md` Switch is 40px
 * tall, matching a `md` Checkbox/Radio). The THUMB is an inset square that sits
 * inside the track; the local px ladder is tuned to leave a consistent inset on
 * every key (track height − ~2× the track's horizontal padding). Track widths
 * are ~1.75× the height so the thumb has room to slide.
 */
/**
 * Horizontal inset between the track edge and the thumb, in px. Matches the
 * `$xxs` token applied as `paddingHorizontal` on the track, and is the numeric
 * value the thumb's slide distance is computed against (track width − thumb
 * width − 2× this inset).
 */
const TRACK_PAD = 6;

const trackSizeVariant = {
  xxs: { minWidth: 36, height: M.xxs.height, paddingHorizontal: "$xxs" },
  xs: { minWidth: 42, height: M.xs.height, paddingHorizontal: "$xxs" },
  sm: { minWidth: 56, height: M.sm.height, paddingHorizontal: "$xxs" },
  md: { minWidth: 70, height: M.md.height, paddingHorizontal: "$xxs" },
  lg: { minWidth: 84, height: M.lg.height, paddingHorizontal: "$xxs" },
  xl: { minWidth: 98, height: M.xl.height, paddingHorizontal: "$xxs" },
  xxl: { minWidth: 112, height: M.xxl.height, paddingHorizontal: "$xxs" },
} as const;

// Thumb = track height − 2× the track's `$xxs` (6px) horizontal inset, so the
// thumb sits flush inside the pill with an even gap on every key.
const thumbSizeVariant = {
  xxs: { width: 8, height: 8 },
  xs: { width: 12, height: 12 },
  sm: { width: 20, height: 20 },
  md: { width: 28, height: 28 },
  lg: { width: 36, height: 36 },
  xl: { width: 44, height: 44 },
  xxl: { width: 52, height: 52 },
} as const;

const SwitchTrack = styled(Box, {
  name: "SwitchTrack",
  position: "relative",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "flex-start",
  borderRadius: 999,
  backgroundColor: "$color5",
  ...webCursor("pointer"),

  variants: {
    // The thumb is absolutely positioned and slides via a `transform`
    // transition (see the `Switch` body), so the track only needs to swap its
    // fill colour here — no `justifyContent` flip, which CSS can't animate.
    on: {
      true: { backgroundColor: "$color9" },
      false: {},
    },
    // The track is a small CONTROL: its `height` derives from the canonical
    // `controlMetrics` height for the key, so a `md` Switch lines up in height
    // with a `md` Checkbox/Radio. `minWidth` is the empty-switch pill width (≈
    // 1.75× the height — wide enough for the thumb to slide); the track has NO
    // fixed `width`, so an on/off label rendered in-flow can grow it wider. A
    // small horizontal inset completes the pill.
    size: trackSizeVariant,
    radius: radiusVariant,
    disabled: {
      true: { pointerEvents: "none", ...webCursor("default") },
    },
  } as const,

  defaultVariants: { size: "md", on: false },
});

const SwitchThumb = styled(Box, {
  name: "SwitchThumb",
  position: "relative",
  zIndex: 1,
  borderRadius: 999,
  backgroundColor: "$white",
  alignItems: "center",
  justifyContent: "center",

  variants: {
    size: thumbSizeVariant,
  } as const,

  defaultVariants: { size: "md" },
});

/** Small dot inside the thumb that echoes the track colour. */
const ThumbIndicator = styled(Box, {
  name: "SwitchThumbIndicator",
  width: "40%",
  height: "40%",
  borderRadius: 999,
  backgroundColor: "$color5",
  ...transitionProps("fast"),
  ...animateOnlyProps(["backgroundColor"]),
  variants: {
    on: { true: { backgroundColor: "$color9" } },
  } as const,
});

/**
 * On/off label rendered inside the track, on the side the thumb is NOT on. It
 * sits in-flow as a `flex: 1` cell so its text width grows the track (the track
 * has no fixed width — see `SwitchTrack`).
 */
const TrackLabel = styled(Text, {
  name: "SwitchTrackLabel",
  flex: 1,
  zIndex: 0,
  textAlign: "center",
  alignItems: "center",
  justifyContent: "center",
  fontWeight: "600",
  color: "$color",
  userSelect: "none",
  numberOfLines: 1,
  paddingHorizontal: "$xs",
  ...transitionProps("fast"),
  ...animateOnlyProps(["color"]),
  variants: {
    on: { true: { color: "$color1" } },
    size: {
      ...fontSizeVariant,
    },
  } as const,
});

type SwitchAriaProps = {
  role: "switch";
  "aria-checked": boolean;
  "aria-disabled"?: boolean;
  "aria-describedby"?: string;
  "aria-label"?: string;
  "aria-labelledby"?: string;
};

/* -------------------------------------------------------------------------- */
/* Switch                                                                     */
/* -------------------------------------------------------------------------- */

type SwitchTrackProps = Omit<
  GetProps<typeof SwitchTrack>,
  | "on"
  | "size"
  | "onChange"
  | "role"
  | "aria-label"
  | "aria-labelledby"
  | "aria-describedby"
  | "accessibilityLabel"
  | "accessibilityRole"
  | "accessibilityState"
>;

/**
 * Slot → part-props map for Switch's own visual parts (Pillar B /
 * `internal/styles.ts`). Layered ON TOP of the inherited chrome slots
 * (`label` / `description` / `error` / `root`, see {@link InlineControlSlots}).
 * `track` is the pill, `thumb` the sliding knob, `thumbIndicator` the dot inside
 * the thumb, and `trackLabel` the on/off text rendered in the track.
 */
export interface SwitchStyles extends InlineControlSlots {
  /** Props for the pill `SwitchTrack`. */
  track: Partial<GetProps<typeof SwitchTrack>>;
  /** Props for the sliding `SwitchThumb`. */
  thumb: Partial<GetProps<typeof SwitchThumb>>;
  /** Props for the dot inside the thumb (`SwitchThumbIndicator`). */
  thumbIndicator: Partial<GetProps<typeof ThumbIndicator>>;
  /** Props for the on/off label rendered in the track (`SwitchTrackLabel`). */
  trackLabel: Partial<GetProps<typeof TrackLabel>>;
}

const SWITCH_SLOTS = [
  ...INLINE_CONTROL_SLOTS,
  "track",
  "thumb",
  "thumbIndicator",
  "trackLabel",
] as const satisfies readonly (keyof SwitchStyles)[];

export interface SwitchProps
  extends
    SwitchTrackProps,
    Pick<InlineControlProps, "label" | "description" | "error" | "labelPosition"> {
  /** Controlled checked state. */
  checked?: boolean;
  /** Initial checked state for the uncontrolled case. @default false */
  defaultChecked?: boolean;
  /**
   * Called with the next checked state. Mirrors Mantine's `onChange` name; the
   * payload is a boolean (not a DOM event) because the kit is cross-platform.
   */
  onChange?: (checked: boolean) => void;
  /** @deprecated Tamagui-style alias for {@link SwitchProps.onChange}. */
  onCheckedChange?: (checked: boolean) => void;
  /** Controls the size of every element. @default 'md' */
  size?: SwitchSize;
  /** Inner label shown in the track when unchecked. */
  offLabel?: React.ReactNode;
  /** Inner label shown in the track when checked. */
  onLabel?: React.ReactNode;
  /** Icon rendered inside the thumb. */
  thumbIcon?: React.ReactNode;
  /** Show a coloured dot inside the thumb. @default true */
  withThumbIndicator?: boolean;
  /**
   * Uniform per-slot style passthrough — sugar over the composable parts. Own
   * slots: `track` / `thumb` / `thumbIndicator` / `trackLabel`; plus the
   * inherited chrome slots `label` / `description` / `error` / `root` forwarded
   * to the `InlineControl`.
   */
  styles?: SlotStyles<SwitchStyles>;
  /** Id used to bind the control and label; auto-generated when omitted. */
  id?: string;
  /** Value reported to a surrounding `Switch.Group`. */
  value?: string;
  /** Disables the switch. */
  disabled?: boolean;
  /** Ref of the root wrapper element. */
  rootRef?: React.Ref<TamaguiElement>;
  /** Accessible label when no visible label is provided. */
  "aria-label"?: React.AriaAttributes["aria-label"];
  /** Id of an external label element. Defaults to the visible label id. */
  "aria-labelledby"?: React.AriaAttributes["aria-labelledby"];
  /** Ids of external description elements; merged with description/error ids. */
  "aria-describedby"?: React.AriaAttributes["aria-describedby"];
}

const SwitchComponent = SwitchTrack.styleable<SwitchProps>(function Switch(props, ref) {
  const {
    checked,
    defaultChecked,
    onChange,
    onCheckedChange,
    size: sizeProp,
    radius = "xl",
    label,
    description,
    error,
    labelPosition = "right",
    styles,
    offLabel,
    onLabel,
    thumbIcon,
    withThumbIndicator = true,
    id,
    value,
    disabled,
    rootRef,
    role: _role,
    "aria-label": ariaLabel,
    "aria-labelledby": ariaLabelledBy,
    "aria-describedby": ariaDescribedByProp,
    ...rest
  } = props;

  const ctx = React.useContext(SwitchGroupContext);
  const inGroup = ctx != null && value != null;
  const size = sizeProp ?? ctx?.size ?? "md";

  // When the user prefers reduced motion, drop the thumb-slide + colour
  // transitions to a null transition (instant). The slide stays transform-based
  // either way; this only removes the easing/duration, not the layout.
  const fade = useReducedTransition("fast");

  const uuid = useId(id);
  const descriptionId = description != null ? `${uuid}-description` : undefined;
  const errorId = error != null && error !== true ? `${uuid}-error` : undefined;

  const [isOn, setOn] = useUncontrolled<boolean>({
    value: inGroup ? ctx!.value.includes(value!) : checked,
    defaultValue: defaultChecked,
    finalValue: false,
    onChange: (next) => {
      onChange?.(next);
      onCheckedChange?.(next);
    },
  });

  const resolvedDisabled = !!(disabled || (inGroup && ctx!.isDisabled(value!)));
  const ariaDescribedBy =
    [ariaDescribedByProp, descriptionId, errorId].filter(Boolean).join(" ") || undefined;
  const ariaProps: SwitchAriaProps = {
    role: "switch",
    "aria-checked": isOn,
    "aria-disabled": resolvedDisabled || undefined,
    "aria-describedby": ariaDescribedBy,
    "aria-label": ariaLabel,
    "aria-labelledby":
      ariaLabelledBy ?? (ariaLabel == null && label != null ? `${uuid}-label` : undefined),
  };

  const toggle = React.useCallback(() => {
    if (resolvedDisabled) {
      return;
    }
    if (inGroup) {
      ctx!.onChange(value!);
    }
    setOn(!isOn);
  }, [resolvedDisabled, inGroup, ctx, value, setOn, isOn]);

  const focusProps = useKeyboardActions({ onActivate: toggle }, { disabled: resolvedDisabled });
  const hasTrackLabels = onLabel != null || offLabel != null;

  // Own slots applied to the visual parts; chrome slots forwarded to InlineControl.
  const s = slotStyles<SwitchStyles>(styles, SWITCH_SLOTS, "Switch");

  const thumb = thumbSizeVariant[size];
  // The thumb is absolutely positioned so it can slide via a `transform`
  // transition instead of an un-animatable `justifyContent` flip. Its travel
  // distance is the track's inner width minus the thumb, so we measure the
  // track (it can grow past `minWidth` when an on/off label is present) and seed
  // the state with `minWidth` for a correct first paint before `onLayout` fires.
  const [trackWidth, setTrackWidth] = React.useState<number>(trackSizeVariant[size].minWidth);
  const slide = Math.max(0, trackWidth - thumb.width - TRACK_PAD * 2);

  // The label sits on the side the thumb is NOT on; pad that side by the thumb's
  // footprint so the text never slides under the thumb.
  const labelEl = hasTrackLabels ? (
    <TrackLabel
      on={isOn}
      size={size}
      paddingLeft={isOn ? "$xs" : thumb.width + TRACK_PAD}
      paddingRight={isOn ? thumb.width + TRACK_PAD : "$xs"}
      {...fade}
      {...s.get("trackLabel")}
    >
      {isOn ? onLabel : offLabel}
    </TrackLabel>
  ) : null;
  const thumbEl = (
    <SwitchThumb
      size={size}
      position="absolute"
      left={TRACK_PAD}
      top="50%"
      y={-thumb.height / 2}
      x={isOn ? slide : 0}
      {...fade}
      {...animateOnlyProps(["transform"])}
      {...s.get("thumb")}
    >
      {thumbIcon ??
        (withThumbIndicator && !thumbIcon ? (
          <ThumbIndicator on={isOn} {...fade} {...s.get("thumbIndicator")} />
        ) : null)}
    </SwitchThumb>
  );

  const track = (
    <SwitchTrack
      ref={ref}
      on={isOn}
      size={size}
      radius={radius}
      disabled={resolvedDisabled}
      onPress={toggle}
      onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
      {...fade}
      {...animateOnlyProps(["backgroundColor"])}
      {...ariaProps}
      {...focusProps}
      focusVisibleStyle={FOCUS_RING}
      {...s.get("track")}
      {...rest}
    >
      {/* The label is the only in-flow child, so its width grows the track; the
          thumb floats above it and slides between the two edges. */}
      {labelEl}
      {thumbEl}
    </SwitchTrack>
  );

  return (
    <InlineControl
      ref={rootRef}
      id={uuid}
      size={size}
      labelPosition={labelPosition}
      label={label}
      description={description}
      error={error}
      disabled={resolvedDisabled}
      descriptionId={descriptionId}
      errorId={errorId}
      onLabelPress={toggle}
      control={track}
      styles={pick<SwitchStyles, InlineControlSlots>(styles, INLINE_CONTROL_SLOTS)}
    />
  );
});

/* -------------------------------------------------------------------------- */
/* Switch.Group                                                               */
/* -------------------------------------------------------------------------- */

const GroupFrame = styled(Box, {
  name: "SwitchGroup",
  flexDirection: "column",
  gap: "$xs",
});

const GroupItems = styled(Box, {
  name: "SwitchGroupItems",
  role: "group",
  flexDirection: "row",
  flexWrap: "wrap",
  gap: "$md",
});

const GroupLabel = styled(Text, { name: "SwitchGroupLabel", fontWeight: "600", color: "$color" });
const GroupDescription = styled(Text, {
  name: "SwitchGroupDescription",
  color: "$color",
  opacity: 0.65,
});

export interface SwitchGroupProps extends Omit<GetProps<typeof GroupFrame>, "onChange"> {
  /** `Switch` children. */
  children?: React.ReactNode;
  /** Controlled array of selected values. */
  value?: string[];
  /** Initial selected values for the uncontrolled case. */
  defaultValue?: string[];
  /** Called with the next array of selected values. */
  onChange?: (value: string[]) => void;
  /** Size shared with every child switch. @default 'md' */
  size?: SwitchSize;
  /** Group label rendered above the switches. */
  label?: React.ReactNode;
  /** Group description rendered below the label. */
  description?: React.ReactNode;
  /** If set, values cannot be changed. */
  readOnly?: boolean;
  /** Disable the whole group. */
  disabled?: boolean;
  /** Cap on selected values; unselected switches disable once reached. */
  maxSelectedValues?: number;
  /**
   * `name` for the hidden form input. Accepted for Mantine parity; uncontrolled
   * native form submission has no DOM input, so this is web-form metadata only.
   */
  name?: string;
}

const SwitchGroup = GroupFrame.styleable<SwitchGroupProps>(function SwitchGroup(props, ref) {
  const {
    children,
    value,
    defaultValue,
    onChange,
    size = "md",
    label,
    description,
    readOnly,
    disabled,
    maxSelectedValues,
    name: _name,
    ...rest
  } = props;

  const [selected, setSelected] = useUncontrolled<string[]>({
    value,
    defaultValue,
    finalValue: [],
    onChange,
  });

  const handleItemChange = React.useCallback(
    (itemValue: string) => {
      if (readOnly) {
        return;
      }
      const isSelected = selected.includes(itemValue);
      if (!isSelected && maxSelectedValues && selected.length >= maxSelectedValues) {
        return;
      }
      setSelected(isSelected ? selected.filter((v) => v !== itemValue) : [...selected, itemValue]);
    },
    [readOnly, selected, maxSelectedValues, setSelected],
  );

  const isDisabled = React.useCallback(
    (itemValue: string) => {
      if (disabled) {
        return true;
      }
      if (!maxSelectedValues) {
        return false;
      }
      return !selected.includes(itemValue) && selected.length >= maxSelectedValues;
    },
    [disabled, maxSelectedValues, selected],
  );

  const contextValue = React.useMemo<SwitchGroupContextValue>(
    () => ({ value: selected, onChange: handleItemChange, size, isDisabled }),
    [selected, handleItemChange, size, isDisabled],
  );

  return (
    <SwitchGroupContext.Provider value={contextValue}>
      <GroupFrame ref={ref} {...rest}>
        {label != null ? <GroupLabel>{label}</GroupLabel> : null}
        {description != null ? <GroupDescription>{description}</GroupDescription> : null}
        <GroupItems>{children}</GroupItems>
      </GroupFrame>
    </SwitchGroupContext.Provider>
  );
});

export const Switch = withStaticProperties(SwitchComponent, {
  Group: SwitchGroup,
  Track: SwitchTrack,
  Thumb: SwitchThumb,
  Indicator: ThumbIndicator,
  TrackLabel: TrackLabel,
});
