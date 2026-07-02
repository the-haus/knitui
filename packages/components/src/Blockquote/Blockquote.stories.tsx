import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Blockquote } from "./Blockquote";

const RADII = ["xs", "sm", "md", "lg", "xl", "none", "full"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const SAMPLE_QUOTE =
  "The only way to do great work is to love what you do. If you haven't found it yet, keep looking. Don't settle.";

const meta = {
  title: "Typography/Blockquote",
  component: Blockquote,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Blockquote renders a styled quotation block with a solid accent border on the inline-start edge, an optional icon badge floated over the top-left corner, and an optional `cite` attribution line. Accent color comes from the active theme ramp; recolor via the `theme` prop. `radius` rounds the inline-end corners.",
      },
    },
  },
  args: {
    children: SAMPLE_QUOTE,
    radius: "md",
    size: "md",
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls token-driven padding, body text, and cite spacing/type.",
    },
    radius: {
      control: "select",
      options: RADII,
      description: "Rounds the inline-end corners of the blockquote frame.",
    },
    iconSize: {
      control: "select",
      options: [undefined, ...SIZES],
      description:
        "Width and height of the icon badge from the `$size` scale. Numbers are also supported.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Active theme accent — recolors the border and icon via the palette ramp.",
    },
    icon: { control: false },
    cite: { control: "text" },
    children: { control: "text" },
  },
} satisfies Meta<typeof Blockquote>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Blockquote>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** A plain quote with no icon or attribution. */
export const Default: Story = {
  args: {
    children: SAMPLE_QUOTE,
  },
};

/** A string `cite` prop renders a dimmed attribution line beneath the quote. */
export const WithCite: Story = {
  args: {
    children: SAMPLE_QUOTE,
    cite: "Steve Jobs, Stanford Commencement 2005",
  },
};

/** An icon node is rendered in a circular badge floated over the top-left corner. */
export const WithIcon: Story = {
  args: {
    children: SAMPLE_QUOTE,
    cite: "Unknown",
    icon: <Text fontSize={20}>❝</Text>,
  },
};

/** All seven token sizes drive padding, text, and cite spacing. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$lg">
      {SIZES.map((size) => (
        <Blockquote key={size} {...args} size={size} cite={`size="${size}"`}>
          {SAMPLE_QUOTE}
        </Blockquote>
      ))}
    </Box>
  ),
};

/**
 * Elevation via the shared `shadow` ladder — inherited from `Box`, so every
 * component accepts it; no shadow unless set.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$xl">
      {SHADOWS.map((shadow) => (
        <Blockquote key={shadow} {...args} shadow={shadow} cite={`shadow="${shadow}"`}>
          {SAMPLE_QUOTE}
        </Blockquote>
      ))}
    </Box>
  ),
};

/** Icon badge size can be adjusted; the badge repositions itself relative to its size. */
export const IconSizes: Story = {
  render: (args) => (
    <Box gap="$xl">
      {(["sm", "xl", "xxl", 72] as const).map((iconSize) => (
        <Blockquote
          key={iconSize}
          {...args}
          iconSize={iconSize}
          icon={<Text fontSize="$lg">⭐</Text>}
          cite={`iconSize=${iconSize}`}
        >
          {SAMPLE_QUOTE}
        </Blockquote>
      ))}
    </Box>
  ),
};

/** All radius values — only the inline-end corners are rounded; the bordered edge stays square. */
export const Radii: Story = {
  render: (args) => (
    <Box gap="$lg">
      {RADII.map((radius) => (
        <Blockquote key={radius} {...args} radius={radius} cite={`radius="${radius}"`}>
          {SAMPLE_QUOTE}
        </Blockquote>
      ))}
    </Box>
  ),
};

/** A non-string `cite` renders any React node as-is in place of the default cite text. */
export const CustomCiteNode: Story = {
  args: {
    children: SAMPLE_QUOTE,
    cite: (
      <Box flexDirection="row" alignItems="center" gap="$sm" marginTop="$md">
        <Text>⭐</Text>
        <Text fontSize="$sm" opacity={0.7}>
          Custom attribution node
        </Text>
      </Box>
    ),
  },
};

/** The accent color follows the active theme — same component, different hue. */
export const Themed: Story = {
  render: (args) => (
    <Box gap="$lg">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <Blockquote
          key={theme}
          {...args}
          theme={theme}
          icon={<Text fontSize={20}>❝</Text>}
          cite={`theme="${theme}"`}
        >
          {SAMPLE_QUOTE}
        </Blockquote>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `text` body and `cite` line. */
export const Styles: Story = {
  args: {
    children: SAMPLE_QUOTE,
    cite: "Steve Jobs, Stanford Commencement 2005",
    styles: {
      text: { color: "$blue11", fontWeight: "700" },
      cite: { color: "$red9" },
    },
  },
};
