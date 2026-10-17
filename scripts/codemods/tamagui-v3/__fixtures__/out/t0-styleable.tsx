import { type GetProps, styled, styleable } from "@knitui/core";
import { Box } from "@knitui/core";

const KbdFrame = styled(Box, { name: "Kbd", p: "xs" });

export const Kbd = styleable<GetProps<typeof KbdFrame>>(KbdFrame, function Kbd(props, ref) {
  return <KbdFrame ref={ref} {...props} />;
});

export const Memo = styleable(KbdFrame, (props, ref) => <KbdFrame ref={ref} {...props} />, {
  staticConfig: { memo: false },
});

export const Chained = styleable(styled(Box, { name: "C" }), (props, ref) => (
  <Box ref={ref} {...props} />
));
