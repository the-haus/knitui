import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { TimeValue } from "./TimeValue";

const meta = {
  title: "Dates/TimeValue",
  component: TimeValue,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`TimeValue` is the time layer's simplest leaf: a pure formatter that renders a time `value` (an `HH:mm[:ss]` string or a `Date`) as text. `format` switches between `24h` (`13:30`) and `12h` (`1:30 PM`); `withSeconds` appends `:ss`; `amPmLabels` swaps the AM/PM words. The output is built from numeric clock components, so it is locale-independent. It renders through the kit `Text`, so it accepts the usual `Text` styling / `theme` props and forwards its ref.",
      },
    },
  },
  args: {
    value: "13:30:00",
    format: "24h",
    withSeconds: false,
  },
  argTypes: {
    value: { control: "text", description: 'Time to format — an "HH:mm:ss" string or a Date.' },
    format: {
      control: "inline-radio",
      options: ["24h", "12h"],
      description: "Clock display mode.",
    },
    withSeconds: { control: "boolean", description: "Display a seconds segment." },
  },
} satisfies Meta<typeof TimeValue>;

export default meta;

type Story = StoryObj<typeof TimeValue>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {};

/** Default `24h` formatting. */
export const Default: Story = {
  render: () => <TimeValue value="13:30:00" />,
};

/** `12h` mode with AM/PM. */
export const TwelveHour: Story = {
  render: () => (
    <Box gap="$xs">
      <TimeValue value="09:05:00" format="12h" />
      <TimeValue value="13:30:00" format="12h" />
      <TimeValue value="00:00:00" format="12h" />
    </Box>
  ),
};

/** Seconds appended in both modes. */
export const WithSeconds: Story = {
  render: () => (
    <Box gap="$xs">
      <TimeValue value="13:30:45" withSeconds />
      <TimeValue value="13:30:45" format="12h" withSeconds />
    </Box>
  ),
};

/** Localized AM/PM labels. */
export const CustomAmPmLabels: Story = {
  render: () => <TimeValue value="13:30:00" format="12h" amPmLabels={{ am: "a.m.", pm: "p.m." }} />,
};

/** A `Date` value reads its wall-clock time. */
export const FromDate: Story = {
  render: () => <TimeValue value={new Date(2026, 5, 16, 9, 5)} />,
};

/**
 * Inherits `Text` styling / `theme`: as a real text node it accepts the kit's
 * font props and recolors with the surrounding theme.
 */
export const Styled: Story = {
  render: () => (
    <Box gap="$xs" theme="red">
      <TimeValue value="13:30:00" fontSize="$xl" fontWeight="700" />
      <Text fontSize="$sm">themed via the surrounding theme</Text>
    </Box>
  ),
};
