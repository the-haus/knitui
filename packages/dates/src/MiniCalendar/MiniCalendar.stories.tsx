import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import type { DateStringValue } from "../types";
import { MiniCalendar } from "./MiniCalendar";

const meta = {
  title: "Dates/MiniCalendar",
  component: MiniCalendar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`MiniCalendar` is a standalone compact horizontal day strip (not a `Calendar` composition). It renders `numberOfDays` consecutive days from the displayed start date, with prev/next controls that page the window by a full strip and respect `minDate` / `maxDate`. Selecting a day commits it; each day is labelled with its month above the day number.",
      },
    },
  },
  args: {
    numberOfDays: 7,
    size: "md",
  },
  argTypes: {
    numberOfDays: {
      control: { type: "number", min: 3, max: 14, step: 1 },
      description: "Number of days shown in the strip.",
    },
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Width/font of the controls and day cells.",
    },
  },
} satisfies Meta<typeof MiniCalendar>;

export default meta;

type Story = StoryObj<ComponentProps<typeof MiniCalendar>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="$md" alignItems="center">
        <MiniCalendar {...args} defaultDate="2026-06-15" value={value} onChange={setValue} />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Default 7-day strip. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-15");
    return <MiniCalendar defaultDate="2026-06-15" value={value} onChange={setValue} />;
  },
};

/** A longer 10-day window that crosses a month boundary (note the month labels). */
export const CrossingMonths: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <MiniCalendar defaultDate="2026-06-26" numberOfDays={10} value={value} onChange={setValue} />
    );
  },
};

/** Bounded — paging is blocked once the window would leave `[minDate, maxDate]`. */
export const Bounded: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <MiniCalendar
        defaultDate="2026-06-15"
        minDate="2026-06-10"
        maxDate="2026-06-24"
        value={value}
        onChange={setValue}
      />
    );
  },
};

/** Per-slot `styles` sugar — recolour/round parts without composing them by hand. */
export const StylesSugar: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-15");
    return (
      <MiniCalendar
        defaultDate="2026-06-15"
        value={value}
        onChange={setValue}
        styles={{
          day: { borderRadius: "$lg" },
          control: { borderRadius: "$lg", backgroundColor: "$color2" },
          dayMonth: { fontWeight: "600" },
        }}
      />
    );
  },
};

/** Theme accent — `theme="red"` recolours the selected day with zero per-component logic. */
export const ThemeAccent: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-15");
    return (
      <Box theme="red">
        <MiniCalendar defaultDate="2026-06-15" value={value} onChange={setValue} />
      </Box>
    );
  },
};

/** Every size token. */
export const Sizes: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="$lg">
        {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
          <Box key={size} gap="$xs">
            <Text fontSize="$sm" color="$color11">
              {size}
            </Text>
            <MiniCalendar size={size} defaultDate="2026-06-15" value={value} onChange={setValue} />
          </Box>
        ))}
      </Box>
    );
  },
};
