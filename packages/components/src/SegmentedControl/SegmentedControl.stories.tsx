import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { SegmentedControl } from "./SegmentedControl";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const FRAMEWORKS = ["React", "Vue", "Svelte"];

const FRAMEWORKS_WITH_DISABLED = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue", disabled: true },
  { value: "svelte", label: "Svelte" },
];

const RICH_DATA = [
  { value: "preview", label: <Text>👁 Preview</Text> },
  { value: "code", label: <Text>{"</>"} Code</Text> },
  { value: "history", label: <Text>🕑 History</Text> },
];

const meta = {
  title: "Inputs/SegmentedControl",
  component: SegmentedControl,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "SegmentedControl is a single-select row (or column) of mutually-exclusive options. The active option sits on a raised indicator over a muted track. Accent follows the active theme via the `theme` prop.",
      },
    },
  },
  args: {
    data: FRAMEWORKS,
    size: "sm",
    orientation: "horizontal",
    fullWidth: false,
    disabled: false,
    readOnly: false,
    withItemsBorders: true,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, horizontal padding and font size.",
    },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Layout direction of the segments.",
    },
    shadow: {
      control: "select",
      options: [undefined, ...SHADOWS],
      description: "Elevation — drop shadow from the shared ladder.",
    },
    fullWidth: { control: "boolean" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    withItemsBorders: { control: "boolean" },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Active theme accent — recolors the control via the palette ramp.",
    },
    data: { control: false },
    value: { control: false },
    defaultValue: { control: false },
    onChange: { control: false },
  },
} satisfies Meta<typeof SegmentedControl>;

export default meta;

type Story = StoryObj<ComponentProps<typeof SegmentedControl>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** The seven token sizes, from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md">
      {SIZES.map((size) => (
        <Box key={size} flexDirection="row" alignItems="center" gap="$md">
          <Text width="$sm" fontSize="$xs" color="$color10">
            {size}
          </Text>
          <SegmentedControl {...args} size={size} data={FRAMEWORKS} />
        </Box>
      ))}
    </Box>
  ),
};

/** The five shadow levels from the shared elevation ladder, from xs to xl. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$md">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} flexDirection="row" alignItems="center" gap="$md">
          <Text width="$sm" fontSize="$xs" color="$color10">
            {shadow}
          </Text>
          <SegmentedControl {...args} shadow={shadow} data={FRAMEWORKS} />
        </Box>
      ))}
    </Box>
  ),
};

/** Disabled state — the whole control becomes non-interactive with reduced opacity. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** A single item can be disabled while the rest remain interactive. */
export const DisabledItem: Story = {
  args: { data: FRAMEWORKS_WITH_DISABLED },
};

/** Read-only mode — the selected value is visible but cannot be changed. */
export const ReadOnly: Story = {
  args: { defaultValue: "Vue", readOnly: true },
};

/** Vertical orientation — segments stack top-to-bottom. */
export const Vertical: Story = {
  args: { orientation: "vertical" },
};

/** Controlled value — the parent owns the state; selection triggers the callback. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("React");
    return (
      <Box gap="$md" alignItems="center">
        <SegmentedControl {...args} value={value} onChange={setValue} />
        <Text fontSize={13} color="$color10">
          Selected: <Text fontWeight="600">{value}</Text>
        </Text>
      </Box>
    );
  },
};

/** Full-width mode — the control stretches to fill the container. */
export const FullWidth: Story = {
  args: { fullWidth: true },
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
};

/** Segments can accept arbitrary React nodes as labels, e.g. icons with text. */
export const RichLabels: Story = {
  args: { data: RICH_DATA },
};

/** The palette ramp follows the active theme — same control, different accent. */
export const Themed: Story = {
  render: (args) => (
    <Box gap="$md">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <SegmentedControl key={theme} {...args} theme={theme} defaultValue="React" />
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `root` track and the `label`. */
export const Styles: Story = {
  args: {
    defaultValue: "React",
    styles: {
      root: { backgroundColor: "$blue3" },
      label: { color: "$blue9", fontWeight: "700" },
    },
  },
};
