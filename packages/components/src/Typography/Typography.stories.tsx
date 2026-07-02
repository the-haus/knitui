import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Typography } from "./Typography";

const meta = {
  title: "Typography/Typography",
  component: Typography,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          '`Typography` is a content-column wrapper that establishes a consistent vertical rhythm between stacked block children via `gap="$md"`. It forwards every `Box` prop and inherits text color from the active theme. Compose the kit\'s own `Title`, `Paragraph`, `List`, `Anchor`, `Blockquote`, and `Code` components inside it — they already carry their own styling.',
      },
    },
  },
  args: {
    children: <Text>Example content inside Typography.</Text>,
  },
  argTypes: {
    gap: {
      control: "select",
      options: ["$xs", "$sm", "$md", "$lg", "$xl"],
      description: "Vertical gap between stacked block children.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Active theme accent — inherited by descendant text.",
    },
    children: { control: false },
  },
} satisfies Meta<typeof Typography>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Typography>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Renders a single block child; the container establishes the content column. */
export const SingleBlock: Story = {
  render: (args) => (
    <Typography {...args} style={{ maxWidth: 480 }}>
      <Text>
        This is a single paragraph of body text inside a Typography container. The wrapper provides
        a consistent column layout for its content.
      </Text>
    </Typography>
  ),
};

/** Multiple stacked children receive automatic vertical rhythm via gap. */
export const MultipleBlocks: Story = {
  render: (args) => (
    <Typography {...args} style={{ maxWidth: 480 }}>
      <Text fontSize="$xl" fontWeight="700">
        Article heading
      </Text>
      <Text>
        First paragraph. Typography wraps any number of block children and spaces them evenly with a
        consistent vertical gap.
      </Text>
      <Text>
        Second paragraph. Each child is an independent block — no manual margin needed between them.
      </Text>
      <Text>Third paragraph. The rhythm holds regardless of child count.</Text>
    </Typography>
  ),
};

/** Demonstrates that the gap token can be overridden to tighten or loosen rhythm. */
export const CustomGap: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {(["$xs", "$sm", "$md", "$lg", "$xl"] as const).map((gap) => (
        <Box key={gap} style={{ width: 200 }}>
          <Text fontSize="$sm" color="$colorSubtitle" marginBottom="$xs">
            gap={gap}
          </Text>
          <Typography gap={gap}>
            <Text>Block one</Text>
            <Text>Block two</Text>
            <Text>Block three</Text>
          </Typography>
        </Box>
      ))}
    </Box>
  ),
};

/** Mixed content types — headings, body text, and inline emphasis in one column. */
export const RichContent: Story = {
  render: (args) => (
    <Typography {...args} style={{ maxWidth: 520 }}>
      <Text fontSize="$xxl" fontWeight="800">
        ⭐ Welcome to the docs
      </Text>
      <Text>
        Typography is a layout primitive, not a style applier. Pair it with the kit's semantic
        components for headings, lists, code blocks, and anchors.
      </Text>
      <Text fontSize="$xl" fontWeight="700">
        Getting started
      </Text>
      <Text>
        Wrap any block-level content with <Text>{"<Typography>"}</Text> and the vertical rhythm is
        handled automatically.
      </Text>
    </Typography>
  ),
};

/** The color of descendant text follows the active Tamagui theme accent. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="flex-start">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <Typography key={theme} {...args} theme={theme} style={{ width: 140 }}>
          <Text fontWeight="700" textTransform="capitalize">
            {theme}
          </Text>
          <Text fontSize="$sm">Theme accent flows to all descendants automatically.</Text>
        </Typography>
      ))}
    </Box>
  ),
};
