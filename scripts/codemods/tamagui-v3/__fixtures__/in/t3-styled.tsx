import { Box, styled } from "@knitui/core";
import { focusRingStyle } from "../internal/style-props";

export const Tab = styled(Box, {
  name: "Tab",
  backgroundColor: "$color1",
  hoverStyle: { backgroundColor: "$color2" },
  // Tactile press-dip
  pressStyle: { backgroundColor: "$color3", scale: 0.98 },
  ...focusRingStyle,
  variants: {
    variant: {
      default: {
        borderBottomColor: "transparent",
        hoverStyle: { backgroundColor: "$color2" },
        pressStyle: { backgroundColor: "$color3" },
      },
      outline: {
        backgroundColor: "transparent",
        borderColor: "$color7",
        hoverStyle: { backgroundColor: "$color2", borderColor: "$color8" },
      },
    },
    disabled: {
      true: { opacity: 0.4, pointerEvents: "none", hoverStyle: { backgroundColor: "transparent" } },
    },
  } as const,
});

export const Spread = styled(Box, {
  hoverStyle: { backgroundColor: "$color2" },
  ...someUnknown,
});

const plain = { backgroundColor: "$color1", hoverStyle: { backgroundColor: "$color2" } };
const fragment = { pressStyle: { scale: 0.97 } };

export function S() {
  return <Tab styles={{ root: { bg: "$color1", hoverStyle: { bg: "$color2" } } }} />;
}

interface P {
  hoverStyle?: object;
}
