import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "@knitui/components";

import type { DatesRangeValue, DateStringValue } from "../types";
import { MonthPickerInput } from "./MonthPickerInput";

const meta = {
  title: "Dates/MonthPickerInput",
  component: MonthPickerInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`MonthPickerInput` is the input-trigger month picker: an `InputBase` trigger opening a `MonthPicker` dropdown. Supports `default` / `range` / `multiple` selection, `label` / `description` / `placeholder`, and `clearable`.",
      },
    },
  },
} satisfies Meta<typeof MonthPickerInput>;

export default meta;

type Story = StoryObj<typeof MonthPickerInput>;

const Frame = ({ children }: { children: React.ReactNode }) => <Box width={320}>{children}</Box>;

/** Single month with a label. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Frame>
        <MonthPickerInput
          label="Billing month"
          placeholder="Pick a month"
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Range of months in the trigger. */
export const Range: Story = {
  render: () => {
    const [value, setValue] = React.useState<DatesRangeValue<DateStringValue>>([null, null]);
    return (
      <Frame>
        <MonthPickerInput
          type="range"
          label="Reporting period"
          placeholder="From – to"
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Clearable single month. */
export const Clearable: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-01");
    return (
      <Frame>
        <MonthPickerInput label="Month" clearable value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** Custom display format via `valueFormat`. */
export const CustomFormat: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-01");
    return (
      <Frame>
        <MonthPickerInput
          label="ISO month"
          valueFormat="YYYY-MM"
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
        <MonthPickerInput
          label="Billing month"
          placeholder="Pick a month"
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
        <MonthPickerInput
          label="Start month"
          description="When the plan begins"
          placeholder="Pick a month"
          required
          error={value ? undefined : "This field is required"}
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};
