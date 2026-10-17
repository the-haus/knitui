import { type GetProps, styled } from "@knitui/core";

import { Box } from "../Box";
import { radiusVariant } from "../internal/style-props";

/**
 * Paper — generic content surface with optional elevation and border. Mirrors
 * Mantine's `Paper`. `shadow` (xxs→xxl, inherited from `Box`) controls elevation, `radius` the corner
 * rounding, `withBorder` shows the outline. No border or shadow by default.
 *
 * A plain `styled()` export (flattenable), NOT a `styleable()` wrapper: the wrapper's render
 * function did nothing but `<PaperFrame ref {...props} />`, so every `<Paper>`
 * paid a whole extra component layer (and its own render pass) to add exactly
 * zero props.
 * `GetProps` gives the identical public prop shape either way.
 */
export const Paper = styled(Box, {
  displayName: "Paper",
  backgroundColor: "background",

  variants: {
    radius: radiusVariant,
    withBorder: {
      true: { borderWidth: 1, borderColor: "borderColor" },
    },
  } as const,

  defaultVariants: { radius: "md" },
});

export type PaperProps = GetProps<typeof Paper>;
