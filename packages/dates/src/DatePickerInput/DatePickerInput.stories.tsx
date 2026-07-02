import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "@knitui/components";

import type { DatesRangeValue, DateStringValue } from "../types";
import { DatePickerInput } from "./DatePickerInput";

const meta = {
  title: "Dates/DatePickerInput",
  component: DatePickerInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`DatePickerInput` is the input-trigger day picker: an `InputBase` trigger that opens a `DatePicker` in a popover (or modal). Pressing a day fills the trigger with the formatted value (`valueFormat`, default `'MMMM D, YYYY'`). `type=\"range\"` renders `start – end` and only commits once both ends are picked. Supports `label`, `description`, `placeholder`, `error`, `required`, and `clearable`.",
      },
    },
  },
} satisfies Meta<typeof DatePickerInput>;

export default meta;

type Story = StoryObj<typeof DatePickerInput>;

const Frame = ({ children }: { children: React.ReactNode }) => <Box width={320}>{children}</Box>;

/** Single date with a label and placeholder. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Frame>
        <DatePickerInput
          label="Event date"
          placeholder="Pick a date"
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Range trigger — renders `start – end` once both ends are chosen. */
export const Range: Story = {
  render: () => {
    const [value, setValue] = React.useState<DatesRangeValue<DateStringValue>>([null, null]);
    return (
      <Frame>
        <DatePickerInput
          type="range"
          label="Stay"
          placeholder="Check-in – check-out"
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
        <DatePickerInput label="Deadline" clearable value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** Custom display format via `valueFormat`. */
export const CustomFormat: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-15");
    return (
      <Frame>
        <DatePickerInput
          label="ISO format"
          valueFormat="YYYY-MM-DD"
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Presenting the picker in a centered modal instead of a popover. */
export const ModalDropdown: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Frame>
        <DatePickerInput
          label="Event date"
          placeholder="Pick a date"
          dropdownType="modal"
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
        <DatePickerInput
          label="Birth date"
          description="Used to verify your age"
          placeholder="Pick a date"
          required
          error={value ? undefined : "This field is required"}
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};
