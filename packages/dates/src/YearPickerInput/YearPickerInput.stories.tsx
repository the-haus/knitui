import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "@knitui/components";

import type { DatesRangeValue, DateStringValue } from "../types";
import { YearPickerInput } from "./YearPickerInput";

const meta = {
  title: "Dates/YearPickerInput",
  component: YearPickerInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`YearPickerInput` is the input-trigger year picker: an `InputBase` trigger opening a `YearPicker` dropdown. Supports `default` / `range` / `multiple` selection, `label` / `description` / `placeholder`, and `clearable`.",
      },
    },
  },
} satisfies Meta<typeof YearPickerInput>;

export default meta;

type Story = StoryObj<typeof YearPickerInput>;

const Frame = ({ children }: { children: React.ReactNode }) => <Box width={320}>{children}</Box>;

/** Single year with a label. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Frame>
        <YearPickerInput
          label="Fiscal year"
          placeholder="Pick a year"
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Range of years in the trigger. */
export const Range: Story = {
  render: () => {
    const [value, setValue] = React.useState<DatesRangeValue<DateStringValue>>([null, null]);
    return (
      <Frame>
        <YearPickerInput
          type="range"
          label="Year range"
          placeholder="From – to"
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Clearable single year. */
export const Clearable: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-01-01");
    return (
      <Frame>
        <YearPickerInput label="Year" clearable value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** Custom display format via `valueFormat`. */
export const CustomFormat: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-01-01");
    return (
      <Frame>
        <YearPickerInput label="Short year" valueFormat="YY" value={value} onChange={setValue} />
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
        <YearPickerInput
          label="Fiscal year"
          placeholder="Pick a year"
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
        <YearPickerInput
          label="Start year"
          description="When the plan begins"
          placeholder="Pick a year"
          required
          error={value ? undefined : "This field is required"}
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};
