import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { RangeSlider, Slider } from "./Slider";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/Slider",
  component: Slider,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Slider captures a single numeric value within a range by dragging a thumb. Accent comes from the theme ramp (`$color9`); recolor via the `theme` prop. `RangeSlider` is also exported for two-thumb ranges.",
      },
    },
  },
  decorators: [
    (Story) => (
      <Box width={360} paddingHorizontal="$lg" paddingVertical="$xl">
        <Story />
      </Box>
    ),
  ],
  args: {
    min: 0,
    max: 100,
    step: 1,
    size: "md",
    defaultValue: 40,
    disabled: false,
    inverted: false,
    labelAlwaysOn: false,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Track thickness and thumb diameter.",
    },
    min: { control: { type: "number" } },
    max: { control: { type: "number" } },
    step: { control: { type: "number" } },
    disabled: { control: "boolean" },
    inverted: { control: "boolean" },
    labelAlwaysOn: { control: "boolean" },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof Slider>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Slider>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** The seven token sizes, from xxs to xxl, showing track and thumb scaling. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$xl">
      {SIZES.map((size) => (
        <Box key={size} flexDirection="row" alignItems="center" gap="$md">
          <Text width="$sm" fontSize="$xs" color="$color11">
            {size}
          </Text>
          <Box flex={1}>
            <Slider {...args} size={size} defaultValue={50} />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

/** Elevation shadow ladder applied via the inherited `shadow` prop. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$xl">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} flexDirection="row" alignItems="center" gap="$md">
          <Text width="$sm" fontSize="$xs" color="$color11">
            {shadow}
          </Text>
          <Box flex={1}>
            <Slider {...args} shadow={shadow} defaultValue={50} />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

/** Disabled state — reduced opacity with pointer events off; keyboard ignored. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: 60 },
};

/** Always-visible value label bubble above the thumb. */
export const LabelAlwaysOn: Story = {
  args: { labelAlwaysOn: true, defaultValue: 35 },
};

/** Custom label formatter — displays a unit suffix next to the value. */
export const CustomLabel: Story = {
  args: {
    labelAlwaysOn: true,
    defaultValue: 70,
    label: (value: number) => `${value} dB`,
  },
};

/** Marks along the track with labels; thumb snaps to the nearest marked step. */
export const WithMarks: Story = {
  args: {
    defaultValue: 50,
    marks: [
      { value: 0, label: "0" },
      { value: 25, label: "25" },
      { value: 50, label: "50" },
      { value: 75, label: "75" },
      { value: 100, label: "100" },
    ],
  },
  decorators: [
    (Story) => (
      <Box width={360} paddingHorizontal="$lg" paddingBottom="$xl" paddingTop="$md">
        <Story />
      </Box>
    ),
  ],
};

/** Inverted fill — the bar covers the right side of the thumb rather than the left. */
export const Inverted: Story = {
  args: { inverted: true, defaultValue: 30 },
};

/** Vertical orientation — the thumb travels bottom-to-top. */
export const Vertical: Story = {
  args: {
    orientation: "vertical",
    defaultValue: 60,
    labelAlwaysOn: true,
  },
  decorators: [
    (Story) => (
      <Box height={240} alignItems="center" justifyContent="center">
        <Story />
      </Box>
    ),
  ],
};

/** Controlled value — the displayed number updates as you drag. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState(25);
    return (
      <Box gap="$md">
        <Box flexDirection="row" alignItems="center" gap="$sm">
          <Text fontSize="$sm" color="$color11">
            Value:
          </Text>
          <Text fontSize="$sm" fontWeight="600">
            {value}
          </Text>
        </Box>
        <Slider {...args} value={value} onChange={setValue} />
      </Box>
    );
  },
};

/** RangeSlider — two thumbs capture a `[start, end]` interval. */
export const Range: Story = {
  render: (args) => (
    <RangeSlider
      min={args.min}
      max={args.max}
      step={args.step}
      size={args.size}
      disabled={args.disabled}
      defaultValue={[20, 75]}
      labelAlwaysOn
    />
  ),
};

/** Controlled RangeSlider — selected interval displayed alongside the track. */
export const RangeControlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<[number, number]>([20, 70]);
    return (
      <Box gap="$md">
        <Box flexDirection="row" alignItems="center" gap="$sm">
          <Text fontSize="$sm" color="$color11">
            Range:
          </Text>
          <Text fontSize="$sm" fontWeight="600">
            {value[0]} – {value[1]}
          </Text>
        </Box>
        <RangeSlider
          min={args.min}
          max={args.max}
          step={args.step}
          size={args.size}
          disabled={args.disabled}
          value={value}
          onChange={setValue}
        />
      </Box>
    );
  },
};

/** Themed slider — the filled bar and thumb border follow the active theme accent. */
export const Themed: Story = {
  render: (args) => (
    <Box gap="$lg">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <Box key={theme} flexDirection="row" alignItems="center" gap="$md">
          <Text width={48} fontSize="$xs" color="$color11">
            {theme}
          </Text>
          <Box flex={1}>
            <Slider {...args} theme={theme} defaultValue={50} />
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `track`, `bar` and `thumb`. */
export const Styles: Story = {
  args: {
    defaultValue: 50,
    styles: {
      track: { backgroundColor: "$blue3" },
      bar: { backgroundColor: "$red9" },
      thumb: { borderColor: "$red9", borderWidth: 3 },
    },
  },
};
