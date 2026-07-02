import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { CalendarHeader } from "./CalendarHeader";

const meta = {
  title: "Dates/CalendarHeader",
  component: CalendarHeader,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`CalendarHeader` is the prev / level-label / next bar that sits atop every calendar level. The level button zooms out a level while `hasNextLevel` is true, and becomes a static, dimmed label at the topmost level. Built from `Box` + `UnstyledButton` so it renders on web + native; accent comes from the active Tamagui theme. Use the `styles` prop to tweak individual parts.",
      },
    },
  },
  args: {
    label: "March 2024",
    size: "md",
    hasNextLevel: true,
    withNext: true,
    withPrevious: true,
    nextDisabled: false,
    previousDisabled: false,
    fullWidth: false,
    previousLabel: "Previous",
    nextLabel: "Next",
    levelControlAriaLabel: "Change level",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"],
      description: "Width/font of the header controls.",
    },
    label: { control: "text", description: "Label between the previous and next buttons." },
    hasNextLevel: {
      control: "boolean",
      description: "Whether the level button can zoom out to the next level.",
    },
    withNext: { control: "boolean", description: "Render the next control." },
    withPrevious: { control: "boolean", description: "Render the previous control." },
    nextDisabled: { control: "boolean", description: "Disable the next control." },
    previousDisabled: { control: "boolean", description: "Disable the previous control." },
    fullWidth: { control: "boolean", description: "Take the full width of the container." },
  },
} satisfies Meta<typeof CalendarHeader>;

export default meta;

type Story = StoryObj<ComponentProps<typeof CalendarHeader>>;

/** Interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Box width={280}>
      <CalendarHeader {...args} />
    </Box>
  ),
};

/** The default month-level header (previous / level / next, all interactive). */
export const Default: Story = {
  render: () => (
    <Box width={280}>
      <CalendarHeader
        label="March 2024"
        previousLabel="Previous month"
        nextLabel="Next month"
        levelControlAriaLabel="Change level"
      />
    </Box>
  ),
};

/** Topmost level — the level control is a static, dimmed, non-interactive label. */
export const TopLevel: Story = {
  render: () => (
    <Box width={280}>
      <CalendarHeader
        label="2020 – 2029"
        hasNextLevel={false}
        previousLabel="Previous decade"
        nextLabel="Next decade"
      />
    </Box>
  ),
};

/** Bounded — the previous control is disabled (e.g. at `minDate`). */
export const DisabledControl: Story = {
  render: () => (
    <Box width={280}>
      <CalendarHeader
        label="March 2024"
        previousDisabled
        previousLabel="Previous month"
        nextLabel="Next month"
        levelControlAriaLabel="Change level"
      />
    </Box>
  ),
};

/** Full-width header — the bar (and its level control) fill the container. */
export const FullWidth: Story = {
  render: () => (
    <Box width={360}>
      <CalendarHeader
        fullWidth
        label="March 2024"
        previousLabel="Previous month"
        nextLabel="Next month"
        levelControlAriaLabel="Change level"
      />
    </Box>
  ),
};

/** Custom previous/next icons replace the default chevron glyphs. */
export const CustomIcons: Story = {
  render: () => (
    <Box width={280}>
      <CalendarHeader
        label="March 2024"
        previousLabel="Previous month"
        nextLabel="Next month"
        previousIcon={<Text>«</Text>}
        nextIcon={<Text>»</Text>}
      />
    </Box>
  ),
};

/** Reordered controls — `level` first, then `previous` / `next`. */
export const ReorderedControls: Story = {
  render: () => (
    <Box width={280}>
      <CalendarHeader
        label="March 2024"
        headerControlsOrder={["level", "previous", "next"]}
        previousLabel="Previous month"
        nextLabel="Next month"
        levelControlAriaLabel="Change level"
      />
    </Box>
  ),
};

/** Per-slot `styles` sugar — round the controls and recolor the level label. */
export const StyledParts: Story = {
  render: () => (
    <Box width={280}>
      <CalendarHeader
        label="March 2024"
        previousLabel="Previous month"
        nextLabel="Next month"
        levelControlAriaLabel="Change level"
        styles={{
          control: { borderRadius: "$lg" },
          levelLabel: { color: "$color11" },
        }}
      />
    </Box>
  ),
};

/** Every size from the shared `xxs…xxl` cell-metrics ladder. */
export const Sizes: Story = {
  render: () => (
    <Box gap="$sm" width={280}>
      {(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const).map((size) => (
        <CalendarHeader
          key={size}
          size={size}
          label={size.toUpperCase()}
          previousLabel="Previous"
          nextLabel="Next"
          levelControlAriaLabel="Change level"
        />
      ))}
    </Box>
  ),
};
