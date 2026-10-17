import { Box, styled } from "@knitui/core";
import { focusRingStyle } from "../internal/style-props";

export const Tab = styled(Box, {
  name: "Tab",
  backgroundColor: "color1 hover:color2 press:color3",

  // Tactile press-dip
  scale: "press:0.98",
  ...focusRingStyle,
  variants: {
    variant: {
      default: {
        borderBottomColor: "transparent",
        backgroundColor: "hover:color2 press:color3",
      },
      outline: {
        backgroundColor: "transparent hover:color2",
        borderColor: "color7 hover:color8",
      },
    },
    disabled: {
      true: { opacity: 0.4, pointerEvents: "none", backgroundColor: "hover:transparent" },
    },
  } as const,
});

export const Spread = styled(Box, {
  hoverStyle: { backgroundColor: "color2" },
  ...someUnknown,
});

const plain = { backgroundColor: "color1 hover:color2" };
const fragment = { pressStyle: { scale: 0.97 } };

export function S() {
  return <Tab styles={{ root: { bg: "color1 hover:color2" } }} />;
}

interface P {
  hoverStyle?: object;
}
