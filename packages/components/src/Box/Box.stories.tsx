import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "../Text";
import { Box } from "./index";

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Layout/Box",
  component: Box,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`Box` is the single base primitive the component kit composes from. It is a thin `styled()` over the Tamagui `View` exposed by `@knitui/core`, giving every Tamagui feature: token style props, theming, hover/press states, animations, and cross-platform output. All other components are built with `styled(Box, { ... })`.",
      },
    },
  },
  args: {
    padding: "$md",
    backgroundColor: "$background",
  },
  argTypes: {
    padding: {
      control: "select",
      options: ["$xs", "$sm", "$md", "$lg", "$xl"],
      description: "Inner spacing — maps to a Tamagui space token.",
    },
    margin: {
      control: "select",
      options: [undefined, "$xs", "$sm", "$md", "$lg", "$xl"],
      description: "Outer spacing — maps to a Tamagui space token.",
    },
    backgroundColor: {
      control: "text",
      description: "Background color — accepts a theme token or a raw color value.",
    },
    borderRadius: {
      control: "select",
      options: [undefined, "$xxs", "$xs", "$sm", "$md", "$lg", "$xl", "$xxl"],
      description: "Border radius token from the radius scale.",
    },
    opacity: {
      control: { type: "range", min: 0, max: 1, step: 0.05 },
      description: "Opacity from 0 (invisible) to 1 (fully opaque).",
    },
    flexDirection: {
      control: "select",
      options: ["column", "row", "row-reverse", "column-reverse"],
      description: "Flex axis direction.",
    },
  },
} satisfies Meta<typeof Box>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Box>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Box {...args}>
      <Text>Box content</Text>
    </Box>
  ),
};

/** Box as a flex row container — the foundation for horizontal layouts. */
export const FlexRow: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {["Alpha", "Beta", "Gamma", "Delta"].map((label) => (
        <Box key={label} padding="$sm" backgroundColor="$color4" borderRadius="$sm">
          <Text>{label}</Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Box as a flex column container — stack children vertically with a gap. */
export const FlexColumn: Story = {
  render: () => (
    <Box flexDirection="column" gap="$md">
      {["First", "Second", "Third"].map((label) => (
        <Box key={label} padding="$sm" backgroundColor="$color3" borderRadius="$sm">
          <Text>{label}</Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Spacing tokens applied as padding and margin — $xs through $xl. */
export const SpacingTokens: Story = {
  render: () => (
    <Box flexDirection="column" gap="$sm">
      {(["$xs", "$sm", "$md", "$lg", "$xl"] as const).map((token) => (
        <Box key={token} flexDirection="row" alignItems="center" gap="$sm">
          <Box width="$lg">
            <Text fontSize="$xs">{token}</Text>
          </Box>
          <Box padding={token} backgroundColor="$color5" borderRadius="$sm">
            <Text fontSize="$xs">padding {token}</Text>
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

/** Theme token for background and border — Box picks up the active theme palette. */
export const ThemedSurfaces: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["$color1", "$color3", "$color5", "$color7", "$color9"] as const).map((token) => (
        <Box
          key={token}
          padding="$md"
          backgroundColor={token}
          borderRadius="$md"
          width="$xxl"
          alignItems="center"
        >
          <Text fontSize="$xs">{token}</Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Nested Box elements — demonstrates natural composition and depth. */
export const Nested: Story = {
  render: () => (
    <Box padding="$lg" backgroundColor="$color2" borderRadius="$md">
      <Text fontWeight="bold">Outer</Text>
      <Box marginTop="$sm" padding="$md" backgroundColor="$color4" borderRadius="$sm">
        <Text fontWeight="bold">Middle</Text>
        <Box marginTop="$sm" padding="$sm" backgroundColor="$color6" borderRadius="$xs">
          <Text>Inner</Text>
        </Box>
      </Box>
    </Box>
  ),
};

/**
 * Elevation via the shared `shadow` ladder — Box is the source of the `shadow`
 * prop every other component inherits; no shadow unless set.
 */
export const Shadows: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Box
          key={shadow}
          shadow={shadow}
          padding="$md"
          backgroundColor="$color1"
          borderRadius="$md"
          width="$xxl"
          alignItems="center"
        >
          <Text fontSize="$xs">{shadow}</Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Reduced opacity — Box supports the `opacity` prop directly. */
export const Opacity: Story = {
  render: () => (
    <Box flexDirection="row" gap="$md" alignItems="center">
      {[1, 0.75, 0.5, 0.25].map((value) => (
        <Box
          key={value}
          opacity={value}
          padding="$md"
          backgroundColor="$color8"
          borderRadius="$sm"
          width="$xxl"
          alignItems="center"
        >
          <Text fontSize="$xs">{value}</Text>
        </Box>
      ))}
    </Box>
  ),
};
