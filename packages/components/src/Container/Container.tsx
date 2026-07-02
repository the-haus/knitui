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
const ContainerFrame = styled(Box, {
  name: "Container",
  width: "100%",
  marginHorizontal: "auto",
  paddingHorizontal: "$md",
  variants: {
    size: {
      ...containerSizeVariant,
    },
    /** Span the full parent width; wins over `size`'s max-width. */
    fluid: {
      true: { maxWidth: "100%" },
    },
  } as const,
  defaultVariants: { size: "md" },
});

export type ContainerProps = GetProps<typeof ContainerFrame>;

export const Container = ContainerFrame.styleable<ContainerProps>(function Container(props, ref) {
  return <ContainerFrame ref={ref} {...props} />;
});
