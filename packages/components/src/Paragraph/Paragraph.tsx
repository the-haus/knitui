import { type GetProps, styled } from "@knitui/core";

import { Text } from "../Text";

/**
 * Body paragraph — `Text` rendered as a semantic `<p>` (Mantine's
 * `<Text component="p">`). Inherits all `Text` features.
 */
const ParagraphFrame = styled(Text, {
  name: "Paragraph",
});

export interface ParagraphProps extends GetProps<typeof ParagraphFrame> {}

export const Paragraph = ParagraphFrame.styleable<ParagraphProps>(function Paragraph(props, ref) {
  return <ParagraphFrame ref={ref} {...props} render="p" />;
});
