import { type GetProps, styled } from "@knitui/core";

import { Box } from "../Box";
import { alignVariant, justifyVariant } from "../internal/style-props";

/**
 * Vertical flex stack — mirrors Mantine's `Stack`. `gap`/`align`/`justify`
 * carry Mantine's names; `gap` takes a Tamagui space token (`"$md"`).
 */
export const Stack = styled(Box, {
  name: "Stack",
  flexDirection: "column",
  gap: "$md",
  variants: {
    align: alignVariant,
    justify: justifyVariant,
  } as const,
  defaultVariants: { align: "stretch", justify: "flex-start" },
});

export type StackProps = GetProps<typeof Stack>;
