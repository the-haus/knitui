import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Marquee } from "./Marquee";

const meta = {
  title: "Data Display/Marquee",
  component: Marquee,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Marquee continuously scrolls its children in a seamless loop. Motion is driven cross-platform (no web-only keyframes). Supports horizontal and vertical orientations, reverse direction, configurable speed, and optional hover-pause.",
      },
    },
  },
  args: {
    reverse: false,
    pauseOnHover: false,
    repeat: 4,
    duration: 8000,
    orientation: "horizontal",
    gap: "$md",
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Scroll axis — horizontal or vertical.",
    },
    reverse: {
      control: "boolean",
      description: "Reverse the scroll direction.",
    },
    pauseOnHover: {
      control: "boolean",
      description: "Pause animation while the pointer is over the marquee (web only).",
    },
    repeat: {
      control: { type: "number", min: 1, max: 10 },
      description: "Number of times the children group is duplicated for seamless looping.",
    },
    duration: {
      control: { type: "number", min: 1000, max: 60000, step: 1000 },
      description: "Time in ms for one full group to scroll past.",
    },
    gap: {
      control: "select",
      options: ["$xs", "$sm", "$md", "$lg", "$xl"],
      description: "Gap between repeated groups.",
    },
    fadeEdges: { control: "boolean" },
    children: { control: false },
  },
  decorators: [
    (Story) => (
      <Box width={480}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Marquee>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Marquee>>;

/* -------------------------------------------------------------------------- */
/* Helpers                                                                     */
/* -------------------------------------------------------------------------- */

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const TAGS = ["React", "Tamagui", "TypeScript", "Storybook", "Design System"];

const TagList = () => (
  <>
    {TAGS.map((tag) => (
      <Box
        key={tag}
        paddingHorizontal="$sm"
        paddingVertical="$xs"
        backgroundColor="$color3"
        borderRadius="$sm"
      >
        <Text>{tag}</Text>
      </Box>
    ))}
  </>
);

/* -------------------------------------------------------------------------- */
/* Stories                                                                     */
/* -------------------------------------------------------------------------- */

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  args: {
    children: <TagList />,
  },
};

/** Horizontal scroll — the default orientation. */
export const Horizontal: Story = {
  args: {
    orientation: "horizontal",
    children: <TagList />,
  },
};

/** Vertical scroll — orientation set to vertical. */
export const Vertical: Story = {
  decorators: [
    (Story) => (
      <Box height={200} width={120}>
        <Story />
      </Box>
    ),
  ],
  args: {
    orientation: "vertical",
    children: (
      <>
        {TAGS.map((tag) => (
          <Box key={tag} paddingVertical="$xs">
            <Text>{tag}</Text>
          </Box>
        ))}
      </>
    ),
  },
};

/** Reverse direction — content scrolls right-to-left (or bottom-to-top). */
export const Reverse: Story = {
  args: {
    reverse: true,
    children: <TagList />,
  },
};

/** The inherited `shadow` elevation prop, from xs to xl. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$lg">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} gap="$xs">
          <Text fontSize="$sm" color="$color11">
            {shadow}
          </Text>
          <Marquee {...args} shadow={shadow}>
            <TagList />
          </Marquee>
        </Box>
      ))}
    </Box>
  ),
};

/** Pause on hover — animation freezes when the pointer enters the marquee. */
export const PauseOnHover: Story = {
  args: {
    pauseOnHover: true,
    duration: 5000,
    children: <TagList />,
  },
};

/** Slow speed — a long duration makes the scroll deliberate and easy to read. */
export const SlowSpeed: Story = {
  args: {
    duration: 20000,
    children: <TagList />,
  },
};

/** Fast speed — a short duration creates urgency or a ticker-tape effect. */
export const FastSpeed: Story = {
  args: {
    duration: 2000,
    children: <TagList />,
  },
};

/** Custom repeat count — fewer copies (2) visible at once. */
export const FewRepeats: Story = {
  args: {
    repeat: 2,
    duration: 6000,
    children: <TagList />,
  },
};

/** Per-slot `styles` targets individual parts — here the `root` frame and the `text` children. */
export const Styles: Story = {
  args: {
    duration: 8000,
    children: "Breaking news — per-slot styles in action — ",
    styles: {
      root: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
      text: { color: "$red9", fontWeight: "700" },
    },
  },
};

/** Rich content — images, icons and multi-line cards scrolled as items. */
export const RichContent: Story = {
  args: {
    duration: 10000,
    pauseOnHover: true,
    children: (
      <>
        {["⭐ Feature A", "🔥 Feature B", "💡 Feature C", "🚀 Feature D"].map((label) => (
          <Box
            key={label}
            paddingHorizontal="$md"
            paddingVertical="$sm"
            backgroundColor="$color4"
            borderRadius="$md"
            minWidth={140}
            alignItems="center"
          >
            <Text fontWeight="700">{label}</Text>
            <Text fontSize="$sm" color="$color10">
              tap to learn more
            </Text>
          </Box>
        ))}
      </>
    ),
  },
};
