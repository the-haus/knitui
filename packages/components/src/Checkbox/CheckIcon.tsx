import * as React from "react";

import { useTheme } from "@knitui/core";
import { IconCheck, IconMinus } from "@knitui/icons";

import { controlIconSize } from "../internal/control-icon-size";
import { resolveThemeColor } from "../internal/resolve-theme-color";
import { type SizeKey } from "../internal/style-props";
import { type TextProps } from "../Text";

export type CheckboxIconSize = SizeKey;

/**
 * Extra style props (e.g. `testID`, layout overrides) accepted by the glyph and
 * spread onto its root element. The `icon` slot of `Checkbox` targets these, so
 * a slot value reaches the rendered glyph. `color`/`size`/`indeterminate` are
 * the glyph's own controls; `children` is owned by the glyph.
 */
export interface CheckboxIconProps extends Omit<TextProps, "color" | "children" | "size"> {
  /** Render the indeterminate (dash) glyph instead of the check mark. */
  indeterminate?: boolean;
  /** Glyph size key (the parent sizes this from the control `size`). */
  size?: CheckboxIconSize;
  /** Glyph colour — resolves from the active theme ramp by default. */
  color?: TextProps["color"];
}

/** A check / indeterminate icon component — overridable via `Checkbox.icon`. */
export type CheckboxIconComponent = React.ComponentType<CheckboxIconProps>;

/**
 * Default checkbox glyph. Renders an `@knitui/icons` `IconCheck` (checked) or
 * `IconMinus` (indeterminate). The `color` token (default `$color1`, which sits
 * on the filled box) is resolved to a concrete colour for `react-native-svg`,
 * and `size` is mapped from the control key to px via `controlIconSize`. A
 * slightly heavier stroke keeps the check crisp at small sizes.
 */
export function CheckboxIcon({
  indeterminate,
  size = "xs",
  color = "$color1",
  ...rest
}: CheckboxIconProps) {
  const theme = useTheme();
  const resolvedColor = resolveThemeColor(theme, typeof color === "string" ? color : "$color1");
  const iconSize = controlIconSize(size);

  const Icon = indeterminate ? IconMinus : IconCheck;

  // `...rest` is the `icon` slot passthrough (testID, aria, layout); icons accept
  // arbitrary props, so the contract carries through to the rendered glyph.
  return <Icon size={iconSize} color={resolvedColor} stroke={3} {...rest} />;
}
