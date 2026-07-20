import * as React from "react";

import {
  createSlot,
  createStyledContext,
  defineSlots,
  type GetProps,
  isWeb,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { Box } from "../Box";
import { controlIconSize } from "../internal/control-icon-size";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import { type GradientValue, useGradient } from "../internal/gradient";
import { usePressScale } from "../internal/motion";
import { renderTextChild } from "../internal/render-text-child";
import {
  controlColorVariant,
  controlFontVariant,
  controlTextColorVariant,
  controlVariant,
  focusRingStyle,
  justifyVariant,
  pickVariants,
  pressScaleStyle,
  radiusVariant,
  type SizeKey,
  webButton,
  webCursor,
} from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";
import { useSlotTextWrapper } from "../internal/use-slot-text-wrapper";
import { Loader, type LoaderProps } from "../Loader";
import { Text } from "../Text";

type ButtonSize = SizeKey;

type ButtonVariant =
  "filled" | "light" | "outline" | "subtle" | "default" | "white" | "transparent" | "gradient";

const ButtonContext = createStyledContext<{ size: ButtonSize; variant: ButtonVariant }>({
  size: "md",
  variant: "filled",
});

/**
 * Button — composed from `Box` + `Text`. Colors reference the active theme's
 * palette ramp ($color1…$color12), so `theme="red"` recolors it with no
 * per-component logic. `variant` chooses how the ramp applies; `size` sets the
 * metrics. `justify` overrides the horizontal alignment of inner content
 * (`justifyContent`). hoverStyle/pressStyle are real Tamagui pseudo states.
 */
const ButtonFrame = styled(Box, {
  name: "Button",
  context: ButtonContext,
  role: "button",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  gap: "$sm",
  borderWidth: 1,
  borderColor: "transparent",
  ...webCursor("pointer"),
  // Tactile press-dip — merges with the per-variant `pressStyle` color below and
  // eases via the `usePressScale()` props applied on render (reduced-motion aware).
  ...pressScaleStyle,
  // Keyboard-focus ring (web) — variant-independent, so it lives on the base and
  // every variant (filled/outline/subtle/…) shows the same focus-visible outline.
  ...focusRingStyle,

  variants: {
    // Frame fill + hover/press per variant — sourced from the shared
    // `variant-colors` ladder so Button/ActionIcon and `theme="…"` stay in lockstep.
    variant: {
      ...controlColorVariant,
    },
    size: {
      ...controlVariant,
    },
    radius: {
      ...radiusVariant,
    },
    /** Override horizontal alignment of inner content (label + sections). */
    justify: justifyVariant,
    fullWidth: {
      true: { alignSelf: "stretch", width: "100%" },
      false: { alignSelf: "flex-start" },
    },
    disabled: {
      true: { opacity: 0.6, pointerEvents: "none" },
    },
  } as const,

  defaultVariants: { variant: "filled", size: "md", fullWidth: false, radius: "md" },
});

const ButtonText = styled(Text, {
  name: "ButtonText",
  context: ButtonContext,
  fontWeight: "600",
  userSelect: "none",
  variants: {
    // Label color per variant — the emphasis ladder, restricted to Button's set.
    variant: {
      ...pickVariants(controlTextColorVariant, [
        "filled",
        "light",
        "outline",
        "subtle",
        "default",
        "white",
        "transparent",
        "gradient",
      ]),
    },
    size: {
      ...controlFontVariant,
    },
  } as const,
});

/**
 * Side-section wrappers (`Button.Left` / `Button.Right`). They render their
 * content in a centered inline box so the `left`/`right` `styles` slots — and
 * the marker-slot `props` — have a real styled part to land on, mirroring
 * Alert's `.Icon`. Layout (gap, axis) still lives on the `ButtonFrame`.
 */
const ButtonSection = styled(Box, {
  name: "ButtonSection",
  context: ButtonContext,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
});

/**
 * Marker slots for `Button` (Pillar A, `docs/slot-system-plan.md`). Additive to
 * `leftSection`/`rightSection`: when present in `children` they drive placement.
 * `Label` is the default slot, so plain text children fold into it and still
 * render inside `ButtonText`. These markers render nothing themselves; the
 * `ButtonFrame` below owns layout, just as before.
 */
const ButtonSlots = defineSlots({
  Left: createSlot<"Left">("Left"),
  Label: createSlot<"Label">("Label"),
  Right: createSlot<"Right">("Right"),
});

/**
 * Named style slots (Pillar B / `internal/styles.ts`). Each key maps to the
 * props of the styled part it targets, so `styles={{ label: { color: "$red9" } }}`
 * is sugar for `<Button.Label color="$red9" />`. Canonical vocabulary:
 * `left` / `label` / `right` / `loader`.
 */
export interface ButtonStyles {
  /** Props for the leading section wrapper (`.Left`). */
  left?: GetProps<typeof ButtonSection>;
  /** Props for the label text (`.Label` / `.Text`). */
  label?: GetProps<typeof ButtonText>;
  /** Props for the trailing section wrapper (`.Right`). */
  right?: GetProps<typeof ButtonSection>;
  /** Props for the `Loader` rendered while `loading` (`.Loader`). */
  loader?: Partial<LoaderProps>;
}

const BUTTON_SLOT_KEYS = [
  "left",
  "label",
  "right",
  "loader",
] as const satisfies readonly (keyof ButtonStyles)[];

type ButtonFrameProps = Omit<GetProps<typeof ButtonFrame>, "disabled">;

export interface ButtonProps extends ButtonFrameProps {
  disabled?: boolean;
  loading?: boolean;
  /**
   * @deprecated Use `styles={{ loader: … }}` instead. Kept as a backward-compatible
   * alias; when both are set the explicit `loaderProps` wins (explicit beats sugar).
   */
  loaderProps?: Partial<LoaderProps>;
  leftSection?: React.ReactNode;
  rightSection?: React.ReactNode;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<ButtonStyles>;
  /**
   * Gradient fill for `variant="gradient"` (ignored otherwise). Two-color
   * shorthand `{ from, to, deg }` or multi-step `{ stops, deg }`; colors accept
   * `$colorN` ramp tokens or any CSS color. Defaults to the active theme ramp.
   */
  gradient?: GradientValue;
}

const ButtonComponent = ButtonFrame.styleable<ButtonProps>(function Button(props, ref) {
  const {
    children,
    loading,
    disabled,
    loaderProps,
    leftSection,
    rightSection,
    styles,
    nativeID,
    gradient,
    size = "md",
    variant = "filled",
    ...rest
  } = props;
  const isDisabled = !!(disabled || loading);
  const nativeIdProps = isWeb ? undefined : { nativeID };

  // Per-slot style sugar, distributed onto the parts below.
  const s = slotStyles<ButtonStyles>(styles, BUTTON_SLOT_KEYS, "Button");

  // Gradient fill (only when `variant="gradient"`): web paints a CSS
  // `backgroundImage`; native renders the `layer` (an SVG fill) behind content.
  const grad = useGradient(variant === "gradient" ? gradient : undefined);

  // Reduced-motion-aware press easing (neutralises the base dip when reduced).
  const press = usePressScale();

  // Normalize marker slots from `children`. Plain (non-marker) children fold
  // into `Label`, so `<Button>plain text</Button>` behaves exactly as before.
  const slots = ButtonSlots.collect(children, { defaultSlot: "Label", displayName: "Button" });

  // Precedence (slot-system-plan): marker slot → legacy prop → plain children.
  // `loading` still replaces the left visual, matching the prior behavior. The
  // marker slot's own props win over the `left`/`right` slot sugar (explicit
  // beats sugar); `loaderProps` likewise wins over the `loader` slot.
  const leftContent = slots.Left?.children ?? leftSection;
  const rightContent = slots.Right?.children ?? rightSection;
  const label = slots.Label?.children ?? slots.default;

  // Section content is wrapped in `ControlIconProvider` so a bare `@knitui/icons`
  // icon dropped into `leftSection`/`rightSection` (or the `.Left`/`.Right` slot)
  // auto-sizes and auto-colors to the button's `size`/`variant`. The `loading`
  // Loader replaces that icon, so it takes the SAME canonical in-control icon px
  // (`controlIconSize`) — reading with the icon's weight, not the full control
  // height. `loaderProps.size` still overrides this.
  const left = loading ? (
    <Loader
      size={controlIconSize(size)}
      type="oval"
      theme="gray"
      {...s.merge("loader", loaderProps)}
    />
  ) : leftContent != null ? (
    <ButtonSection {...s.merge("left", slots.Left?.props)}>
      <ControlIconProvider size={size} variant={variant}>
        {leftContent}
      </ControlIconProvider>
    </ButtonSection>
  ) : null;
  const right =
    rightContent != null ? (
      <ButtonSection {...s.merge("right", slots.Right?.props)}>
        <ControlIconProvider size={size} variant={variant}>
          {rightContent}
        </ControlIconProvider>
      </ButtonSection>
    ) : null;

  // The label's text wrapper carries the `label` slot props, so
  // `styles={{ label }}` reaches the `ButtonText` that `renderTextChild` emits.
  const LabelText = useSlotTextWrapper(ButtonText, s.get("label"));

  return (
    <ButtonFrame
      ref={ref}
      disabled={isDisabled}
      size={size}
      variant={variant}
      {...press}
      {...grad.frameProps}
      {...rest}
      aria-disabled={isDisabled || undefined}
      {...nativeIdProps}
      // Real focusable `<button>` on web so the `:focus-visible` outline fires.
      {...webButton()}
    >
      {grad.layer}
      {left}
      {renderTextChild(label, LabelText)}
      {right}
    </ButtonFrame>
  );
});

/**
 * `Button.Group` — visually attached row/column of buttons. Children sit flush
 * (`gap: 0`); `orientation` switches the main axis.
 */
const ButtonGroupFrame = styled(Box, {
  name: "ButtonGroup",
  role: "group",
  flexDirection: "row",
  alignSelf: "flex-start",
  gap: 0,
  variants: {
    orientation: {
      horizontal: { flexDirection: "row" },
      vertical: { flexDirection: "column" },
    },
  } as const,
  defaultVariants: { orientation: "horizontal" },
});

type EdgeStyle = {
  borderTopLeftRadius?: 0;
  borderTopRightRadius?: 0;
  borderBottomLeftRadius?: 0;
  borderBottomRightRadius?: 0;
  marginLeft?: number;
  marginTop?: number;
};

export interface ButtonGroupProps extends GetProps<typeof ButtonGroupFrame> {}

const ButtonGroup = ButtonGroupFrame.styleable<ButtonGroupProps>(function ButtonGroup(props, ref) {
  const { children, orientation = "horizontal", ...rest } = props;
  const items = React.Children.toArray(children).filter(Boolean);
  const horizontal = orientation === "horizontal";
  const lastIndex = items.length - 1;

  return (
    <ButtonGroupFrame ref={ref} orientation={orientation} {...rest}>
      {items.map((child, i) => {
        if (!React.isValidElement(child)) return child;
        const isFirst = i === 0;
        const isLast = i === lastIndex;
        const edge: EdgeStyle = horizontal
          ? {
              borderTopLeftRadius: isFirst ? undefined : 0,
              borderBottomLeftRadius: isFirst ? undefined : 0,
              borderTopRightRadius: isLast ? undefined : 0,
              borderBottomRightRadius: isLast ? undefined : 0,
              marginLeft: isFirst ? undefined : -1,
            }
          : {
              borderTopLeftRadius: isFirst ? undefined : 0,
              borderTopRightRadius: isFirst ? undefined : 0,
              borderBottomLeftRadius: isLast ? undefined : 0,
              borderBottomRightRadius: isLast ? undefined : 0,
              marginTop: isFirst ? undefined : -1,
            };
        return React.cloneElement(child, { key: i, ...edge });
      })}
    </ButtonGroupFrame>
  );
});

/**
 * `Button.GroupSection` — a non-interactive segment within a `Button.Group`.
 * Useful for decorative labels or addon sections that sit between buttons.
 * Gets the same edge-stripping as buttons from the group's child iteration.
 */
const ButtonGroupSection = styled(Box, {
  name: "ButtonGroupSection",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "$borderColor",
  backgroundColor: "$background",
  variants: {
    size: {
      ...controlVariant,
    },
    radius: {
      ...radiusVariant,
    },
  } as const,
  defaultVariants: { size: "md", radius: "md" },
});

export type ButtonGroupSectionProps = GetProps<typeof ButtonGroupSection>;

export const Button = withStaticProperties(ButtonComponent, {
  ...ButtonSlots.markers, // Left, Label, Right — single source of truth
  Text: ButtonText,
  // The `left`/`right` slots target this section wrapper; `loader` targets `Loader`.
  Section: ButtonSection,
  Loader,
  Frame: ButtonFrame,
  Group: ButtonGroup,
  GroupSection: ButtonGroupSection,
});

export type { ButtonSize, ButtonVariant };
