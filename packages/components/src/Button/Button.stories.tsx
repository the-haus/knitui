import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import type { GradientValue } from "../internal/gradient";
import { Text } from "../Text";
import { Button } from "./Button";

const VARIANTS = [
  "filled",
  "light",
  "outline",
  "subtle",
  "default",
  "white",
  "transparent",
  "gradient",
] as const;

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

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

const meta = {
  title: "Inputs/Button",
  component: Button,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Button is composed from `Box` + `Text`. Colors reference the active theme palette ramp, so the `theme` prop recolors it with no per-component logic. `variant` chooses how the ramp applies and `size` sets the metrics.",
      },
    },
  },
  args: {
    children: "Button",
    variant: "filled",
    size: "md",
    fullWidth: false,
    disabled: false,
    loading: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: VARIANTS,
      description: "Visual variant — how the theme color ramp is applied.",
    },
    gradient: {
      control: "object",
      description: "Gradient fill for variant='gradient' — { from, to, deg } or { stops, deg }.",
    },
    shadow: {
      control: "select",
      options: [undefined, ...SHADOWS],
      description: "Elevation — drop shadow from the shared ladder (inherited from Box).",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, horizontal padding, radius and font size.",
    },
    justify: {
      control: "select",
      options: ["center", "flex-start", "flex-end", "space-between", "space-around"],
      description: "Horizontal alignment of inner content (label + sections).",
    },
    fullWidth: { control: "boolean" },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Active theme accent — recolors the button via the palette ramp.",
    },
    children: { control: "text" },
    leftSection: { control: false },
    rightSection: { control: false },
  },
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Button>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every visual variant side by side, at the default size. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {VARIANTS.map((variant) => (
        <Button key={variant} {...args} variant={variant}>
          {variant}
        </Button>
      ))}
    </Box>
  ),
};

/** The seven token sizes, from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Button key={size} {...args} size={size}>
          {size}
        </Button>
      ))}
    </Box>
  ),
};

/**
 * Elevation via the shared `shadow` ladder. `shadow` isn't Button-specific — it's
 * inherited from `Box`, so every component accepts it; no shadow unless set.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Button key={shadow} {...args} shadow={shadow}>
          {shadow}
        </Button>
      ))}
    </Box>
  ),
};

/** Loading state — the label is replaced by a spinner; the button is disabled. */
export const Loading: Story = {
  args: { loading: true, children: "Saving…" },
};

/** Disabled state — reduced opacity and pointer events off. */
export const Disabled: Story = {
  args: { disabled: true, children: "Disabled" },
};

/** Stretches to the full width of its container. */
export const FullWidth: Story = {
  args: { fullWidth: true, children: "Full width" },
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
};

/** Left and right sections hold icons, badges or any adornment. */
export const WithSections: Story = {
  args: {
    children: "Continue",
    leftSection: <Text>←</Text>,
    rightSection: <Text>→</Text>,
  },
};

/** The palette ramp follows the active theme — same component, different accent. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <Button key={theme} {...args} theme={theme}>
          {theme}
        </Button>
      ))}
    </Box>
  ),
};

/** `Button.Group` attaches buttons flush together; `orientation` flips the axis. */
export const Group: Story = {
  render: (args) => (
    <Box gap="$lg">
      <Button.Group>
        <Button {...args} variant="default">
          Left
        </Button>
        <Button {...args} variant="default">
          Middle
        </Button>
        <Button {...args} variant="default">
          Right
        </Button>
      </Button.Group>

      <Button.Group orientation="vertical">
        <Button {...args} variant="default">
          Top
        </Button>
        <Button {...args} variant="default">
          Bottom
        </Button>
      </Button.Group>
    </Box>
  ),
};

/** `Button.GroupSection` is a non-interactive segment inside a group. */
export const GroupSection: Story = {
  render: (args) => (
    <Button.Group>
      <Button {...args} variant="default">
        Seats
      </Button>
      <Button.GroupSection size={args.size}>
        <Text>3</Text>
      </Button.GroupSection>
      <Button {...args} variant="default">
        Checkout
      </Button>
    </Button.Group>
  ),
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$lg">
      {VARIANTS.map((variant) => (
        <Box key={variant} flexDirection="row" gap="$md" alignItems="center">
          {SIZES.map((size) => (
            <Button key={size} variant={variant} size={size}>
              {variant}
            </Button>
          ))}
        </Box>
      ))}
    </Box>
  ),
};

/** Gradient fills — the themed default ramp, a two-color shorthand, a token gradient, and a multi-step stops gradient. */
export const Gradient: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Button {...args} variant="gradient">
        Themed
      </Button>
      <Button {...args} variant="gradient" gradient={{ from: "#4f46e5", to: "#ec4899", deg: 60 }}>
        Shorthand
      </Button>
      <Button {...args} variant="gradient" gradient={{ from: "$blue9", to: "$teal9" }}>
        Tokens
      </Button>
      <Button {...args} variant="gradient" gradient={GRADIENT_PRESETS.Spectrum}>
        Multi-step
      </Button>
    </Box>
  ),
};

/** A handful of curated gradient presets — both two-color and multi-step. */
export const GradientPresets: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {Object.entries(GRADIENT_PRESETS).map(([name, gradient]) => (
        <Button key={name} {...args} variant="gradient" gradient={gradient}>
          {name}
        </Button>
      ))}
    </Box>
  ),
};

/** With no `gradient` prop, `variant="gradient"` falls back to the active theme's ramp. */
export const GradientThemed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "orange", "pink", "teal"] as const).map((theme) => (
        <Button key={theme} {...args} variant="gradient" theme={theme}>
          {theme}
        </Button>
      ))}
    </Box>
  ),
};

/** A gradient fill across the seven token sizes. */
export const GradientSizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Button
          key={size}
          {...args}
          variant="gradient"
          gradient={GRADIENT_PRESETS.Sunset}
          size={size}
        >
          {size}
        </Button>
      ))}
    </Box>
  ),
};

/** The same two-color gradient swept through a range of angles. */
export const GradientAngles: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {[0, 45, 90, 135, 180].map((deg) => (
        <Button
          key={deg}
          {...args}
          variant="gradient"
          gradient={{ from: "#4f46e5", to: "#ec4899", deg }}
        >
          {deg}°
        </Button>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `label` and `right` section. */
export const Styles: Story = {
  args: {
    children: "Continue",
    variant: "default",
    rightSection: <Text>→</Text>,
    styles: {
      label: { color: "$blue11", fontWeight: "700" },
      right: { backgroundColor: "$red3" },
    },
  },
};
