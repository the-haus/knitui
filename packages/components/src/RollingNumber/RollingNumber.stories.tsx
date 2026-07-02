import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { RollingNumber, type RollingNumberFontSize } from "./RollingNumber";

const FONT_SIZES: RollingNumberFontSize[] = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

const meta = {
  title: "Display/RollingNumber",
  component: RollingNumber,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "An animated number whose digits roll between values. Supports prefix/suffix, thousands and decimal separators, configurable animation duration, and tabular (monospace) digit alignment. Respects the user's reduced-motion preference by snapping instead of rolling.",
      },
    },
  },
  args: {
    value: 1234,
    fontSize: "xxl",
    animationDuration: 600,
    tabularNumbers: true,
    withLiveRegion: false,
  },
  argTypes: {
    value: {
      control: "number",
      description: "The number value to display.",
    },
    fontSize: {
      control: "select",
      options: FONT_SIZES,
      description:
        "Digit font size. Standard values resolve against the fontSize scale; numbers are custom px sizes.",
    },
    animationDuration: {
      control: "number",
      description: "Roll animation duration in ms (0 disables animation).",
    },
    tabularNumbers: {
      control: "boolean",
      description: "Use monospace digits so columns stay aligned.",
    },
    withLiveRegion: {
      control: "boolean",
      description: "Announces changes to screen readers via an aria-live region.",
    },
    prefix: { control: "text" },
    suffix: { control: "text" },
    decimalSeparator: { control: "text" },
    thousandSeparator: { control: "text" },
    decimalScale: { control: "number" },
    fixedDecimalScale: { control: "boolean" },
  },
} satisfies Meta<typeof RollingNumber>;

export default meta;

type Story = StoryObj<ComponentProps<typeof RollingNumber>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Full font-size token scale shown side by side to illustrate the sizing knob. */
export const FontSizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      {FONT_SIZES.map((size) => (
        <Box key={size} gap="$xs" alignItems="center">
          <RollingNumber {...args} value={args.value} fontSize={size} />
          <Text fontSize="$xs" color="$color11">
            {size}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Numeric custom font size remains available for exact animation geometry. */
export const CustomFontSize: Story = {
  args: {
    value: 9876,
    fontSize: 40,
  },
};

/** Prefix and suffix characters rendered statically around the rolling digits. */
export const WithPrefixAndSuffix: Story = {
  args: {
    value: 1000,
    prefix: "$",
    suffix: " USD",
    thousandSeparator: true,
  },
};

/** Thousands separator groups digits for large numbers; decimal scale fixes the fractional part. */
export const FormattedNumber: Story = {
  render: (args) => (
    <Box gap="$md">
      <RollingNumber {...args} value={1234567} thousandSeparator />
      <RollingNumber {...args} value={9.5} decimalScale={2} fixedDecimalScale />
      <RollingNumber {...args} value={1000000} prefix="€" thousandSeparator suffix=" EUR" />
    </Box>
  ),
};

/** Negative value — the minus sign renders as a static character slot. */
export const NegativeValue: Story = {
  args: {
    value: -42,
  },
};

/** A controlled counter that increments and decrements so you can watch the roll animation. */
export const AnimatedCounter: Story = {
  render: (args) => {
    const [count, setCount] = React.useState(0);
    return (
      <Box gap="$md" alignItems="center">
        <RollingNumber {...args} value={count} fontSize="xxl" />
        <Box flexDirection="row" gap="$md">
          <Box
            onPress={() => setCount((n) => n - 1)}
            paddingHorizontal="$md"
            paddingVertical="$sm"
            backgroundColor="$color4"
            borderRadius="$sm"
          >
            <Text>−</Text>
          </Box>
          <Box
            onPress={() => setCount((n) => n + 1)}
            paddingHorizontal="$md"
            paddingVertical="$sm"
            backgroundColor="$color4"
            borderRadius="$sm"
          >
            <Text>+</Text>
          </Box>
        </Box>
      </Box>
    );
  },
};

/** Live region mode announces every value change to screen readers. */
export const LiveRegion: Story = {
  args: {
    value: 7,
    withLiveRegion: true,
  },
};

/** Animation disabled (duration=0) — digits snap immediately without rolling. */
export const NoAnimation: Story = {
  args: {
    value: 9876,
    animationDuration: 0,
  },
};

/** Per-slot `styles` targets individual parts — here the `digitViewport` and `digitText`. */
export const Styles: Story = {
  args: {
    value: 1234,
    styles: {
      digitViewport: { backgroundColor: "$blue3", borderRadius: "$xs" },
      digitText: { color: "$blue9", fontWeight: "700" },
    },
  },
};
