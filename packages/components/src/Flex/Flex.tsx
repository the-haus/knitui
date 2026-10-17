import { type GetProps, styled } from "@knitui/core";

import { Box } from "../Box";
import {
  alignVariant,
  type FlexDirection,
  justifyVariant,
  passthroughVariant,
  wrapVariant,
} from "../internal/style-props";

/**
 * Mantine's `direction` → `flexDirection`. Built at module scope (an inline
 * generic builder call inside `styled()` defeats variant inference).
 *
 * `direction` is also a (writing-direction) style key, but v3 dispatches a key
 * that a component declares in `variants` to the variant BEFORE the host-style
 * path, so the variant owns the name here. RTL writing direction stays reachable
 * through the `theme`/`dir` route, which no Flex consumer used.
 */
const directionVariant = passthroughVariant<FlexDirection>("flexDirection");

/**
 * Flexbox layout primitive — mirrors Mantine's `Flex`. Carries Mantine's named
 * flex props (`align`, `justify`, `wrap`, `direction`) as variants over Box style
 * props, so it is a plain `styled()` component the compiler can flatten.
 * `gap`/`rowGap`/`columnGap` are inherited Box style props and pass straight
 * through. A raw `flexDirection` call-site prop still beats `direction`
 * (call-site style props outrank variants). Color/theme is inherited from Box —
 * there is no Mantine `color` prop.
 */
export const Flex = styled(Box, {
  displayName: "Flex",
  display: "flex",
  // Explicit on every platform: RN/Yoga defaults to `column`.
  flexDirection: "row",
  variants: {
    align: alignVariant,
    justify: justifyVariant,
    wrap: wrapVariant,
    /** Flex main-axis direction (Mantine's `direction`). Maps to `flexDirection`. */
    direction: directionVariant,
  } as const,
});

export type FlexProps = GetProps<typeof Flex>;
