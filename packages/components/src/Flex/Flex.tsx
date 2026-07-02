import { type GetProps, styled } from "@knitui/core";

import { Box } from "../Box";
import {
  alignVariant,
  type FlexDirection,
  justifyVariant,
  wrapVariant,
} from "../internal/style-props";

/**
 * Flexbox layout primitive — mirrors Mantine's `Flex`. Carries Mantine's named
 * flex props (`align`, `justify`, `wrap`, `direction`). `align`/`justify`/`wrap`
 * map onto Tamagui style props as variants; `direction` is handled in the
 * styleable wrapper below (Tamagui reserves the `direction` prop for CSS
 * writing-direction, so it cannot be a same-named variant). `gap`/`rowGap`/
 * `columnGap` are inherited Box style props and pass straight through.
 * Color/theme is inherited from Box — there is no Mantine `color` prop.
 */
const FlexFrame = styled(Box, {
  name: "Flex",
  display: "flex",
  flexDirection: "row",
  variants: {
    align: alignVariant,
    justify: justifyVariant,
    wrap: wrapVariant,
  } as const,
});

export interface FlexProps extends Omit<GetProps<typeof FlexFrame>, "direction"> {
  /** Flex main-axis direction (Mantine's `direction`). Maps to `flexDirection`. */
  direction?: FlexDirection;
}

export const Flex = FlexFrame.styleable<FlexProps>(function Flex(props, ref) {
  const { direction, ...rest } = props;
  // Only map `direction` onto `flexDirection` when it's actually provided —
  // passing `flexDirection={undefined}` would clobber the frame's `row` base
  // back to the platform default (`column` on native). A raw `flexDirection` in
  // `rest` still wins, preserving the prior precedence.
  return <FlexFrame ref={ref} {...(direction ? { flexDirection: direction } : null)} {...rest} />;
});
