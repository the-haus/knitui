import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { LoadingOverlay } from "./LoadingOverlay";

const LOADER_TYPES = ["oval", "dots", "bars"] as const;
const LOADER_SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Feedback/LoadingOverlay",
  component: LoadingOverlay,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "LoadingOverlay covers its parent container with a centered `Loader` over a translucent scrim. It composes `Overlay` + `Loader` and renders `null` when `visible` is false. The loader accent follows the active `theme` prop; scrim background and opacity are configurable via `overlayProps`.",
      },
    },
  },
  args: {
    visible: true,
    zIndex: 400,
  },
  argTypes: {
    visible: {
      control: "boolean",
      description: "Mount the overlay when true; renders nothing when false.",
    },
    zIndex: {
      control: "number",
      description: "Stack order of the overlay.",
    },
    loaderProps: { control: false },
    overlayProps: { control: false },
  },
} satisfies Meta<typeof LoadingOverlay>;

export default meta;

type Story = StoryObj<ComponentProps<typeof LoadingOverlay>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  decorators: [
    (Story) => (
      <Box
        width={320}
        height={200}
        backgroundColor="$background"
        borderRadius="$md"
        overflow="hidden"
        position="relative"
      >
        <Text padding="$md">Content beneath the overlay.</Text>
        <Story />
      </Box>
    ),
  ],
};

/** Demonstrates the default hidden state — nothing is rendered when visible is false. */
export const Hidden: Story = {
  args: { visible: false },
  decorators: [
    (Story) => (
      <Box
        width={320}
        height={160}
        backgroundColor="$background"
        borderRadius="$md"
        overflow="hidden"
        position="relative"
      >
        <Text padding="$md">No overlay rendered — visible is false.</Text>
        <Story />
      </Box>
    ),
  ],
};

/** Controlled toggle — use the button to show and hide the overlay. */
export const Controlled: Story = {
  args: {},
  render: () => {
    const [visible, setVisible] = React.useState(false);
    return (
      <Box gap="$md" alignItems="center">
        <Box
          width={320}
          height={180}
          backgroundColor="$background"
          borderRadius="$md"
          overflow="hidden"
          position="relative"
        >
          <Text padding="$md">Content beneath the overlay.</Text>
          <LoadingOverlay visible={visible} />
        </Box>
        <Button onPress={() => setVisible((v) => !v)}>
          {visible ? "Hide overlay" : "Show overlay"}
        </Button>
      </Box>
    );
  },
};

/** All three loader types — oval (spinning ring), dots, and bars — side by side. */
export const LoaderTypes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      {LOADER_TYPES.map((type) => (
        <Box
          key={type}
          width={140}
          height={120}
          backgroundColor="$background"
          borderRadius="$md"
          overflow="hidden"
          position="relative"
        >
          <Text padding="$sm" fontSize="$sm" color="$color11">
            {type}
          </Text>
          <LoadingOverlay {...args} visible loaderProps={{ type }} />
        </Box>
      ))}
    </Box>
  ),
};

/** The full loader size scale swept across a fixed container. */
export const LoaderSizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      {LOADER_SIZES.map((size) => (
        <Box
          key={size}
          width={120}
          height={120}
          backgroundColor="$background"
          borderRadius="$md"
          overflow="hidden"
          position="relative"
        >
          <Text padding="$sm" fontSize="$sm" color="$color11">
            {size}
          </Text>
          <LoadingOverlay {...args} visible loaderProps={{ size }} />
        </Box>
      ))}
    </Box>
  ),
};

/** The inherited `shadow` elevation prop, from xs to xl. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Box
          key={shadow}
          width={120}
          height={120}
          backgroundColor="$background"
          borderRadius="$md"
          overflow="hidden"
          position="relative"
        >
          <Text padding="$sm" fontSize="$sm" color="$color11">
            {shadow}
          </Text>
          <LoadingOverlay {...args} visible shadow={shadow} loaderProps={{ size: "lg" }} />
        </Box>
      ))}
    </Box>
  ),
};

/** Custom scrim — dark background at higher opacity to show how overlayProps affect the wash. */
export const DarkScrim: Story = {
  args: {
    visible: true,
    overlayProps: { backgroundColor: "#000", backgroundOpacity: 0.85 },
    loaderProps: { type: "oval", size: "lg" },
  },
  decorators: [
    (Story) => (
      <Box
        width={320}
        height={200}
        backgroundColor="$background"
        borderRadius="$md"
        overflow="hidden"
        position="relative"
      >
        <Text padding="$md">Content beneath a dark scrim.</Text>
        <Story />
      </Box>
    ),
  ],
};

/** Blurred scrim — applies a backdrop blur for a frosted-glass effect (web only). */
export const BlurredScrim: Story = {
  args: {
    visible: true,
    overlayProps: { backgroundColor: "#fff", backgroundOpacity: 0.4, blur: 8 },
    loaderProps: { type: "dots", size: "lg" },
  },
  decorators: [
    (Story) => (
      <Box
        width={320}
        height={200}
        backgroundColor="$background"
        borderRadius="$md"
        overflow="hidden"
        position="relative"
      >
        <Box padding="$md" gap="$xs">
          <Text fontWeight="700">Article title</Text>
          <Text>Some underlying content that gets blurred behind the scrim.</Text>
        </Box>
        <Story />
      </Box>
    ),
  ],
};

/** Per-slot `styles` targets individual parts — here the `overlay` scrim and the `loader`. */
export const Styles: Story = {
  args: {
    visible: true,
    styles: {
      overlay: { backgroundColor: "$blue3", backgroundOpacity: 0.8 },
      loader: { type: "bars", size: "lg" },
    },
  },
  decorators: [
    (Story) => (
      <Box
        width={320}
        height={200}
        backgroundColor="$background"
        borderRadius="$md"
        overflow="hidden"
        position="relative"
      >
        <Text padding="$md">Content beneath the overlay.</Text>
        <Story />
      </Box>
    ),
  ],
};

/** Themed loader — the loader accent follows the active theme color ramp. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      {(["blue", "red", "green"] as const).map((theme) => (
        <Box
          key={theme}
          width={140}
          height={120}
          backgroundColor="$background"
          borderRadius="$md"
          overflow="hidden"
          position="relative"
        >
          <Text padding="$sm" fontSize="$sm" color="$color11">
            {theme}
          </Text>
          <LoadingOverlay {...args} visible theme={theme} loaderProps={{ size: "lg" }} />
        </Box>
      ))}
    </Box>
  ),
};
