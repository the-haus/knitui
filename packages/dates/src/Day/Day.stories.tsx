import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import type { DateStringValue } from "../types";
import { Day } from "./Day";

const DATE = "2026-06-15" satisfies DateStringValue;
// A short week strip used by the range stories.
const WEEK = [
  "2026-06-15",
  "2026-06-16",
  "2026-06-17",
  "2026-06-18",
  "2026-06-19",
] satisfies DateStringValue[];

const meta = {
  title: "Dates/Day",
  component: Day,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The atomic calendar cell — an `UnstyledButton`-based control. Every per-day state (selected, in-range, weekend, outside, today, disabled, static, hidden) is a boolean variant; accent comes from the active Tamagui `theme=` ramp (no `color` prop, no hex).",
      },
    },
  },
  args: { date: DATE, size: "md" },
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Width/height of the day.",
    },
    selected: { control: "boolean" },
    weekend: { control: "boolean" },
    outside: { control: "boolean" },
    disabled: { control: "boolean" },
    static: { control: "boolean" },
    highlightToday: { control: "boolean" },
  },
} satisfies Meta<typeof Day>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Day>>;

/** Interactive playground — tweak every state from the Controls panel. */
export const Playground: Story = {};

/** A plain, interactive day cell. */
export const Default: Story = {};

/** Selected — solid accent fill with contrast-coloured label. */
export const Selected: Story = {
  args: { selected: true },
};

/** Weekend — the label flips to the accent-error colour. */
export const Weekend: Story = {
  args: { weekend: true },
};

/** Outside the displayed month — dimmed. */
export const Outside: Story = {
  args: { outside: true },
};

/** Today — bordered highlight (only when not selected / in range). */
export const Today: Story = {
  args: { date: new Date().toISOString().slice(0, 10) as DateStringValue, highlightToday: true },
};

/** Disabled — dimmed and non-interactive (selection/range styling suppressed). */
export const Disabled: Story = {
  args: { disabled: true },
};

/** Static (display-only) — renders as a non-interactive `div`. */
export const Static: Story = {
  args: { static: true },
};

/**
 * A selected range across a week strip: the edges round their outer corners
 * (`firstInRange`/`lastInRange`), the middle is a squared `$color4` tint, and the
 * endpoints are `selected`. Cells sit flush so the tint reads as one band.
 */
export const Range: Story = {
  render: () => (
    <Box flexDirection="row">
      {WEEK.map((date, index) => {
        const first = index === 0;
        const last = index === WEEK.length - 1;
        return (
          <Day
            key={date}
            date={date}
            inRange
            firstInRange={first}
            lastInRange={last}
            selected={first || last}
          />
        );
      })}
    </Box>
  ),
};

/** Custom content via `renderDay` — a non-text node renders without a label. */
export const CustomRenderDay: Story = {
  args: {
    renderDay: (date) => (
      <Box alignItems="center">
        <Text>{new Date(date).getUTCDate()}</Text>
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
          <Day date={DATE} size={size} selected />
        </Box>
      ))}
    </Box>
  ),
};
