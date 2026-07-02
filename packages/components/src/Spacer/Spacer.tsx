import { type GetProps, styled } from "@knitui/core";

import { Box, type BoxProps } from "../Box";

const SpacerFrame = styled(Box, {
  name: "Spacer",
});

type SpacerFrameProps = Omit<GetProps<typeof SpacerFrame>, "w" | "h" | "miw" | "mih">;

export interface SpacerProps extends SpacerFrameProps {
  w?: BoxProps["width"];
  h?: BoxProps["height"];
  miw?: BoxProps["minWidth"];
  mih?: BoxProps["minHeight"];
}

/**
 * Fixed-size spacer — mirrors Mantine's `Space`. Set token-first `w`/`h` values
 * to reserve room between elements; `minWidth`/`minHeight` default to `w`/`h`
 * so the space can't collapse.
 */
export const Spacer = SpacerFrame.styleable<SpacerProps>(function Spacer(props, ref) {
  const {
    w,
    h,
    miw,
    mih,
    width: widthProp,
    height: heightProp,
    minWidth: minWidthProp,
    minHeight: minHeightProp,
    "aria-hidden": ariaHidden = true,
    ...rest
  } = props;

  return (
    <SpacerFrame
      ref={ref}
      {...rest}
      aria-hidden={ariaHidden}
      width={widthProp ?? w}
      height={heightProp ?? h}
      minWidth={minWidthProp ?? miw ?? w}
      minHeight={minHeightProp ?? mih ?? h}
    />
  );
});
