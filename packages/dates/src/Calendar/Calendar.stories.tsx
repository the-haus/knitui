import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { Calendar } from "./Calendar";

const meta = {
  title: "Dates/Calendar",
  component: Calendar,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`Calendar` is the keystone level state machine: it owns the displayed level (decade ↔ year ↔ month) and the displayed date, and renders one level group at a time. It is **display + navigation only** — it does not own a selection (the `DatePicker` family layers selection on top). `minLevel` / `maxLevel` clamp how far the user can zoom; `numberOfColumns` renders several months side by side. Accent comes from the active Tamagui theme.",
      },
    },
  },
  args: {
    size: "md",
    numberOfColumns: 1,
    minLevel: "month",
    maxLevel: "decade",
    static: false,
    fullWidth: false,
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Width/font of the header controls and cells.",
    },
    numberOfColumns: {
      control: { type: "number", min: 1, max: 4, step: 1 },
      description: "Number of month columns displayed next to each other.",
    },
    minLevel: {
      control: "inline-radio",
      options: ["month", "year", "decade"],
      description: "Min level the user can zoom in to.",
    },
    maxLevel: {
      control: "inline-radio",
      options: ["month", "year", "decade"],
      description: "Max level the user can zoom out to.",
    },
    static: {
      control: "boolean",
      description: "Render days as static (non-interactive) display cells.",
    },
    fullWidth: {
      control: "boolean",
      description: "Stretch the calendar to the full width of its container.",
    },
    defaultLevel: {
      control: "inline-radio",
      options: [undefined, "month", "year", "decade"],
      description: "Initial displayed level (uncontrolled).",
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Calendar>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  args: {
    defaultDate: "2026-06-15",
  },
};

/** Default month view, opened on June 2026. */
export const MonthLevel: Story = {
  args: { defaultDate: "2026-06-15", defaultLevel: "month" },
};

/** Year view — pick a month to zoom into it. */
export const YearLevel: Story = {
  args: { defaultDate: "2026-06-15", defaultLevel: "year" },
};

/** Decade view — pick a year to zoom into it. */
export const DecadeLevel: Story = {
  args: { defaultDate: "2026-06-15", defaultLevel: "decade" },
};

/** Three months side by side — `numberOfColumns={3}`. */
export const MultipleColumns: Story = {
  args: { defaultDate: "2026-06-15", numberOfColumns: 3 },
};

/** Bounded range — only March–September 2026 is navigable/selectable. */
export const MinMaxDate: Story = {
  args: { defaultDate: "2026-06-15", minDate: "2026-03-01", maxDate: "2026-09-30" },
};

/** Custom day rendering — weekend numbers get a colored dot via `renderDay`. */
export const CustomRenderDay: Story = {
  args: {
    defaultDate: "2026-06-15",
    renderDay: (date) => {
      const day = new Date(date).getUTCDay();
      const isWeekend = day === 0 || day === 6;
      return (
        <Box alignItems="center">
          <Text>{new Date(date).getUTCDate()}</Text>
          {isWeekend && (
            <Box width={4} height={4} borderRadius={2} backgroundColor="$color9" marginTop={2} />
          )}
        </Box>
      );
    },
  },
};

/**
 * The accent recolors with the Tamagui `theme=` prop — no `color` prop, no hex.
 * Here the whole calendar renders in the `red` ramp.
 */
export const Themed: Story = {
  args: { defaultDate: "2026-06-15", theme: "red" },
};

/**
 * `Calendar.Frame` is the styled root, exposed as the single extension point —
 * `styled(Calendar.Frame, …)` (here a bordered, padded surface) and the
 * forwarded frame style props both land on the root.
 */
export const FramedSurface: Story = {
  args: {
    defaultDate: "2026-06-15",
    padding: "$md",
    borderWidth: 1,
    borderColor: "$borderColor",
    borderRadius: "$md",
  },
};

/** Every size token, from `xxs` to `xxl`, at the month level. */
export const Sizes: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Box key={size} gap="$xs" alignItems="center">
          <Text>{size}</Text>
          <Calendar size={size} defaultDate="2026-06-15" />
        </Box>
      ))}
    </Box>
  ),
};

/**
 * `fullWidth` stretches the whole calendar — header, weekday row and grid — to
 * its container's width, with the cells sharing each row equally. Unlike the
 * standalone `Month`, this exercises the full container chain (Calendar → level
 * group → level → grid), so every wrapper must opt into the stretch.
 */
export const FullWidth: Story = {
  render: () => (
    <Box width={360}>
      <Calendar fullWidth defaultDate="2026-06-15" />
    </Box>
  ),
};

/**
 * `fullWidth` fills BOTH axes. Given a fixed container height, the level fills it
 * below the header and the week rows distribute the extra vertical space (the day
 * cells grow taller). Switch levels to see the month/year grids fill the same way.
 */
export const FullWidthFilled: Story = {
  render: () => (
    <Box width={360} height={440}>
      <Calendar fullWidth defaultDate="2026-06-15" />
    </Box>
  ),
};
