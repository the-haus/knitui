import { type GetProps, styled } from "@knitui/core";

import { Box } from "../Box";
import { containerSizeVariant, type SizeKey } from "../internal/style-props";

export type ContainerSize = SizeKey;

/**
 * Centered, max-width content wrapper — mirrors Mantine's `Container`. `size`
 * caps the max-width to a named breakpoint (or an arbitrary number / CSS value);
 * `fluid` makes it span the full parent width, ignoring `size`. The kit extends
 * Mantine's xs-xl caps to the full seven-step size API. Centering is
 * cross-platform via automatic horizontal margins. Color/theme is inherited from
 * Box — there is no Mantine `color` prop. (Mantine's web-only CSS-grid `strategy`
 * is out of scope; block centering is enough cross-platform.)
 */
export const Container = styled(Box, {
  displayName: "Container",
  width: "100%",
  marginHorizontal: "auto",
  paddingHorizontal: "md",
  variants: {
    size: containerSizeVariant,
    /** Span the full parent width; wins over `size`'s max-width. */
    fluid: styled.dynamic<boolean>(),
  } as const,
  defaultVariants: { size: "md" },
})
  // `fluid` must beat `size` regardless of prop order, so it lives one tier
  // above the variants (a component resolver) instead of in the variant body,
  // where the later-written prop would win. A call-site `maxWidth` still wins.
  .resolve((props) => ({ maxWidth: props.fluid ? "100%" : undefined }));

export type ContainerProps = GetProps<typeof Container>;
