import { Box, Button, styled } from "@knitui/core";

const A = styled(Box, {
  backgroundColor: "color1",
  bg: "color2",
  hoverStyle: { backgroundColor: "color3" },
});

const B = styled(Box, {
  opacity: "1 hover:0.9 press:0.8",
  ...webCursor("pointer"),
});

const C = styled(Box, {
  variants: {
    tone: {
      ghost: {
        x: "0 press:1px",
        rotate: "press:0deg",
        hoverStyle: { pressStyle: { opacity: 1 } },
      },
    },
  } as const,
});

export const D = () => (
  <>
    <Button color="blue9" hoverStyle={{ color: "blue10" }} />
    <Box backgroundColor="$color1 sm:$color2" hoverStyle={{ backgroundColor: c }} />
    <Box enterStyle={{ opacity: 0, transition: "fast" }} />
    <Box hoverStyle={{ ...extra, bg: "color3" }} />
    <Box hoverStyle={{ opacity: undefined }} />
    <Box hoverStyle={{ bg: "" }} />
  </>
);
