import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import type { GradientValue } from "../internal/gradient";
import { Text } from "../Text";
import { Avatar } from "./Avatar";

const VARIANTS = [
  "filled",
  "light",
  "outline",
  "transparent",
  "default",
  "white",
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
  title: "Display/Avatar",
  component: Avatar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Avatar is a circular display element built from `Box` + `Text`. It renders an image when `src` is provided, falls back to initials derived from `name`, or shows custom `children` as the placeholder. `autoColor` automatically assigns a theme accent by hashing the name. Use `Avatar.Group` to stack overlapping avatars.",
      },
    },
  },
  args: {
    name: "Jane Doe",
    variant: "light",
    size: "md",
    autoColor: true,
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
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls the diameter and initials font size.",
    },
    name: {
      control: "text",
      description: "User name — rendered as initials when no image is present.",
    },
    src: {
      control: "text",
      description: "Image URL. Falls back to initials or children on error.",
    },
    alt: {
      control: "text",
      description: "Accessible label for the avatar image role.",
    },
    autoColor: {
      control: "boolean",
      description:
        "Automatically selects a theme accent by hashing the name when no explicit theme is set.",
    },
    theme: {
      control: "select",
      options: [
        undefined,
        "blue",
        "red",
        "green",
        "orange",
        "pink",
        "purple",
        "teal",
        "yellow",
        "gray",
      ],
      description: "Explicit accent theme — overrides autoColor.",
    },
    children: { control: false },
  },
} satisfies Meta<typeof Avatar>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Avatar>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every visual variant side by side, at the default size. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {VARIANTS.map((variant) => (
        <Avatar key={variant} {...args} variant={variant} autoColor={false} theme="blue" />
      ))}
    </Box>
  ),
};

/** The seven token sizes, from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Avatar key={size} {...args} size={size} />
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
        <Avatar key={shadow} {...args} size="lg" shadow={shadow} name={shadow} />
      ))}
    </Box>
  ),
};

/** Initials are derived from the name — one word gives up to two letters, two+ words give the first letter of each. */
export const WithInitials: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Avatar {...args} name="Jane Doe" />
      <Avatar {...args} name="Alice" />
      <Avatar {...args} name="Bob Charles Dean" />
      <Avatar {...args} name="X" />
    </Box>
  ),
};

/** Each avatar auto-selects a distinct accent color by hashing its name — no manual theme needed. */
export const AutoColor: Story = {
  args: { autoColor: true, variant: "filled" },
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {["Alice Brown", "Carlos Ray", "Diana Prince", "Ethan Hunt", "Fiona Green", "George Luz"].map(
        (name) => (
          <Avatar key={name} {...args} name={name} />
        ),
      )}
    </Box>
  ),
};

/** An image is rendered clipped to the avatar circle; if loading fails the initials placeholder is shown. */
export const WithImage: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Avatar
        {...args}
        src="https://i.pravatar.cc/150?img=1"
        name="Jane Doe"
        alt="Jane Doe profile picture"
      />
      <Avatar
        {...args}
        src="https://i.pravatar.cc/150?img=2"
        name="John Smith"
        alt="John Smith profile picture"
        size="lg"
      />
      <Avatar
        {...args}
        src="https://broken.invalid/image.png"
        name="Error Fallback"
        alt="Broken image — shows initials"
      />
    </Box>
  ),
};

/** Custom children are used as the placeholder instead of initials. */
export const CustomPlaceholder: Story = {
  args: { name: undefined, autoColor: false },
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Avatar {...args} variant="filled" theme="blue">
        <Text>⭐</Text>
      </Avatar>
      <Avatar {...args} variant="light" theme="red">
        <Text>🔥</Text>
      </Avatar>
      <Avatar {...args} variant="outline" theme="green">
        AB
      </Avatar>
    </Box>
  ),
};

