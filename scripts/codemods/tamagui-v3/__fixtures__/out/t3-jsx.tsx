import { Box, Text } from "@knitui/core";

export function A({ active, color }: { active: boolean; color: string }) {
  return (
    <>
      <Box bg="color2 hover:color3 press:color4" />
      <Box backgroundColor="hover:color3" opacity="hover:0.8" />
      <Box backgroundColor={{ default: color, hover: "color3" }} />
      <Box backgroundColor={{ hover: active ? "color5" : "color4" }} />
      <Box opacity="1 press:0.7" scale="press:0.97" y="press:2px" />
      <Box opacity="enter:0 exit:0" y="enter:-10px" rotate="enter:45deg" />
      <Box bg="rgba(0,0,0,0.5) hover:rgba(0,0,0,0.7)" />
      <Box
        outlineWidth="focus-visible:2px"
        outlineStyle="focus-visible:solid"
        outlineColor="focus-visible:blue8"
      />
      <Box w="100px hover:120px" lineHeight={{ hover: 20 }} />
      <Box hoverStyle={cond ? { bg: "a" } : undefined} />
      <Box enterStyle={motion.enterStyle} />
      <Box bg="color1" {...rest} hoverStyle={{ bg: "color3" }} />
      <Box hoverStyle={{ bg: "color3" }} {...rest} />
      <Box {...rest} bg="color1" opacity="disabled:0.5" borderColor="focus:blue8" />
      <Box hoverStyle={{ rotateX: "10deg" }} />
      <Box hoverStyle={{ boxShadow: "0 0 0 2px $blue8" }} />
      <Text c="color11" textDecorationLine="hover:underline" />
    </>
  );
}
