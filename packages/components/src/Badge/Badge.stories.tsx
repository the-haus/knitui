import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import type { GradientValue } from "../internal/gradient";
import { Text } from "../Text";
import { Badge } from "./Badge";

const GRADIENT_PRESETS = {
  Sunset: { from: "#f97316", to: "#ec4899", deg: 45 },
  Ocean: { from: "#0ea5e9", to: "#22d3ee", deg: 45 },
  Forest: { from: "#22c55e", to: "#15803d", deg: 45 },
  Grape: { from: "#8b5cf6", to: "#ec4899", deg: 45 },
  Spectrum: {
    stops: [
      { color: "#f97316", offset: 0 },
      { color: "#eab308", offset: 25 },
      { color: "#22c55e", offset: 50 },
      { color: "#0ea5e9", offset: 75 },
      { color: "#8b5cf6", offset: 100 },
    ],
    deg: 90,
  },
} satisfies Record<string, GradientValue>;

const VARIANTS = [
  "filled",
  "light",
  "outline",
  "dot",
  "transparent",
  "white",
  "default",
  "gradient",
] as const;

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Display/Badge",
  component: Badge,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Badge is a compact status label composed from `Box` + `Text`. Accent color comes from the active `theme` prop (palette ramp). `variant` picks the fill style, `size` sets the metrics, `radius` controls rounding (pill by default), `circle` makes a square-aspect badge for single glyphs, and `leftSection`/`rightSection` accept any adornment.",
      },
    },
  },
  args: {
    children: "Badge",
    variant: "light",
    size: "md",
    circle: false,
    fullWidth: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: VARIANTS,
      description: "Visual variant — how the theme color ramp is applied.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, horizontal padding and font size.",
    },
    radius: {
      control: "select",
      options: [undefined, "xs", "sm", "md", "lg", "xl", "full"],
      description: "Border radius override — defaults to pill (999).",
    },
    circle: {
      control: "boolean",
      description: "Square aspect-ratio — useful for single glyph badges.",
    },
    fullWidth: {
      control: "boolean",
      description: "Stretches the badge to the full width of its container.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Active theme accent — recolors the badge via the palette ramp.",
    },
    gradient: {
      control: "object",
      description: "Gradient fill for variant='gradient' — { from, to, deg } or { stops, deg }.",
    },
    children: { control: "text" },
    leftSection: { control: false },
    rightSection: { control: false },
  },
} satisfies Meta<typeof Badge>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Badge>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every visual variant side by side, at the default size. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {VARIANTS.map((variant) => (
        <Badge key={variant} {...args} variant={variant}>
          {variant}
        </Badge>
      ))}
    </Box>
  ),
};

/** The seven token sizes, from xxs to xxl, using the default light variant. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Badge key={size} {...args} size={size}>
          {size}
        </Badge>
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
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Badge key={shadow} {...args} shadow={shadow}>
          {shadow}
        </Badge>
      ))}
    </Box>
  ),
};

/** Left and right sections hold icons or any adornment alongside the label. */
export const WithSections: Story = {
  args: {
    children: "Stars",
    leftSection: <Text>⭐</Text>,
    rightSection: <Text>⭐</Text>,
  },
};

/** Circle mode — equal width and height for a single glyph or short number. */
export const Circle: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Badge key={size} {...args} size={size} circle>
          {size === "xxs" || size === "xs" || size === "sm" ? "1" : size === "md" ? "42" : "99+"}
        </Badge>
      ))}
    </Box>
  ),
};

/** The dot variant prepends a colored indicator dot — no leftSection needed. */
export const DotVariant: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Badge key={size} {...args} variant="dot" size={size}>
          {size}
        </Badge>
      ))}
    </Box>
  ),
};

/** The palette ramp follows the active theme — same component, different accent. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <Badge key={theme} {...args} theme={theme}>
          {theme}
        </Badge>
      ))}
    </Box>
  ),
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$lg">
      {VARIANTS.map((variant) => (
        <Box key={variant} flexDirection="row" gap="$md" alignItems="center">
          {SIZES.map((size) => (
            <Badge key={size} variant={variant} size={size}>
              {variant}
            </Badge>
          ))}
        </Box>
      ))}
    </Box>
  ),
};

/**
 * The `gradient` variant fills the badge with a linear gradient. With no
 * `gradient` prop it follows the theme ramp; otherwise it accepts a two-color
 * shorthand, `$colorN` tokens, or a multi-step `stops` list. Text renders white.
 */
export const Gradient: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Badge {...args} variant="gradient">
        Themed
      </Badge>
      <Badge {...args} variant="gradient" gradient={{ from: "#4f46e5", to: "#ec4899", deg: 60 }}>
        Shorthand
      </Badge>
      <Badge {...args} variant="gradient" gradient={{ from: "$blue9", to: "$teal9" }}>
        Tokens
      </Badge>
      <Badge
        {...args}
        variant="gradient"
        gradient={{
          stops: [
            { color: "#f97316", offset: 0 },
            { color: "#22c55e", offset: 50 },
            { color: "#8b5cf6", offset: 100 },
          ],
          deg: 90,
        }}
      >
        Multi-step
      </Badge>
    </Box>
  ),
};

/** A set of curated multi-color gradient presets. */
export const GradientPresets: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {Object.entries(GRADIENT_PRESETS).map(([name, gradient]) => (
        <Badge key={name} {...args} variant="gradient" gradient={gradient}>
          {name}
        </Badge>
      ))}
    </Box>
  ),
};

/** The themed gradient (no `gradient` prop) derives its ramp from the active theme. */
export const GradientThemed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "orange", "pink", "teal"] as const).map((theme) => (
        <Badge key={theme} {...args} variant="gradient" theme={theme}>
          {theme}
        </Badge>
      ))}
    </Box>
  ),
};

/** The Sunset gradient across the full token size scale. */
export const GradientSizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Badge
          key={size}
          {...args}
          variant="gradient"
          gradient={GRADIENT_PRESETS.Sunset}
          size={size}
        >
          {size}
        </Badge>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `root` frame and `text` label. */
export const Styles: Story = {
  args: {
    children: "Badge",
    styles: {
      root: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
      text: { color: "$blue11", fontWeight: "700" },
    },
  },
};
