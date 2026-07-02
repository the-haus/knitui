import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import type { DatesRangeValue, DateStringValue } from "../types";
import { MonthPicker } from "./MonthPicker";

const meta = {
  title: "Dates/MonthPicker",
  component: MonthPicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          '`MonthPicker` is the inline month-selection picker — a `Calendar` pinned to the year level (`minLevel="year"`), zooming year ↔ decade. Selects months in `default` / `range` / `multiple` modes; values are `YYYY-MM-DD` strings normalised to the first of the month.',
      },
    },
  },
} satisfies Meta<typeof MonthPicker>;

export default meta;

type Story = StoryObj<typeof MonthPicker>;

/** Single month selection. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="$md" alignItems="center">
        <MonthPicker value={value} onChange={setValue} defaultDate="2026-06-01" />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Range of months (`type="range"`). */
export const Range: Story = {
  render: () => {
    const [value, setValue] = React.useState<DatesRangeValue<DateStringValue>>([null, null]);
    return (
      <Box gap="$md" alignItems="center">
        <MonthPicker type="range" value={value} onChange={setValue} defaultDate="2026-06-01" />
        <Text fontSize="$sm" color="$color11">
          {value[0] ?? "—"} → {value[1] ?? "—"}
        </Text>
      </Box>
    );
  },
};

/** Multiple months toggled into an array. */
export const Multiple: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue[]>([]);
    return (
      <Box gap="$md" alignItems="center">
        <MonthPicker type="multiple" value={value} onChange={setValue} defaultDate="2026-06-01" />
        <Text fontSize="$sm" color="$color11">
          {value.length ? value.join(", ") : "none"}
        </Text>
      </Box>
    );
  },
};
