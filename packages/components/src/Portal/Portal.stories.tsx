import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Portal, PortalHost } from "./index";

const meta = {
  title: "Overlays/Portal",
  component: Portal,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'Portal (built on `react-native-teleport`) moves its `children` to a different place in the view hierarchy so overlays (popovers, dropdowns, modals) escape `overflow: hidden` and stacking-context ancestors. Pass `hostName` to teleport into a matching `PortalHost` — the app-wide host named `"root"` is mounted by `@knitui/core`\'s `<Provider>`. Omit `hostName` to render children inline in place (no teleport).',
      },
    },
  },
  args: {
    hostName: "root",
  },
  argTypes: {
    hostName: {
      control: "text",
      description:
        "Name of the `PortalHost` to teleport into. Omit to render children inline in place.",
    },
    name: {
      control: "text",
      description: "Identifies this portal within its host (defaults to a generated id).",
    },
    style: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof Portal>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Portal>>;

/** The interactive playground — tweak `hostName` from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Portal {...args}>
      <Box
        backgroundColor="$color2"
        borderWidth={1}
        borderColor="$borderColor"
        borderRadius="$md"
        padding="$md"
      >
        <Text>Portal content — teleported into the "root" host.</Text>
      </Box>
    </Portal>
  ),
};

/** Renders children inline (no `hostName`) — no teleportation occurs. */
export const Inline: Story = {
  args: { hostName: undefined },
  render: (args) => (
    <Box backgroundColor="$color3" padding="$md" borderRadius="$md" overflow="hidden">
      <Text marginBottom="$sm" fontWeight="600">
        Parent with overflow: hidden
      </Text>
      <Portal {...args}>
        <Box backgroundColor="$color5" padding="$sm" borderRadius="$sm">
          <Text>Inline content — not teleported (no hostName).</Text>
        </Box>
      </Portal>
    </Box>
  ),
};

/** Teleports into a named PortalHost rendered in the same story. */
export const NamedHost: Story = {
  args: { hostName: "story-host" },
  render: (args) => (
    <Box gap="$md" alignItems="flex-start">
      <Box borderWidth={1} borderColor="$borderColor" borderRadius="$md" padding="$md" width={280}>
        <Text fontWeight="600" marginBottom="$sm">
          Named PortalHost: "story-host"
        </Text>
        <PortalHost name="story-host" style={{ minHeight: 60 }} />
      </Box>

      <Portal {...args}>
        <Box backgroundColor="$color5" borderRadius="$sm" padding="$sm">
          <Text>⭐ Content teleported into "story-host"</Text>
        </Box>
      </Portal>
    </Box>
  ),
};

/**
 * A controlled trigger story — click the button to mount/unmount the portal.
 * Demonstrates conditional rendering and how the teleported node is cleaned up.
 */
export const ControlledTrigger: Story = {
  render: (args) => {
    const [open, setOpen] = React.useState(false);

    return (
      <Box gap="$md" alignItems="flex-start">
        <Box
          render="button"
          backgroundColor="$color5"
          borderRadius="$sm"
          paddingHorizontal="$md"
          paddingVertical="$sm"
          style={{ cursor: "pointer" }}
          onPress={() => setOpen((v) => !v)}
        >
          <Text>{open ? "Unmount portal" : "Mount portal"}</Text>
        </Box>

        {open && (
          <Portal {...args} hostName="root">
            <Box
              position="fixed"
              bottom="$lg"
              right="$lg"
              backgroundColor="$color2"
              borderWidth={1}
              borderColor="$borderColor"
              borderRadius="$md"
              padding="$md"
              minWidth={220}
              pointerEvents="auto"
            >
              <Text fontWeight="600" marginBottom="$xs">
                ⭐ Teleported overlay
              </Text>
              <Text color="$color10">
                This content is teleported into the root host. Dismiss it with the button above.
              </Text>
            </Box>
          </Portal>
        )}
      </Box>
    );
  },
};
