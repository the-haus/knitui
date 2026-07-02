import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { Notification } from "./Notification";

const RADIUS_VALUES = ["xs", "sm", "md", "lg", "xl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;
const THEMES = ["blue", "red", "green", "yellow", "pink", "gray"] as const;

const meta = {
  title: "Feedback/Notification",
  component: Notification,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Self-contained notification tile. Renders a themed accent line (no icon) or a circular icon badge, an optional bold title, a message body, and an optional close button. Accent color comes from the `theme` prop + palette ramp.",
      },
    },
  },
  args: {
    children: "Your file has been uploaded successfully.",
    title: "Upload complete",
    withCloseButton: true,
    withBorder: false,
    loading: false,
    radius: "md",
  },
  argTypes: {
    radius: {
      control: "inline-radio",
      options: RADIUS_VALUES,
      description: "Border radius of the notification tile.",
    },
    withBorder: {
      control: "boolean",
      description: "Adds a visible border around the notification tile.",
    },
    withCloseButton: {
      control: "boolean",
      description: "Show or hide the close button.",
    },
    loading: {
      control: "boolean",
      description: "Replaces the icon slot with a spinner.",
    },
    theme: {
      control: "select",
      options: [undefined, ...THEMES],
      description: "Active theme accent — recolors the badge and accent line.",
    },
    title: { control: "text" },
    children: { control: "text" },
    icon: { control: false },
    onClose: { control: false },
    closeButtonProps: { control: false },
    loaderProps: { control: false },
  },
} satisfies Meta<typeof Notification>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Notification>>;

/** The interactive playground — tweak props from the Controls panel. */
export const Playground: Story = {};

/** Notification without a title — message-only presentation. */
export const MessageOnly: Story = {
  args: {
    title: undefined,
    children: "Your session will expire in 5 minutes.",
  },
};

/** Bold title alongside the message body; wires aria-labelledby automatically. */
export const WithTitle: Story = {
  args: {
    title: "Heads up",
    children: "There is a new version available. Refresh to update.",
  },
};

/** Icon badge replaces the left accent line; React nodes are accepted. */
export const WithIcon: Story = {
  args: {
    title: "Check your inbox",
    children: "A confirmation email has been sent to your address.",
    icon: <Text>✉️</Text>,
  },
};

/** Loading spinner in the badge slot — useful while an async operation is in progress. */
export const Loading: Story = {
  args: {
    title: "Processing",
    children: "Your request is being processed, please wait…",
    loading: true,
  },
};

/** Close button hidden — for persistent, non-dismissible notifications. */
export const WithoutCloseButton: Story = {
  args: {
    title: "Maintenance notice",
    children: "Scheduled maintenance starts at 02:00 UTC.",
    withCloseButton: false,
  },
};

/** withBorder adds a subtle $color7 border around the tile. */
export const WithBorder: Story = {
  args: {
    title: "Bordered tile",
    children: "The border helps the notification stand out against a busy background.",
    withBorder: true,
  },
};

/** Each elevation of the `shadow` prop applied to the notification tile. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$md">
      {SHADOWS.map((shadow) => (
        <Notification key={shadow} {...args} shadow={shadow} title={`shadow="${shadow}"`}>
          Notification with the {shadow} elevation.
        </Notification>
      ))}
    </Box>
  ),
};

/** Controlled dismiss — onClose hides the notification via local state. */
export const Controlled: Story = {
  render: (args) => {
    const [visible, setVisible] = React.useState(true);
    return (
      <Box gap="$md" alignItems="center">
        {visible ? (
          <Notification {...args} title="Dismissible" onClose={() => setVisible(false)}>
            Press the close button to dismiss this notification.
          </Notification>
        ) : (
          <Button variant="light" onPress={() => setVisible(true)}>
            Show notification again
          </Button>
        )}
      </Box>
    );
  },
};

/** All theme accents side by side — each one recolors the badge and accent line. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$md">
      {THEMES.map((theme) => (
        <Notification key={theme} {...args} theme={theme} title={theme} icon={<Text>⭐</Text>}>
          Notification with the <Text fontWeight="700">{theme}</Text> theme accent.
        </Notification>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `icon` badge, the `title`, and the `message`. */
export const Styles: Story = {
  args: {
    title: "Check your inbox",
    children: "A confirmation email has been sent to your address.",
    icon: <Text>✉️</Text>,
    styles: {
      icon: { backgroundColor: "$blue9" },
      title: { color: "$red9" },
      message: { color: "$blue11", fontWeight: "700" },
    },
  },
};

/** All radius values — from sharp xs corners to very round xl corners. */
export const Radii: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$md">
      {RADIUS_VALUES.map((radius) => (
        <Notification key={radius} {...args} radius={radius} title={`radius="${radius}"`}>
          Border radius variant: {radius}
        </Notification>
      ))}
    </Box>
  ),
};
