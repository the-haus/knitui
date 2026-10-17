import { type GetProps, styled } from "@knitui/core";

import { Text } from "../Text";

/**
 * Highlighted inline text — mirrors Mantine's `Mark`. Renders a semantic
 * `<mark>` on web with a subtle tinted fill behind the text. The tint comes from
 * the theme ramp (`color5` fill, `color12` text) so `theme="yellow"` (or any
 * accent) recolors it — there is no Mantine `color` prop. Inherits the full
 * `Text` surface (`size`, `fw`, `truncate`, …).
 *
 * A plain `styled()` component (flattenable); `<mark>` is a static `render`
 * default.
 */
export const Mark = styled(Text, {
  displayName: "Mark",
  render: "mark",
  backgroundColor: "color5",
  color: "color12",
  paddingHorizontal: "xxs",
  borderRadius: "xs",
});

export type MarkProps = GetProps<typeof Mark>;
