import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import type { DateStringValue } from "../types";
import { ExampleControl } from "./ExampleControl";

const WEEK = [
  "2026-06-15",
  "2026-06-16",
  "2026-06-17",
  "2026-06-18",
  "2026-06-19",
] satisfies DateStringValue[];

const meta = {
  title: "Dates/_Reference/ExampleControl",
  component: ExampleControl,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "REFERENCE component (not part of the public API). A compact single-select strip of date options that demonstrates every @knitui/dates convention in one place — see `_reference/README.md` for the checklist.",
      },
    },
  },
  args: { size: "md" },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Width/font of the options.",
    },
  },
} satisfies Meta<typeof ExampleControl>;

export default meta;

type Story = StoryObj<ComponentProps<typeof ExampleControl>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-15");
    return (
      <Box gap="$md" alignItems="center">
        <ExampleControl {...args} data={WEEK} value={value} onChange={setValue} />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Default single-select strip. */
export const Default: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-16");
    return <ExampleControl data={WEEK} value={value} onChange={setValue} />;
  },
};

/** Bounded — options outside `[minDate, maxDate]` are disabled. */
export const Bounded: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>(null);
    return (
      <ExampleControl
        data={WEEK}
        minDate="2026-06-16"
        maxDate="2026-06-18"
        value={value}
        onChange={setValue}
      />
    );
  },
};

/** Composition + per-slot `styles`: lead/trail sections and a recolored selected label. */
export const Composed: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-17");
    return (
      <ExampleControl
        data={WEEK}
        value={value}
        onChange={setValue}
        styles={{ label: { fontWeight: "600" } }}
      >
        <ExampleControl.Lead>
          <Text fontSize="$sm" color="$color11">
            Wk 25
          </Text>
        </ExampleControl.Lead>
      </ExampleControl>
    );
  },
};

/** Every size token. */
export const Sizes: Story = {
  render: () => {
    const [value, setValue] = React.useState<DateStringValue | null>("2026-06-16");
    return (
      <Box gap="$lg">
        {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
          <Box key={size} gap="$xs">
            <Text fontSize="$sm" color="$color11">
              {size}
            </Text>
            <ExampleControl size={size} data={WEEK} value={value} onChange={setValue} />
          </Box>
        ))}
      </Box>
    );
  },
};
