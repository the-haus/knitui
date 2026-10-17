import { type GetProps, styled } from "@knitui/core";

import { Box } from "../Box";

/**
 * Fixed-size spacer — mirrors Mantine's `Space`. Set token-first `w`/`h` values
 * (`w="md"`, `h={24}`, `h="sm md:lg"`) to reserve room between elements;
 * `minWidth`/`minHeight` default to `w`/`h` so the space can't collapse inside a
 * shrinking flex parent. Hidden from assistive technology by default.
 *
 * A plain `styled()` component (flattenable): the min-size defaults are derived
 * from the sibling `width`/`height` props by a component resolver, which sits
 * above variants and BELOW call-site props, so an explicit `miw`/`mih` (or
 * `minWidth`/`minHeight`) still wins.
 */
export const Spacer = styled(Box, {
  displayName: "Spacer",
  "aria-hidden": true,
}).resolve((props) => ({
  minWidth: props.w ?? props.width,
  minHeight: props.h ?? props.height,
}));

export type SpacerProps = GetProps<typeof Spacer>;
