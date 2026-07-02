import * as React from "react";

import {
  createStyledContext,
  type GetProps,
  styled,
  useTheme,
  withStaticProperties,
} from "@knitui/core";
import { useKeyboardActions, useUncontrolled } from "@knitui/hooks";
import { IconCheck } from "@knitui/icons";

import { Box } from "../Box";
import { controlIconSize } from "../internal/control-icon-size";
import { usePressScale } from "../internal/motion";
import { renderTextChild } from "../internal/render-text-child";
import { resolveThemeColor } from "../internal/resolve-theme-color";
import {
  controlFontVariant,
  controlGapVariant,
  focusRingStyle,
  pressScaleStyle,
  radiusVariant,
  type SizeKey,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { useToggle } from "../internal/use-toggle";
import { Text } from "../Text";

type ChipSize = SizeKey;
type ChipVariant = "outline" | "filled" | "light";
type ChipRole = "checkbox" | "radio";

type ChipAriaProps = {
  role: ChipRole;
  "aria-checked": boolean;
  "aria-disabled"?: boolean;
  "aria-label"?: string;
};

/**
 * Combined visual state — `variant` crossed with the checked flag. Tamagui has
 * no compound variants, so the `Chip` component derives this single key from its
 * public `variant` + the resolved checked state and feeds it to the frame (and,
 * via context, the label/check). `-on` suffix = checked.
 */
type ChipState = ChipVariant | `${ChipVariant}-on`;

const ChipContext = createStyledContext<{ size: ChipSize; state: ChipState }>({
  size: "sm",
  state: "outline",
});

/**
 * Pill-shaped toggle — mirrors Mantine's `Chip` (and `Chip.Group`). Accent comes
 * from the active theme's palette ramp via the `theme` prop, not a `color` prop.
 * Standalone it is a controlled/uncontrolled checkbox; inside a `Chip.Group` it
 * defers its checked state to the group (single- or multi-select).
 */
const ChipFrame = styled(Box, {
  name: "Chip",
  context: ChipContext,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  alignSelf: "flex-start",
  borderWidth: 1,
  borderColor: "transparent",
  borderRadius: 9999,
  ...webCursor("pointer"),
  userSelect: "none",
  ...focusRingStyle,
  // Tactile press-dip — merges with the per-state `pressStyle` color below and
  // eases via the `usePressScale()` props applied on render (reduced-motion aware).
  ...pressScaleStyle,

  variants: {
    state: {
      outline: {
        backgroundColor: "transparent",
        borderColor: "$color7",
        hoverStyle: { backgroundColor: "$color2" },
        pressStyle: { backgroundColor: "$color3" },
      },
      "outline-on": {
        backgroundColor: "transparent",
        borderColor: "$color9",
        hoverStyle: { borderColor: "$color10" },
        pressStyle: { backgroundColor: "$color2" },
      },
      filled: {
        backgroundColor: "$color3",
        hoverStyle: { backgroundColor: "$color4" },
        pressStyle: { backgroundColor: "$color5" },
      },
      "filled-on": {
        backgroundColor: "$color9",
        hoverStyle: { backgroundColor: "$color10" },
        pressStyle: { backgroundColor: "$color8" },
      },
      light: {
        backgroundColor: "$color2",
        hoverStyle: { backgroundColor: "$color3" },
        pressStyle: { backgroundColor: "$color4" },
      },
      "light-on": {
        backgroundColor: "$color5",
        hoverStyle: { backgroundColor: "$color6" },
        pressStyle: { backgroundColor: "$color7" },
      },
    },
    size: controlGapVariant,
    radius: radiusVariant,
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { state: "outline", size: "sm" },
});

/**
 * Wraps the chip's leading glyph (the default ✓ or a user-supplied `icon`).
 * Exposed as `Chip.Icon` and targeted by the `icon` slot so the check mark can
 * be restyled like any other composable part. Inherits the combined state via
 * context so its colour matches the label.
 */
// A `Box` (not a `Text`): the check glyph is now an `@knitui/icons` SVG, which on
// native must live inside a `View`. The `state`/`size` style props are inert on a
// View and harmless; the rendered `IconCheck` carries its own resolved color/px.
const ChipIcon = styled(Box, {
  name: "ChipIcon",
  context: ChipContext,
  alignItems: "center",
  justifyContent: "center",
  userSelect: "none",
  variants: {
    state: {
      outline: { color: "$color" },
      "outline-on": { color: "$color11" },
      filled: { color: "$color" },
      "filled-on": { color: "$color1" },
      light: { color: "$color" },
      "light-on": { color: "$color11" },
    },
    size: {
      ...controlFontVariant,
    },
  } as const,
});

/**
 * Foreground token a checked chip's check glyph takes, per combined state — the
 * `-on` half of `ChipIcon`'s `state` variant. Resolved to a concrete colour so
 * the `@knitui/icons` `IconCheck` can paint it (`react-native-svg` can't resolve
 * theme tokens). The icon only renders when checked, so only the `-on` states
 * are reachable.
 */
const CHIP_ICON_TOKEN: Record<ChipState, string> = {
  outline: "$color",
  "outline-on": "$color11",
  filled: "$color",
  "filled-on": "$color1",
  light: "$color",
  "light-on": "$color11",
};

/** Label + check glyph share this themed text (coloured by the combined state). */
const ChipLabel = styled(Text, {
  name: "ChipLabel",
  context: ChipContext,
  fontWeight: "500",
  userSelect: "none",
  numberOfLines: 1,
  variants: {
    state: {
      outline: { color: "$color" },
      "outline-on": { color: "$color11" },
      filled: { color: "$color" },
      "filled-on": { color: "$color1" },
      light: { color: "$color" },
      "light-on": { color: "$color11" },
    },
    size: {
      ...controlFontVariant,
    },
  } as const,
});

// --- Chip.Group ------------------------------------------------------------

interface ChipGroupContextValue {
  isChipSelected: (value: string) => boolean;
  onChange: (value: string) => void;
  multiple: boolean;
}

const ChipGroupContext = React.createContext<ChipGroupContextValue | null>(null);

export interface ChipGroupProps {
  /** If set, multiple chips can be selected (value becomes `string[]`). */
  multiple?: boolean;
  /** Controlled value — a single `string` (single-select) or `string[]` (multiple). */
  value?: string | string[];
  /** Uncontrolled initial value. */
  defaultValue?: string | string[];
  /** Called when the selection changes. */
  onChange?: (value: string | string[]) => void;
  /** `Chip` components (and any other nodes). */
  children?: React.ReactNode;
}

/**
 * Groups chips into a single- or multi-select set. Holds the selection (via the
 * `useUncontrolled` hook) and hands each chip a `isChipSelected`/`onChange` pair
 * through context; chips read whether their own `value` is selected.
 */
function ChipGroup(props: ChipGroupProps) {
  const { multiple = false, value, defaultValue, onChange, children } = props;
  const [current, setValue] = useUncontrolled<string | string[]>({
    value,
    defaultValue,
    finalValue: multiple ? [] : "",
    onChange,
  });

  const ctx = React.useMemo<ChipGroupContextValue>(() => {
    const isChipSelected = (val: string) =>
      Array.isArray(current) ? current.includes(val) : val === current;
    const handleChange = (val: string) => {
      if (Array.isArray(current)) {
        setValue(current.includes(val) ? current.filter((v) => v !== val) : [...current, val]);
      } else {
        setValue(val);
      }
    };
    return { isChipSelected, onChange: handleChange, multiple };
  }, [current, multiple, setValue]);

  return <ChipGroupContext.Provider value={ctx}>{children}</ChipGroupContext.Provider>;
}

// --- Chip ------------------------------------------------------------------

export interface ChipProps extends Omit<
  GetProps<typeof ChipFrame>,
  "state" | "onChange" | "role" | "aria-checked" | "aria-disabled"
> {
  /** Visual style. @default "outline" */
  variant?: ChipVariant;
  /** Controlled checked state. */
  checked?: boolean;
  /** Uncontrolled initial checked state. */
  defaultChecked?: boolean;
  /** Called when the checked state changes. */
  onChange?: (checked: boolean) => void;
  /** Identifies this chip inside a `Chip.Group`. */
  value?: string;
  /** Replaces the default check glyph shown when checked. `null`/`false` hides it. */
  icon?: React.ReactNode;
  /** Chip label. */
  children?: React.ReactNode;
  /**
   * Uniform per-slot style passthrough — sugar over the composable parts. Slots:
   * `root` (the chip frame) / `label` (the chip's text) / `icon` (the leading
   * check glyph). Shares the kit-wide vocabulary so styling "the label of a
   * control" works the same as elsewhere.
   */
  styles?: SlotStyles<ChipSlots>;
}

/**
 * Slot → part-props map for Chip's uniform `styles` prop (Pillar B /
 * `internal/styles.ts`). Chip has no label/description/error chrome (its body IS
 * the label), so it exposes only the parts it owns: `root` + `label` + `icon`.
 */
export interface ChipSlots {
  /** The outer `ChipFrame`. */
  root: Partial<GetProps<typeof ChipFrame>>;
  /** The chip's text `ChipLabel`. */
  label: Partial<GetProps<typeof ChipLabel>>;
  /**
   * The leading check glyph `ChipIcon` (the default ✓; no-op when `icon` is
   * custom). `color` is routed to the `@knitui/icons` `IconCheck` (the wrapper is a
   * `Box`), so `styles={{ icon: { color } }}` still recolors the check.
   */
  icon: Partial<GetProps<typeof ChipIcon>> & { color?: string };
}

const CHIP_SLOTS = ["root", "label", "icon"] as const satisfies readonly (keyof ChipSlots)[];

const ChipComponent = ChipFrame.styleable<ChipProps>(function Chip(props, ref) {
  const {
    variant = "outline",
    size = "sm",
    checked,
    defaultChecked = false,
    onChange,
    value,
    icon,
    children,
    disabled,
    styles,
    "aria-label": ariaLabel,
    ...rest
  } = props;

  // Uniform `styles` slots, distributed onto the chip parts below. `rest`
  // (explicit props spread on the frame) is applied AFTER the `root` slot so an
  // explicit prop always wins over the sugar.
  const s = slotStyles<ChipSlots>(styles, CHIP_SLOTS, "Chip");

  // The label slot must reach the `ChipLabel` that `renderTextChild` mounts, so
  // wrap `ChipLabel` to fold in the slot props. Memoized so the wrapper's
  // identity is stable across renders unless the slot props change.
  const labelSlot = s.get("label");
  const LabelWrapper = React.useMemo(
    () =>
      function ChipLabelSlot({ children: labelChildren }: { children: React.ReactNode }) {
        return <ChipLabel {...labelSlot}>{labelChildren}</ChipLabel>;
      },
    [labelSlot],
  );

  const theme = useTheme();
  const group = React.useContext(ChipGroupContext);
  const inGroup = group !== null && value !== undefined;
  const [selfOn, toggle] = useToggle(checked, defaultChecked, onChange);
  const isOn = inGroup ? group.isChipSelected(value) : selfOn;
  // Reduced-motion-aware press easing (neutralises the base dip when reduced).
  const press = usePressScale();

  const handlePress = React.useCallback(() => {
    if (disabled) return;
    if (inGroup) {
      group.onChange(value);
      onChange?.(!isOn);
    } else {
      toggle();
    }
  }, [disabled, group, inGroup, isOn, onChange, toggle, value]);

  const state: ChipState = isOn ? `${variant}-on` : variant;
  const showIcon = isOn && icon !== null && icon !== false;

  // Concrete colour + px for the default check glyph (the `IconCheck` SVG can't
  // resolve theme tokens or the font cascade). Colour tracks the combined state,
  // size tracks the control key via the canonical icon ladder. A `color` from the
  // `icon` slot overrides the state colour and is routed to the icon.
  const { color: iconSlotColor, ...iconSlotProps } = s.get("icon") ?? {};
  const checkColor = resolveThemeColor(
    theme,
    typeof iconSlotColor === "string" ? iconSlotColor : CHIP_ICON_TOKEN[state],
  );
  const checkSize = controlIconSize(size);
  const derivedRole: ChipRole = inGroup && !group.multiple ? "radio" : "checkbox";
  const ariaProps: ChipAriaProps = {
    role: derivedRole,
    "aria-checked": isOn,
    "aria-disabled": disabled || undefined,
    "aria-label": ariaLabel,
  };
  const focusProps = useKeyboardActions({ onActivate: handlePress }, { disabled });

  return (
    <ChipFrame
      ref={ref}
      state={state}
      size={size}
      disabled={disabled}
      onPress={handlePress}
      {...press}
      {...ariaProps}
      {...s.get("root")}
      {...rest}
      {...focusProps}
    >
      {showIcon ? (
        icon === undefined ? (
          // Decorative check glyph — `aria-hidden` so it does not pollute the
          // chip's accessible name (the label alone names the chip, per Mantine).
          // `ChipIcon` stays the stylable wrapper (its `icon` slot still applies);
          // the rendered glyph is now an `@knitui/icons` `IconCheck`.
          <ChipIcon aria-hidden {...iconSlotProps}>
            <IconCheck size={checkSize} color={checkColor} stroke={3} />
          </ChipIcon>
        ) : (
          icon
        )
      ) : null}
      {renderTextChild(children, LabelWrapper)}
    </ChipFrame>
  );
});

export const Chip = withStaticProperties(ChipComponent, {
  Group: ChipGroup,
  Label: ChipLabel,
  Icon: ChipIcon,
  Frame: ChipFrame,
});

export type { ChipSize, ChipVariant };