/** `Avatar.Group` stacks avatars with overlap; `spacing` controls the overlap distance in px. */
export const Group: Story = {
  render: (args) => (
    <Box gap="$lg">
      <Avatar.Group>
        <Avatar {...args} name="Ann Bee" />
        <Avatar {...args} name="Cal Dee" />
        <Avatar {...args} name="Eve Fox" />
        <Avatar {...args} name="Gus Hart" />
      </Avatar.Group>

      <Avatar.Group spacing={16}>
        <Avatar {...args} name="Ann Bee" size="lg" />
        <Avatar {...args} name="Cal Dee" size="lg" />
        <Avatar {...args} name="Eve Fox" size="lg" />
        <Avatar {...args} name="+ 3" size="lg" variant="default" autoColor={false} />
      </Avatar.Group>
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
            <Avatar
              key={size}
              variant={variant}
              size={size}
              autoColor={false}
              theme="blue"
              name="JD"
            />
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
      <Avatar {...args} variant="gradient" autoColor={false} name="TH" />
      <Avatar
        {...args}
        variant="gradient"
        autoColor={false}
        gradient={{ from: "#4f46e5", to: "#ec4899", deg: 60 }}
        name="SH"
      />
      <Avatar
        {...args}
        variant="gradient"
        autoColor={false}
        gradient={{ from: "$blue9", to: "$teal9" }}
        name="TK"
      />
      <Avatar
        {...args}
        variant="gradient"
        autoColor={false}
        gradient={{
          stops: [
            { color: "#f97316", offset: 0 },
            { color: "#22c55e", offset: 50 },
            { color: "#8b5cf6", offset: 100 },
          ],
          deg: 90,
        }}
        name="MS"
      />
    </Box>
  ),
};

/** A handful of curated gradient presets — both two-color and multi-step. */
export const GradientPresets: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {Object.entries(GRADIENT_PRESETS).map(([name, gradient]) => (
        <Avatar
          key={name}
          {...args}
          variant="gradient"
          autoColor={false}
          gradient={gradient}
          name={name}
        />
      ))}
    </Box>
  ),
};

/** With no `gradient` prop, `variant="gradient"` falls back to the active theme's ramp. */
export const GradientThemed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "orange", "pink", "teal"] as const).map((theme) => (
        <Avatar
          key={theme}
          {...args}
          variant="gradient"
          autoColor={false}
          theme={theme}
          name={theme}
        />
      ))}
    </Box>
  ),
};

/** A gradient fill across the seven token sizes. */
export const GradientSizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Avatar
          key={size}
          {...args}
          variant="gradient"
          autoColor={false}
          gradient={GRADIENT_PRESETS.Sunset}
          size={size}
          name="JD"
        />
      ))}
    </Box>
  ),
};

/** `Avatar.Group` stacks gradient avatars — each with a distinct preset and initials. */
export const GradientGroup: Story = {
  render: (args) => (
    <Avatar.Group>
      <Avatar
        {...args}
        variant="gradient"
        autoColor={false}
        gradient={GRADIENT_PRESETS.Sunset}
        name="Ann Bee"
      />
      <Avatar
        {...args}
        variant="gradient"
        autoColor={false}
        gradient={GRADIENT_PRESETS.Ocean}
        name="Cal Dee"
      />
      <Avatar
        {...args}
        variant="gradient"
        autoColor={false}
        gradient={GRADIENT_PRESETS.Forest}
        name="Eve Fox"
      />
      <Avatar
        {...args}
        variant="gradient"
        autoColor={false}
        gradient={GRADIENT_PRESETS.Grape}
        name="Gus Hart"
      />
    </Avatar.Group>
  ),
};

/** Per-slot `styles` targets individual parts — here the `root` frame and `text` initials. */
export const Styles: Story = {
  args: {
    name: "Jane Doe",
    autoColor: false,
    size: "xl",
    styles: {
      root: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
      text: { color: "$red9", fontWeight: "700" },
    },
  },
};
