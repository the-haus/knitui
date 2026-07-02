import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Button } from "../Button";
import { Text } from "../Text";
import { HoverCard } from "./HoverCard";

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

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const TRANSITIONS = [
  "fade",
  "fade-up",
  "fade-down",
  "scale",
  "skew-up",
  "slide-down",
  "slide-up",
  "pop",
  "pop-top-left",
  "pop-bottom-right",
] as const;

const meta = {
  title: "Overlays/HoverCard",
  component: HoverCard,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "HoverCard is a compound overlay that opens a floating dropdown when the pointer enters `HoverCard.Target`. Compose `HoverCard` → `HoverCard.Target` + `HoverCard.Dropdown`. The dropdown is hover-driven (not value-controlled); use `initiallyOpened` to start open, and `openDelay`/`closeDelay` to tune the timing.",
      },
    },
  },
  args: {
    position: "bottom",
    openDelay: 0,
    closeDelay: 150,
    offset: 8,
    width: "max-content",
    withinPortal: true,
    keepMounted: false,
    shadow: "md",
    disabled: false,
    withArrow: false,
    withOverlay: false,
  },
  argTypes: {
    position: {
      control: "select",
      options: POSITIONS,
      description: "Dropdown placement relative to the target.",
    },
    openDelay: {
      control: { type: "number", min: 0, max: 2000, step: 50 },
      description: "Delay in ms before the dropdown opens on hover.",
    },
    closeDelay: {
      control: { type: "number", min: 0, max: 2000, step: 50 },
      description: "Delay in ms before the dropdown closes on leave.",
    },
    offset: {
      control: { type: "number", min: 0, max: 40 },
      description: "Main-axis gap in px between the target and the dropdown.",
    },
    width: {
      control: "text",
      description: "Dropdown width; 'target' matches the trigger width.",
    },
    shadow: {
      control: "select",
      options: ["xs", "sm", "md", "lg", "xl"],
      description: "Dropdown shadow scale.",
    },
    radius: {
      control: "text",
      description: "Dropdown border radius token.",
    },
    withinPortal: { control: "boolean" },
    keepMounted: { control: "boolean" },
    disabled: { control: "boolean" },
    withArrow: { control: "boolean" },
    withOverlay: { control: "boolean" },
    initiallyOpened: { control: "boolean" },
    transitionProps: {
      control: "object",
      description:
        "Enter/exit animation: { transition, duration, exitDuration, timingFunction }. Defaults to a 150ms fade.",
    },
  },
} satisfies Meta<typeof HoverCard>;

export default meta;

type Story = StoryObj<ComponentProps<typeof HoverCard>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <HoverCard {...args}>
      <HoverCard.Target>
        <Button>Hover me</Button>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Text fontWeight="600" marginBottom="$xs">
          User profile
        </Text>
        <Text color="$color11" fontSize="$sm">
          Hover cards reveal extra context without navigation.
        </Text>
      </HoverCard.Dropdown>
    </HoverCard>
  ),
};

/**
 * Configurable enter/exit animation via `transitionProps` (forwarded to the
 * underlying `Popover`). Pick a preset, then hover the target to watch it animate
 * in and out.
 */
export const Transitions: Story = {
  render: (args) => {
    const [transition, setTransition] = React.useState<(typeof TRANSITIONS)[number]>("pop");
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
        <HoverCard {...args} transitionProps={{ transition, duration: 250 }}>
          <HoverCard.Target>
            <Button>Hover for “{transition}”</Button>
          </HoverCard.Target>
          <HoverCard.Dropdown>
            <Text fontWeight="600" marginBottom="$xs">
              {transition}
            </Text>
            <Text color="$color11" fontSize="$sm">
              Hover in and out to watch the “{transition}” transition.
            </Text>
          </HoverCard.Dropdown>
        </HoverCard>
      </Box>
    );
  },
};

/** Demonstrates the compound API: Target wraps the trigger, Dropdown holds the content. */
export const CompoundAPI: Story = {
  render: () => (
    <HoverCard>
      <HoverCard.Target>
        <Button variant="outline">@johndoe</Button>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Box gap="$xs">
          <Text fontWeight="700">John Doe</Text>
          <Text color="$color11" fontSize="$xs">
            <Text>⭐</Text> 142 stars · <Text>🔀</Text> 18 forks
          </Text>
          <Text color="$color11" fontSize="$xs">
            Full-stack developer, open-source enthusiast.
          </Text>
        </Box>
      </HoverCard.Dropdown>
    </HoverCard>
  ),
};

/** Opens immediately on hover; start open via initiallyOpened for visual snapshot. */
export const InitiallyOpened: Story = {
  args: { initiallyOpened: true },
  render: (args) => (
    <Box padding="$xl">
      <HoverCard {...args}>
        <HoverCard.Target>
          <Button>Already open</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Text>This dropdown starts in the open state.</Text>
        </HoverCard.Dropdown>
      </HoverCard>
    </Box>
  ),
};

