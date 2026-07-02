import { type GetProps, styled, withStaticProperties } from "@knitui/core";

import { Box } from "../Box";

/**
 * Maintains a fixed width-to-height ratio for its content — mirrors Mantine's
 * `AspectRatio`. `ratio` is the width/height fraction (e.g. `16 / 9`); the box
 * fills the available cross-axis and derives the other dimension. Cross-platform:
 * Tamagui/RN support the `aspectRatio` style prop natively (no web-only CSS
 * variable). Child overflow is clipped. Color/theme is inherited from `Box` —
 * there is no Mantine `color` prop.
 *
 * `alignSelf: "stretch"` (rather than a hardcoded `width: "100%"`) lets the box
 * fill the parent's cross-axis regardless of flex direction: in a column it
 * spans the width and derives its height; in a row it spans the height and
 * derives its width. This is what makes it behave correctly inside a flex
 * container. Pass an explicit `width`/`height` or `flex` to override.
 */
const AspectRatioFrame = styled(Box, {
  name: "AspectRatio",
  alignSelf: "stretch",
  overflow: "hidden",
  // Square by default; the `ratio` variant overrides for any other fraction.
  aspectRatio: 1,

  variants: {
    /** Width / height fraction, e.g. `16 / 9`. @default 1 */
    ratio: {
      ":number": (val: number) => ({ aspectRatio: val }),
    },
  } as const,
});

export interface AspectRatioProps extends GetProps<typeof AspectRatioFrame> {}

const AspectRatioComponent = AspectRatioFrame.styleable<AspectRatioProps>(
  function AspectRatio(props, ref) {
    return <AspectRatioFrame ref={ref} {...props} />;
  },
);

export const AspectRatio = withStaticProperties(AspectRatioComponent, {
  Frame: AspectRatioFrame,
});
