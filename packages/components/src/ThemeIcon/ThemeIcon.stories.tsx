import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { IconStar } from "@knitui/icons";

import { Box } from "../Box";
import type { GradientValue } from "../internal/gradient";
import { ThemeIcon } from "./ThemeIcon";

const VARIANTS = [
  "filled",
  "light",
  "outline",
  "subtle",
  "transparent",
  "white",
  "default",
  "gradient",
] as const;

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

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

const GRADIENT_THEMES = ["blue", "red", "green", "orange", "pink", "teal"] as const;

const meta = {
  title: "Data display/ThemeIcon",
  component: ThemeIcon,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ThemeIcon is the canonical icon chip — a themed square that holds an icon. It models `ActionIcon`'s frame (square `size`, `variant`-driven fill, `radius` rounding) but is NOT interactive. A bare `@knitui/icons` icon dropped inside auto-sizes and auto-colors to the chip. Accent comes from the `theme` prop, never a `color` prop.",
      },
    },
  },
  args: {
    variant: "filled",
    size: "md",
    children: <IconStar />,
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
      description: "Controls the square width/height and radius.",
    },
    radius: {
      control: "text",
      description: "Theme radius token (e.g. `$sm`) or any CSS value.",
    },
    shadow: {
      control: "select",
      options: [undefined, "xs", "sm", "md", "lg", "xl"],
      description: "Elevation — drop shadow from the shared ladder.",
    },
    gradient: {
      control: "object",
      description: "Gradient fill for variant='gradient' — { from, to, deg } or { stops, deg }.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink"],
    },
  },
} satisfies Meta<typeof ThemeIcon>;

export default meta;

type Story = StoryObj<ComponentProps<typeof ThemeIcon>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every visual variant side by side. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {VARIANTS.map((variant) => (
        <ThemeIcon key={variant} {...args} variant={variant}>
          <IconStar />
        </ThemeIcon>
      ))}
    </Box>
  ),
};

/** The five sizes, from xs to xl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <ThemeIcon key={size} {...args} size={size}>
          <IconStar />
        </ThemeIcon>
      ))}
    </Box>
  ),
};

/** Each elevation level from the shared shadow ladder. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      {SHADOWS.map((shadow) => (
        <ThemeIcon key={shadow} {...args} shadow={shadow}>
          <IconStar />
        </ThemeIcon>
      ))}
    </Box>
  ),
};

/** The palette ramp follows the active theme. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <ThemeIcon key={theme} {...args} theme={theme}>
          <IconStar />
        </ThemeIcon>
      ))}
    </Box>
  ),
};

/**
 * `variant="gradient"` fills the chip with a linear gradient. With no `gradient`
 * prop it falls back to the theme ramp; otherwise pass a two-color shorthand,
 * `$colorN` tokens, or a multi-step `stops` array. The icon auto-colors white.
 */
export const Gradient: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <ThemeIcon {...args} variant="gradient">
        <IconStar />
      </ThemeIcon>
      <ThemeIcon
        {...args}
        variant="gradient"
        gradient={{ from: "#4f46e5", to: "#ec4899", deg: 60 }}
      >
        <IconStar />
      </ThemeIcon>
      <ThemeIcon {...args} variant="gradient" gradient={{ from: "$blue9", to: "$teal9" }}>
        <IconStar />
      </ThemeIcon>
      <ThemeIcon
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
        <IconStar />
      </ThemeIcon>
    </Box>
  ),
};

/** A set of curated gradient presets — handy starting points. */
export const GradientPresets: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {Object.entries(GRADIENT_PRESETS).map(([name, gradient]) => (
        <ThemeIcon key={name} {...args} variant="gradient" gradient={gradient}>
          <IconStar />
        </ThemeIcon>
      ))}
    </Box>
  ),
};

/** `variant="gradient"` with no `gradient` prop derives the gradient from each theme. */
export const GradientThemed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {GRADIENT_THEMES.map((theme) => (
        <ThemeIcon key={theme} {...args} variant="gradient" theme={theme}>
          <IconStar />
        </ThemeIcon>
      ))}
    </Box>
  ),
};

/** One gradient (Sunset) across the full size scale. */
export const GradientSizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <ThemeIcon
          key={size}
          {...args}
          size={size}
          variant="gradient"
          gradient={GRADIENT_PRESETS.Sunset}
        >
          <IconStar />
        </ThemeIcon>
      ))}
    </Box>
  ),
};
