import * as React from "react";

import { IconCheck } from "@knitui/icons/IconCheck";
import { IconMinus } from "@knitui/icons/IconMinus";

import { controlIconSize } from "../internal/control-icon-size";
import { type SizeKey } from "../internal/style-props";
import { useIconColor } from "../internal/use-icon-color";
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
  // `useIconColor` instead of `useTheme()` + `resolveThemeColor`: on web the token
  // → `var(--token)` mapping is a pure string transform, so the glyph needs no
  // theme subscription at all (one per checkbox, plus the dep-less `useEffect`
  // `useThemeWithState` fires after every render). Native still reads the theme,
  // where `react-native-svg` needs a concrete colour. See `use-icon-color.ts`.
  const resolvedColor = useIconColor(typeof color === "string" ? color : "$color1");
  const iconSize = controlIconSize(size);

  const Icon = indeterminate ? IconMinus : IconCheck;

  // `...rest` is the `icon` slot passthrough (testID, aria, layout); icons accept
  // arbitrary props, so the contract carries through to the rendered glyph.
  return <Icon size={iconSize} color={resolvedColor} stroke={3} {...rest} />;
}
