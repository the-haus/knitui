import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import type { DateStringValue } from "../types";
import { Month } from "./Month";

const MONTH = "2026-06-15"; // June 2026

const meta = {
  title: "Dates/Month",
  component: Month,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`Month` is the calendar month day grid — a column of week rows built from `Box`/`Text` + `Day` + `WeekdaysRow` (never an HTML `<table>`), so it renders on web and native. Per-cell sizing/colour/interaction live in the `Day` leaf; `Month` lays out the rows/cells, shares `size` via context, and offers a per-day `getDayProps` passthrough plus per-slot `styles` sugar. Accent comes from the active Tamagui theme.",
      },
    },
  },
  args: {
    month: MONTH,
    size: "md",
    withCellSpacing: true,
    hideOutsideDates: false,
    hideWeekdays: false,
    highlightToday: false,
    withWeekNumbers: false,
    fullWidth: false,
    static: false,
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Width/font of the grid cells.",
    },
    withCellSpacing: { control: "boolean", description: "Separate cells/rows with spacing." },
    hideOutsideDates: { control: "boolean", description: "Hide days outside the current month." },
    hideWeekdays: { control: "boolean", description: "Hide the weekday header row." },
    highlightToday: { control: "boolean", description: "Highlight today with a border." },
    withWeekNumbers: { control: "boolean", description: "Display a leading week-number column." },
    fullWidth: { control: "boolean", description: "Stretch the grid to its container width." },
    static: { control: "boolean", description: "Render days as non-interactive display cells." },
  },
} satisfies Meta<typeof Month>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Month>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="$md" alignItems="center">
        <Month
          {...args}
          getDayProps={(date) => ({ selected: date === value })}
          __onDayClick={(_event, date) => setValue(date)}
        />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Default month grid with a selected day. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-15");
    return (
      <Month
        month={MONTH}
        getDayProps={(date) => ({ selected: date === value })}
        __onDayClick={(_event, date) => setValue(date)}
      />
    );
  },
};

/** Outside days hidden — the trailing/leading adjacent-month cells disappear. */
export const HideOutsideDates: Story = {
  render: () => <Month month={MONTH} hideOutsideDates />,
};

/** Today highlighted with a border (uses the real current date). */
export const HighlightToday: Story = {
  render: () => <Month month={MONTH} highlightToday />,
};

/** Leading week-number column. */
export const WithWeekNumbers: Story = {
  render: () => <Month month={MONTH} withWeekNumbers />,
};

/** Bounded — days outside `[minDate, maxDate]` are disabled. */
export const Bounded: Story = {
  render: () => <Month month={MONTH} minDate="2026-06-10" maxDate="2026-06-24" />,
};

/** Static (display-only) grid — no interactive day buttons. */
export const StaticDisplay: Story = {
  render: () => <Month month={MONTH} static />,
};

/** Full-width grid stretched to its container's width (day cells share the row equally). */
export const FullWidth: Story = {
  render: () => (
    <Box width={360}>
      <Month month={MONTH} fullWidth />
    </Box>
  ),
};

/**
 * `fullWidth` fills BOTH axes: in a container with a fixed height the week rows
 * distribute the extra vertical space and the day cells grow taller to fill it.
 */
export const FullWidthFilled: Story = {
  render: () => (
    <Box width={360} height={420}>
      <Month month={MONTH} fullWidth />
    </Box>
  ),
};

/** Per-slot `styles` sugar — recolour the week-number labels via the `weekNumberLabel` slot. */
export const StyledSlots: Story = {
  render: () => (
    <Month
      month={MONTH}
      withWeekNumbers
      styles={{ weekNumberLabel: { color: "$blue9", fontWeight: "700" } }}
    />
  ),
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
          <Month month={MONTH} size={size} />
        </Box>
      ))}
    </Box>
  ),
};
