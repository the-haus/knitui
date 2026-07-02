import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "@knitui/components";

import { DecadeLevel } from "./DecadeLevel";

const meta = {
  title: "Dates/DecadeLevel",
  component: DecadeLevel,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`DecadeLevel` is the top calendar level: a `CalendarHeader` (decade label + prev/next controls) atop a `YearsList` ragged 3/3/3/1 year grid. There is no level above a decade, so the level label is non-interactive. The prev/next controls auto-disable at the `minDate`/`maxDate` bounds, and the label honours `decadeLabelFormat` + the `DatesProvider` locale. Use the `styles` prop to tweak the header parts and the grid.",
      },
    },
  },
  args: {
    decade: "2024-01-01",
    size: "md",
    withNext: true,
    withPrevious: true,
    fullWidth: false,
    previousLabel: "Previous decade",
    nextLabel: "Next decade",
    levelControlAriaLabel: "Decade",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Width/font of the header controls and year cells.",
    },
    decade: { control: "text", description: "A date within the displayed decade (`YYYY-MM-DD`)." },
    withNext: { control: "boolean", description: "Render the next control." },
    withPrevious: { control: "boolean", description: "Render the previous control." },
    fullWidth: { control: "boolean", description: "Take the full width of the container." },
  },
} satisfies Meta<typeof DecadeLevel>;

export default meta;

type Story = StoryObj<ComponentProps<typeof DecadeLevel>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Box width={280}>
      <DecadeLevel {...args} />
    </Box>
  ),
};

/** The default decade level (header + the 3/3/3/1 year grid). */
export const Default: Story = {
  render: () => (
    <Box width={280}>
      <DecadeLevel
        decade="2024-01-01"
        previousLabel="Previous decade"
        nextLabel="Next decade"
        levelControlAriaLabel="Decade"
      />
    </Box>
  ),
};

/** A two-arg `decadeLabelFormat` function overrides the `start – end` label. */
export const CustomLabel: Story = {
  render: () => (
    <Box width={280}>
      <DecadeLevel
        decade="2024-01-01"
        decadeLabelFormat={(start, end) => `${start.slice(0, 4)}–${end.slice(0, 4)}`}
        previousLabel="Previous decade"
        nextLabel="Next decade"
      />
    </Box>
  ),
};

/** Bounded — `minDate`/`maxDate` auto-disable the prev/next controls at the edges. */
export const Bounded: Story = {
  render: () => (
    <Box width={280}>
      <DecadeLevel
        decade="2024-01-01"
        minDate="2020-01-01"
        maxDate="2029-12-31"
        previousLabel="Previous decade"
        nextLabel="Next decade"
      />
    </Box>
  ),
};

/** Full-width level — the header and grid fill the container. */
export const FullWidth: Story = {
  render: () => (
    <Box width={360}>
      <DecadeLevel
        fullWidth
        decade="2024-01-01"
        previousLabel="Previous decade"
        nextLabel="Next decade"
      />
    </Box>
  ),
};

/** Per-slot `styles` sugar — round the header controls and recolor the label. */
export const StyledParts: Story = {
  render: () => (
    <Box width={280}>
      <DecadeLevel
        decade="2024-01-01"
        previousLabel="Previous decade"
        nextLabel="Next decade"
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
    <Box gap="$md" width={280}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <DecadeLevel
          key={size}
          size={size}
          decade="2024-01-01"
          previousLabel="Previous"
          nextLabel="Next"
          levelControlAriaLabel={size.toUpperCase()}
        />
      ))}
    </Box>
  ),
};
