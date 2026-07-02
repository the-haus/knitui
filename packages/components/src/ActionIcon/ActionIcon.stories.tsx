import type { ComponentProps, ReactNode } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  IconBold,
  IconChevronDown,
  IconChevronUp,
  IconDots,
  IconHeart,
  IconItalic,
  IconMinus,
  IconPencil,
  IconPlus,
  IconSearch,
  IconStar,
  IconTrash,
  IconUnderline,
} from "@knitui/icons";

import { Box } from "../Box";
import type { GradientValue } from "../internal/gradient";
import { Text } from "../Text";
import { ActionIcon } from "./ActionIcon";

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

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const THEMES = ["blue", "red", "green", "yellow", "pink"] as const;

const RADII = ["xs", "sm", "md", "lg", "xl"] as const;

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

/** A swatch with a caption underneath — keeps the variant/size grids legible. */
function Labeled({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box alignItems="center" gap="$xs">
      {children}
      <Text fontSize="$xs" color="$color11">
        {label}
      </Text>
    </Box>
  );
}

const meta = {
  title: "Inputs/ActionIcon",
  component: ActionIcon,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ActionIcon is a square, icon-only button — the closest sibling to `Button`. Same theme-driven palette ramp and pseudo states. `variant` chooses how the ramp applies, `size` sets the (square) metrics, `radius` the rounding. Accent comes from the `theme` prop, never a `color` prop. A bare `@knitui/icons` icon dropped inside auto-sizes and auto-colors to the control. `loading` swaps the icon for a `Loader` and blocks interaction. Always pass an `aria-label` — the icon carries no text.",
      },
    },
  },
  args: {
    children: <IconStar />,
    "aria-label": "favourite",
    variant: "filled",
    size: "md",
    disabled: false,
    loading: false,
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
    gradient: {
      control: "object",
      description: "Gradient fill for variant='gradient' — { from, to, deg } or { stops, deg }.",
    },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    children: { control: false },
    theme: {
      control: "select",
      options: [undefined, ...THEMES],
      description: "Active theme accent — recolors the icon via the palette ramp.",
    },
    "aria-label": {
      control: "text",
      description: "Accessible name — required, since the icon has no visible text.",
    },
  },
} satisfies Meta<typeof ActionIcon>;

export default meta;

type Story = StoryObj<ComponentProps<typeof ActionIcon>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every visual variant side by side, captioned. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      {VARIANTS.map((variant) => (
        <Labeled key={variant} label={variant}>
          <ActionIcon {...args} variant={variant} aria-label={variant}>
            <IconStar />
          </ActionIcon>
        </Labeled>
      ))}
    </Box>
  ),
};

/** The seven token sizes, from xxs to xxl — the icon auto-scales to each. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="flex-end">
      {SIZES.map((size) => (
        <Labeled key={size} label={size}>
          <ActionIcon {...args} size={size} aria-label={size}>
            <IconStar />
          </ActionIcon>
        </Labeled>
      ))}
    </Box>
  ),
};

/** `radius` rounds the square — from a soft `xs` to a full circle. */
export const Radius: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      {RADII.map((radius) => (
        <Labeled key={radius} label={radius}>
          <ActionIcon {...args} radius={`$${radius}`} aria-label={radius}>
            <IconStar />
          </ActionIcon>
        </Labeled>
      ))}
      <Labeled label="round">
        <ActionIcon {...args} radius={9999} aria-label="round">
          <IconStar />
        </ActionIcon>
      </Labeled>
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
        <Labeled key={shadow} label={shadow}>
          <ActionIcon {...args} shadow={shadow} aria-label={shadow}>
            <IconStar />
          </ActionIcon>
        </Labeled>
      ))}
    </Box>
  ),
};

/** Loading state — the icon is replaced by a spinner and interaction is blocked. */
export const Loading: Story = {
  args: { loading: true },
};

/** Disabled state — reduced opacity and pointer events off. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** The palette ramp follows the active theme — same component, different accent. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      {THEMES.map((theme) => (
        <Labeled key={theme} label={theme}>
          <ActionIcon {...args} theme={theme} aria-label={theme}>
            <IconHeart />
          </ActionIcon>
        </Labeled>
      ))}
    </Box>
  ),
};

/** A realistic toolbar — distinct icons, a `subtle` variant, and a flush group. */
export const Toolbar: Story = {
  render: (args) => (
    <Box flexDirection="row" gap="$sm" alignItems="center">
      <ActionIcon.Group>
        <ActionIcon {...args} variant="default" aria-label="bold">
          <IconBold />
        </ActionIcon>
        <ActionIcon {...args} variant="default" aria-label="italic">
          <IconItalic />
        </ActionIcon>
        <ActionIcon {...args} variant="default" aria-label="underline">
          <IconUnderline />
        </ActionIcon>
      </ActionIcon.Group>

      <ActionIcon {...args} variant="subtle" aria-label="search">
        <IconSearch />
      </ActionIcon>
      <ActionIcon {...args} variant="subtle" aria-label="edit">
        <IconPencil />
      </ActionIcon>
      <ActionIcon {...args} variant="subtle" theme="red" aria-label="delete">
        <IconTrash />
      </ActionIcon>
      <ActionIcon {...args} variant="subtle" aria-label="more">
        <IconDots />
      </ActionIcon>
    </Box>
  ),
};

