import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { Tooltip } from "./Tooltip";

const POSITIONS = [
  "top",
  "top-start",
  "top-end",
  "bottom",
  "bottom-start",
  "bottom-end",
  "left",
  "left-start",
  "left-end",
  "right",
  "right-start",
  "right-end",
] as const;

const TRANSITIONS = [
  "fade",
  "fade-up",
  "fade-down",
  "fade-left",
  "fade-right",
  "scale",
  "skew-up",
  "rotate-left",
  "slide-down",
  "slide-up",
  "pop",
  "pop-top-left",
  "pop-bottom-right",
] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Overlays/Tooltip",
  component: Tooltip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Tooltip wraps a single target element and renders a floating label on hover (or focus/touch when enabled). Positioning is handled by floating-ui with automatic flip and shift on overflow.",
      },
    },
  },
  args: {
    label: "Tooltip label",
    position: "top",
    offset: 5,
    theme: undefined,
    withArrow: false,
    arrowSize: 4,
    arrowOffset: 5,
    arrowRadius: 0,
    multiline: false,
    disabled: false,
    withinPortal: true,
    keepMounted: false,
    zIndex: 300,
  },
  argTypes: {
    label: {
      control: "text",
      description: "Floating label content shown when the tooltip opens.",
    },
    position: {
      control: "select",
      options: POSITIONS,
      description: "Preferred placement relative to the target element.",
    },
    offset: {
      control: { type: "number", min: 0, max: 40 },
      description: "Main-axis gap in px between the target and the label.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Accent theme used for the tooltip label.",
    },
    openDelay: {
      control: { type: "number", min: 0, max: 2000 },
      description: "Delay in ms before the tooltip opens.",
    },
    closeDelay: {
      control: { type: "number", min: 0, max: 2000 },
      description: "Delay in ms before the tooltip closes.",
    },
    withArrow: { control: "boolean", description: "Show a small arrow pointing at the target." },
    arrowSize: {
      control: { type: "number", min: 2, max: 20 },
      description: "Arrow square size in px (before the internal 2× scale).",
    },
    multiline: {
      control: "boolean",
      description: "Allow the label to wrap across multiple lines.",
    },
    shadow: {
      control: "select",
      options: [undefined, "xs", "sm", "md", "lg", "xl"],
      description: "Elevation — drop shadow from the shared ladder.",
    },
    disabled: { control: "boolean", description: "Prevent the tooltip from ever opening." },
    withinPortal: {
      control: "boolean",
      description: "Render the label in a portal (recommended).",
    },
    keepMounted: {
      control: "boolean",
      description: "Keep the label node mounted while closed (hidden via display:none).",
    },
    transitionProps: {
      control: "object",
      description:
        "Enter/exit animation: { transition, duration, exitDuration, timingFunction }. Defaults to a 150ms fade.",
    },
    events: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Tooltip>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Tooltip {...args}>
      <Button variant="default">Hover me</Button>
    </Tooltip>
  ),
};

/**
 * Configurable enter/exit animation via `transitionProps`. Pick a preset, then
 * toggle the label to watch it animate (shared `Transition` engine — same presets
 * on web and native).
 */
export const Transitions: Story = {
  render: (args) => {
    const [transition, setTransition] = React.useState<(typeof TRANSITIONS)[number]>("pop");
    const [opened, setOpened] = React.useState(true);
    return (
      <Box gap="$lg" alignItems="center" padding="$xl">
        <Box flexDirection="row" flexWrap="wrap" gap="$xs" maxWidth={520} justifyContent="center">
          {TRANSITIONS.map((name) => (
            <Button
              key={name}
              size="xs"
              variant={name === transition ? "filled" : "default"}
              onPress={() => setTransition(name)}
            >
              {name}
            </Button>
          ))}
        </Box>
        <Tooltip
          {...args}
          label={transition}
          opened={opened}
          transitionProps={{ transition, duration: 250 }}
        >
          <Button variant="default" onPress={() => setOpened((o) => !o)}>
            {opened ? "Hide" : "Show"} label
          </Button>
        </Tooltip>
      </Box>
    );
  },
};

/** All twelve supported placements displayed at once for a quick visual overview. */
export const Positions: Story = {
  render: () => (
    <Box
      flexDirection="row"
      flexWrap="wrap"
      gap="$lg"
      alignItems="center"
      justifyContent="center"
      padding="$xl"
    >
      {POSITIONS.map((position) => (
        <Tooltip key={position} label={position} position={position} opened>
          <Button variant="outline" size="sm">
            {position}
          </Button>
        </Tooltip>
      ))}
    </Box>
  ),
};

