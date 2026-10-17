import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import type { DatesRangeValue, DateStringValue } from "../types";
import { InlineDateTimePicker } from "./InlineDateTimePicker";

const meta = {
  title: "Dates/_Internal/InlineDateTimePicker",
  component: InlineDateTimePicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          '`InlineDateTimePicker` is the always-open body of `DateTimePicker`: a `DatePicker` plus one (or, with `type="range"`, two) `TimePicker`s and a submit button, with no popover. Picking a day assigns the current time (or `defaultTimeValue`) and focuses the hours segment; editing the time re-assigns it onto the selected date. The time row only shows on the month level. Values round-trip as `YYYY-MM-DD HH:mm:ss` strings.',
      },
    },
  },
} satisfies Meta<typeof InlineDateTimePicker>;

export default meta;

type Story = StoryObj<typeof InlineDateTimePicker>;

/** Single date + time, controlled. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="md" width={320}>
        <InlineDateTimePicker value={value} onChange={setValue} defaultDate="2026-06-15" />
        <Text fontSize="sm" color="color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Seconds segment in the time row. */
export const WithSeconds: Story = {
  render: () => (
    <Box width={320}>
      <InlineDateTimePicker withSeconds defaultDate="2026-06-15" />
    </Box>
  ),
};

/** A newly picked day starts at 09:00 instead of midnight. */
export const DefaultTimeValue: Story = {
  render: () => (
    <Box width={320}>
      <InlineDateTimePicker defaultTimeValue="09:00" defaultDate="2026-06-15" />
    </Box>
  ),
};

/** `type="range"` — a start and an end time plus the formatted range summary. */
export const Range: Story = {
  render: () => {
    const [value, setValue] = React.useState<DatesRangeValue<DateStringValue>>([null, null]);
    return (
      <Box gap="md" width={320}>
        <InlineDateTimePicker
          type="range"
          value={value}
          onChange={setValue}
          defaultDate="2026-06-15"
          defaultTimeValue="09:00"
        />
        <Text fontSize="sm" color="color11">
          {value[0] ?? "…"} → {value[1] ?? "…"}
        </Text>
      </Box>
    );
  },
};

/** Bounds: days outside `[minDate, maxDate]` are disabled; the time row clamps on those days. */
export const MinMax: Story = {
  render: () => (
    <Box width={320}>
      <InlineDateTimePicker
        defaultDate="2026-06-15"
        minDate="2026-06-10 09:00:00"
        maxDate="2026-06-20 17:00:00"
      />
    </Box>
  ),
};

/** `onSubmit` fires from the check button (and Enter in a time input via the wrapper). */
export const Submit: Story = {
  render: () => {
    const [submitted, setSubmitted] = React.useState(0);
    return (
      <Box gap="md" width={320}>
        <InlineDateTimePicker
          defaultDate="2026-06-15"
          onSubmit={() => setSubmitted((n) => n + 1)}
          submitButtonProps={{ "aria-label": "Apply" }}
        />
        <Text fontSize="sm" color="color11">
          Submitted {submitted}×
        </Text>
      </Box>
    );
  },
};

/** Accent from the active theme. */
export const Themed: Story = {
  render: () => (
    <Box width={320}>
      <InlineDateTimePicker
        theme="blue"
        defaultDate="2026-06-15"
        defaultValue="2026-06-18 10:30:00"
      />
    </Box>
  ),
};

/** Per-slot `styles` sugar over the wrapper parts (explicit `*Props` still win). */
export const Styles: Story = {
  render: () => (
    <Box width={320}>
      <InlineDateTimePicker
        defaultDate="2026-06-15"
        styles={{
          timeWrapper: { marginTop: "md", gap: "sm" },
          submitButton: { variant: "filled" },
        }}
      />
    </Box>
  ),
};
