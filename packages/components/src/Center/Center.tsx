import { type GetProps, styleable, styled } from "@knitui/core";

import { Box } from "../Box";
import { renderTextChild } from "../internal/render-text-child";
import { Text } from "../Text";

/**
 * Centers children on both axes — mirrors Mantine's `Center`. `inline` switches
 * to `inline-flex` so it sits inline with surrounding text.
 */
const CenterFrame = styled(Box, {
  displayName: "Center",
  alignItems: "center",
  justifyContent: "center",
  variants: {
    inline: {
      true: { display: "inline-flex" },
      false: { display: "flex" },
    },
  } as const,
  defaultVariants: { inline: false },
});

export interface CenterProps extends GetProps<typeof CenterFrame> {}

export const Center = styleable<CenterProps>(CenterFrame, function Center(props, ref) {
  const { children, ...rest } = props;

  return (
    <CenterFrame ref={ref} {...rest}>
      {renderTextChild(children, Text)}
    </CenterFrame>
  );
});
