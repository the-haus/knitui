import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "@knitui/components";

import { YearLevel } from "./YearLevel";

const meta = {
  title: "Dates/YearLevel",
  component: YearLevel,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`YearLevel` is the month-grid calendar level: a `CalendarHeader` (year label + prev/next/level controls) atop a `MonthsList` 4×3 grid. A year zooms out to a decade, so the level label stays interactive (`onLevelClick`). The prev/next controls auto-disable at the `minDate`/`maxDate` bounds, and the label honours `yearLabelFormat` + the `DatesProvider` locale. Use the `styles` prop to tweak the header parts and the grid.",
      },
    },
  },
  args: {
    year: "2024-01-01",
    size: "md",
    withNext: true,
    withPrevious: true,
    fullWidth: false,
    previousLabel: "Previous year",
    nextLabel: "Next year",
    levelControlAriaLabel: "Year",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Width/font of the header controls and month cells.",
    },
    year: { control: "text", description: "A date within the displayed year (`YYYY-MM-DD`)." },
    withNext: { control: "boolean", description: "Render the next control." },
    withPrevious: { control: "boolean", description: "Render the previous control." },
    fullWidth: { control: "boolean", description: "Take the full width of the container." },
  },
} satisfies Meta<typeof YearLevel>;

export default meta;

type Story = StoryObj<ComponentProps<typeof YearLevel>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Box width={280}>
      <YearLevel {...args} />
    </Box>
  ),
};

/** The default year level (header + the month grid). */
export const Default: Story = {
  render: () => (
    <Box width={280}>
      <YearLevel
        year="2024-01-01"
        previousLabel="Previous year"
        nextLabel="Next year"
        levelControlAriaLabel="Year"
      />
    </Box>
  ),
};

/** A function `yearLabelFormat` overrides the default `YYYY` label. */
export const CustomLabel: Story = {
  render: () => (
    <Box width={280}>
      <YearLevel
        year="2024-01-01"
        yearLabelFormat={(year) => `Year of ${year}`}
        previousLabel="Previous year"
        nextLabel="Next year"
      />
    </Box>
  ),
};

/** Bounded — `minDate`/`maxDate` auto-disable the prev/next controls at the edges. */
export const Bounded: Story = {
  render: () => (
    <Box width={280}>
      <YearLevel
        year="2024-01-01"
        minDate="2024-01-01"
        maxDate="2024-12-31"
        previousLabel="Previous year"
        nextLabel="Next year"
      />
    </Box>
  ),
};

/** Full-width level — the header and grid fill the container. */
export const FullWidth: Story = {
  render: () => (
    <Box width={360}>
      <YearLevel fullWidth year="2024-01-01" previousLabel="Previous year" nextLabel="Next year" />
    </Box>
  ),
};

/** Per-slot `styles` sugar — round the header controls and recolor the label. */
export const StyledParts: Story = {
  render: () => (
    <Box width={280}>
      <YearLevel
        year="2024-01-01"
        previousLabel="Previous year"
        nextLabel="Next year"
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
        <YearLevel
          key={size}
          size={size}
          year="2024-01-01"
          previousLabel="Previous"
          nextLabel="Next"
          levelControlAriaLabel={size.toUpperCase()}
        />
      ))}
    </Box>
  ),
};
