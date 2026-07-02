import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Transition } from "./Transition";
import type { TransitionName } from "./Transition";

const TRANSITIONS: TransitionName[] = [
  "fade",
  "fade-up",
  "fade-down",
  "fade-left",
  "fade-right",
  "scale",
  "scale-y",
  "scale-x",
  "skew-up",
  "skew-down",
  "rotate-left",
  "rotate-right",
  "slide-down",
  "slide-up",
  "slide-left",
  "slide-right",
  "pop",
  "pop-top-left",
  "pop-top-right",
  "pop-bottom-left",
  "pop-bottom-right",
];

const meta = {
  title: "Overlays/Transition",
  component: Transition,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Transition drives single-child mount/unmount animations via a render prop. It mirrors Mantine's `Transition` API: the `mounted` prop controls visibility, `transition` selects the preset, and the render prop receives computed `style` that the child spreads onto any element. Respects the user's reduced-motion preference.",
      },
    },
  },
  args: {
    mounted: true,
    transition: "fade",
    duration: 250,
    timingFunction: "ease",
    keepMounted: false,
  },
  argTypes: {
    mounted: {
      control: "boolean",
      description: "Whether the child should be visible/mounted.",
    },
    transition: {
      control: "select",
      options: TRANSITIONS,
      description: "Transition preset name (or a custom style object).",
    },
    duration: {
      control: { type: "range", min: 0, max: 2000, step: 50 },
      description: "Enter transition duration in ms.",
    },
    exitDuration: {
      control: { type: "range", min: 0, max: 2000, step: 50 },
      description: "Exit transition duration in ms (defaults to `duration`).",
    },
    timingFunction: {
      control: "select",
      options: ["ease", "ease-in", "ease-out", "ease-in-out", "linear"],
      description: "CSS transition timing function.",
    },
    keepMounted: {
      control: "boolean",
      description:
        "When true the child stays in the DOM with `display:none` after exiting rather than being unmounted.",
    },
    enterDelay: {
      control: { type: "number", min: 0 },
      description: "Delay in ms before the enter transition starts.",
    },
    exitDelay: {
      control: { type: "number", min: 0 },
      description: "Delay in ms before the exit transition starts.",
    },
    children: { control: false },
    onEnter: { control: false },
    onEntered: { control: false },
    onExit: { control: false },
    onExited: { control: false },
  },
} satisfies Meta<typeof Transition>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Transition>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Transition {...args}>
      {(styles) => (
        <Box
          style={styles}
          backgroundColor="$blue8"
          padding="$lg"
          borderRadius="$sm"
          alignItems="center"
          justifyContent="center"
          width={180}
          height={80}
        >
          <Text color="white" fontWeight="bold">
            Hello, world!
          </Text>
        </Box>
      )}
    </Transition>
  ),
};

/** Toggle mounted on and off to watch the animation play. */
export const Controlled: Story = {
  render: (args) => {
    const [mounted, setMounted] = React.useState(true);
    return (
      <Box gap="$lg" alignItems="center">
        <Box
          render="button"
          onPress={() => setMounted((m) => !m)}
          backgroundColor="$gray5"
          paddingHorizontal="$md"
          paddingVertical="$sm"
          borderRadius="$sm"
          style={{ cursor: "pointer" }}
        >
          <Text>{mounted ? "Hide" : "Show"}</Text>
        </Box>
        <Transition {...args} mounted={mounted}>
          {(styles) => (
            <Box
              style={styles}
              backgroundColor="$blue8"
              padding="$lg"
              borderRadius="$sm"
              alignItems="center"
              justifyContent="center"
              width={180}
              height={80}
            >
              <Text color="white" fontWeight="bold">
                Animated content
              </Text>
            </Box>
          )}
        </Transition>
      </Box>
    );
  },
};

