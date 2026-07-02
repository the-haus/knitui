import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Center } from "./Center";

const meta = {
  title: "Layout/Center",
  component: Center,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Center aligns its children on both the horizontal and vertical axes. It is a thin styled wrapper around `Box` that sets `alignItems` and `justifyContent` to `center`. The `inline` variant switches the display to `inline-flex` so it can sit inline with surrounding text.",
      },
    },
  },
  args: {
    inline: false,
  },
  argTypes: {
    inline: {
      control: "boolean",
      description: "When true the container uses `inline-flex` instead of `flex`.",
    },
    children: { control: false },
  },
} satisfies Meta<typeof Center>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Center>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  args: {
    children: <Text>Center</Text>,
    width: "$xxl",
    height: "$xxl",
    backgroundColor: "$color3",
    borderRadius: "$md",
  },
};

/** Default block centering — content is centered on both axes inside a fixed container. */
export const Default: Story = {
  render: (args) => (
    <Center {...args} width="$xxl" height="$xxl" backgroundColor="$color3" borderRadius="$md">
      <Text>Center</Text>
    </Center>
  ),
};

/** Inline variant — the container shrinks to content width and sits inline with surrounding text. */
export const Inline: Story = {
  render: (args) => (
    <Text>
      Before{" "}
      <Center {...args} inline padding="$xs" backgroundColor="$color3" borderRadius="$sm">
        <Text>inline</Text>
      </Center>{" "}
      after
    </Text>
  ),
};

/** Centering nested element children — any React node is centered correctly. */
export const NestedChildren: Story = {
  render: (args) => (
    <Center
      {...args}
      minWidth="$xxl"
      minHeight="$xxl"
      padding="$lg"
      backgroundColor="$color3"
      borderRadius="$md"
    >
      <Box gap="$xs" alignItems="center">
        <Text fontSize="$sm">⭐</Text>
        <Text fontWeight="bold">Title</Text>
        <Text color="$color10">Subtitle text</Text>
      </Box>
    </Center>
  ),
};

/** Multiple Center containers side by side — each cell centers its own content. */
export const MultipleContainers: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["$blue8", "$green8", "$red8", "$yellow8"] as const).map((color, i) => (
        <Center
          key={color}
          {...args}
          width="$xxl"
          height="$xxl"
          backgroundColor={color}
          borderRadius="$md"
        >
          <Text color="white" fontWeight="bold">
            {i + 1}
          </Text>
        </Center>
      ))}
    </Box>
  ),
};

/** Full-width centering pattern — stretch to the parent and center a card inside. */
export const FullWidth: Story = {
  render: (args) => (
    <Center {...args} width="100%" minHeight="$xxl" padding="$xl" backgroundColor="$color2">
      <Box
        padding="$lg"
        backgroundColor="$color1"
        borderRadius="$md"
        shadow="sm"
        alignItems="center"
        gap="$sm"
      >
        <Text fontSize="$sm">⭐</Text>
        <Text fontWeight="bold">Card title</Text>
        <Text color="$color10">Centered card content</Text>
      </Box>
    </Center>
  ),
};
