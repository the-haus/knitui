import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Rating } from "./Rating";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/Rating",
  component: Rating,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Rating renders `count` star symbols that support hover preview, fractional selection, read-only display and clearable interaction. The filled accent follows the active theme palette ramp via the `theme` prop. Custom symbols can be passed as nodes or as `(value) => node` functions.",
      },
    },
  },
  args: {
    count: 5,
    size: "sm",
    fractions: 1,
    readOnly: false,
    allowClear: true,
    highlightSelectedOnly: false,
    disabled: false,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Symbol size — either a named key or a custom pixel value.",
    },
    count: {
      control: { type: "number", min: 1, max: 10 },
      description: "Number of symbols rendered.",
    },
    fractions: {
      control: { type: "number", min: 1, max: 10 },
      description: "Sub-divisions per symbol (e.g. 2 = half-stars).",
    },
    value: {
      control: { type: "number", min: 0, max: 10, step: 0.5 },
      description: "Controlled value.",
    },
    defaultValue: {
      control: { type: "number", min: 0, max: 10, step: 0.5 },
      description: "Uncontrolled initial value.",
    },
    readOnly: { control: "boolean" },
    allowClear: { control: "boolean" },
    highlightSelectedOnly: { control: "boolean" },
    disabled: { control: "boolean" },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
    },
    emptySymbol: { control: false },
    fullSymbol: { control: false },
    onChange: { control: false },
    onHover: { control: false },
  },
} satisfies Meta<typeof Rating>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Rating>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All named sizes side by side, from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Box key={size} flexDirection="column" gap="$xs" alignItems="center">
          <Rating {...args} size={size} defaultValue={3} />
          <Text fontSize="$sm" color="$color10">
            {size}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Theme-driven accent color via Tamagui's `theme` prop. */
export const ThemeAccent: Story = {
  args: { defaultValue: 4, theme: "pink" },
};

/** Read-only display — no interactive segments are rendered, hover has no effect. */
export const ReadOnly: Story = {
  args: { value: 3.5, fractions: 2, readOnly: true },
};

/** Disabled state — reduced opacity and pointer events turned off. */
export const Disabled: Story = {
  args: { defaultValue: 2, disabled: true },
};

/** Half-star precision via fractions={2} — hover and select at 0.5 intervals. */
export const HalfStars: Story = {
  args: { fractions: 2, defaultValue: 2.5 },
};

/** Highlights only the selected symbol rather than all symbols up to it. */
export const HighlightSelectedOnly: Story = {
  args: { defaultValue: 3, highlightSelectedOnly: true },
};

/** Elevation shadow ladder applied via the inherited `shadow` prop. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} flexDirection="column" gap="$xs" alignItems="center">
          <Rating {...args} shadow={shadow} defaultValue={3} />
          <Text fontSize="$sm" color="$color10">
            {shadow}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Custom symbol nodes replace the default star glyphs for empty and filled states. */
export const CustomSymbols: Story = {
  args: {
    emptySymbol: <Text>♡</Text>,
    fullSymbol: <Text>♥</Text>,
    size: "lg",
    defaultValue: 3,
  },
};

/** Custom count — ten-point scale with a heart theme. */
export const CustomCount: Story = {
  args: {
    count: 10,
    size: "sm",
    defaultValue: 7,
    emptySymbol: <Text>♡</Text>,
    fullSymbol: <Text>♥</Text>,
  },
};

/** Fully controlled — value is managed in React state; onChange keeps it in sync. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState(0);
    return (
      <Box gap="$md" alignItems="center">
        <Rating {...args} value={value} onChange={setValue} />
        <Text fontSize="$sm" color="$color10">
          Selected: {value > 0 ? value : "none"}
        </Text>
      </Box>
    );
  },
};

/** Dense visual regression matrix across sizes and common states. */
export const Matrix: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$md">
      {SIZES.map((size) => (
        <Box key={size} flexDirection="row" gap="$lg" alignItems="center">
          <Text width="$xl" fontSize="$sm" color="$color10">
            {size}
          </Text>
          <Rating {...args} size={size} defaultValue={3} />
          <Rating {...args} size={size} defaultValue={2.5} fractions={2} />
          <Rating {...args} size={size} value={4} readOnly />
          <Rating {...args} size={size} defaultValue={3} disabled />
        </Box>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `root` and each `symbol`. */
export const Styles: Story = {
  args: {
    size: "lg",
    defaultValue: 3,
    styles: {
      root: { backgroundColor: "$blue3", padding: "$xs", borderRadius: "$sm" },
      symbol: { borderColor: "$blue7", borderWidth: 1 },
    },
  },
};
