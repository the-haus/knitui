import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import type { DatesRangeValue, DateStringValue } from "../types";
import { DateTimePicker } from "./DateTimePicker";

const meta = {
  title: "Dates/DateTimePicker",
  component: DateTimePicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          '`DateTimePicker` is the input-trigger date + time picker. Pressing the trigger opens a popover (or modal) holding an `InlineDateTimePicker` — a `DatePicker` plus one or two `TimePicker`s and a submit button. Picking a date + time fills the trigger; the submit button (or Enter in a time input) commits and closes. `type="range"` selects a `[start, end]` pair with independent times. Values round-trip as `YYYY-MM-DD HH:mm:ss` strings.',
      },
    },
  },
} satisfies Meta<typeof DateTimePicker>;

export default meta;

type Story = StoryObj<typeof DateTimePicker>;

/** Single date + time selection (`type="default"`). */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="$md" width={320}>
        <DateTimePicker
          label="Appointment"
          placeholder="Pick date & time"
          value={value}
          onChange={setValue}
          defaultDate="2026-06-15"
        />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Seconds input shown in the dropdown and reflected in the trigger format. */
export const WithSeconds: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="$md" width={320}>
        <DateTimePicker
          label="Precise time"
          withSeconds
          value={value}
          onChange={setValue}
          defaultDate="2026-06-15"
        />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** A new selection picks up `defaultTimeValue` instead of midnight. */
export const DefaultTimeValue: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="$md" width={320}>
        <DateTimePicker
          label="Defaults to 09:00"
          defaultTimeValue="09:00"
          value={value}
          onChange={setValue}
          defaultDate="2026-06-15"
        />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Range selection (`type="range"`) — a start and end date, each with its own time. */
export const Range: Story = {
  render: () => {
    const [value, setValue] = React.useState<DatesRangeValue<DateStringValue>>([null, null]);
    return (
      <Box gap="$md" width={360}>
        <DateTimePicker
          type="range"
          label="Window"
          value={value}
          onChange={setValue}
          defaultDate="2026-06-15"
        />
        <Text fontSize="$sm" color="$color11">
          {value[0] ?? "—"} → {value[1] ?? "—"}
        </Text>
      </Box>
    );
  },
};

/** Clearable field — a clear button appears in the right section once a value is set. */
export const Clearable: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-15 13:30:00");
    return (
      <Box gap="$md" width={320}>
        <DateTimePicker label="Clearable" clearable value={value} onChange={setValue} />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Bounded selection — out-of-`[minDate, maxDate]` days are disabled and the value is clamped on close. */
export const MinMax: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="$md" width={320}>
        <DateTimePicker
          label="Within range"
          value={value}
          onChange={setValue}
          defaultDate="2026-06-15"
          minDate="2026-06-05"
          maxDate="2026-06-25"
        />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Custom trigger format via a `valueFormat` string. */
export const CustomFormat: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-15 13:30:00");
    return (
      <Box width={320}>
        <DateTimePicker
          label="YYYY-MM-DD HH:mm"
          valueFormat="YYYY-MM-DD HH:mm"
          value={value}
          onChange={setValue}
        />
      </Box>
    );
  },
};

/** Opens in a centered modal instead of a popover (`dropdownType="modal"`). */
export const ModalDropdown: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box width={320}>
        <DateTimePicker
          label="Modal dropdown"
          dropdownType="modal"
          value={value}
          onChange={setValue}
          defaultDate="2026-06-15"
        />
      </Box>
    );
  },
};

/** Disabled trigger — the dropdown can't open. */
export const Disabled: Story = {
  render: () => (
    <Box width={320}>
      <DateTimePicker label="Disabled" disabled defaultDate="2026-06-15" />
    </Box>
  ),
};
