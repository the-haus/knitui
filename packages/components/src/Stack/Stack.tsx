import { type GetProps, styled } from "@knitui/core";

import { Box } from "../Box";
import { alignVariant, justifyVariant } from "../internal/style-props";

/**
 * Vertical flex stack — mirrors Mantine's `Stack`. `gap`/`align`/`justify`
 * carry Mantine's names; `gap` takes a bare space token (`gap="md"`) or a number.
 */
export const Stack = styled(Box, {
  displayName: "Stack",
  flexDirection: "column",
  gap: "md",
  variants: {
    align: alignVariant,
    justify: justifyVariant,
  } as const,
  defaultVariants: { align: "stretch", justify: "flex-start" },
});

export type StackProps = GetProps<typeof Stack>;
