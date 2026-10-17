import { Box, styled } from "@knitui/core";

const Fade = styled(Box, {
  transition: { preset: "quick", properties: "opacity, transform" },
});

export function T() {
  return (
    <>
      <Box transition={{ preset: "quick", opacity: "lazy" }} />
      <Box transition="bouncy" />
      <Box transition={{ preset: "bouncy", properties: "opacity" }} />
      <Box transition={{ preset: "ease-out", duration: 250, properties: "transform" }} />
      <Box transition="none" />
      <Box transition="none" />
      <Box transition="fast" animateOnly={keys} />
      <Box transition={{ preset: "quick", opacity: "lazy", properties: "opacity" }} />
    </>
  );
}

const recipe = { transition: ["fast", { duration: 300 }], animateOnly: OPACITY };
