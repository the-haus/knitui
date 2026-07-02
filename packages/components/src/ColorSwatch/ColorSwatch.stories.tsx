import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { ColorSwatch, type ColorSwatchSize } from "./ColorSwatch";

const COLORS = [
  "#e03131",
  "#f76707",
  "#f59f00",
  "#2f9e44",
  "#1971c2",
  "#7048e8",
  "#c2255c",
] as const;

const SIZES: ColorSwatchSize[] = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

const RADII = [0, "xs", "sm", "md", "lg", "xxl", 9999] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Display/ColorSwatch",
  component: ColorSwatch,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ColorSwatch displays a solid color circle or square. `color` accepts any valid CSS color string. `size` controls width and height with token keys, numeric pixels, or a CSS string. `radius` controls the rounding (defaults to pill). An inset shadow overlay keeps the swatch edge visible against matching backgrounds.",
      },
    },
  },
  args: {
    color: "#1971c2",
    size: "md",
    withShadow: true,
  },
  argTypes: {
    color: {
      control: "color",
      description: "Any valid CSS color string to display.",
    },
    size: {
      control: "select",
      options: SIZES,
      description:
        "Width and height of the swatch. Standard keys resolve against the size scale; numbers and CSS strings are also supported.",
    },
    radius: {
      control: "select",
      options: RADII,
      description: "Border radius token or number; 9999 produces a pill/circle, 0 a square.",
    },
    withShadow: {
      control: "boolean",
      description: "Adds an inset shadow overlay to define the swatch edge.",
    },
    children: { control: false },
  },
} satisfies Meta<typeof ColorSwatch>;

export default meta;

type Story = StoryObj<ComponentProps<typeof ColorSwatch>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Multiple color swatches side by side — the most common use-case. */
export const Colors: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {COLORS.map((color) => (
        <ColorSwatch key={color} {...args} color={color} />
      ))}
    </Box>
  ),
};

/** Full seven-step token size scale. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <ColorSwatch key={size} {...args} size={size} />
      ))}
    </Box>
  ),
};

/** Border radius from square (0) to fully rounded pill (9999). */
export const Radii: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {RADII.map((radius) => (
        <ColorSwatch key={radius} {...args} radius={radius} />
      ))}
    </Box>
  ),
};

/**
 * The inherited `shadow` elevation ladder, from `xs` to `xl` — distinct from the
 * `withShadow` inset edge-ring; this drops a real elevation shadow under the swatch.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <ColorSwatch key={shadow} {...args} size="xl" shadow={shadow} />
      ))}
    </Box>
  ),
};

/** Shadow overlay disabled — the inset ring that outlines the swatch is removed. */
export const NoShadow: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {COLORS.slice(0, 4).map((color) => (
        <ColorSwatch key={color} {...args} color={color} withShadow={false} />
      ))}
    </Box>
  ),
};

/** Children rendered inside the swatch — useful for check marks or labels. */
export const WithChildren: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <ColorSwatch {...args} color="#2f9e44" size="lg">
        <Text fontSize="$md" color="$white">
          ✓
        </Text>
      </ColorSwatch>
      <ColorSwatch {...args} color="#1971c2" size="lg">
        <Text fontSize="$md" color="$white">
          ★
        </Text>
      </ColorSwatch>
      <ColorSwatch {...args} color="#e03131" size="lg">
        <Text fontSize="$md" color="$white">
          ✕
        </Text>
      </ColorSwatch>
    </Box>
  ),
};

/** A palette strip — large swatches at square radius to act as color cells. */
export const PaletteStrip: Story = {
  render: (args) => (
    <Box flexDirection="row" gap="$xs" alignItems="center">
      {COLORS.map((color) => (
        <ColorSwatch key={color} {...args} color={color} size="md" radius="sm" />
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the inset ring `overlay`. */
export const Styles: Story = {
  args: {
    color: "#1971c2",
    size: "xxl",
    withShadow: true,
    styles: {
      overlay: { borderColor: "$red9", borderWidth: 3 },
    },
  },
};
