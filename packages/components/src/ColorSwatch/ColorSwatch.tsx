import * as React from "react";

import { type GetProps, styled, withStaticProperties } from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { radiusVariant, type SizeKey, squareSizeVariantFallthrough } from "../internal/style-props";
import { slotStyles, type SlotStyles } from "../internal/styles";

export type ColorSwatchSize = SizeKey;

const SwatchFrame = styled(Box, {
  name: "ColorSwatch",
  position: "relative",
  overflow: "hidden",
  alignItems: "center",
  justifyContent: "center",
  variants: {
    size: {
      ...squareSizeVariantFallthrough,
    },
    radius: radiusVariant,
    withShadow: {
      true: {
        boxShadow: "0px 1px 2px 0px $dropShadowColor",
      },
    },
  } as const,

  defaultVariants: { size: "md", withShadow: true },
});

const SwatchOverlay = styled(Box, {
  name: "ColorSwatchOverlay",
  position: "absolute",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  borderWidth: 1,
  borderColor: "$dropShadowColor",
  pointerEvents: "none",
});

/**
 * Named style slots (Pillar B / `internal/styles.ts`). The `Frame` is reached
 * directly via style props on the component, so only the inset ring needs a slot:
 * the `<ColorSwatch.Overlay>` is rendered internally (when `withShadow`), so it
 * isn't otherwise reachable. `styles={{ overlay: { borderColor: "$red9" } }}` is
 * sugar for the rendered overlay.
 */
export interface ColorSwatchStyles {
  /** Props for the inset ring overlay (`ColorSwatch.Overlay`). */
  overlay?: GetProps<typeof SwatchOverlay>;
}

const COLOR_SWATCH_SLOT_KEYS = ["overlay"] as const satisfies readonly (keyof ColorSwatchStyles)[];

type SwatchFrameProps = Omit<GetProps<typeof SwatchFrame>, "color" | "radius" | "size">;

export interface ColorSwatchProps extends SwatchFrameProps {
  /** Valid CSS color to display. */
  color: string;
  /** Width and height of the swatch. Standard keys resolve against the size scale. @default "md" */
  size?: ColorSwatchSize | number | (string & {});
  /** Key of `theme.radius` or any CSS border-radius value. @default 9999 (pill) */
  radius?: string | number;
  /** Adds inner shadow. @default true */
  withShadow?: boolean;
  /** Content rendered inside the swatch. */
  children?: React.ReactNode;
  /** Per-slot style sugar — props spread onto the matching styled part. */
  styles?: SlotStyles<ColorSwatchStyles>;
}

/**
 * `ColorSwatch` — displays a colored circle/square. Mirrors Mantine's
 * `ColorSwatch`. `color` is any valid CSS color string; `size` controls
 * width/height; `radius` the rounding (pill by default). A subtle inset ring
 * (Mantine's `shadowOverlay`) keeps the swatch edge visible even when `color`
 * matches the background. Forwards a ref for composition.
 *
 * Pillar B note: the styled `Frame` is reached directly via style props on the
 * component, so the only slot in `ColorSwatchStyles` is `overlay` — the inset ring
 * is rendered internally (when `withShadow`) and would otherwise be unreachable.
 */
const ColorSwatchBase = SwatchFrame.styleable<ColorSwatchProps>(function ColorSwatch(props, ref) {
  const { color, size = "md", radius = 9999, withShadow = true, styles, children, ...rest } = props;
  const resolvedRadius = typeof radius === "number" ? radius : undefined;
  const radiusStr = typeof radius === "string" ? radius : undefined;
  const s = slotStyles<ColorSwatchStyles>(styles, COLOR_SWATCH_SLOT_KEYS, "ColorSwatch");

  return (
    <SwatchFrame
      ref={ref}
      size={size}
      withShadow={withShadow}
      radius={radiusStr}
      borderRadius={resolvedRadius}
      backgroundColor={color as BoxProps["backgroundColor"]}
      {...rest}
    >
      {withShadow ? <SwatchOverlay aria-hidden {...s.get("overlay")} /> : null}
      {children}
    </SwatchFrame>
  );
});

export const ColorSwatch = withStaticProperties(ColorSwatchBase, {
  Frame: SwatchFrame,
  Overlay: SwatchOverlay,
});
