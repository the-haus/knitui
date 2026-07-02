import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "@knitui/components";

import { MonthLevel } from "./MonthLevel";

const meta = {
  title: "Dates/MonthLevel",
  component: MonthLevel,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`MonthLevel` is the day-grid calendar level: a `CalendarHeader` (month label + prev/next/level controls) atop a `Month` day grid. A month zooms out to a year, so the level label stays interactive (`onLevelClick`). The prev/next controls auto-disable at the `minDate`/`maxDate` bounds, and the label honours `monthLabelFormat` + the `DatesProvider` locale. Use the `styles` prop to tweak the header parts and the grid.",
      },
    },
  },
  args: {
    month: "2024-01-01",
    size: "md",
    withNext: true,
    withPrevious: true,
    fullWidth: false,
    previousLabel: "Previous month",
    nextLabel: "Next month",
    levelControlAriaLabel: "Month",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Width/font of the header controls and day cells.",
    },
    month: { control: "text", description: "A date within the displayed month (`YYYY-MM-DD`)." },
    withNext: { control: "boolean", description: "Render the next control." },
    withPrevious: { control: "boolean", description: "Render the previous control." },
    fullWidth: { control: "boolean", description: "Take the full width of the container." },
  },
} satisfies Meta<typeof MonthLevel>;

export default meta;

type Story = StoryObj<ComponentProps<typeof MonthLevel>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Box width={280}>
      <MonthLevel {...args} />
    </Box>
  ),
};

/** The default month level (header + the day grid). */
export const Default: Story = {
  render: () => (
    <Box width={280}>
      <MonthLevel
        month="2024-01-01"
        previousLabel="Previous month"
        nextLabel="Next month"
        levelControlAriaLabel="Month"
      />
    </Box>
  ),
};

/** A function `monthLabelFormat` overrides the default `MMMM YYYY` label. */
export const CustomLabel: Story = {
  render: () => (
    <Box width={280}>
      <MonthLevel
        month="2024-01-01"
        monthLabelFormat={(month) => `Week of ${month}`}
        previousLabel="Previous month"
        nextLabel="Next month"
      />
    </Box>
  ),
};

/** Bounded — `minDate`/`maxDate` auto-disable the prev/next controls at the edges. */
export const Bounded: Story = {
  render: () => (
    <Box width={280}>
      <MonthLevel
        month="2024-01-01"
        minDate="2024-01-01"
        maxDate="2024-01-31"
        previousLabel="Previous month"
        nextLabel="Next month"
      />
    </Box>
  ),
};

/** Static display month — non-interactive day cells, no week labels needed. */
export const Static: Story = {
  render: () => (
    <Box width={280}>
      <MonthLevel
        static
        month="2024-01-01"
        hasNextLevel={false}
        previousLabel="Previous month"
        nextLabel="Next month"
      />
    </Box>
  ),
};

/** Full-width level — the header and grid fill the container. */
export const FullWidth: Story = {
  render: () => (
    <Box width={360}>
      <MonthLevel
        fullWidth
        month="2024-01-01"
        previousLabel="Previous month"
        nextLabel="Next month"
      />
    </Box>
  ),
};

/** Per-slot `styles` sugar — round the header controls and recolor the label. */
export const StyledParts: Story = {
  render: () => (
    <Box width={280}>
      <MonthLevel
        month="2024-01-01"
        previousLabel="Previous month"
        nextLabel="Next month"
        styles={{
          headerControl: { borderRadius: "$lg" },
          headerLevelLabel: { color: "$color11" },
        }}
      />
    </Box>
  ),
};

/** Every size from the shared `xxs…xxl` cell-metrics ladder. */
export const Sizes: Story = {
  render: () => (
    <Box gap="$md" width={320}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <MonthLevel
          key={size}
          size={size}
          month="2024-01-01"
          previousLabel="Previous"
          nextLabel="Next"
          levelControlAriaLabel={size.toUpperCase()}
        />
      ))}
    </Box>
  ),
};
