import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Skeleton } from "./Skeleton";

const RADII = ["xs", "sm", "md", "lg", "xl", "none", "full"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Display/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Skeleton renders an animated placeholder while content is loading. `visible` (default true) switches between the placeholder and real children. `circle` forces a round block. `animate` drives a soft opacity pulse. `radius` rounds the corners via the shared radius variant.",
      },
    },
  },
  args: {
    visible: true,
    circle: false,
    animate: true,
    width: 200,
    height: "$xs",
  },
  argTypes: {
    visible: {
      control: "boolean",
      description: "When false, renders children normally with no placeholder.",
    },
    circle: {
      control: "boolean",
      description: "Force an equal-sided round block. Mirrors `height` onto `width`.",
    },
    animate: {
      control: "boolean",
      description: "Soft opacity pulse while the placeholder is visible.",
    },
    radius: {
      control: "select",
      options: RADII,
      description: "Corner radius — maps to the shared radius variant.",
    },
    width: { control: "number" },
    height: { control: "text" },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Skeleton>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** A block of stacked skeletons mimicking a text-heavy content card. */
export const TextBlock: Story = {
  render: (args) => (
    <Box gap="$sm" width={320}>
      <Skeleton {...args} height="$xxs" width={240} />
      <Skeleton {...args} height="$xxs" width={320} />
      <Skeleton {...args} height="$xxs" width={300} />
      <Skeleton {...args} height="$xxs" width={180} />
    </Box>
  ),
  args: { width: undefined, height: undefined },
};

/** Circle variant — useful for avatar placeholders; height is mirrored onto width. */
export const Circle: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Skeleton {...args} circle height="$md" />
      <Skeleton {...args} circle height="$xl" />
      <Skeleton {...args} circle height="$xxl" />
      <Skeleton {...args} circle height={96} />
    </Box>
  ),
  args: { circle: true, width: undefined, height: undefined },
};

/** All supported radius values applied to the same block. */
export const Radii: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {RADII.map((radius) => (
        <Box key={radius} gap="$xs" alignItems="center">
          <Skeleton {...args} radius={radius} width={80} height="$xl" />
          <Text fontSize="$xxs" lineHeight="$xxs">
            {radius}
          </Text>
        </Box>
      ))}
    </Box>
  ),
  args: { width: undefined, height: undefined },
};

/** Elevation shadow ladder applied via the inherited `shadow` prop. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} gap="$xs" alignItems="center">
          <Skeleton {...args} shadow={shadow} animate={false} width={80} height="$xl" />
          <Text fontSize="$xxs" lineHeight="$xxs">
            {shadow}
          </Text>
        </Box>
      ))}
    </Box>
  ),
  args: { width: undefined, height: undefined },
};

/** Animate disabled — static placeholder with no pulse. Useful for reduced-motion contexts. */
export const NoAnimation: Story = {
  args: { animate: false, width: 200, height: "$xs" },
};

/** When visible is false the real children are rendered and the placeholder is gone. */
export const ContentLoaded: Story = {
  render: (args) => (
    <Skeleton {...args} visible={false} width={280} height="$xl">
      <Box
        backgroundColor="$color3"
        padding="$md"
        borderRadius="$sm"
        width={280}
        height="$xl"
        justifyContent="center"
        alignItems="center"
      >
        <Text>Content has loaded</Text>
      </Box>
    </Skeleton>
  ),
  args: { visible: false },
};

/** Controlled toggle — press the button to flip between loading and loaded states. */
export const Controlled: Story = {
  render: (args) => {
    const [loading, setLoading] = React.useState(true);
    return (
      <Box gap="$lg" alignItems="center">
        <Box gap="$sm" width={280}>
          <Skeleton {...args} visible={loading} height="$xxs" width={240}>
            <Text>Jane Doe</Text>
          </Skeleton>
          <Skeleton {...args} visible={loading} height="$xxs" width={180}>
            <Text>Senior Engineer</Text>
          </Skeleton>
          <Skeleton {...args} visible={loading} height="$xxs" width={200}>
            <Text>jane@example.com</Text>
          </Skeleton>
        </Box>
        <Box
          render="button"
          onPress={() => setLoading((v) => !v)}
          backgroundColor="$color5"
          paddingHorizontal="$md"
          paddingVertical="$sm"
          borderRadius="$sm"
          style={{ cursor: "pointer" }}
        >
          <Text>{loading ? "Finish loading" : "Reset to loading"}</Text>
        </Box>
      </Box>
    );
  },
  args: { width: undefined, height: undefined },
};

/** Card skeleton — a realistic layout with a circle avatar and stacked text lines. */
export const CardLayout: Story = {
  render: (args) => (
    <Box
      flexDirection="row"
      gap="$md"
      padding="$lg"
      borderRadius="$md"
      backgroundColor="$color2"
      width={340}
    >
      <Skeleton {...args} circle height="$xxl" />
      <Box gap="$sm" flex={1} justifyContent="center">
        <Skeleton {...args} height="$xxs" width="60%" />
        <Skeleton {...args} height="$xxs" width="90%" />
        <Skeleton {...args} height="$xxs" width="75%" />
      </Box>
    </Box>
  ),
  args: { width: undefined, height: undefined },
};
