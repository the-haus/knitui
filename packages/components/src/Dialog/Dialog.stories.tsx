import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { Dialog } from "./Dialog";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Overlays/Dialog",
  component: Dialog,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Dialog is a floating corner panel pinned to a viewport edge via `Affix` — no overlay scrim. It mirrors Mantine's `Dialog`. Use `opened` to control visibility, `position` to choose the corner, and `size` to set the content width. Accent color follows the active `theme` prop.",
      },
    },
  },
  args: {
    opened: true,
    size: "md",
    withCloseButton: true,
    withBorder: true,
    keepMounted: false,
    withinPortal: false,
    zIndex: 300,
    position: { bottom: "$xl", right: "$xl" },
    children: "This is a dialog message.",
  },
  argTypes: {
    opened: { control: "boolean" },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Content width — xxs through xxl, plus custom number or CSS width.",
    },
    shadow: {
      control: "select",
      options: [undefined, "xs", "sm", "md", "lg", "xl"],
      description: "Elevation — drop shadow from the shared ladder.",
    },
    withCloseButton: { control: "boolean" },
    withBorder: { control: "boolean" },
    keepMounted: {
      control: "boolean",
      description: "Keep mounted in the DOM while closed (toggles display instead of unmounting).",
    },
    withinPortal: { control: "boolean" },
    zIndex: { control: "number" },
    children: { control: "text" },
    onClose: { action: "onClose" },
  },
} satisfies Meta<typeof Dialog>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Dialog>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All seven content widths stacked to compare the size presets. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md">
      {SIZES.map((size, i) => (
        <Dialog
          key={size}
          {...args}
          size={size}
          withinPortal={false}
          position={{ bottom: 32 + i * 110, right: "$xl" }}
          withCloseButton={false}
        >
          <Text fontWeight="700" marginBottom="$xs">
            size="{size}"
          </Text>
          <Text>Width preset: {size}.</Text>
        </Dialog>
      ))}
    </Box>
  ),
};

/**
 * All five `shadow` levels stacked to compare elevation. Each always-open panel
 * is offset vertically (and rendered with `withinPortal={false}`) so the drop
 * shadows sit side by side without overlapping. The dialog defaults to `shadow="md"`.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$md">
      {SHADOWS.map((shadow, i) => (
        <Dialog
          key={shadow}
          {...args}
          shadow={shadow}
          withinPortal={false}
          position={{ bottom: 32 + i * 90, right: "$xl" }}
          withCloseButton={false}
        >
          <Text fontWeight="700">shadow="{shadow}"</Text>
        </Dialog>
      ))}
    </Box>
  ),
};

/** Controlled open/close via a trigger button — demonstrates the opened + onClose pattern. */
export const Trigger: Story = {
  args: { withinPortal: false },
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box alignItems="center" gap="$md" padding="$xl">
        <Button onPress={() => setOpened(true)}>Open dialog</Button>
        <Dialog
          {...args}
          opened={opened}
          onClose={() => setOpened(false)}
          position={{ bottom: "$xl", right: "$xl" }}
        >
          <Text fontWeight="700" marginBottom="$xs">
            Cookie preferences
          </Text>
          <Text marginBottom="$md">
            We use cookies to improve your experience. Accept all or customise below.
          </Text>
          <Box flexDirection="row" gap="$sm">
            <Button size="xs" variant="filled" onPress={() => setOpened(false)}>
              Accept all
            </Button>
            <Button size="xs" variant="subtle" onPress={() => setOpened(false)}>
              Manage
            </Button>
          </Box>
        </Dialog>
      </Box>
    );
  },
};

/** Close button hidden — useful when dismissal is handled via action buttons inside the dialog. */
export const WithoutCloseButton: Story = {
  args: { withCloseButton: false, withinPortal: false },
  render: (args) => {
    const [opened, setOpened] = React.useState(true);
    return (
      <Box alignItems="center" padding="$xl">
        {!opened && (
          <Button size="sm" onPress={() => setOpened(true)}>
            Re-open
          </Button>
        )}
        <Dialog {...args} opened={opened} position={{ bottom: "$xl", right: "$xl" }}>
          <Text fontWeight="700" marginBottom="$xs">
            No close button
          </Text>
          <Text marginBottom="$md">Dismiss using the button below.</Text>
          <Button size="xs" variant="default" fullWidth onPress={() => setOpened(false)}>
            Got it
          </Button>
        </Dialog>
      </Box>
    );
  },
};

/** keepMounted keeps the node in the DOM while closed — only display is toggled. */
export const KeepMounted: Story = {
  args: { keepMounted: true, opened: false, withinPortal: false },
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box alignItems="center" gap="$md" padding="$xl">
        <Button onPress={() => setOpened((v) => !v)}>
          {opened ? "Hide dialog" : "Show dialog"}
        </Button>
        <Text fontSize="$xs" color="$color11">
          keepMounted=true — DOM node persists regardless of opened
        </Text>
        <Dialog
          {...args}
          opened={opened}
          onClose={() => setOpened(false)}
          position={{ bottom: "$xl", right: "$xl" }}
        >
          <Text fontWeight="700" marginBottom="$xs">
            Kept in DOM
          </Text>
          <Text>The dialog node stays mounted even when closed.</Text>
        </Dialog>
      </Box>
    );
  },
};

/** Pinned to each viewport corner to verify position prop behaviour. */
export const CornerPositions: Story = {
  args: { withinPortal: false },
  parameters: { layout: "fullscreen" },
  render: (args) => (
    <Box flex={1} width="100%" height={500} position="relative">
      {(
        [
          { label: "Bottom-Right", position: { bottom: "$md", right: "$md" } },
          { label: "Bottom-Left", position: { bottom: "$md", left: "$md" } },
          { label: "Top-Right", position: { top: "$md", right: "$md" } },
          { label: "Top-Left", position: { top: "$md", left: "$md" } },
        ] as const
      ).map(({ label, position }) => (
        <Dialog
          key={label}
          {...args}
          opened
          position={position}
          size="xs"
          onClose={undefined}
          withCloseButton={false}
        >
          <Text fontWeight="700" fontSize="$xs">
            {label}
          </Text>
        </Dialog>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `content` frame and the `closeButton`. */
export const Styles: Story = {
  args: {
    opened: true,
    withinPortal: false,
    position: { bottom: "$xl", right: "$xl" },
    styles: {
      content: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
      closeButton: { styles: { icon: { color: "$red9" } } },
    },
  },
  render: (args) => (
    <Dialog {...args}>
      <Text fontWeight="700" marginBottom="$xs">
        Styled dialog
      </Text>
      <Text>The content frame and close button are restyled via the styles prop.</Text>
    </Dialog>
  ),
};

/** Rich content — title, body copy, and action buttons showing a realistic use-case. */
export const WithActions: Story = {
  args: { withinPortal: false },
  render: (args) => (
    <Dialog {...args} opened position={{ bottom: "$xl", right: "$xl" }} size="md">
      <Text fontWeight="700" fontSize="$md" marginBottom="$xs">
        ⭐ New feature available
      </Text>
      <Text color="$color11" marginBottom="$md">
        We shipped a redesigned dashboard. Try it out and let us know what you think.
      </Text>
      <Box flexDirection="row" gap="$sm">
        <Button size="sm" variant="filled">
          Try it now
        </Button>
        <Button size="sm" variant="subtle">
          Dismiss
        </Button>
      </Box>
    </Dialog>
  ),
};
