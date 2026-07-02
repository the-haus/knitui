import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import type { DateStringValue } from "../types";
import { MonthsList } from "./MonthsList";

const YEAR = "2026-06-15"; // any date within 2026

const meta = {
  title: "Dates/MonthsList",
  component: MonthsList,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`MonthsList` is the month selection grid — a 4×3 grid of `PickerControl`s built from `Box` rows/cells (never an HTML `<table>`), so it renders on web and native. Per-cell sizing/colour/interaction live in the `PickerControl` leaf; `MonthsList` lays out the rows/cells, shares `size` via context, and offers a per-month `getMonthControlProps` passthrough plus per-slot `styles` sugar. Accent comes from the active Tamagui theme.",
      },
    },
  },
  args: {
    year: YEAR,
    size: "md",
    withCellSpacing: true,
    fullWidth: false,
    monthsListFormat: "MMM",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Width/font of the controls.",
    },
    withCellSpacing: { control: "boolean", description: "Separate controls/rows with spacing." },
    fullWidth: { control: "boolean", description: "Stretch the grid to its container width." },
    monthsListFormat: { control: "text", description: "dayjs format for the month labels." },
  },
} satisfies Meta<typeof MonthsList>;

export default meta;

type Story = StoryObj<ComponentProps<typeof MonthsList>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="$md" alignItems="center">
        <MonthsList
          {...args}
          getMonthControlProps={(date) => ({ selected: date === value })}
          __onControlClick={(_event, date) => setValue(date)}
        />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Default month grid with a selected month. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-01");
    return (
      <MonthsList
        year={YEAR}
        getMonthControlProps={(date) => ({ selected: date === value })}
        __onControlClick={(_event, date) => setValue(date)}
      />
    );
  },
};

/** Custom label format — full month names. */
export const CustomFormat: Story = {
  render: () => <MonthsList year={YEAR} monthsListFormat="MMMM" />,
};

/** Bounded — months outside `[minDate, maxDate]` are disabled. */
export const Bounded: Story = {
  render: () => <MonthsList year={YEAR} minDate="2026-03-01" maxDate="2026-09-30" />,
};

/** Full-width grid stretched to its container's width (controls share each row equally). */
export const FullWidth: Story = {
  render: () => (
    <Box width={360}>
      <MonthsList year={YEAR} fullWidth />
    </Box>
  ),
};

/** `fullWidth` fills BOTH axes — in a fixed-height box the rows distribute the height and the controls grow taller. */
export const FullWidthFilled: Story = {
  render: () => (
    <Box width={360} height={320}>
      <MonthsList year={YEAR} fullWidth />
    </Box>
  ),
};

/** Per-slot `styles` sugar — recolour every control via the `control` slot. */
export const StyledSlots: Story = {
  render: () => (
    <MonthsList
      year={YEAR}
      styles={{ control: { backgroundColor: "$blue4" }, cell: { padding: "$xxs" } }}
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
          <MonthsList year={YEAR} size={size} />
        </Box>
      ))}
    </Box>
  ),
};
