import { Box, styled } from "@knitui/core";

const Fade = styled(Box, {
  transition: "quick",
  animateOnly: ["opacity", "transform"],
});

export function T() {
  return (
    <>
      <Box transition={["quick", { opacity: "lazy" }]} />
      <Box transition={["bouncy"]} />
      <Box transition="bouncy" animateOnly={["opacity"]} />
      <Box transition={["ease-out", { duration: 250 }]} animateOnly={["transform"]} />
      <Box transition="fast" animateOnly={[]} />
      <Box animateOnly={[]} />
      <Box transition="fast" animateOnly={keys} />
      <Box transition={["quick", { opacity: "lazy", transform: "fast" }]} animateOnly={["opacity"]} />
    </>
  );
}

const recipe = { transition: ["fast", { duration: 300 }], animateOnly: OPACITY };
