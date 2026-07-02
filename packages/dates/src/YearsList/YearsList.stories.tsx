import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import type { DateStringValue } from "../types";
import { YearsList } from "./YearsList";

const DECADE = "2024-01-01"; // any date within the 2020 decade

const meta = {
  title: "Dates/YearsList",
  component: YearsList,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`YearsList` is the year selection grid — a ragged 3/3/3/1 grid of `PickerControl`s built from `Box` rows/cells (never an HTML `<table>`), so it renders on web and native. Per-cell sizing/colour/interaction live in the `PickerControl` leaf; `YearsList` lays out the rows/cells, shares `size` via context, and offers a per-year `getYearControlProps` passthrough plus per-slot `styles` sugar. Accent comes from the active Tamagui theme.",
      },
    },
  },
  args: {
    decade: DECADE,
    size: "md",
    withCellSpacing: true,
    fullWidth: false,
    yearsListFormat: "YYYY",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Width/font of the controls.",
    },
    withCellSpacing: { control: "boolean", description: "Separate controls/rows with spacing." },
    fullWidth: { control: "boolean", description: "Stretch the grid to its container width." },
    yearsListFormat: { control: "text", description: "dayjs format for the year labels." },
  },
} satisfies Meta<typeof YearsList>;

export default meta;

type Story = StoryObj<ComponentProps<typeof YearsList>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <Box gap="$md" alignItems="center">
        <YearsList
          {...args}
          getYearControlProps={(date) => ({ selected: date === value })}
          __onControlClick={(_event, date) => setValue(date)}
        />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Default year grid with a selected year. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2024-01-01");
    return (
      <YearsList
        decade={DECADE}
        getYearControlProps={(date) => ({ selected: date === value })}
        __onControlClick={(_event, date) => setValue(date)}
      />
    );
  },
};

/** Custom label format — two-digit years. */
export const CustomFormat: Story = {
  render: () => <YearsList decade={DECADE} yearsListFormat="YY" />,
};

/** Bounded — years outside `[minDate, maxDate]` are disabled. */
export const Bounded: Story = {
  render: () => <YearsList decade={DECADE} minDate="2022-01-01" maxDate="2027-12-31" />,
};

/** Full-width grid stretched to its container's width (controls share each row equally). */
export const FullWidth: Story = {
  render: () => (
    <Box width={360}>
      <YearsList decade={DECADE} fullWidth />
    </Box>
  ),
};

/** `fullWidth` fills BOTH axes — in a fixed-height box the rows distribute the height and the controls grow taller. */
export const FullWidthFilled: Story = {
  render: () => (
    <Box width={360} height={320}>
      <YearsList decade={DECADE} fullWidth />
    </Box>
  ),
};

/** Per-slot `styles` sugar — recolour every control via the `control` slot. */
export const StyledSlots: Story = {
  render: () => (
    <YearsList
      decade={DECADE}
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
          <YearsList decade={DECADE} size={size} />
        </Box>
      ))}
    </Box>
  ),
};
