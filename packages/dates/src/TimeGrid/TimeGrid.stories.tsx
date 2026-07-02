import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { TimeGrid } from "./TimeGrid";

const DATA = ["10:00", "12:00", "14:30", "16:00", "18:30", "20:00", "22:00", "23:45"];

const meta = {
  title: "Dates/TimeGrid",
  component: TimeGrid,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A standalone grid of selectable time options. Cross-platform port of @mantine/dates' TimeGrid: controlled/uncontrolled value, 12h/24h + seconds formatting, min/max/disableTime gating, and `styles` sugar over its parts.",
      },
    },
  },
  args: { size: "sm", format: "24h" },
  argTypes: {
    size: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Control size.",
    },
    format: {
      control: "inline-radio",
      options: ["24h", "12h"],
      description: "Clock display mode.",
    },
  },
} satisfies Meta<typeof TimeGrid>;

export default meta;

type Story = StoryObj<ComponentProps<typeof TimeGrid>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string | null>("14:30");
    return (
      <Box gap="$md" width={320}>
        <TimeGrid {...args} data={DATA} value={value} onChange={setValue} />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Default uncontrolled grid. */
export const Default: Story = {
  render: () => (
    <Box width={320}>
      <TimeGrid data={DATA} defaultValue="14:30" />
    </Box>
  ),
};

/** 12h clock with AM/PM labels. */
export const TwelveHour: Story = {
  render: () => {
    const [value, setValue] = React.useState<string | null>("18:30");
    return (
      <Box width={320}>
        <TimeGrid data={DATA} format="12h" value={value} onChange={setValue} />
      </Box>
    );
  },
};

/** Seconds shown in each label. */
export const WithSeconds: Story = {
  render: () => (
    <Box width={320}>
      <TimeGrid
        data={["10:00:30", "12:15:45", "14:30:00", "16:45:15"]}
        withSeconds
        defaultValue="12:15:45"
      />
    </Box>
  ),
};

/** Bounded + disabled — controls outside `[minTime, maxTime]` or listed in `disableTime` are disabled. */
export const Bounded: Story = {
  render: () => {
    const [value, setValue] = React.useState<string | null>(null);
    return (
      <Box width={320}>
        <TimeGrid
          data={DATA}
          minTime="12:00"
          maxTime="22:00"
          disableTime={["16:00"]}
          value={value}
          onChange={setValue}
        />
      </Box>
    );
  },
};

/** Deselectable — re-pressing the active control clears it. */
export const AllowDeselect: Story = {
  render: () => {
    const [value, setValue] = React.useState<string | null>("14:30");
    return (
      <Box gap="$md" width={320}>
        <TimeGrid data={DATA} allowDeselect value={value} onChange={setValue} />
        <Text fontSize="$sm" color="$color11">
          Selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** Per-slot `styles` sugar — recolor the labels and add a denser grid. */
export const Styled: Story = {
  render: () => (
    <Box width={320}>
      <TimeGrid
        data={DATA}
        defaultValue="14:30"
        styles={{ label: { fontWeight: "600" }, grid: { cols: 4 } }}
      />
    </Box>
  ),
};

/** Every size token. */
export const Sizes: Story = {
  render: () => (
    <Box gap="$lg" width={320}>
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Box key={size} gap="$xs">
          <Text fontSize="$sm" color="$color11">
            {size}
          </Text>
          <TimeGrid size={size} data={DATA.slice(0, 6)} defaultValue="14:30" />
        </Box>
      ))}
    </Box>
  ),
};
