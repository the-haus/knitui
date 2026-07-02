import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { WeekdaysRow } from "./WeekdaysRow";

const meta = {
  title: "Dates/WeekdaysRow",
  component: WeekdaysRow,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`WeekdaysRow` is the localized weekday header for a calendar month — 7 labels (8 with `withWeekNumbers`) built from `Box`/`Text` (never an HTML `<tr>`/`<th>`), so it renders on web and native. Column width/font scale on the shared `cell-metrics` ladders so the header lines up with the `Day` grid. Reads locale/`firstDayOfWeek` from `DatesProvider`; offers per-slot `styles` sugar over its parts.",
      },
    },
  },
  args: {
    size: "md",
    withWeekNumbers: false,
    fullWidth: false,
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Width/font of the header columns.",
    },
    locale: { control: "text", description: "dayjs locale; falls back to DatesProvider." },
    firstDayOfWeek: {
      control: "select",
      options: [0, 1, 2, 3, 4, 5, 6],
      description: "First weekday of the row, 0 (Sunday) … 6 (Saturday).",
    },
    weekdayFormat: { control: "text", description: "dayjs format for weekday names." },
    withWeekNumbers: {
      control: "boolean",
      description: "Render a leading # heading for the week-number column.",
    },
    fullWidth: { control: "boolean", description: "Stretch columns to fill the row." },
  },
} satisfies Meta<typeof WeekdaysRow>;

export default meta;

type Story = StoryObj<ComponentProps<typeof WeekdaysRow>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {};

/** Default Monday-first header row. */
export const Default: Story = {
  render: () => <WeekdaysRow />,
};

/** Sunday-first ordering. */
export const SundayFirst: Story = {
  render: () => <WeekdaysRow firstDayOfWeek={0} />,
};

/** Leading `#` heading for the week-number column. */
export const WithWeekNumbers: Story = {
  render: () => <WeekdaysRow withWeekNumbers />,
};

/** A non-default locale (Russian). */
export const Localized: Story = {
  render: () => <WeekdaysRow locale="ru" />,
};

/** Full weekday names via a custom dayjs format. */
export const FullNames: Story = {
  render: () => <WeekdaysRow weekdayFormat="dddd" />,
};

/** Full-width header stretched to its container (aligns with a full-width Month). */
export const FullWidth: Story = {
  render: () => (
    <Box width={360}>
      <WeekdaysRow fullWidth />
    </Box>
  ),
};

/** Per-slot `styles` sugar — recolour the weekday labels via the `weekday` slot. */
export const StyledSlots: Story = {
  render: () => <WeekdaysRow styles={{ weekday: { color: "$blue9", fontWeight: "700" } }} />,
};

/** Every size token. */
export const Sizes: Story = {
  render: () => (
    <Box gap="$lg">
      {(["xs", "sm", "md", "lg"] as const).map((size) => (
        <Box key={size} gap="$xs">
          <Text fontSize="$sm" color="$color11">
            {size}
          </Text>
          <WeekdaysRow size={size} />
        </Box>
      ))}
    </Box>
  ),
};
