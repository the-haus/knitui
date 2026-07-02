import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { PickerControl } from "./PickerControl";

// A short strip of months used by the range stories.
const MONTHS = ["Jan", "Feb", "Mar", "Apr"] as const;

const meta = {
  title: "Dates/PickerControl",
  component: PickerControl,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The month/year/decade grid cell — the `Day` analogue for the year & decade levels, built on `UnstyledButton`. Every per-cell state (selected, in-range, first/last-in-range, disabled, fullWidth) is a boolean variant; accent comes from the active Tamagui `theme=` ramp (no `color` prop, no hex).",
      },
    },
  },
  args: { children: "Jan", size: "md", "aria-label": "January 2026" },
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Width/font of the control.",
    },
    selected: { control: "boolean" },
    inRange: { control: "boolean" },
    firstInRange: { control: "boolean" },
    lastInRange: { control: "boolean" },
    disabled: { control: "boolean" },
    fullWidth: { control: "boolean" },
  },
} satisfies Meta<typeof PickerControl>;

export default meta;

type Story = StoryObj<ComponentProps<typeof PickerControl>>;

/** Interactive playground — tweak every state from the Controls panel. */
export const Playground: Story = {};

/** A plain, interactive control. */
export const Default: Story = {};

/** Selected — solid accent fill with contrast-coloured label. */
export const Selected: Story = {
  args: { selected: true },
};

/** Disabled — dimmed and non-interactive (selection/range styling suppressed). */
export const Disabled: Story = {
  args: { disabled: true },
};

/**
 * A selected range across a month strip: the edges round their outer corners
 * (`firstInRange`/`lastInRange`), the middle is a squared `$color4` tint, and the
 * endpoints are `selected`. Cells sit flush so the tint reads as one band.
 */
export const Range: Story = {
  render: () => (
    <Box flexDirection="row">
      {MONTHS.map((month, index) => {
        const first = index === 0;
        const last = index === MONTHS.length - 1;
        return (
          <PickerControl
            key={month}
            aria-label={month}
            inRange
            firstInRange={first}
            lastInRange={last}
            selected={first || last}
          >
            {month}
          </PickerControl>
        );
      })}
    </Box>
  ),
};

/** Custom content — a non-text node renders without a label. */
export const CustomContent: Story = {
  args: {
    children: (
      <Box alignItems="center">
        <Text>2026</Text>
        <Box width={4} height={4} borderRadius={2} backgroundColor="$color9" marginTop={2} />
      </Box>
    ),
  },
};

/** The accent recolors with the Tamagui `theme=` prop — no `color` prop, no hex. */
export const Themed: Story = {
  args: { selected: true, theme: "red" },
};

/** Every size token, from `xxs` to `xxl`. */
export const Sizes: Story = {
  render: () => (
    <Box flexDirection="row" gap="$lg" alignItems="center">
      {(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const).map((size) => (
        <Box key={size} gap="$xs" alignItems="center">
          <Text fontSize="$sm" color="$color11">
            {size}
          </Text>
          <PickerControl size={size} selected aria-label={`Jan ${size}`}>
            Jan
          </PickerControl>
        </Box>
      ))}
    </Box>
  ),
};
