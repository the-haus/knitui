import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "@knitui/components";

import type { DateStringValue } from "../types";
import { DateInput } from "./DateInput";

const meta = {
  title: "Dates/DateInput",
  component: DateInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`DateInput` is the free-typing single-date field: an editable `Input` trigger that opens a `Calendar` in a popover. Typing a value in `valueFormat` (default `'MMMM D, YYYY'`) parses and selects it; an unparseable string is preserved while typing and (with `fixOnBlur`, the default) reverts on blur; picking a day fills the input and closes the dropdown. Supports `label`, `description`, `placeholder`, `error`, `required`, `clearable`, `withTime`, and per-slot `styles`.",
      },
    },
  },
} satisfies Meta<typeof DateInput>;

export default meta;

type Story = StoryObj<typeof DateInput>;

const Frame = ({ children }: { children: React.ReactNode }) => <Box width={320}>{children}</Box>;

/** Single date with a label and placeholder. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Frame>
        <DateInput
          label="Event date"
          placeholder="Type or pick a date"
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Clearable — a clear button appears in the trigger once a value is set. */
export const Clearable: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-15");
    return (
      <Frame>
        <DateInput label="Deadline" clearable value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** Custom display + parse format via `valueFormat`. */
export const CustomFormat: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-15");
    return (
      <Frame>
        <DateInput label="ISO format" valueFormat="YYYY-MM-DD" value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** `withTime` preserves the time portion when `valueFormat` includes it. */
export const WithTime: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Frame>
        <DateInput
          label="Appointment"
          placeholder="MMMM D, YYYY HH:mm"
          withTime
          valueFormat="MMMM D, YYYY HH:mm"
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Bounded input — values outside `[minDate, maxDate]` are not accepted. */
export const WithBounds: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Frame>
        <DateInput
          label="In range only"
          placeholder="Jan 2026"
          minDate={new Date(2026, 0, 1)}
          maxDate={new Date(2026, 0, 31)}
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Required field with a description and an error message. */
export const WithValidation: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Frame>
        <DateInput
          label="Birth date"
          description="Used to verify your age"
          placeholder="Type your birthday"
          required
          error={value ? undefined : "This field is required"}
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Per-slot `styles` sugar — props spread onto the composed parts. */
export const SlotStylesSugar: Story = {
  name: "Slot styles",
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-15");
    return (
      <Frame>
        <DateInput
          label="Themed"
          value={value}
          onChange={setValue}
          styles={{
            input: { borderRadius: "$lg" },
            dropdown: { padding: "$md" },
          }}
        />
      </Frame>
    );
  },
};
