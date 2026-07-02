import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Indicator, type IndicatorPosition, type IndicatorSize } from "./Indicator";

const SIZES: IndicatorSize[] = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"];
const OFFSETS = [0, "0", "xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const POSITIONS: IndicatorPosition[] = [
  "top-start",
  "top-center",
  "top-end",
  "middle-start",
  "middle-center",
  "middle-end",
  "bottom-start",
  "bottom-center",
  "bottom-end",
];

/** A simple avatar-like target used across stories. */
const Avatar = () => (
  <Box
    width="$xl"
    height="$xl"
    borderRadius={999}
    backgroundColor="$color5"
    alignItems="center"
    justifyContent="center"
  >
    <Text>👤</Text>
  </Box>
);

const meta = {
  title: "Display/Indicator",
  component: Indicator,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Indicator overlays a small dot or label badge on a corner/edge of its children. Accent comes from the active `theme` palette ramp. `position`, `offset`, `size`, `withBorder`, `disabled`, `processing`, `label`, `maxValue`, and `showZero` mirror Mantine's surface.",
      },
    },
  },
  args: {
    position: "top-end",
    size: "xxs",
    withBorder: false,
    disabled: false,
    processing: false,
    showZero: true,
  },
  argTypes: {
    position: {
      control: "select",
      options: POSITIONS,
      description: "Corner / edge the indicator is anchored to.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Dot/badge width and height; named values resolve against the size scale.",
    },
    offset: {
      control: "select",
      options: OFFSETS,
      description: "Space-token or pixel nudge from the anchored edge(s).",
    },
    label: {
      control: "text",
      description: "Content inside the indicator — turns the dot into a pill badge.",
    },
    maxValue: {
      control: "number",
      description: "Numeric cap; values above it render as `{maxValue}+`.",
    },
    withBorder: { control: "boolean" },
    disabled: { control: "boolean" },
    processing: { control: "boolean" },
    showZero: { control: "boolean" },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Active theme accent — recolors the dot via the palette ramp.",
    },
    children: { control: false },
    radius: { control: false },
  },
} satisfies Meta<typeof Indicator>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Indicator>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Indicator {...args}>
      <Avatar />
    </Indicator>
  ),
};

/** All nine anchor positions around the same target element. */
export const Positions: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {POSITIONS.map((position) => (
        <Box key={position} alignItems="center" gap="$xs">
          <Indicator {...args} position={position}>
            <Avatar />
          </Indicator>
          <Text fontSize="$xxs" color="$color10">
            {position}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** The seven named sizes resolve against the `$size` token scale. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SIZES.map((size) => (
        <Box key={size} alignItems="center" gap="$xs">
          <Indicator {...args} size={size}>
            <Avatar />
          </Indicator>
          <Text fontSize="$xxs" color="$color10">
            {size}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Dot turns into a pill badge when a `label` is provided. */
export const WithLabel: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      <Indicator {...args} label={3}>
        <Avatar />
      </Indicator>
      <Indicator {...args} label={99}>
        <Avatar />
      </Indicator>
      <Indicator {...args} label="NEW">
        <Avatar />
      </Indicator>
    </Box>
  ),
};

/** Values exceeding `maxValue` are clamped and rendered as `{maxValue}+`. */
export const MaxValue: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      <Indicator {...args} label={5} maxValue={99}>
        <Avatar />
      </Indicator>
      <Indicator {...args} label={100} maxValue={99}>
        <Avatar />
      </Indicator>
      <Indicator {...args} label={999} maxValue={99}>
        <Avatar />
      </Indicator>
    </Box>
  ),
};

/** `disabled` hides the dot while still rendering children. */
export const Disabled: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      <Indicator {...args} label={4} disabled={false}>
        <Avatar />
      </Indicator>
      <Indicator {...args} label={4} disabled>
        <Avatar />
      </Indicator>
    </Box>
  ),
};

/**
 * `processing` animates the dot with a continuous opacity pulse plus a one-shot
 * scale-in entrance. The pulse rides on the anchor wrapper while the entrance rides
 * on the dot, so the two animation drivers never share a node (a bare dot, a label
 * pill, and the size ladder all exercise that split — the path that crashed
 * reanimated on native when both ran on one node).
 */
export const Processing: Story = {
  args: { processing: true },
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      <Indicator {...args}>
        <Avatar />
      </Indicator>
      <Indicator {...args} size="md" />
      <Indicator {...args} label={8}>
        <Avatar />
      </Indicator>
      {SIZES.map((size) => (
        <Box key={size} alignItems="center" gap="$xs">
          <Indicator {...args} size={size}>
            <Avatar />
          </Indicator>
          <Text fontSize="$xxs" color="$color10">
            {size}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** `withBorder` adds a ring in the page background so the dot separates from the target. */
export const WithBorder: Story = {
  args: { withBorder: true, size: "xs" },
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      <Indicator {...args} withBorder={false}>
        <Avatar />
      </Indicator>
      <Indicator {...args} withBorder>
        <Avatar />
      </Indicator>
      <Indicator {...args} withBorder label={7}>
        <Avatar />
      </Indicator>
    </Box>
  ),
};

/** `showZero` controls whether a zero label is rendered or suppressed. */
export const ShowZero: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      <Box alignItems="center" gap="$xs">
        <Indicator {...args} label={0} showZero>
          <Avatar />
        </Indicator>
        <Text fontSize="$xxs" color="$color10">
          showZero=true
        </Text>
      </Box>
      <Box alignItems="center" gap="$xs">
        <Indicator {...args} label={0} showZero={false}>
          <Avatar />
        </Indicator>
        <Text fontSize="$xxs" color="$color10">
          showZero=false
        </Text>
      </Box>
    </Box>
  ),
};

/** The inherited `shadow` elevation prop, from xs to xl. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} alignItems="center" gap="$xs">
          <Indicator {...args} shadow={shadow} label={shadow}>
            <Avatar />
          </Indicator>
          <Text fontSize="$xxs" color="$color10">
            {shadow}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `dot` and `label`. */
export const Styles: Story = {
  render: (args) => (
    <Indicator
      {...args}
      label={5}
      styles={{
        dot: { backgroundColor: "$blue9" },
        label: { color: "$red9", fontWeight: "700" },
      }}
    >
      <Avatar />
    </Indicator>
  ),
};

/** The palette ramp follows the active `theme` — same component, different accent color. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <Box key={theme} alignItems="center" gap="$xs">
          <Indicator {...args} theme={theme} label={theme[0].toUpperCase()}>
            <Avatar />
          </Indicator>
          <Text fontSize="$xxs" color="$color10">
            {theme}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};
