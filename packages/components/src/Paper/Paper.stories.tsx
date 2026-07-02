import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Paper } from "./Paper";

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;
const RADII = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Layout/Paper",
  component: Paper,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Paper is a generic content surface built on `Box`. `shadow` (xs→xl) adds elevation, `radius` rounds the corners, and `withBorder` draws an outline. No border or shadow is shown by default.",
      },
    },
  },
  args: {
    shadow: undefined,
    radius: "md",
    withBorder: false,
    padding: "$md",
  },
  argTypes: {
    shadow: {
      control: "select",
      options: [undefined, ...SHADOWS],
      description: "Elevation level — maps to a box-shadow scale (xs→xl).",
    },
    radius: {
      control: "select",
      options: RADII,
      description: "Corner rounding — maps to the border-radius token scale.",
    },
    withBorder: {
      control: "boolean",
      description: "When true, renders a 1 px border using the $borderColor token.",
    },
  },
} satisfies Meta<typeof Paper>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Paper>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  args: {
    children: <Text>Paper surface</Text>,
    padding: "$lg",
    width: 280,
  },
};

/** All five shadow levels side by side to compare elevation. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Paper
          key={shadow}
          {...args}
          shadow={shadow}
          padding="$md"
          minWidth="$xxl"
          minHeight="$xxl"
        >
          <Text>{shadow}</Text>
        </Paper>
      ))}
    </Box>
  ),
};

/** All five radius values side by side, from sharp to fully rounded. */
export const Radii: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {RADII.map((radius) => (
        <Paper
          key={radius}
          {...args}
          radius={radius}
          withBorder
          padding="$md"
          minWidth="$xxl"
          minHeight="$xxl"
        >
          <Text>{radius}</Text>
        </Paper>
      ))}
    </Box>
  ),
};

/** Border variant — a 1 px outline using the active theme's $borderColor token. */
export const WithBorder: Story = {
  args: {
    withBorder: true,
    padding: "$lg",
    width: 280,
    children: <Text>Bordered surface</Text>,
  },
};

/** Shadow and border combined — useful for cards that need both depth and definition. */
export const ShadowAndBorder: Story = {
  args: {
    shadow: "md",
    withBorder: true,
    padding: "$lg",
    width: 280,
    children: <Text>Shadow + border</Text>,
  },
};

/** Paper used as a card layout with a title and body text. */
export const CardLayout: Story = {
  args: {
    shadow: "sm",
    withBorder: true,
    radius: "md",
    padding: "$lg",
    width: 320,
    children: (
      <Box gap="$sm">
        <Text fontWeight="700" fontSize="$md">
          Card title
        </Text>
        <Text fontSize="$sm" color="$colorSubtitle">
          This is a short description rendered inside a Paper surface acting as a card.
        </Text>
      </Box>
    ),
  },
};

/** Nesting two Paper surfaces to create a layered depth effect. */
export const Nested: Story = {
  render: (args) => (
    <Paper {...args} shadow="lg" padding="$xl" width={340}>
      <Box gap="$md">
        <Text fontWeight="700">Outer surface</Text>
        <Paper shadow="xs" withBorder padding="$md">
          <Text>Inner surface</Text>
        </Paper>
      </Box>
    </Paper>
  ),
};
