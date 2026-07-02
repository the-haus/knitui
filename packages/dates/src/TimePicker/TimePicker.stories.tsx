import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { TimePicker } from "./TimePicker";

const meta = {
  title: "Dates/TimePicker",
  component: TimePicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          '`TimePicker` is the segmented time input: hours/minutes/(seconds) are kit `SpinInput` segments, am/pm is the kit `AmPmInput`, all driven by the `use-time-picker` controller. The bordered field frame mirrors the kit input recipe and the segments render `variant="unstyled"`. `withDropdown` opens a `Popover` holding the `TimeControlsList` columns (or `TimePresets`). Supports `12h`/`24h` `format`, `withSeconds`, `min`/`max` clamping, `clearable`, `label`/`description`/`error`/`required`, per-segment `xxxInputProps`, and per-slot `styles` sugar (`field`/`segment`/`colon`/`dropdown` + the wrapper chrome). Cross-platform web + native from one source. Accent + error colours come from the active Tamagui theme.',
      },
    },
  },
  args: {
    type: "time",
    format: "24h",
    withSeconds: false,
    withDropdown: false,
    clearable: false,
    size: "sm",
  },
  argTypes: {
    type: { control: "inline-radio", options: ["time", "duration"] },
    format: { control: "inline-radio", options: ["24h", "12h"] },
    size: { control: "select", options: ["xs", "sm", "md", "lg", "xl"] },
    variant: { control: "select", options: ["default", "filled", "unstyled"] },
    withSeconds: { control: "boolean", description: "Show the seconds segment." },
    withDropdown: { control: "boolean", description: "Open a time-controls dropdown on focus." },
    clearable: { control: "boolean", description: "Show a clear button when filled." },
    readOnly: { control: "boolean" },
    disabled: { control: "boolean" },
    value: { control: false },
    onChange: { control: false },
  },
} satisfies Meta<typeof TimePicker>;

export default meta;

type Story = StoryObj<ComponentProps<typeof TimePicker>>;

const Frame = ({ children }: { children: React.ReactNode }) => <Box width={280}>{children}</Box>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("");
    return (
      <Frame>
        <TimePicker {...args} value={value} onChange={setValue} />
        <Text fontSize="$sm" color="$color11" marginTop="$sm">
          Value: {value === "" ? "empty" : value}
        </Text>
      </Frame>
    );
  },
};

/** Default 24h field with a label. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState("10:30");
    return (
      <Frame>
        <TimePicker label="Start time" value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** 12h format adds the am/pm segment. */
export const TwelveHour: Story = {
  name: "12h format",
  render: () => {
    const [value, setValue] = React.useState("13:30");
    return (
      <Frame>
        <TimePicker label="Meeting" format="12h" value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** With the seconds segment. */
export const WithSeconds: Story = {
  render: () => {
    const [value, setValue] = React.useState("10:30:15");
    return (
      <Frame>
        <TimePicker label="Lap time" withSeconds value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** `type="duration"` allows hours beyond 24 and forces 24h (no am/pm). */
export const Duration: Story = {
  render: () => {
    const [value, setValue] = React.useState("30:15");
    return (
      <Frame>
        <TimePicker label="Duration" type="duration" value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** The time-controls dropdown opens on focus when `withDropdown` is set. */
export const WithDropdown: Story = {
  render: () => {
    const [value, setValue] = React.useState("10:30");
    return (
      <Frame>
        <TimePicker label="Pick from list" withDropdown value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** Quick presets shown in the dropdown. */
export const WithPresets: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    return (
      <Frame>
        <TimePicker
          label="Slot"
          withDropdown
          presets={["09:00", "12:30", "17:30", "21:00"]}
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Clearable — a clear button appears once a value is set. */
export const Clearable: Story = {
  render: () => {
    const [value, setValue] = React.useState("10:30");
    return (
      <Frame>
        <TimePicker label="Deadline" clearable value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** Bounded — the value clamps into `[min, max]` when focus leaves the field. */
export const WithBounds: Story = {
  render: () => {
    const [value, setValue] = React.useState("12:00");
    return (
      <Frame>
        <TimePicker
          label="Office hours"
          description="Clamped to 09:00–17:00 on blur"
          min="09:00:00"
          max="17:00:00"
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
    const [value, setValue] = React.useState("");
    return (
      <Frame>
        <TimePicker
          label="Arrival"
          description="When do you arrive?"
          required
          error={value ? undefined : "This field is required"}
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Read-only and disabled states. */
export const States: Story = {
  render: () => (
    <Box gap="$md" width={280}>
      <TimePicker label="Read only" readOnly value="10:30" onChange={() => {}} />
      <TimePicker label="Disabled" disabled value="10:30" onChange={() => {}} />
    </Box>
  ),
};

/** Every size token. */
export const Sizes: Story = {
  render: () => {
    const [value, setValue] = React.useState("10:30");
    return (
      <Box gap="$md" width={280}>
        {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
          <TimePicker key={size} label={size} size={size} value={value} onChange={setValue} />
        ))}
      </Box>
    );
  },
};

/** Per-slot `styles` sugar — props spread onto the composed parts. */
export const SlotStylesSugar: Story = {
  name: "Slot styles",
  render: () => {
    const [value, setValue] = React.useState("10:30");
    return (
      <Frame>
        <TimePicker
          label="Themed"
          withDropdown
          value={value}
          onChange={setValue}
          styles={{
            field: { borderRadius: "$lg" },
            colon: { color: "$color11" },
            dropdown: { padding: "$xs" },
          }}
        />
      </Frame>
    );
  },
};