/** Tooltip with an arrow pointing at its target; arrow size is configurable. */
export const WithArrow: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      <Tooltip {...args} label="Small arrow" withArrow arrowSize={4} position="top">
        <Button variant="default">Small arrow</Button>
      </Tooltip>
      <Tooltip {...args} label="Large arrow" withArrow arrowSize={8} position="top">
        <Button variant="default">Large arrow</Button>
      </Tooltip>
      <Tooltip
        {...args}
        label="Rounded arrow"
        withArrow
        arrowSize={6}
        arrowRadius={2}
        position="bottom"
      >
        <Button variant="default">Rounded arrow</Button>
      </Tooltip>
    </Box>
  ),
};

/** Tooltip label colors follow the active Tamagui theme. */
export const Theme: Story = {
  render: (args) => (
    <Tooltip {...args} label="Red themed tooltip" theme="red" opened>
      <Button variant="default">Red theme</Button>
    </Tooltip>
  ),
};

/** Disabled tooltip — even with `opened` forced it never shows the label. */
export const Disabled: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Tooltip {...args} label="This will show" disabled={false}>
        <Button variant="default">Enabled</Button>
      </Tooltip>
      <Tooltip {...args} label="This will never show" disabled>
        <Button variant="default" disabled>
          Disabled tooltip
        </Button>
      </Tooltip>
    </Box>
  ),
};

/** Multiline label — wraps long content instead of truncating at 320 px. */
export const Multiline: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Tooltip
        {...args}
        label="This is a single-line tooltip that truncates at 320 px wide."
        position="top"
      >
        <Button variant="default">Single-line</Button>
      </Tooltip>
      <Tooltip
        {...args}
        label="This is a multiline tooltip. It wraps long content across several lines so that the entire message remains readable without hard truncation."
        multiline
        position="top"
      >
        <Button variant="default">Multiline</Button>
      </Tooltip>
    </Box>
  ),
};

/** Open and close delays add a intentional pause before the label appears or disappears. */
export const Delays: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Tooltip {...args} label="Instant (no delay)" openDelay={0} closeDelay={0}>
        <Button variant="default">No delay</Button>
      </Tooltip>
      <Tooltip {...args} label="Opens after 500 ms" openDelay={500}>
        <Button variant="default">Open delay 500 ms</Button>
      </Tooltip>
      <Tooltip {...args} label="Closes after 300 ms" closeDelay={300}>
        <Button variant="default">Close delay 300 ms</Button>
      </Tooltip>
    </Box>
  ),
};

/** Controlled open state — the parent drives visibility via React state. */
export const Controlled: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box gap="$md" alignItems="center">
        <Tooltip {...args} label="Controlled tooltip" opened={opened}>
          <Button variant="default" onPress={() => setOpened((o) => !o)}>
            {opened ? "Click to hide" : "Click to show"}
          </Button>
        </Tooltip>
        <Text fontSize="$sm" color="$color10">
          Tooltip is: {opened ? "open" : "closed"}
        </Text>
      </Box>
    );
  },
};

/** Touch and focus events can trigger the tooltip in addition to (or instead of) hover. */
export const Events: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Tooltip
        {...args}
        label="Hover only (default)"
        events={{ hover: true, focus: false, touch: false }}
      >
        <Button variant="default">Hover</Button>
      </Tooltip>
      <Tooltip {...args} label="Focus only" events={{ hover: false, focus: true, touch: false }}>
        <Button variant="default">Focus (Tab here)</Button>
      </Tooltip>
      <Tooltip {...args} label="Touch / tap" events={{ hover: false, focus: false, touch: true }}>
        <Button variant="default">Touch / tap</Button>
      </Tooltip>
      <Tooltip
        {...args}
        label="All interactions"
        events={{ hover: true, focus: true, touch: true }}
      >
        <Button variant="default">All</Button>
      </Tooltip>
    </Box>
  ),
};

/** Optional elevation via the `shadow` prop — the shared ladder from xs to xl. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center" padding="$xl">
      {SHADOWS.map((shadow) => (
        <Tooltip key={shadow} {...args} label={`shadow ${shadow}`} shadow={shadow} opened>
          <Button variant="default">{shadow}</Button>
        </Tooltip>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `dropdown` and `label`. */
export const Styles: Story = {
  render: (args) => (
    <Tooltip
      {...args}
      label="Styled tooltip"
      opened
      styles={{
        dropdown: { backgroundColor: "$blue9" },
        label: { color: "$color1", fontWeight: "700" },
      }}
    >
      <Button variant="default">Styled slots</Button>
    </Tooltip>
  ),
};
