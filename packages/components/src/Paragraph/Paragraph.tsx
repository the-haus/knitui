import { type GetProps, styled } from "@knitui/core";

import { Text } from "../Text";

/**
 * Body paragraph — `Text` rendered as a semantic `<p>` (Mantine's
 * `<Text component="p">`). Inherits all `Text` features.
 *
 * A plain `styled()` component (flattenable): the `<p>` host is a static
 * `render` default, so a caller can still pick another host (`render="div"`).
 */
export const Paragraph = styled(Text, {
  displayName: "Paragraph",
  render: "p",
});

export type ParagraphProps = GetProps<typeof Paragraph>;
