import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { AmPmInput } from "./AmPmInput";

const labels = { am: "AM", pm: "PM" };

const meta = {
  title: "Dates/AmPmInput",
  component: AmPmInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "The controlled am/pm leaf the composed `TimePicker` pairs with `SpinInput` in `12h` mode. On web it is a text field driven by letter entry (`a`/`p`) and an Arrow/Home/End/Backspace keyboard machine; on native it is a non-editable tap-to-toggle segment (no soft keyboard). Built on a single kit `Input` — never a raw `<select>`/`<input>`.",
      },
    },
  },
  args: { focusable: true },
  argTypes: {
    value: { control: false },
    onChange: { control: false },
    labels: { control: false },
    focusable: { control: "boolean", description: "Whether the field is in the tab order." },
    readOnly: { control: "boolean", description: "Whether the field rejects edits." },
    disabled: { control: "boolean", description: "Whether the field is disabled." },
  },
} satisfies Meta<typeof AmPmInput>;

export default meta;

type Story = StoryObj<ComponentProps<typeof AmPmInput>>;

/** Interactive playground — type `a`/`p`, use the arrows, or tap on native. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("");
    return (
      <Box gap="$md" alignItems="center">
        <AmPmInput {...args} labels={labels} value={value} onChange={setValue} />
        <Text fontSize="$sm" color="$color11">
          Value: {value === "" ? "empty" : value}
        </Text>
      </Box>
    );
  },
};

/** Default empty segment, showing the `--` placeholder. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    return <AmPmInput labels={labels} focusable value={value} onChange={setValue} />;
  },
};

/** A pre-selected value. */
export const Filled: Story = {
  render: () => {
    const [value, setValue] = React.useState("PM");
    return <AmPmInput labels={labels} focusable value={value} onChange={setValue} />;
  },
};

/** Read-only — edits and keyboard input are rejected. */
export const ReadOnly: Story = {
  render: () => {
    const [value, setValue] = React.useState("AM");
    return <AmPmInput labels={labels} focusable readOnly value={value} onChange={setValue} />;
  },
};

/** Disabled — dimmed and non-interactive. */
export const Disabled: Story = {
  render: () => {
    const [value, setValue] = React.useState("AM");
    return <AmPmInput labels={labels} focusable disabled value={value} onChange={setValue} />;
  },
};

/** Localized labels — typed first letters match the localized strings (`vm`/`nm`). */
export const Localized: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    return (
      <Box gap="$md" alignItems="center">
        <AmPmInput labels={{ am: "vm", pm: "nm" }} focusable value={value} onChange={setValue} />
        <Text fontSize="$sm" color="$color11">
          Value: {value === "" ? "empty" : value}
        </Text>
      </Box>
    );
  },
};
