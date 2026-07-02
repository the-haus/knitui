import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Spoiler } from "./Spoiler";

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.";

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Feedback/Spoiler",
  component: Spoiler,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Spoiler collapses content taller than `maxHeight` and renders a toggle control to reveal or hide the overflow. Supports both controlled (`expanded`) and uncontrolled (`defaultExpanded`) usage.",
      },
    },
  },
  args: {
    showLabel: "Show more",
    hideLabel: "Hide",
    maxHeight: 80,
    defaultExpanded: false,
    transitionDuration: 200,
    children: LOREM,
  },
  argTypes: {
    maxHeight: {
      control: { type: "number", min: 0, step: 10 },
      description:
        "Maximum height (px) of the collapsed region. The toggle appears only when the content exceeds this value.",
    },
    showLabel: {
      control: "text",
      description: "Label on the control while the content is collapsed.",
    },
    hideLabel: {
      control: "text",
      description: "Label on the control while the content is expanded.",
    },
    defaultExpanded: {
      control: "boolean",
      description: "Initial expanded state (uncontrolled).",
    },
    expanded: {
      control: "boolean",
      description: "Controlled expanded state.",
    },
    transitionDuration: {
      control: { type: "number", min: 0, step: 50 },
      description: "Height-animation duration in ms. Set to 0 to disable the animation entirely.",
    },
    showAriaLabel: { control: "text" },
    hideAriaLabel: { control: "text" },
    children: { control: "text" },
    onExpandedChange: { control: false },
    controlRef: { control: false },
  },
} satisfies Meta<typeof Spoiler>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Spoiler>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Content that is shorter than maxHeight — the toggle is never rendered. */
export const NoOverflow: Story = {
  args: {
    maxHeight: 200,
    children: "Short content that fits within the max height — no toggle appears.",
  },
};

/** Content that overflows and reveals the toggle control. */
export const WithOverflow: Story = {
  args: {
    maxHeight: 80,
    children: LOREM,
  },
};

/** Starts fully expanded via defaultExpanded. */
export const DefaultExpanded: Story = {
  args: {
    defaultExpanded: true,
    maxHeight: 80,
    children: LOREM,
  },
};

/** Elevation shadow ladder applied via the inherited `shadow` prop. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$xl">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} gap="$xs">
          <Text fontSize="$xs" color="$color11">
            {shadow}
          </Text>
          <Spoiler {...args} shadow={shadow} padding="$md" maxHeight={80}>
            {LOREM}
          </Spoiler>
        </Box>
      ))}
    </Box>
  ),
};

/** Controlled expanded state wired to external React state. */
export const Controlled: Story = {
  render: (args) => {
    const [expanded, setExpanded] = React.useState(false);
    return (
      <Box gap="$md">
        <Text>External state: {expanded ? "expanded" : "collapsed"}</Text>
        <Spoiler {...args} expanded={expanded} onExpandedChange={setExpanded} />
      </Box>
    );
  },
  args: {
    maxHeight: 80,
    children: LOREM,
  },
};

/** Animation disabled — the region snaps to its target height instantly. */
export const NoAnimation: Story = {
  args: {
    transitionDuration: 0,
    maxHeight: 80,
    children: LOREM,
  },
};

/** Custom show/hide labels with emoji to illustrate arbitrary ReactNode labels. */
export const CustomLabels: Story = {
  args: {
    showLabel: <Text>⬇ Read the full story</Text>,
    hideLabel: <Text>⬆ Collapse</Text>,
    maxHeight: 80,
    children: LOREM,
  },
};

/** Multiple independent Spoilers side by side, each with a different maxHeight. */
export const MultipleInstances: Story = {
  render: (args) => (
    <Box gap="$lg">
      {([60, 100, 140] as const).map((maxHeight) => (
        <Box key={maxHeight} gap="$xs">
          <Text fontWeight="700">maxHeight={maxHeight}px</Text>
          <Spoiler {...args} maxHeight={maxHeight} />
        </Box>
      ))}
    </Box>
  ),
  args: {
    showLabel: "Show more",
    hideLabel: "Hide",
    children: LOREM,
  },
};

/** Per-slot `styles` targets individual parts — here the `region` and `control`. */
export const Styles: Story = {
  args: {
    showLabel: "Show more",
    hideLabel: "Hide",
    maxHeight: 80,
    children: LOREM,
    styles: {
      region: { backgroundColor: "$blue3" },
      control: { color: "$red9", fontWeight: "700" },
    },
  },
};
