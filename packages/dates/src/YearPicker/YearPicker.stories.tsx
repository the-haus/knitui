import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import type { DatesRangeValue, DateStringValue } from "../types";
import { YearPicker } from "./YearPicker";

const meta = {
  title: "Dates/YearPicker",
  component: YearPicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          '`YearPicker` is the inline year-selection picker — a `Calendar` pinned to the decade level (`minLevel="decade"`). Selects years in `default` / `range` / `multiple` modes; values are `YYYY-MM-DD` strings normalised to Jan 1 of the year.',
      },
    },
  },
} satisfies Meta<typeof YearPicker>;

export default meta;

type Story = StoryObj<typeof YearPicker>;

/** Single year selection. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="$md" alignItems="center">
        <YearPicker value={value} onChange={setValue} defaultDate="2026-01-01" />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Range of years (`type="range"`). */
export const Range: Story = {
  render: () => {
    const [value, setValue] = React.useState<DatesRangeValue<DateStringValue>>([null, null]);
    return (
      <Box gap="$md" alignItems="center">
        <YearPicker type="range" value={value} onChange={setValue} defaultDate="2026-01-01" />
        <Text fontSize="$sm" color="$color11">
          {value[0] ?? "—"} → {value[1] ?? "—"}
        </Text>
      </Box>
    );
  },
};

/** Multiple years toggled into an array. */
export const Multiple: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue[]>([]);
    return (
      <Box gap="$md" alignItems="center">
        <YearPicker type="multiple" value={value} onChange={setValue} defaultDate="2026-01-01" />
        <Text fontSize="$sm" color="$color11">
          {value.length ? value.join(", ") : "none"}
        </Text>
      </Box>
    );
  },
};
