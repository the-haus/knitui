import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { TimeInput } from "./TimeInput";

const meta = {
  title: "Dates/TimeInput",
  component: TimeInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          '`TimeInput` is the standalone, controlled time field — a kit `InputBase` that free-edits an `HH:mm[:ss]` string (no browser-native `type="time"`, so it works on native too). On blur the value is clamped into `[minTime, maxTime]`. `withSeconds` widens the placeholder to `--:--:--`. Carries `label` / `description` / `error` / `required` / `size` from the kit Input.',
      },
    },
  },
  args: {
    withSeconds: false,
    size: "sm",
  },
  argTypes: {
    withSeconds: {
      control: "boolean",
      description: "Expect/display a seconds segment.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Control size.",
    },
    minTime: { control: "text", description: "Minimum allowed time (clamped on blur)." },
    maxTime: { control: "text", description: "Maximum allowed time (clamped on blur)." },
  },
} satisfies Meta<typeof TimeInput>;

export default meta;

type Story = StoryObj<typeof TimeInput>;

const Frame = ({ children }: { children: React.ReactNode }) => <Box width={220}>{children}</Box>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("");
    return (
      <Frame>
        <TimeInput {...args} label="Time" value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** Basic `HH:mm` field. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState("09:30");
    return (
      <Box gap="$md" alignItems="center">
        <Frame>
          <TimeInput label="Start time" value={value} onChange={setValue} />
        </Frame>
        <Text fontSize="$sm" color="$color11">
          Value: {value || "empty"}
        </Text>
      </Box>
    );
  },
};

/** With a seconds segment (`withSeconds`). */
export const WithSeconds: Story = {
  render: () => {
    const [value, setValue] = React.useState("09:30:15");
    return (
      <Frame>
        <TimeInput label="Precise time" withSeconds value={value} onChange={setValue} />
      </Frame>
    );
  },
};

/** Clamped to office hours — values outside `09:00`–`17:00` snap back on blur. */
export const Bounded: Story = {
  render: () => {
    const [value, setValue] = React.useState("12:00");
    return (
      <Frame>
        <TimeInput
          label="Office hours"
          description="Clamped to 09:00–17:00 on blur"
          minTime="09:00"
          maxTime="17:00"
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};

/** Required field with an error state. */
export const WithValidation: Story = {
  render: () => {
    const [value, setValue] = React.useState("");
    return (
      <Frame>
        <TimeInput
          label="Appointment"
          required
          error={value ? undefined : "Pick a time"}
          value={value}
          onChange={setValue}
        />
      </Frame>
    );
  },
};
