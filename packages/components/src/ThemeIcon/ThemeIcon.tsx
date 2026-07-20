import * as React from "react";

import { createStyledContext, type GetProps, styled, withStaticProperties } from "@knitui/core";

import { Box } from "../Box";
import { ControlIconProvider } from "../internal/ControlIconProvider";
import { type GradientValue, useGradient } from "../internal/gradient";
import {
  pickVariants,
  radiusVariant,
  shadowVariant,
  type SizeKey,
  squareSizeRoundedVariant,
  surfaceColorVariant,
} from "../internal/style-props";

type ThemeIconSize = SizeKey;
type ThemeIconVariant =
  "filled" | "light" | "outline" | "subtle" | "transparent" | "white" | "default" | "gradient";

const ThemeIconContext = createStyledContext<{
  size: ThemeIconSize;
  variant: ThemeIconVariant;
}>({
  size: "md",
  variant: "filled",
});

/**
 * Icon chip — the canonical themed square that holds an icon. Models
 * `ActionIcon`'s frame (square `size` metrics, `variant`-driven fill from the
 * shared `variant-colors` ladder, `radius` rounding, theme-driven palette ramp)
 * but is NOT interactive: no `role="button"`, no cursor, no hover/press states.
 * Use it to decorate lists, headings, or stats with a colored glyph; for a
 * pressable icon use `ActionIcon` instead. Accent comes from the `theme` prop,
 * never a `color` prop.
 */
const ThemeIconFrame = styled(Box, {
  name: "ThemeIcon",
  context: ThemeIconContext,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "center",
  borderWidth: 1,
  borderColor: "transparent",

  variants: {
    // Static fill from the shared `variant-colors` ladder — no hover/press, a
    // theme icon isn't interactive (mirrors Badge's static surface fill).
    variant: {
      ...pickVariants(surfaceColorVariant, [
        "filled",
        "light",
        "outline",
        "subtle",
        "transparent",
        "white",
        "default",
        "gradient",
      ]),
    },
    size: {
      ...squareSizeRoundedVariant,
    },
    radius: radiusVariant,
    shadow: shadowVariant,
  } as const,

  defaultVariants: { variant: "filled", size: "md" },
});

export interface ThemeIconProps extends GetProps<typeof ThemeIconFrame> {
  /** The icon to render. A bare `@knitui/icons` icon auto-sizes/colors to the chip. */
  children?: React.ReactNode;
  /**
   * Gradient fill for `variant="gradient"` (ignored otherwise). Two-color
   * shorthand `{ from, to, deg }` or multi-step `{ stops, deg }`; colors accept
   * `$colorN` ramp tokens or any CSS color. Defaults to the active theme ramp.
   */
  gradient?: GradientValue;
}

const ThemeIconComponent = ThemeIconFrame.styleable<ThemeIconProps>(function ThemeIcon(props, ref) {
  const { children, variant = "filled", size = "md", gradient, ...rest } = props;

  // Gradient fill (only when `variant="gradient"`): web paints a CSS
  // `backgroundImage`; native renders the `layer` (an SVG fill) behind the icon.
  const grad = useGradient(variant === "gradient" ? gradient : undefined);

  return (
    <ThemeIconFrame ref={ref} variant={variant} size={size} {...grad.frameProps} {...rest}>
      {grad.layer}
      {/* Publish icon context so a bare `@knitui/icons` icon auto-matches the chip. */}
      <ControlIconProvider size={size} variant={variant}>
        {children}
      </ControlIconProvider>
    </ThemeIconFrame>
  );
});

export const ThemeIcon = withStaticProperties(ThemeIconComponent, {
  Frame: ThemeIconFrame,
});

export type { ThemeIconSize, ThemeIconVariant };
