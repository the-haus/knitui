import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { Popover } from "./Popover";

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
] as const;

const meta = {
  title: "Overlays/Popover",
  component: Popover,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Popover is a floating overlay anchored to a trigger element. Compose `Popover.Target` (the trigger) with `Popover.Dropdown` (the content panel). Supports uncontrolled and controlled open state, floating-ui placement, arrow, overlay scrim, focus trap, and ARIA roles.",
      },
    },
  },
  args: {
    position: "bottom-start",
    offset: "$xs",
    withArrow: false,
    withOverlay: false,
    trapFocus: false,
    keepMounted: false,
    closeOnClickOutside: true,
    closeOnEscape: true,
    disabled: false,
    withRoles: false,
    shadow: "md",
  },
  argTypes: {
    position: {
      control: "select",
      options: POSITIONS,
      description: "Placement of the dropdown relative to the target.",
    },
    offset: {
      control: "select",
      options: ["$xxs", "$xs", "$sm", "$md", "$lg", "$xl", "$xxl", 4, 8, 12],
      description: "Gap between the target and dropdown as a space token or px number.",
    },
    withArrow: { control: "boolean", description: "Show an arrow pointing at the target." },
    arrowSize: { control: "number", description: "Arrow edge length in px." },
    arrowOffset: {
      control: "select",
      options: ["$xxs", "$xs", "$sm", "$md", "$lg", "$xl", "$xxl", 4, 5, 8],
    },
    arrowRadius: { control: "number" },
    withOverlay: {
      control: "boolean",
      description: "Render a full-cover overlay scrim behind the open dropdown.",
    },
    trapFocus: {
      control: "boolean",
      description: "Trap keyboard focus within the dropdown while open.",
    },
    keepMounted: {
      control: "boolean",
      description: "Keep the dropdown mounted while closed (uses display:none).",
    },
    closeOnClickOutside: { control: "boolean" },
    closeOnEscape: { control: "boolean" },
    disabled: { control: "boolean", description: "Prevent the dropdown from opening." },
    withRoles: {
      control: "boolean",
      description: "Wire ARIA dialog roles between target and dropdown.",
    },
    shadow: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Dropdown shadow scale.",
    },
    width: {
      control: "select",
      options: ["max-content", "target", 200, 300],
      description: "Dropdown width; 'target' matches the trigger width.",
    },
    transitionProps: {
      control: "object",
      description:
        "Enter/exit animation: { transition, duration, exitDuration, timingFunction }. Defaults to a 150ms fade.",
    },
    opened: { control: false },
    onChange: { control: false },
    onOpen: { control: false },
    onClose: { control: false },
    onDismiss: { control: false },
    overlayProps: { control: false },
  },
} satisfies Meta<typeof Popover>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Popover>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Popover {...args}>
      <Popover.Target>
        <Button>Toggle popover</Button>
      </Popover.Target>
      <Popover.Dropdown padding="$md">
        <Text fontWeight="600" marginBottom="$xs">
          Popover content
        </Text>
        <Text color="$color11" fontSize={14}>
          This is the dropdown body. Adjust props in the Controls panel.
        </Text>
      </Popover.Dropdown>
    </Popover>
  ),
};

/** Controlled open state — parent owns when the dropdown is visible. */
export const Controlled: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box gap="$md" alignItems="center">
        <Popover {...args} opened={opened} onChange={setOpened}>
          <Popover.Target>
            <Button variant="outline">{opened ? "Close popover" : "Open popover"}</Button>
          </Popover.Target>
          <Popover.Dropdown padding="$md">
            <Text marginBottom="$sm">Controlled dropdown is open.</Text>
            <Button size="xs" variant="subtle" onPress={() => setOpened(false)}>
              Dismiss
            </Button>
          </Popover.Dropdown>
        </Popover>
        <Text fontSize={12} color="$color11">
          opened: {String(opened)}
        </Text>
      </Box>
    );
  },
};

/** Arrow pointing at the target, shown at several placements. */
export const WithArrow: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["top", "bottom", "left", "right"] as const).map((position) => (
        <Popover key={position} {...args} withArrow position={position} defaultOpened>
          <Popover.Target>
            <Button variant="default" size="sm">
              {position}
            </Button>
          </Popover.Target>
          <Popover.Dropdown padding="$sm">
            <Text fontSize={12}>{position}</Text>
          </Popover.Dropdown>
        </Popover>
      ))}
    </Box>
  ),
};

/** Disabled — the dropdown cannot open regardless of user interaction. */
export const Disabled: Story = {
  render: (args) => (
    <Popover {...args} disabled>
      <Popover.Target>
        <Button disabled>Disabled trigger</Button>
      </Popover.Target>
      <Popover.Dropdown padding="$md">
        <Text>This will never appear.</Text>
      </Popover.Dropdown>
    </Popover>
  ),
};