/** `ActionIcon.Group` attaches icons flush; `orientation` flips the axis. */
export const Group: Story = {
  render: (args) => (
    <Box gap="$lg">
      <ActionIcon.Group>
        <ActionIcon {...args} variant="default" aria-label="bold">
          <IconBold />
        </ActionIcon>
        <ActionIcon {...args} variant="default" aria-label="italic">
          <IconItalic />
        </ActionIcon>
        <ActionIcon {...args} variant="default" aria-label="underline">
          <IconUnderline />
        </ActionIcon>
      </ActionIcon.Group>

      <ActionIcon.Group orientation="vertical">
        <ActionIcon {...args} variant="default" aria-label="up">
          <IconChevronUp />
        </ActionIcon>
        <ActionIcon {...args} variant="default" aria-label="down">
          <IconChevronDown />
        </ActionIcon>
      </ActionIcon.Group>
    </Box>
  ),
};

/** `ActionIcon.GroupSection` is a non-interactive segment inside a group. */
export const GroupWithSection: Story = {
  render: (args) => (
    <ActionIcon.Group>
      <ActionIcon {...args} variant="default" aria-label="decrease">
        <IconMinus />
      </ActionIcon>
      <ActionIcon.GroupSection size="md">
        <Text>3</Text>
      </ActionIcon.GroupSection>
      <ActionIcon {...args} variant="default" aria-label="increase">
        <IconPlus />
      </ActionIcon>
    </ActionIcon.Group>
  ),
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$lg">
      {VARIANTS.map((variant) => (
        <Box key={variant} flexDirection="row" gap="$md" alignItems="center">
          {SIZES.map((size) => (
            <ActionIcon key={size} variant={variant} size={size} aria-label={`${variant}-${size}`}>
              <IconStar />
            </ActionIcon>
          ))}
        </Box>
      ))}
    </Box>
  ),
};

/**
 * Per-slot `styles` targets individual parts. The `loader` slot recolors the
 * spinner; the `icon` slot recolors string-glyph children (node icons instead
 * inherit color from the control via the icon context).
 */
export const Styles: Story = {
  render: (args) => (
    <Box flexDirection="row" gap="$lg" alignItems="center">
      <Labeled label="loader slot">
        <ActionIcon
          {...args}
          variant="light"
          loading
          aria-label="saving"
          styles={{ loader: { backgroundColor: "$red9" } }}
        >
          <IconStar />
        </ActionIcon>
      </Labeled>
      <Labeled label="icon slot">
        <ActionIcon
          {...args}
          variant="default"
          aria-label="favourite"
          styles={{ icon: { color: "$red9" } }}
        >
          ★
        </ActionIcon>
      </Labeled>
    </Box>
  ),
};

/**
 * `variant="gradient"` fills the square with a linear gradient. With no
 * `gradient` prop it falls back to the theme ramp; otherwise pass a two-color
 * shorthand, `$colorN` tokens, or a multi-step `stops` array. The icon
 * auto-colors white on the gradient.
 */
export const Gradient: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      <Labeled label="theme ramp">
        <ActionIcon {...args} variant="gradient" aria-label="theme ramp">
          <IconStar />
        </ActionIcon>
      </Labeled>
      <Labeled label="shorthand">
        <ActionIcon
          {...args}
          variant="gradient"
          gradient={{ from: "#4f46e5", to: "#ec4899", deg: 60 }}
          aria-label="shorthand gradient"
        >
          <IconStar />
        </ActionIcon>
      </Labeled>
      <Labeled label="tokens">
        <ActionIcon
          {...args}
          variant="gradient"
          gradient={{ from: "$blue9", to: "$teal9" }}
          aria-label="token gradient"
        >
          <IconStar />
        </ActionIcon>
      </Labeled>
      <Labeled label="multi-step">
        <ActionIcon
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
          aria-label="multi-step gradient"
        >
          <IconStar />
        </ActionIcon>
      </Labeled>
    </Box>
  ),
};

/** A set of curated gradient presets — handy starting points. */
export const GradientPresets: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      {Object.entries(GRADIENT_PRESETS).map(([name, gradient]) => (
        <Labeled key={name} label={name}>
          <ActionIcon {...args} variant="gradient" gradient={gradient} aria-label={name}>
            <IconStar />
          </ActionIcon>
        </Labeled>
      ))}
    </Box>
  ),
};

/** `variant="gradient"` with no `gradient` prop derives the gradient from each theme. */
export const GradientThemed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      {GRADIENT_THEMES.map((theme) => (
        <Labeled key={theme} label={theme}>
          <ActionIcon {...args} variant="gradient" theme={theme} aria-label={theme}>
            <IconStar />
          </ActionIcon>
        </Labeled>
      ))}
    </Box>
  ),
};

/** One gradient (Sunset) across the full size scale. */
export const GradientSizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="flex-end">
      {SIZES.map((size) => (
        <Labeled key={size} label={size}>
          <ActionIcon
            {...args}
            size={size}
            variant="gradient"
            gradient={GRADIENT_PRESETS.Sunset}
            aria-label={size}
          >
            <IconStar />
          </ActionIcon>
        </Labeled>
      ))}
    </Box>
  ),
};
