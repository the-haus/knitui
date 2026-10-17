import { type GetProps, styled } from "@knitui/core";
import { Box } from "@knitui/core";

const KbdFrame = styled(Box, { name: "Kbd", p: "$xs" });

export const Kbd = KbdFrame.styleable<GetProps<typeof KbdFrame>>(function Kbd(props, ref) {
  return <KbdFrame ref={ref} {...props} />;
});

export const Memo = KbdFrame.styleable(
  (props, ref) => <KbdFrame ref={ref} {...props} />,
  { staticConfig: { memo: false } },
);

export const Chained = styled(Box, { name: "C" }).styleable((props, ref) => <Box ref={ref} {...props} />);
