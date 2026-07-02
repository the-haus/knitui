import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { AmPmControlsList } from "./AmPmControlsList";
import { TimeControlsList } from "./TimeControlsList";

const meta = {
  title: "Dates/TimeControlsList",
  component: TimeControlsList,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`TimeControlsList` is one scrollable dropdown column of `TimeControl`s (hours, minutes or seconds) for the `TimePicker` dropdown — built on the kit `ScrollArea` + a `Box` column of leaf controls, so it renders on web and native. Per-control sizing/colour/interaction live in the `TimeControl` leaf; `TimeControlsList` lays out the column, shares `size` via context, reveals the active control, and offers a per-value `getControlProps` passthrough plus per-slot `styles` sugar. Accent comes from the active Tamagui theme. Folder-local to `TimePicker` (not re-exported from the public barrel).",
      },
    },
  },
  args: {
    min: 0,
    max: 23,
    step: 1,
    reversed: false,
    maxHeight: 200,
    size: "sm",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Label font size.",
    },
    reversed: { control: "boolean", description: "Render the column in descending order." },
    maxHeight: { control: "number", description: "Max column height in px before it scrolls." },
  },
} satisfies Meta<typeof TimeControlsList>;

export default meta;

type Story = StoryObj<ComponentProps<typeof TimeControlsList>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<number | null>(null);
    return (
      <Box gap="$md" alignItems="center">
        <TimeControlsList {...args} value={value} onSelect={setValue} />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** The hours column with a selected value (revealed on open). */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<number | null>(9);
    return (
      <TimeControlsList
        min={0}
        max={23}
        step={1}
        value={value}
        onSelect={setValue}
        reversed={false}
      />
    );
  },
};

/** A minutes column stepped by 5. */
export const Stepped: Story = {
  render: () => {
    const [value, setValue] = React.useState<number | null>(30);
    return (
      <TimeControlsList
        min={0}
        max={59}
        step={5}
        value={value}
        onSelect={setValue}
        reversed={false}
      />
    );
  },
};

/** Descending order. */
export const Reversed: Story = {
  render: () => {
    const [value, setValue] = React.useState<number | null>(null);
    return (
      <TimeControlsList min={0} max={23} step={1} value={value} onSelect={setValue} reversed />
    );
  },
};

/** Per-slot `styles` sugar — recolour every control via the `control` slot. */
export const StyledSlots: Story = {
  render: () => {
    const [value, setValue] = React.useState<number | null>(2);
    return (
      <TimeControlsList
        min={0}
        max={11}
        step={1}
        value={value}
        onSelect={setValue}
        reversed={false}
        styles={{ control: { backgroundColor: "$blue4" } }}
      />
    );
  },
};

/** The two-cell am/pm variant shown in the 12h dropdown. */
export const AmPm: Story = {
  render: () => {
    const [value, setValue] = React.useState<string | null>("AM");
    return <AmPmControlsList labels={{ am: "AM", pm: "PM" }} value={value} onSelect={setValue} />;
  },
};

/** Every size token. */
export const Sizes: Story = {
  render: () => (
    <Box gap="$lg" flexDirection="row" alignItems="flex-start">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <Box key={size} gap="$xs" alignItems="center">
          <Text fontSize="$sm" color="$color11">
            {size}
          </Text>
          <TimeControlsList
            min={0}
            max={11}
            step={1}
            value={3}
            onSelect={() => {}}
            reversed={false}
            size={size}
            maxHeight={160}
          />
        </Box>
      ))}
    </Box>
  ),
};
