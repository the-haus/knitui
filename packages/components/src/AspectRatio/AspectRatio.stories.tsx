import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { AspectRatio } from "./AspectRatio";

const meta = {
  title: "Layout/AspectRatio",
  component: AspectRatio,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "AspectRatio constrains its content to a fixed width-to-height ratio. The `ratio` prop accepts a number (width / height) — e.g. `16 / 9` for widescreen. The box fills available width and derives its height accordingly. Child overflow is clipped.",
      },
    },
  },
  args: {
    ratio: 16 / 9,
  },
  argTypes: {
    ratio: {
      control: { type: "number", min: 0.1, max: 5, step: 0.01 },
      description: "Width / height fraction, e.g. `16 / 9`. Defaults to `1` (square).",
    },
  },
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof AspectRatio>;

export default meta;

type Story = StoryObj<ComponentProps<typeof AspectRatio>>;

/** The interactive playground — adjust the ratio from the Controls panel. */
export const Playground: Story = {
  args: {
    children: (
      <Box flex={1} backgroundColor="$color5" alignItems="center" justifyContent="center">
        <Text>16 / 9</Text>
      </Box>
    ),
  },
};

/** Square ratio (1 : 1) — the default when no ratio is provided. */
export const Square: Story = {
  args: {
    ratio: 1,
    children: (
      <Box flex={1} backgroundColor="$color5" alignItems="center" justifyContent="center">
        <Text>1 : 1</Text>
      </Box>
    ),
  },
};

/** Classic 16 : 9 widescreen ratio, typical for video embeds. */
export const Widescreen: Story = {
  args: {
    ratio: 16 / 9,
    children: (
      <Box flex={1} backgroundColor="$color6" alignItems="center" justifyContent="center">
        <Text>16 : 9</Text>
      </Box>
    ),
  },
};

/** Portrait 9 : 16 ratio, suitable for vertical media. */
export const Portrait: Story = {
  args: {
    ratio: 9 / 16,
    children: (
      <Box flex={1} backgroundColor="$color7" alignItems="center" justifyContent="center">
        <Text>9 : 16</Text>
      </Box>
    ),
  },
};

/** Common ratios side by side for visual comparison. */
export const CommonRatios: Story = {
  decorators: [
    (Story) => (
      <Box width={600}>
        <Story />
      </Box>
    ),
  ],
  render: () => {
    const RATIOS: { label: string; value: number }[] = [
      { label: "1:1", value: 1 },
      { label: "4:3", value: 4 / 3 },
      { label: "16:9", value: 16 / 9 },
      { label: "21:9", value: 21 / 9 },
    ];

    return (
      <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="flex-start">
        {RATIOS.map(({ label, value }) => (
          <Box key={label} width={120}>
            <AspectRatio ratio={value}>
              <Box flex={1} backgroundColor="$color5" alignItems="center" justifyContent="center">
                <Text>{label}</Text>
              </Box>
            </AspectRatio>
          </Box>
        ))}
      </Box>
    );
  },
};

/**
 * Inside a flex row — `alignSelf: "stretch"` fills the row's height and derives
 * the width from the ratio, so the box keeps its proportions next to a flex
 * sibling instead of forcing 100% width.
 */
export const InsideFlexRow: Story = {
  decorators: [
    (Story) => (
      <Box width={400}>
        <Story />
      </Box>
    ),
  ],
  render: () => (
    <Box flexDirection="row" height={160} gap="$md" alignItems="stretch">
      <AspectRatio ratio={1}>
        <Box flex={1} backgroundColor="$color5" alignItems="center" justifyContent="center">
          <Text>1 : 1</Text>
        </Box>
      </AspectRatio>
      <Box flex={1} backgroundColor="$color3" alignItems="center" justifyContent="center">
        <Text>flex sibling</Text>
      </Box>
    </Box>
  ),
};

/** Overflow clipping — the inner content is larger than the container and gets clipped. */
export const OverflowClipped: Story = {
  args: {
    ratio: 16 / 9,
    children: (
      <Box
        width={640}
        height={640}
        backgroundColor="$color8"
        alignItems="center"
        justifyContent="center"
      >
        <Text>⭐ Oversized content — clipped by AspectRatio</Text>
      </Box>
    ),
  },
};

/** Renders an image-like placeholder scaled inside the ratio box. */
export const WithImagePlaceholder: Story = {
  args: {
    ratio: 16 / 9,
    children: (
      <Box flex={1} backgroundColor="$color4" alignItems="center" justifyContent="center" gap="$sm">
        <Text fontSize={32}>🖼</Text>
        <Text>Image placeholder</Text>
      </Box>
    ),
  },
};
