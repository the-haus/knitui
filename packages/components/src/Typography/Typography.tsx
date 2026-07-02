import { type GetProps, styled } from "@knitui/core";

import { Box } from "../Box";

/**
 * `Typography` (Mantine's `TypographyStylesProvider`) — a content wrapper that
 * establishes consistent typographic defaults for the block content it holds.
 *
 * Mantine styles raw descendant DOM via a CSS module; cross-platform we cannot
 * inject descendant CSS, so the honest port is a **content column** that applies
 * a consistent vertical rhythm (gap between stacked block children) and forwards
 * every `Box` prop; text color is inherited from the active theme. Compose the
 * kit's own `Title` /
 * `Paragraph` / `List` / `Anchor` / `Blockquote` / `Code` inside it — they
 * already carry their own styling.
 *
 * Accent/color follows the kit convention: the Tamagui `theme` prop + palette
 * ramp, never a Mantine `color` prop.
 *
 * Documented divergence: Mantine's per-element descendant resets (heading/list/
 * table/code spacing applied to raw HTML) are NOT reproduced here.
 */
const TypographyFrame = styled(Box, {
  name: "Typography",
  flexDirection: "column",
  gap: "$md",
});

export interface TypographyProps extends GetProps<typeof TypographyFrame> {}

export const Typography = TypographyFrame.styleable<TypographyProps>(
  function Typography(props, ref) {
    return <TypographyFrame ref={ref} {...props} render="div" />;
  },
);
