import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Progress } from "./Progress";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Display/Progress",
  component: Progress,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          'Progress renders a filled track bar. Use `<Progress value={n} />` for the simple single-section form, or the compound `<Progress.Root><Progress.Section>` form for stacked multi-section bars. Accent comes from the active theme palette ramp — recolor with the `theme` prop. `orientation="vertical"` rotates the track; pair with an explicit `height`.',
      },
    },
  },
  args: {
    value: 60,
    size: "md",
    striped: false,
    animated: false,
    orientation: "horizontal",
  },
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
      description: "Filled portion of the track, 0–100.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Track thickness — xxs through xxl size key, or a px number.",
    },
    striped: { control: "boolean", description: "Diagonal striped sheen over the fill." },
    animated: { control: "boolean", description: "Animates the stripes (implies striped)." },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Rotates the track axis.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Active theme accent — recolors the bar via the palette ramp.",
    },
  },
  decorators: [
    (Story) => (
      <Box width={400}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Progress>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Progress>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All seven track thicknesses from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md">
      {SIZES.map((size) => (
        <Box key={size} gap="$xs">
          <Text fontSize="$xs" color="$color11">
            {size}
          </Text>
          <Progress {...args} size={size} value={60} />
        </Box>
      ))}
    </Box>
  ),
};

/** Edge values — 0 %, 50 % and 100 % fill. */
export const Values: Story = {
  render: (args) => (
    <Box gap="$md">
      {([0, 25, 50, 75, 100] as const).map((value) => (
        <Box key={value} gap="$xs">
          <Text fontSize="$xs" color="$color11">
            {value}%
          </Text>
          <Progress {...args} value={value} />
        </Box>
      ))}
    </Box>
  ),
};

/** Diagonal striped sheen applied over the fill. */
export const Striped: Story = {
  args: { striped: true, value: 70 },
};

/** Stripes animate when `animated` is set (implies striped). */
export const Animated: Story = {
  args: { animated: true, value: 70 },
};

/** Vertical orientation — pair with an explicit height on the root. */
export const Vertical: Story = {
  render: (args) => (
    <Box flexDirection="row" gap="$lg" alignItems="flex-end" height={120}>
      {SIZES.map((size) => (
        <Progress key={size} {...args} size={size} orientation="vertical" height={120} value={60} />
      ))}
    </Box>
  ),
  decorators: [
    (Story) => (
      <Box>
        <Story />
      </Box>
    ),
  ],
};

/** Palette ramp follows the active theme — same component, different accent. */
export const Themed: Story = {
  render: (args) => (
    <Box gap="$md">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <Box key={theme} gap="$xs">
          <Text fontSize="$xs" color="$color11">
            {theme}
          </Text>
          <Progress {...args} theme={theme} value={65} />
        </Box>
      ))}
    </Box>
  ),
};

/** Elevation shadow ladder applied via the inherited `shadow` prop. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$md">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} gap="$xs">
          <Text fontSize="$xs" color="$color11">
            {shadow}
          </Text>
          <Progress {...args} shadow={shadow} value={60} />
        </Box>
      ))}
    </Box>
  ),
};

/**
 * Compound API — Progress.Root holds multiple Progress.Section children so
 * values fill the track in sequence; each section can carry an inline label.
 */
export const CompoundStacked: Story = {
  render: () => (
    <Box gap="$lg">
      {/* Three sections, no labels */}
      <Progress.Root size="lg">
        <Progress.Section value={30} theme="blue" withAria />
        <Progress.Section value={25} theme="red" withAria />
        <Progress.Section value={20} theme="green" withAria />
      </Progress.Root>

      {/* With inline percentage labels */}
      <Progress.Root size="xl">
        <Progress.Section value={40} theme="blue" withAria>
          40%
        </Progress.Section>
        <Progress.Section value={35} theme="pink" withAria>
          35%
        </Progress.Section>
        <Progress.Section value={15} theme="yellow" withAria>
          15%
        </Progress.Section>
      </Progress.Root>
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `section` fill and its inline `label`. */
export const Styles: Story = {
  args: {
    value: 65,
    size: "xl",
    label: "65%",
    styles: {
      section: { backgroundColor: "$red9" },
      label: { color: "$color1", fontWeight: "700" },
    },
  },
};

/** Controlled — value is owned by the parent and driven by a slider. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState(40);
    return (
      <Box gap="$md">
        <Progress {...args} value={value} />
        <Box flexDirection="row" alignItems="center" gap="$sm">
          <Text fontSize="$xs" color="$color11">
            0
          </Text>
          <input
            type="range"
            min={0}
            max={100}
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            style={{ flex: 1 }}
          />
          <Text fontSize="$xs" color="$color11">
            100
          </Text>
          <Text fontSize="$xs" color="$color11" minWidth="$md">
            {value}%
          </Text>
        </Box>
      </Box>
    );
  },
};