/** Every built-in transition preset side by side — click Show/Hide to compare. */
export const AllPresets: Story = {
  render: (args) => {
    const [mounted, setMounted] = React.useState(true);
    return (
      <Box gap="$lg" alignItems="flex-start">
        <Box
          render="button"
          onPress={() => setMounted((m) => !m)}
          backgroundColor="$gray5"
          paddingHorizontal="$md"
          paddingVertical="$sm"
          borderRadius="$sm"
          style={{ cursor: "pointer" }}
        >
          <Text>{mounted ? "Hide all" : "Show all"}</Text>
        </Box>
        <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
          {TRANSITIONS.map((name) => (
            <Transition key={name} {...args} mounted={mounted} transition={name}>
              {(styles) => (
                <Box
                  style={styles}
                  backgroundColor="$blue8"
                  padding="$sm"
                  borderRadius="$xs"
                  alignItems="center"
                  justifyContent="center"
                  width={110}
                  height="$xl"
                >
                  <Text color="white" fontSize="$xs" textAlign="center">
                    {name}
                  </Text>
                </Box>
              )}
            </Transition>
          ))}
        </Box>
      </Box>
    );
  },
};

/** keepMounted keeps the child in the DOM (display:none) instead of unmounting it. */
export const KeepMounted: Story = {
  render: (args) => {
    const [mounted, setMounted] = React.useState(true);
    return (
      <Box gap="$lg" alignItems="center">
        <Box
          render="button"
          onPress={() => setMounted((m) => !m)}
          backgroundColor="$gray5"
          paddingHorizontal="$md"
          paddingVertical="$sm"
          borderRadius="$sm"
          style={{ cursor: "pointer" }}
        >
          <Text>{mounted ? "Hide (stays in DOM)" : "Show"}</Text>
        </Box>
        <Transition {...args} mounted={mounted} keepMounted>
          {(styles) => (
            <Box
              style={styles}
              backgroundColor="$green8"
              padding="$lg"
              borderRadius="$sm"
              alignItems="center"
              justifyContent="center"
              width={220}
              height={80}
            >
              <Text color="white" fontWeight="bold">
                I stay mounted (display:none)
              </Text>
            </Box>
          )}
        </Transition>
      </Box>
    );
  },
  args: { keepMounted: true },
};

/** Enter and exit delays let you stagger reveals — useful for sequential animations. */
export const WithDelays: Story = {
  render: (args) => {
    const [mounted, setMounted] = React.useState(false);
    return (
      <Box gap="$lg" alignItems="flex-start">
        <Box
          render="button"
          onPress={() => setMounted((m) => !m)}
          backgroundColor="$gray5"
          paddingHorizontal="$md"
          paddingVertical="$sm"
          borderRadius="$sm"
          style={{ cursor: "pointer" }}
        >
          <Text>{mounted ? "Hide" : "Show (staggered)"}</Text>
        </Box>
        <Box gap="$sm">
          {[0, 100, 200, 300].map((delay, i) => (
            <Transition
              key={delay}
              {...args}
              mounted={mounted}
              transition="fade-right"
              enterDelay={delay}
              exitDelay={300 - delay}
            >
              {(styles) => (
                <Box
                  style={styles}
                  backgroundColor="$blue8"
                  padding="$sm"
                  paddingHorizontal="$md"
                  borderRadius="$sm"
                  width={200}
                >
                  <Text color="white">Item {i + 1}</Text>
                </Box>
              )}
            </Transition>
          ))}
        </Box>
      </Box>
    );
  },
  args: { duration: 300 },
};

/** Slow duration makes it easy to observe the transition in detail. */
export const SlowMotion: Story = {
  render: (args) => {
    const [mounted, setMounted] = React.useState(true);
    return (
      <Box gap="$lg" alignItems="center">
        <Box
          render="button"
          onPress={() => setMounted((m) => !m)}
          backgroundColor="$gray5"
          paddingHorizontal="$md"
          paddingVertical="$sm"
          borderRadius="$sm"
          style={{ cursor: "pointer" }}
        >
          <Text>{mounted ? "Hide (slow)" : "Show (slow)"}</Text>
        </Box>
        <Transition {...args} mounted={mounted}>
          {(styles) => (
            <Box
              style={styles}
              backgroundColor="$yellow8"
              padding="$lg"
              borderRadius="$sm"
              alignItems="center"
              justifyContent="center"
              width={200}
              height={80}
            >
              <Text color="white" fontWeight="bold">
                Slow transition
              </Text>
            </Box>
          )}
        </Transition>
      </Box>
    );
  },
  args: { transition: "scale", duration: 1200, timingFunction: "ease-in-out" },
};
