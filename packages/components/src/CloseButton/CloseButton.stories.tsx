import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import type { GradientValue } from "../internal/gradient";
import { Text } from "../Text";
import { CloseButton } from "./CloseButton";

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

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/CloseButton",
  component: CloseButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "CloseButton mirrors Mantine's `CloseButton`, built on `ActionIcon`. It renders a centered `✕` glyph by default and inherits all `ActionIcon` props except `loading` and `children` (children are appended after the icon, useful for a `VisuallyHidden` label). Accent comes from the `theme` prop + palette ramp.",
      },
    },
  },
  args: {
    variant: "subtle",
    size: "md",
    disabled: false,
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
      description: "Controls the square width/height, radius and icon size.",
    },
    iconSize: {
      control: "text",
      description: "Override the `✕` glyph font size. Ignored when `icon` is set.",
    },
    disabled: { control: "boolean" },
    gradient: {
      control: "object",
      description: "Gradient fill for variant='gradient' — { from, to, deg } or { stops, deg }.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Active theme accent — recolors the button via the palette ramp.",
    },
    icon: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof CloseButton>;

export default meta;

type Story = StoryObj<ComponentProps<typeof CloseButton>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every visual variant side by side at the default size. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {VARIANTS.map((variant) => (
        <CloseButton key={variant} {...args} variant={variant} aria-label={`Close (${variant})`} />
      ))}
    </Box>
  ),
};

/** The full seven-step size scale, from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <CloseButton key={size} {...args} size={size} aria-label={`Close (${size})`} />
      ))}
    </Box>
  ),
};

/** The inherited `shadow` elevation ladder, from `xs` to `xl`. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <CloseButton key={shadow} {...args} shadow={shadow} aria-label={`Close (${shadow})`} />
      ))}
    </Box>
  ),
};

/** Disabled state — reduced opacity and pointer events off. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** Custom icon replaces the default `✕` glyph entirely. */
export const CustomIcon: Story = {
  args: {
    icon: <Text>✖</Text>,
    "aria-label": "Dismiss",
  },
};

/** Custom `aria-label` overrides the default "Close" label for accessibility. */
export const CustomAriaLabel: Story = {
  args: {
    "aria-label": "Dismiss notification",
  },
};

/** The palette ramp follows the active theme — same component, different accent. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <CloseButton key={theme} {...args} theme={theme} aria-label={`Close (${theme})`} />
      ))}
    </Box>
  ),
};

/**
 * Gradient fill — themed default (no `gradient` prop), a two-color shorthand, a token gradient,
 * and a multi-step `stops` gradient.
 */
export const Gradient: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <CloseButton {...args} variant="gradient" aria-label="Close (themed gradient)" />
      <CloseButton
        {...args}
        variant="gradient"
        gradient={{ from: "#4f46e5", to: "#ec4899", deg: 60 }}
        aria-label="Close (indigo to pink)"
      />
      <CloseButton
        {...args}
        variant="gradient"
        gradient={{ from: "$blue9", to: "$teal9" }}
        aria-label="Close (token gradient)"
      />
      <CloseButton
        {...args}
        variant="gradient"
        gradient={{
          stops: [
            { color: "#f97316", offset: 0 },
            { color: "#22c55e", offset: 50 },
            { color: "#0ea5e9", offset: 100 },
          ],
          deg: 90,
        }}
        aria-label="Close (multi-step gradient)"
      />
    </Box>
  ),
};

/** Curated gradient presets for the gradient variant. */
export const GradientPresets: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {Object.entries(GRADIENT_PRESETS).map(([name, gradient]) => (
        <CloseButton
          key={name}
          {...args}
          variant="gradient"
          gradient={gradient}
          aria-label={`Close (${name})`}
        />
      ))}
    </Box>
  ),
};

/** Themed gradient (no `gradient` prop) — the `$color5`→`$color9` ramp follows the active theme. */
export const GradientThemed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "orange", "pink", "teal"] as const).map((theme) => (
        <CloseButton
          key={theme}
          {...args}
          variant="gradient"
          theme={theme}
          aria-label={`Close (${theme} gradient)`}
        />
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
            <CloseButton
              key={size}
              variant={variant}
              size={size}
              aria-label={`Close (${variant}-${size})`}
            />
          ))}
        </Box>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `icon` glyph. */
export const Styles: Story = {
  args: {
    variant: "subtle",
    size: "md",
    styles: {
      icon: { color: "$red9" },
    },
  },
};
