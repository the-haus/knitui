import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import type { DatesRangeValue, DateStringValue } from "../types";
import { DatePicker } from "./DatePicker";

const meta = {
  title: "Dates/DatePicker",
  component: DatePicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`DatePicker` is the inline day-selection picker — a full `Calendar` driven by the shared selection machine. `type` switches between `default` (single date), `range` (`[start, end]` with a live hover preview), and `multiple` (toggle an array of days). Values are `YYYY-MM-DD` strings. Optional `presets` render quick-jump buttons beside the calendar.",
      },
    },
  },
} satisfies Meta<typeof DatePicker>;

export default meta;

type Story = StoryObj<typeof DatePicker>;

/** Single-date selection (`type="default"`). Click a day to select; the value is a `YYYY-MM-DD` string. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="$md" alignItems="center">
        <DatePicker value={value} onChange={setValue} defaultDate="2026-06-15" />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Range selection (`type="range"`). Pick a start then an end day. */
export const Range: Story = {
  render: () => {
    const [value, setValue] = React.useState<DatesRangeValue<DateStringValue>>([null, null]);
    return (
      <Box gap="$md" alignItems="center">
        <DatePicker type="range" value={value} onChange={setValue} defaultDate="2026-06-15" />
        <Text fontSize="$sm" color="$color11">
          {value[0] ?? "—"} → {value[1] ?? "—"}
        </Text>
      </Box>
    );
  },
};

/** Multiple selection (`type="multiple"`). Each click toggles a day in the array. */
export const Multiple: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue[]>([]);
    return (
      <Box gap="$md" alignItems="center">
        <DatePicker type="multiple" value={value} onChange={setValue} defaultDate="2026-06-15" />
        <Text fontSize="$sm" color="$color11">
          {value.length ? value.join(", ") : "none"}
        </Text>
      </Box>
    );
  },
};

/** Range picker with preset quick-jumps rendered beside the calendar. */
export const WithPresets: Story = {
  render: () => {
    const [value, setValue] = React.useState<DatesRangeValue<DateStringValue>>([null, null]);
    return (
      <DatePicker
        type="range"
        value={value}
        onChange={setValue}
        defaultDate="2026-06-15"
        presets={[
          { label: "First week of June", value: ["2026-06-01", "2026-06-07"] },
          { label: "Full month", value: ["2026-06-01", "2026-06-30"] },
          { label: "Q3", value: ["2026-07-01", "2026-09-30"] },
        ]}
      />
    );
  },
};

/** Two months shown side by side — handy for range selection. */
export const TwoColumns: Story = {
  render: () => {
    const [value, setValue] = React.useState<DatesRangeValue<DateStringValue>>([null, null]);
    return (
      <DatePicker
        type="range"
        numberOfColumns={2}
        value={value}
        onChange={setValue}
        defaultDate="2026-06-15"
      />
    );
  },
};

/** Bounded selection — only dates within `[minDate, maxDate]` are pickable. */
export const MinMax: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <DatePicker
        value={value}
        onChange={setValue}
        defaultDate="2026-06-15"
        minDate="2026-06-05"
        maxDate="2026-06-25"
      />
    );
  },
};

/**
 * `fullWidth` stretches the calendar to its container. With a fixed container
 * height it also fills vertically — the week rows distribute the extra height and
 * the day cells grow taller — so the picker fills a sized panel in both axes.
 */
export const FullWidth: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box width={360} height={440}>
        <DatePicker fullWidth value={value} onChange={setValue} defaultDate="2026-06-15" />
      </Box>
    );
  },
};
