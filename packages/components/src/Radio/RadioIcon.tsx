import * as React from "react";

import { type SizeTokens } from "@knitui/core";

import { Box, type BoxProps } from "../Box";
import { type SizeKey } from "../internal/style-props";
import { type TextProps } from "../Text";

export type RadioIconSize = SizeKey;

/**
 * Extra style props (e.g. `testID`, layout overrides) accepted by the glyph and
 * spread onto its root `Box`. The `dot`/`icon` slots of `Radio` target these, so
 * a slot value reaches the rendered glyph. `color`/`size` are the glyph's own
 * controls.
 */
export interface RadioIconProps extends Omit<BoxProps, "color" | "size"> {
  /** Glyph size key (the parent sizes this from the control `size`). */
  size?: RadioIconSize;
  /** Glyph colour — resolves from the active theme ramp by default. */
  color?: TextProps["color"];
}

/** The inner radio glyph component — overridable via `Radio.icon`. */
export type RadioIconComponent = React.ComponentType<RadioIconProps>;

/**
 * Default radio glyph: a filled dot. Rendered from `Box` rather than an SVG so it
 * works on web AND native without an `react-native-svg` dependency — the same
 * approach as `CheckboxIcon`.
 */
const squareToken = (size: RadioIconSize): SizeTokens => `$${size}` as SizeTokens;

export function RadioIcon({ size = "xs", color = "$color1", ...rest }: RadioIconProps) {
  const boxToken = squareToken(size);

  return (
    <Box
      width={boxToken}
      height={boxToken}
      scale={0.5}
      borderRadius={999}
      backgroundColor={color}
      {...rest}
    />
  );
}
