import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Spacer } from "./Spacer";

const SIZE_TOKENS = ["$xxs", "$xs", "$sm", "$md", "$lg", "$xl", "$xxl"] as const;

const meta = {
  title: "Layout/Spacer",
  component: Spacer,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Spacer is a fixed-size invisible element that reserves space between other elements. Set `w` for horizontal gaps and `h` for vertical gaps. `miw`/`mih` default to `w`/`h` so the space never collapses.",
      },
    },
  },
  args: {
    w: "$md",
    h: "$md",
  },
  argTypes: {
    w: {
      control: "select",
      options: SIZE_TOKENS,
      description: "Width of the spacer from the $size scale (also sets `miw` by default).",
    },
    h: {
      control: "select",
      options: SIZE_TOKENS,
      description: "Height of the spacer from the $size scale (also sets `mih` by default).",
    },
    miw: {
      control: "select",
      options: [undefined, ...SIZE_TOKENS],
      description: "Override the minimum width (defaults to `w`).",
    },
    mih: {
      control: "select",
      options: [undefined, ...SIZE_TOKENS],
      description: "Override the minimum height (defaults to `h`).",
    },
  },
} satisfies Meta<typeof Spacer>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Spacer>>;

/** The interactive playground — tweak w/h from the Controls panel to inspect the reserved area. */
export const Playground: Story = {
  render: (args) => (
    <Box flexDirection="row" alignItems="center">
      <Box backgroundColor="$blue8" padding="$sm">
        <Text color="$color">Block A</Text>
      </Box>
      <Spacer {...args} backgroundColor="$yellow4" />
      <Box backgroundColor="$blue8" padding="$sm">
        <Text color="$color">Block B</Text>
      </Box>
    </Box>
  ),
};

/** Horizontal spacer — reserves a fixed amount of space between two inline elements. */
export const Horizontal: Story = {
  render: () => (
    <Box flexDirection="row" alignItems="center">
      <Box backgroundColor="$blue8" padding="$sm" borderRadius="$sm">
        <Text color="$color">Left</Text>
      </Box>
      <Spacer w="$md" />
      <Box backgroundColor="$green8" padding="$sm" borderRadius="$sm">
        <Text color="$color">Right</Text>
      </Box>
    </Box>
  ),
};

/** Vertical spacer — reserves a fixed amount of vertical space between stacked elements. */
export const Vertical: Story = {
  render: () => (
    <Box flexDirection="column">
      <Box backgroundColor="$blue8" padding="$sm" borderRadius="$sm">
        <Text color="$color">Top</Text>
      </Box>
      <Spacer h="$md" />
      <Box backgroundColor="$green8" padding="$sm" borderRadius="$sm">
        <Text color="$color">Bottom</Text>
      </Box>
    </Box>
  ),
};

/** Multiple spacer sizes using Tamagui $size tokens — shows how spacing scales across a row. */
export const SpacerSizes: Story = {
  render: () => (
    <Box flexDirection="column" gap="$lg">
      {SIZE_TOKENS.map((size) => (
        <Box key={size} flexDirection="row" alignItems="center">
          <Box backgroundColor="$gray6" padding="$xs" borderRadius="$sm" width={80}>
            <Text fontSize="$sm">{`w=${size}`}</Text>
          </Box>
          <Spacer w={size} backgroundColor="$yellow4" h="$sm" />
          <Box backgroundColor="$gray6" padding="$xs" borderRadius="$sm">
            <Text fontSize="$sm">end</Text>
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

/** Flex-grow layout — Spacer with flex={1} expands to fill available space, pushing siblings apart. */
export const FlexGrow: Story = {
  render: () => (
    <Box
      flexDirection="row"
      alignItems="center"
      width={400}
      backgroundColor="$gray3"
      padding="$sm"
      borderRadius="$sm"
    >
      <Box backgroundColor="$blue8" padding="$sm" borderRadius="$sm">
        <Text color="$color">Logo</Text>
      </Box>
      <Spacer flex={1} />
      <Box flexDirection="row" gap="$sm">
        <Box backgroundColor="$gray6" padding="$sm" borderRadius="$sm">
          <Text>Nav 1</Text>
        </Box>
        <Box backgroundColor="$gray6" padding="$sm" borderRadius="$sm">
          <Text>Nav 2</Text>
        </Box>
      </Box>
    </Box>
  ),
};

/** Minimum size guarantee — the spacer resists collapsing even inside a flex container that tries to shrink it. */
export const MinimumSize: Story = {
  render: () => (
    <Box flexDirection="column" gap="$md">
      <Text fontSize="$sm" color="$color">
        Both spacers have miw=$xxl / mih=$xxl. Even inside a narrow parent they hold their minimum
        dimensions.
      </Text>
      <Box
        flexDirection="row"
        width={120}
        backgroundColor="$gray3"
        padding="$xs"
        borderRadius="$sm"
      >
        <Box backgroundColor="$blue8" padding="$xs" borderRadius="$sm">
          <Text color="$color" fontSize="$xs">
            A
          </Text>
        </Box>
        <Spacer w="$xxl" miw="$xxl" backgroundColor="$yellow4" h="$sm" />
        <Box backgroundColor="$green8" padding="$xs" borderRadius="$sm">
          <Text color="$color" fontSize="$xs">
            B
          </Text>
        </Box>
      </Box>
    </Box>
  ),
};