/** Full-cover overlay scrim rendered behind the open dropdown. */
export const WithOverlay: Story = {
  render: (args) => (
    <Popover {...args} withOverlay>
      <Popover.Target>
        <Button>Open with overlay</Button>
      </Popover.Target>
      <Popover.Dropdown padding="$md">
        <Text fontWeight="600" marginBottom="$xs">
          Modal-style popover
        </Text>
        <Text color="$color11" fontSize={14}>
          A translucent overlay sits behind this dropdown.
        </Text>
      </Popover.Dropdown>
    </Popover>
  ),
};

/** ARIA dialog roles wired between target and dropdown for assistive technology. */
export const WithRoles: Story = {
  render: (args) => (
    <Popover {...args} withRoles defaultOpened>
      <Popover.Target>
        <Button>Open dialog</Button>
      </Popover.Target>
      <Popover.Dropdown padding="$md">
        <Text fontWeight="600" marginBottom="$xs">
          Accessible dialog
        </Text>
        <Text color="$color11" fontSize={14}>
          The target has aria-haspopup="dialog" and the dropdown has role="dialog".
        </Text>
      </Popover.Dropdown>
    </Popover>
  ),
};

/** Dropdown width matches the trigger element width. */
export const TargetWidth: Story = {
  render: (args) => (
    <Box width={280}>
      <Popover {...args} width="target" defaultOpened>
        <Popover.Target>
          <Button fullWidth>Wide trigger</Button>
        </Popover.Target>
        <Popover.Dropdown padding="$md">
          <Text fontSize={14}>This dropdown stretches to match the trigger above.</Text>
        </Popover.Dropdown>
      </Popover>
    </Box>
  ),
};

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

/**
 * The `shadow` prop lifts the dropdown off the page using the shared elevation
 * ladder (`xs` → `xl`). Each popover below is always open and rendered inline
 * (`withinPortal={false}`) inside its own relative wrapper so the dropdowns sit
 * side by side without overlapping.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} gap="$xs" alignItems="center" position="relative" width={160}>
          <Text fontSize="$xs" color="$color11">
            {shadow}
          </Text>
          <Popover {...args} shadow={shadow} defaultOpened withinPortal={false}>
            <Popover.Target>
              <Button variant="default" size="sm">
                {shadow}
              </Button>
            </Popover.Target>
            <Popover.Dropdown padding="$md">
              <Text fontSize={14}>shadow="{shadow}"</Text>
            </Popover.Dropdown>
          </Popover>
        </Box>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `dropdown` frame and the `arrow`. */
export const Styles: Story = {
  render: (args) => (
    <Popover
      {...args}
      withArrow
      defaultOpened
      styles={{
        dropdown: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
        arrow: { background: "$blue3", borderColor: "$blue7", borderWidth: 1, radius: 0 },
      }}
    >
      <Popover.Target>
        <Button>Styled popover</Button>
      </Popover.Target>
      <Popover.Dropdown padding="$md">
        <Text fontWeight="600" marginBottom="$xs">
          Styled dropdown
        </Text>
        <Text color="$color11" fontSize={14}>
          The dropdown frame and arrow are recolored via the `styles` map.
        </Text>
      </Popover.Dropdown>
    </Popover>
  ),
};

/**
 * Configurable enter/exit animation via `transitionProps`. Pick a preset, then
 * toggle the popover to watch it animate in and out (all driven by the shared
 * `Transition` engine, so the same presets work on web and native).
 */
export const Transitions: Story = {
  render: (args) => {
    const [transition, setTransition] = React.useState<(typeof TRANSITIONS)[number]>("pop");
    return (
      <Box gap="$lg" alignItems="center">
        <Box flexDirection="row" flexWrap="wrap" gap="$xs" maxWidth={540} justifyContent="center">
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
        <Popover {...args} transitionProps={{ transition, duration: 250 }}>
          <Popover.Target>
            <Button>Toggle “{transition}”</Button>
          </Popover.Target>
          <Popover.Dropdown padding="$md">
            <Text fontWeight="600" marginBottom="$xs">
              {transition}
            </Text>
            <Text color="$color11" fontSize={14}>
              Open and close to watch the “{transition}” transition.
            </Text>
          </Popover.Dropdown>
        </Popover>
      </Box>
    );
  },
};

/** Compound API — Target + Dropdown composed inside a single Popover root. */
export const CompoundAPI: Story = {
  render: (args) => (
    <Box gap="$lg">
      <Popover {...args}>
        <Popover.Target>
          <Button leftSection={<Text>⭐</Text>}>With icon trigger</Button>
        </Popover.Target>
        <Popover.Dropdown padding="$md" minWidth={200}>
          <Text fontWeight="600" marginBottom="$xs">
            Actions
          </Text>
          <Box gap="$xs">
            <Button variant="subtle" size="sm" justify="flex-start">
              <Text>✏️</Text> Edit
            </Button>
            <Button variant="subtle" size="sm" justify="flex-start">
              <Text>📋</Text> Duplicate
            </Button>
            <Button variant="subtle" size="sm" justify="flex-start">
              <Text>🗑️</Text> Delete
            </Button>
          </Box>
        </Popover.Dropdown>
      </Popover>
    </Box>
  ),
};
