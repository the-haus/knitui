// Template: a cross-platform control that plugs into every kit system.
// Replace `Widget`/`widget` with your component name. Delete the systems you don't need
// (gradient, marker slots), but KEEP: styled(Box) frame, shared variant ladders,
// SlotStyles, focus contract (focusRingStyle + webButton), and DEFAULT_SIZE.
//
// Rename this file to <Name>.tsx. Imports come from @knitui/core, never @tamagui/core.

import type { ReactNode } from "react";
import {
  createStyledContext,
  type GetProps,
  isWeb,
  styled,
  withStaticProperties,
} from "@knitui/core";

import { Box } from "../Box";
import { Text } from "../Text";
import {
  controlColorVariant, // interactive fill + hover/press (drop for a static surface → surfaceColorVariant)
  controlFontVariant, // label font size per control size
  controlVariant, // height + horizontal padding per control size
  focusRingStyle, // Layer 1 of the focus contract
  pressScaleStyle, // tactile press dip
  radiusVariant,
  webButton, // Layer 2 of the focus contract (real <button> on web)
  webCursor,
} from "../internal/style-props";
import { type GradientValue, useGradient } from "../internal/gradient";
import { type SlotStyles, slotStyles } from "../internal/styles";
import { useSlotTextWrapper } from "../internal/use-slot-text-wrapper";
import { renderTextChild } from "../internal/render-text-child";

// ---- shared context so styled sub-parts inherit size/variant --------------
const WidgetContext = createStyledContext<{ size: string; variant: string }>({
  size: "md",
  variant: "filled",
});

// ---- the host frame -------------------------------------------------------
const WidgetFrame = styled(Box, {
  name: "Widget",
  context: WidgetContext,
  role: "button",
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  ...webCursor("pointer"),
  ...pressScaleStyle,
  ...focusRingStyle,
  variants: {
    variant: { ...controlColorVariant },
    size: { ...controlVariant },
    radius: { ...radiusVariant },
    disabled: { true: { opacity: 0.6, pointerEvents: "none" } },
  } as const,
  defaultVariants: { variant: "filled", size: "md", radius: "md" },
});

// ---- styled label part (inherits context) ---------------------------------
const WidgetText = styled(Text, {
  name: "WidgetText",
  context: WidgetContext,
  variants: {
    size: { ...controlFontVariant },
  } as const,
});

// ---- per-slot styles map (Pillar B) ---------------------------------------
export interface WidgetStyles {
  label?: GetProps<typeof WidgetText>;
}
const WIDGET_SLOT_KEYS = ["label"] as const satisfies readonly (keyof WidgetStyles)[];

// ---- public props ---------------------------------------------------------
type WidgetFrameProps = Omit<GetProps<typeof WidgetFrame>, "disabled">;
export type WidgetSize = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";
export type WidgetVariant = "filled" | "light" | "outline" | "subtle" | "default" | "gradient";

export interface WidgetProps extends WidgetFrameProps {
  disabled?: boolean;
  leftSection?: ReactNode;
  rightSection?: ReactNode;
  styles?: SlotStyles<WidgetStyles>;
  gradient?: GradientValue; // only honored when variant="gradient"
}

// ---- implementation -------------------------------------------------------
const WidgetComponent = WidgetFrame.styleable<WidgetProps>(function Widget(props, ref) {
  const {
    children,
    disabled,
    leftSection,
    rightSection,
    styles,
    gradient,
    size = "md",
    variant = "filled",
    nativeID,
    ...rest
  } = props;

  const s = slotStyles<WidgetStyles>(styles, WIDGET_SLOT_KEYS, "Widget");
  const grad = useGradient(variant === "gradient" ? gradient : undefined);
  const LabelText = useSlotTextWrapper(WidgetText, s.get("label"));
  const nativeIdProps = isWeb ? undefined : { nativeID };

  return (
    <WidgetFrame
      ref={ref}
      size={size}
      variant={variant}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      {...grad.frameProps}
      {...rest}
      {...nativeIdProps}
      {...webButton()}
    >
      {grad.layer}
      {leftSection}
      {renderTextChild(children, LabelText)}
      {rightSection}
    </WidgetFrame>
  );
});

// ---- compound assembly ----------------------------------------------------
export const Widget = withStaticProperties(WidgetComponent, {
  Text: WidgetText,
  Frame: WidgetFrame, // raw frame escape hatch
});
