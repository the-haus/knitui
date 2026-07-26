import { type GetProps, styled } from "@knitui/core";

import { Box } from "../Box";
import { radiusVariant, shadowVariant } from "../internal/style-props";

/**
 * Paper — generic content surface with optional elevation and border. Mirrors
 * Mantine's `Paper`. `shadow` (xs→xl) controls elevation, `radius` the corner
 * rounding, `withBorder` shows the outline. No border or shadow by default.
 *
 * A plain `styled()` export, NOT a `.styleable()` wrapper: the wrapper's render
 * function did nothing but `<PaperFrame ref {...props} />`, so every `<Paper>`
 * paid a whole extra component layer (and its own render pass, and the `<Theme>`
 * layer `themeable` puts around a named styleable) to add exactly zero props.
 * `GetProps` gives the identical public prop shape either way.
 */
export const Paper = styled(Box, {
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

export type PaperProps = GetProps<typeof Paper>;