/** Disabled — the dropdown never opens regardless of hover. */
export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => (
    <HoverCard {...args}>
      <HoverCard.Target>
        <Button disabled>Disabled trigger</Button>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Text>You will never see this.</Text>
      </HoverCard.Dropdown>
    </HoverCard>
  ),
};

/** Arrow points from the dropdown back toward the target. */
export const WithArrow: Story = {
  args: { withArrow: true, position: "top", initiallyOpened: true },
  render: (args) => (
    <Box padding="$xl">
      <HoverCard {...args}>
        <HoverCard.Target>
          <Button>Arrow above</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Text>Arrow enabled via withArrow.</Text>
        </HoverCard.Dropdown>
      </HoverCard>
    </Box>
  ),
};

/** Open and close delays make the interaction feel less jittery. */
export const WithDelays: Story = {
  args: { openDelay: 300, closeDelay: 500 },
  render: (args) => (
    <HoverCard {...args}>
      <HoverCard.Target>
        <Button variant="light">Slow open &amp; close</Button>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Text fontWeight="600">Delayed hover card</Text>
        <Text color="$color11" fontSize="$xs">
          Opens after 300 ms, closes after 500 ms.
        </Text>
      </HoverCard.Dropdown>
    </HoverCard>
  ),
};

/** keepMounted keeps the dropdown in the DOM (hidden) while closed. */
export const KeepMounted: Story = {
  args: { keepMounted: true },
  render: (args) => (
    <HoverCard {...args}>
      <HoverCard.Target>
        <Button variant="subtle">Keep DOM mounted</Button>
      </HoverCard.Target>
      <HoverCard.Dropdown>
        <Text>
          Even while closed, this node stays mounted (display: none). Useful for SEO or
          pre-rendering.
        </Text>
      </HoverCard.Dropdown>
    </HoverCard>
  ),
};

/** All supported placements shown together to compare positioning. */
export const Positions: Story = {
  render: () => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {POSITIONS.map((pos) => (
        <HoverCard key={pos} position={pos} initiallyOpened={false}>
          <HoverCard.Target>
            <Button size="sm" variant="default">
              {pos}
            </Button>
          </HoverCard.Target>
          <HoverCard.Dropdown>
            <Text fontSize="$xs">{pos}</Text>
          </HoverCard.Dropdown>
        </HoverCard>
      ))}
    </Box>
  ),
};

/**
 * All five shadow levels side by side to compare dropdown elevation. Each card is
 * always open (`initiallyOpened`) and rendered in its own contained relative wrapper
 * (`withinPortal={false}`) so the dropdowns sit inline and don't overlap.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start" padding="$xl">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} position="relative" alignItems="center" gap="$xs">
          <Text fontSize="$sm" color="$color11">
            {shadow}
          </Text>
          <HoverCard
            {...args}
            shadow={shadow}
            initiallyOpened
            withinPortal={false}
            position="bottom"
          >
            <HoverCard.Target>
              <Button variant="default">{shadow}</Button>
            </HoverCard.Target>
            <HoverCard.Dropdown>
              <Text fontSize="$xs">shadow={shadow}</Text>
            </HoverCard.Dropdown>
          </HoverCard>
        </Box>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `dropdown` and `arrow`. */
export const Styles: Story = {
  args: { withArrow: true, position: "top", initiallyOpened: true },
  render: (args) => (
    <Box padding="$xl">
      <HoverCard
        {...args}
        styles={{
          dropdown: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
          arrow: { background: "$blue3", borderColor: "$blue7", borderWidth: 2, radius: 0 },
        }}
      >
        <HoverCard.Target>
          <Button>Styled dropdown</Button>
        </HoverCard.Target>
        <HoverCard.Dropdown>
          <Text fontWeight="700">Restyled via styles</Text>
          <Text color="$color11" fontSize="$xs">
            The dropdown frame and arrow are recolored.
          </Text>
        </HoverCard.Dropdown>
      </HoverCard>
    </Box>
  ),
};

/** Open/close callbacks let consumers react to hover-driven visibility changes. */
export const Callbacks: Story = {
  render: () => {
    const [opens, setOpens] = React.useState(0);
    const [closes, setCloses] = React.useState(0);

    return (
      <Box gap="$md" alignItems="center">
        <HoverCard
          onOpen={() => setOpens((value) => value + 1)}
          onClose={() => setCloses((value) => value + 1)}
        >
          <HoverCard.Target>
            <Button variant="outline">Profile</Button>
          </HoverCard.Target>
          <HoverCard.Dropdown>
            <Box gap="$xs">
              <Text fontWeight="700">Jane Smith</Text>
              <Text color="$color11" fontSize="$xs">
                Opened {opens} times, closed {closes} times.
              </Text>
            </Box>
          </HoverCard.Dropdown>
        </HoverCard>
      </Box>
    );
  },
};
