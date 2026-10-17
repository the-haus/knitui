import { Box, Text } from "@knitui/core";

export function A({ active, color }: { active: boolean; color: string }) {
  return (
    <>
      <Box bg="$color2" hoverStyle={{ bg: "$color3" }} pressStyle={{ bg: "$color4" }} />
      <Box hoverStyle={{ backgroundColor: "$color3", opacity: 0.8 }} />
      <Box backgroundColor={color} hoverStyle={{ bg: "$color3" }} />
      <Box hoverStyle={{ backgroundColor: active ? "$color5" : "$color4" }} />
      <Box opacity={1} pressStyle={{ opacity: 0.7, scale: 0.97, y: 2 }} />
      <Box enterStyle={{ opacity: 0, y: -10, rotate: 45 }} exitStyle={{ opacity: 0 }} />
      <Box bg="rgba(0, 0, 0, 0.5)" hoverStyle={{ bg: "rgba(0, 0, 0, 0.7)" }} />
      <Box focusVisibleStyle={{ outlineWidth: 2, outlineStyle: "solid", outlineColor: "$blue8" }} />
      <Box w={100} hoverStyle={{ w: 120, lineHeight: 20 }} />
      <Box hoverStyle={cond ? { bg: "$a" } : undefined} />
      <Box enterStyle={motion.enterStyle} />
      <Box bg="$color1" {...rest} hoverStyle={{ bg: "$color3" }} />
      <Box hoverStyle={{ bg: "$color3" }} {...rest} />
      <Box {...rest} bg="$color1" disabledStyle={{ opacity: 0.5 }} focusStyle={{ borderColor: "$blue8" }} />
      <Box hoverStyle={{ rotateX: "10deg" }} />
      <Box hoverStyle={{ boxShadow: "0 0 0 2px $blue8" }} />
      <Text c="$color11" hoverStyle={{ textDecorationLine: "underline" }} />
    </>
  );
}
