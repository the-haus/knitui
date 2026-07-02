import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import type { GradientValue } from "../internal/gradient";
import { Text } from "../Text";
import { Pill } from "./Pill";

const VARIANTS = ["default", "contrast", "gradient"] as const;

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
  title: "Display/Pill",
  component: Pill,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Pill is a small rounded label, optionally with a remove button. Use `Pill.Group` to lay out multiple pills and inherit `size`/`disabled`. The `contrast` variant uses the active theme's solid accent (`$color9`); colour comes from the `theme` prop + palette ramp.",
      },
    },
  },
  args: {
    children: "Pill",
    variant: "default",
    size: "sm",
    withRemoveButton: false,
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description:
        "Visual style — default uses a subtle background, contrast uses the solid accent.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, horizontal padding and font size.",
    },
    withRemoveButton: {
      control: "boolean",
      description: "Show a trailing remove (×) button.",
    },
    gradient: {
      control: "object",
      description: "Gradient fill for variant='gradient' — { from, to, deg } or { stops, deg }.",
    },
    disabled: {
      control: "boolean",
      description: "Reduced opacity and pointer events off.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Active theme accent — recolors the pill via the palette ramp.",
    },
    children: { control: "text" },
    onRemove: { control: false },
    removeButtonProps: { control: false },
  },
} satisfies Meta<typeof Pill>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Pill>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Both visual variants side by side at the default size. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {VARIANTS.map((variant) => (
        <Pill key={variant} {...args} variant={variant}>
          {variant}
        </Pill>
      ))}
    </Box>
  ),
};

/** All seven sizes from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Pill key={size} {...args} size={size}>
          {size}
        </Pill>
      ))}
    </Box>
  ),
};

/** Each elevation of the inherited `shadow` prop applied to the pill. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Pill key={shadow} {...args} shadow={shadow}>
          {shadow}
        </Pill>
      ))}
    </Box>
  ),
};

/** Pill with a remove button — pressing × fires `onRemove`. */
export const WithRemoveButton: Story = {
  args: {
    children: "Removable",
    withRemoveButton: true,
    removeButtonProps: { "aria-label": "remove" },
  },
};

/** Disabled state — reduced opacity, pointer events off. */
export const Disabled: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Pill {...args} disabled>
        Disabled
      </Pill>
      <Pill {...args} disabled withRemoveButton removeButtonProps={{ "aria-label": "remove" }}>
        Disabled + remove
      </Pill>
    </Box>
  ),
};

/** The palette ramp follows the active theme — same component, different accent. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <Pill key={theme} {...args} theme={theme} variant="contrast">
          {theme}
        </Pill>
      ))}
    </Box>
  ),
};

/**
 * Gradient fill — themed default (no `gradient` prop), a two-color shorthand, a token gradient,
 * and a multi-step `stops` gradient (shown with a remove button — the × glyph turns white).
 */
export const Gradient: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Pill {...args} variant="gradient">
        Tag
      </Pill>
      <Pill {...args} variant="gradient" gradient={{ from: "#4f46e5", to: "#ec4899", deg: 60 }}>
        Tag
      </Pill>
      <Pill {...args} variant="gradient" gradient={{ from: "$blue9", to: "$teal9" }}>
        Tag
      </Pill>
      <Pill
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
        withRemoveButton
        removeButtonProps={{ "aria-label": "remove" }}
      >
        Tag
      </Pill>
    </Box>
  ),
};

/** Curated gradient presets for the gradient variant. */
export const GradientPresets: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {Object.entries(GRADIENT_PRESETS).map(([name, gradient]) => (
        <Pill key={name} {...args} variant="gradient" gradient={gradient}>
          {name}
        </Pill>
      ))}
    </Box>
  ),
};

/** Themed gradient (no `gradient` prop) — the `$color5`→`$color9` ramp follows the active theme. */
export const GradientThemed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "orange", "pink", "teal"] as const).map((theme) => (
        <Pill key={theme} {...args} variant="gradient" theme={theme}>
          {theme}
        </Pill>
      ))}
    </Box>
  ),
};

/** `Pill.Group` lays out pills in a wrapping row and propagates `size`/`disabled` to children. */
export const Group: Story = {
  render: (args) => (
    <Box gap="$lg">
      <Pill.Group size="sm">
        <Pill {...args}>React</Pill>
        <Pill {...args}>TypeScript</Pill>
        <Pill {...args}>Tamagui</Pill>
        <Pill {...args} withRemoveButton removeButtonProps={{ "aria-label": "remove storybook" }}>
          Storybook
        </Pill>
      </Pill.Group>

      <Pill.Group size="lg" disabled>
        <Pill {...args}>Disabled group</Pill>
        <Pill {...args}>All pills</Pill>
        <Pill {...args}>Are disabled</Pill>
      </Pill.Group>
    </Box>
  ),
};

/** A controlled tag-input pattern — click × to remove individual pills. */
export const RemovableTags: Story = {
  render: (args) => {
    const [tags, setTags] = React.useState(["Design", "Engineering", "Product", "Marketing"]);
    return (
      <Box gap="$sm">
        <Pill.Group size="md">
          {tags.map((tag) => (
            <Pill
              key={tag}
              {...args}
              withRemoveButton
              onRemove={() => setTags((prev) => prev.filter((t) => t !== tag))}
              removeButtonProps={{ "aria-label": `remove ${tag}` }}
            >
              {tag}
            </Pill>
          ))}
        </Pill.Group>
        {tags.length === 0 && (
          <Text size="xs" color="$color11">
            All tags removed. Refresh to reset.
          </Text>
        )}
      </Box>
    );
  },
};

/** Per-slot `styles` targets individual parts — here the `label` and the `removeButton`. */
export const Styles: Story = {
  args: {
    children: "Styled pill",
    withRemoveButton: true,
    removeButtonProps: { "aria-label": "remove" },
    styles: {
      label: { color: "$blue9", fontWeight: "700" },
      removeButton: { backgroundColor: "$red3" },
    },
  },
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$lg">
      {VARIANTS.map((variant) => (
        <Box key={variant} flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
          {SIZES.map((size) => (
            <Pill key={size} variant={variant} size={size}>
              {variant} {size}
            </Pill>
          ))}
        </Box>
      ))}
    </Box>
  ),
};
