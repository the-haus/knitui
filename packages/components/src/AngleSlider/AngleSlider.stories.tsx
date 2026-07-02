import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { AngleSlider, type AngleSliderSize } from "./AngleSlider";

const SIZES: AngleSliderSize[] = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"];

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/AngleSlider",
  component: AngleSlider,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "AngleSlider lets users pick an angle (0–359°) by dragging around a circular ring or using arrow keys. It supports marks, custom label formatting, step snapping, and controlled/uncontrolled usage.",
      },
    },
  },
  args: {
    "aria-label": "angle",
    size: "xxl",
    step: 1,
    withLabel: true,
    disabled: false,
    restrictToMarks: false,
  },
  argTypes: {
    size: {
      control: "select",
      options: SIZES,
      description: "Diameter token from the $size scale. Numeric px values are also supported.",
    },
    step: {
      control: { type: "number", min: 1, max: 45, step: 1 },
      description: "Angle step between selectable values.",
    },
    withLabel: {
      control: "boolean",
      description: "Show the current value in the centre of the ring.",
    },
    disabled: {
      control: "boolean",
      description: "Disable all interactions.",
    },
    restrictToMarks: {
      control: "boolean",
      description: "Restrict selectable values to the marks array.",
    },
    defaultValue: {
      control: { type: "number", min: 0, max: 359, step: 1 },
      description: "Uncontrolled initial value.",
    },
    value: { control: false },
    onChange: { control: false },
    onChangeEnd: { control: false },
    onScrubStart: { control: false },
    onScrubEnd: { control: false },
    formatLabel: { control: false },
    marks: { control: false },
  },
} satisfies Meta<typeof AngleSlider>;

export default meta;

type Story = StoryObj<ComponentProps<typeof AngleSlider>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Full token size scale, from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SIZES.map((size) => (
        <Box key={size} alignItems="center" gap="$xs">
          <AngleSlider {...args} size={size} aria-label={`angle ${size}`} />
          <Text fontSize="$xs" color="$color10">
            {size}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/**
 * Elevation via the shared `shadow` ladder — inherited from `Box`, so every
 * component accepts it; no shadow unless set.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} alignItems="center" gap="$xs">
          <AngleSlider {...args} size="lg" shadow={shadow} aria-label={`angle ${shadow}`} />
          <Text fontSize="$xs" color="$color10">
            {shadow}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Numeric custom diameter for exact pixel-sized use cases. */
export const NumericSize: Story = {
  args: { size: 100, defaultValue: 90 },
};

/** Disabled state — reduced opacity and all pointer/keyboard interactions suppressed. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 45 },
};

/** Marks displayed around the ring at cardinal and ordinal angles. */
export const WithMarks: Story = {
  args: {
    size: 100,
    step: 45,
    defaultValue: 0,
    marks: [
      { value: 0, label: "N" },
      { value: 45 },
      { value: 90, label: "E" },
      { value: 135 },
      { value: 180, label: "S" },
      { value: 225 },
      { value: 270, label: "W" },
      { value: 315 },
    ],
  },
};

/** restrictToMarks snaps the thumb to the nearest mark; arrow keys cycle between them. */
export const RestrictedToMarks: Story = {
  args: {
    size: 100,
    restrictToMarks: true,
    defaultValue: 0,
    marks: [
      { value: 0, label: "0°" },
      { value: 90, label: "90°" },
      { value: 180, label: "180°" },
      { value: 270, label: "270°" },
    ],
  },
};

/** formatLabel replaces the plain number with a custom React node. */
export const CustomLabel: Story = {
  args: {
    size: 80,
    defaultValue: 90,
    formatLabel: (v) => (
      <Text fontSize="$xs" fontWeight="700">
        {v}°
      </Text>
    ),
  },
};

/** Fully controlled — the external state drives the slider and is displayed next to it. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState(0);
    return (
      <Box flexDirection="row" gap="$lg" alignItems="center">
        <AngleSlider {...args} value={value} onChange={setValue} aria-label="controlled angle" />
        <Box gap="$xs">
          <Text fontWeight="700">{value}°</Text>
          <Box flexDirection="row" gap="$sm">
            {[0, 90, 180, 270].map((preset) => (
              <Text
                key={preset}
                onPress={() => setValue(preset)}
                color="$color10"
                fontSize="$sm"
                style={{ cursor: "pointer" }}
              >
                {preset}°
              </Text>
            ))}
          </Box>
        </Box>
      </Box>
    );
  },
};

/** withLabel={false} hides the centre value, leaving a clean ring. */
export const NoLabel: Story = {
  args: { withLabel: false, defaultValue: 135 },
};

/** Per-slot `styles` targets individual parts — here the `frame`, `thumbKnob`, and `label`. */
export const Styles: Story = {
  args: {
    size: 100,
    defaultValue: 45,
    styles: {
      frame: { backgroundColor: "$blue3" },
      thumbKnob: { backgroundColor: "$red9" },
      label: { color: "$blue11", fontWeight: "700" },
    },
  },
};
