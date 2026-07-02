import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { SpinInput } from "./SpinInput";

const meta = {
  title: "Dates/SpinInput",
  component: SpinInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The controlled two-digit number leaf the composed `TimePicker` builds its hour/minute/second segments from. Digit entry rides the kit `Input`'s `onChangeText` (strip non-digits → clamp into `[min, max]` → auto-advance); focusing a segment selects all its text so typing replaces rather than appends. On web it exposes the `spinbutton` ARIA contract with an Arrow/Home/End/Backspace keyboard machine; on native it maps to the `adjustable` role. Built on a single kit `Input` — never a raw `<input>`.",
      },
    },
  },
  args: { focusable: true, min: 0, max: 59, step: 1 },
  argTypes: {
    value: { control: false },
    onChange: { control: false },
    min: { control: "number", description: "Smallest allowed value." },
    max: { control: "number", description: "Largest allowed value." },
    step: { control: "number", description: "Arrow-key increment/decrement step." },
    focusable: { control: "boolean", description: "Whether the field is in the tab order." },
    readOnly: { control: "boolean", description: "Whether the field rejects edits." },
    disabled: { control: "boolean", description: "Whether the field is disabled." },
    allowTemporaryZero: {
      control: "boolean",
      description: "Permit a transient `0` even when `min > 0`.",
    },
    disableAutoAdvance: {
      control: "boolean",
      description: "Disable auto-advance-to-next-segment.",
    },
    placeholder: { control: "text", description: "Placeholder shown when the value is `null`." },
  },
} satisfies Meta<typeof SpinInput>;

export default meta;

type Story = StoryObj<ComponentProps<typeof SpinInput>>;

/** Interactive playground — type digits, or use the arrows / Home / End / Backspace. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<number | null>(null);
    return (
      <Box gap="$md" alignItems="center">
        <SpinInput {...args} value={value} onChange={setValue} />
        <Text fontSize="$sm" color="$color11">
          Value: {value === null ? "empty" : value}
        </Text>
      </Box>
    );
  },
};

/** Default empty segment, showing the `--` placeholder. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<number | null>(null);
    return <SpinInput value={value} min={0} max={59} step={1} focusable onChange={setValue} />;
  },
};

/** A pre-filled value, padded to two digits. */
export const Filled: Story = {
  render: () => {
    const [value, setValue] = React.useState<number | null>(5);
    return <SpinInput value={value} min={0} max={59} step={1} focusable onChange={setValue} />;
  },
};

/** Hours in `12h` mode — `min={1}`, `max={12}`, with a transient zero allowed. */
export const TwelveHourHours: Story = {
  render: () => {
    const [value, setValue] = React.useState<number | null>(null);
    return (
      <Box gap="$md" alignItems="center">
        <SpinInput
          value={value}
          min={1}
          max={12}
          step={1}
          focusable
          allowTemporaryZero
          placeholder="hh"
          onChange={setValue}
        />
        <Text fontSize="$sm" color="$color11">
          Value: {value === null ? "empty" : value}
        </Text>
      </Box>
    );
  },
};

/** Read-only — edits and keyboard input are rejected. */
export const ReadOnly: Story = {
  render: () => {
    const [value, setValue] = React.useState<number | null>(12);
    return (
      <SpinInput value={value} min={0} max={59} step={1} focusable readOnly onChange={setValue} />
    );
  },
};

/** Disabled — dimmed and non-interactive. */
export const Disabled: Story = {
  render: () => {
    const [value, setValue] = React.useState<number | null>(12);
    return (
      <SpinInput value={value} min={0} max={59} step={1} focusable disabled onChange={setValue} />
    );
  },
};
