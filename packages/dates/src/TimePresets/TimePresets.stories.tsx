import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import type { TimePickerPresetGroup } from "../types";
import { TimePresets } from "./TimePresets";

const LABELS = { am: "AM", pm: "PM" };

const FLAT = ["08:00", "10:30", "12:00", "14:15", "18:00", "21:45"];

const GROUPS: TimePickerPresetGroup[] = [
  { label: "Morning", values: ["08:00", "09:30", "11:00"] },
  { label: "Afternoon", values: ["13:00", "15:30", "17:00"] },
  { label: "Evening", values: ["19:00", "20:30", "22:00"] },
];

const meta = {
  title: "Dates/TimePresets",
  component: TimePresets,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`TimePresets` is the preset list shown in the `TimePicker` dropdown instead of the scroll columns — a flat `string[]` renders as one `SimpleGrid` of `TimePresetControl`s; a `TimePickerPresetGroup[]` renders one labelled `TimePresetGroup` per entry, all inside the kit `ScrollArea.Autosize`. Per-cell sizing/colour/interaction live in the `TimePresetControl` leaf; `TimePresets` lays out the list, shares `size` via context, and offers a per-value `getControlProps` passthrough plus per-slot `styles` sugar. Accent comes from the active Tamagui theme. Folder-local to `TimePicker` (not re-exported from the public barrel).",
      },
    },
  },
  args: {
    presets: FLAT,
    format: "24h",
    amPmLabels: LABELS,
    withSeconds: false,
    maxHeight: 200,
    size: "sm",
  },
  argTypes: {
    format: { control: "radio", options: ["24h", "12h"], description: "Clock display mode." },
    withSeconds: { control: "boolean", description: "Whether seconds are displayed." },
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Label font size.",
    },
    maxHeight: { control: "number", description: "Max content height in px before it scrolls." },
  },
} satisfies Meta<typeof TimePresets>;

export default meta;

type Story = StoryObj<ComponentProps<typeof TimePresets>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("12:00");
    return (
      <Box gap="$md" width={260}>
        <TimePresets {...args} value={value} onChange={setValue} />
        <Text fontSize="$sm" color="$color11">
          Selected: {value || "none"}
        </Text>
      </Box>
    );
  },
};

/** A flat `string[]` with the active preset highlighted. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState("12:00");
    return (
      <Box width={260}>
        <TimePresets
          presets={FLAT}
          format="24h"
          amPmLabels={LABELS}
          withSeconds={false}
          value={value}
          onChange={setValue}
        />
      </Box>
    );
  },
};

/** Labelled groups (`TimePickerPresetGroup[]`). */
export const Grouped: Story = {
  render: () => {
    const [value, setValue] = React.useState("15:30");
    return (
      <Box width={260}>
        <TimePresets
          presets={GROUPS}
          format="24h"
          amPmLabels={LABELS}
          withSeconds={false}
          value={value}
          onChange={setValue}
        />
      </Box>
    );
  },
};

/** 12h formatting via the shared `TimeValue`. */
export const TwelveHour: Story = {
  render: () => {
    const [value, setValue] = React.useState("08:00");
    return (
      <Box width={260}>
        <TimePresets
          presets={FLAT}
          format="12h"
          amPmLabels={LABELS}
          withSeconds={false}
          value={value}
          onChange={setValue}
        />
      </Box>
    );
  },
};

/** Per-slot `styles` sugar — recolour every preset cell via the `control` slot. */
export const StyledSlots: Story = {
  render: () => {
    const [value, setValue] = React.useState("12:00");
    return (
      <Box width={260}>
        <TimePresets
          presets={FLAT}
          format="24h"
          amPmLabels={LABELS}
          withSeconds={false}
          value={value}
          onChange={setValue}
          styles={{ control: { backgroundColor: "$blue4", borderColor: "$blue4" } }}
        />
      </Box>
    );
  },
};

/** Every size token. */
export const Sizes: Story = {
  render: () => (
    <Box gap="$lg" flexDirection="row" alignItems="flex-start">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <Box key={size} gap="$xs" width={160}>
          <Text fontSize="$sm" color="$color11">
            {size}
          </Text>
          <TimePresets
            presets={["08:00", "12:00", "18:00"]}
            format="24h"
            amPmLabels={LABELS}
            withSeconds={false}
            value="12:00"
            onChange={() => {}}
            size={size}
          />
        </Box>
      ))}
    </Box>
  ),
};
