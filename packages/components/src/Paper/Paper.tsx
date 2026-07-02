import { type GetProps, styled } from "@knitui/core";

import { Box } from "../Box";
import { radiusVariant, shadowVariant } from "../internal/style-props";

/**
 * Paper — generic content surface with optional elevation and border. Mirrors
 * Mantine's `Paper`. `shadow` (xs→xl) controls elevation, `radius` the corner
 * rounding, `withBorder` shows the outline. No border or shadow by default.
 */
const PaperFrame = styled(Box, {
  name: "Paper",
  backgroundColor: "$background",

  variants: {
    shadow: shadowVariant,
    radius: radiusVariant,
    withBorder: {
      true: { borderWidth: 1, borderColor: "$borderColor" },
    },
  } as const,

  defaultVariants: { radius: "md" },
});

export type PaperProps = GetProps<typeof PaperFrame>;

export const Paper = PaperFrame.styleable<PaperProps>(function Paper(props, ref) {
  return <PaperFrame ref={ref} {...props} />;
});
