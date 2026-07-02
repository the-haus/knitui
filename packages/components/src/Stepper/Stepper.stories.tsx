import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Stepper } from "./Stepper";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Navigation/Stepper",
  component: Stepper,
  parameters: {
    docs: {
      description: {
        component:
          "Stepper guides users through a multi-step flow. Compose `Stepper.Step` children for each step and an optional `Stepper.Completed` for the finished state. `active` controls the current position; `onStepClick` enables navigation between steps. `orientation` flips the layout to vertical, `iconPosition` mirrors the bubble to the right, and `keepMounted` preserves step state across navigation.",
      },
    },
  },
  args: {
    active: 1,
    size: "md",
    orientation: "horizontal",
    iconPosition: "left",
    allowNextStepsSelect: true,
    keepMounted: false,
    wrap: true,
  },
  argTypes: {
    active: {
      control: { type: "number", min: 0, max: 3 },
      description: "Index of the currently active step.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls bubble diameter, connector thickness and font sizes.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Accent theme used for progress and completed steps.",
    },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Layout axis of the step row.",
    },
    variant: {
      control: "inline-radio",
      options: ["stepper", "timeline"],
      description:
        "Visual mode: numbered bubbles + content panel (stepper) or filled-dot bullets with inline content (timeline).",
    },
    iconPosition: {
      control: "inline-radio",
      options: ["left", "right"],
      description: "Position of the step bubble relative to the label body.",
    },
    allowNextStepsSelect: {
      control: "boolean",
      description: "Allow clicking steps after the active one.",
    },
    keepMounted: {
      control: "boolean",
      description: "Keep all step content mounted (hidden with display:none) to preserve state.",
    },
    wrap: {
      control: "boolean",
      description: "Wrap the horizontal step row when it overflows.",
    },
  },
  decorators: [
    (Story) => (
      <Box width={560}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Stepper>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Stepper>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Stepper {...args}>
      <Stepper.Step label="Account" description="Create your account">
        <Text>Step 1 content — fill in your account details.</Text>
      </Stepper.Step>
      <Stepper.Step label="Profile" description="Set up your profile">
        <Text>Step 2 content — personalise your profile.</Text>
      </Stepper.Step>
      <Stepper.Step label="Confirm" description="Review and confirm">
        <Text>Step 3 content — review your choices.</Text>
      </Stepper.Step>
      <Stepper.Completed>
        <Text>All steps complete — you are good to go!</Text>
      </Stepper.Completed>
    </Stepper>
  ),
};

/** All seven sizes from xxs to xxl. */
export const Sizes: Story = {
  render: () => (
    <Box gap="$xl">
      {SIZES.map((size) => (
        <Stepper key={size} active={1} size={size}>
          <Stepper.Step label="First" />
          <Stepper.Step label="Second" />
          <Stepper.Step label="Third" />
        </Stepper>
      ))}
    </Box>
  ),
};

/** Accent color follows Tamagui's theme prop. */
export const Theme: Story = {
  args: { active: 1, theme: "green" },
  render: (args) => (
    <Stepper {...args}>
      <Stepper.Step label="Account" />
      <Stepper.Step label="Profile" />
      <Stepper.Step label="Confirm" />
    </Stepper>
  ),
};

/** Vertical orientation — steps stack top to bottom with the connector on the left. */
export const Vertical: Story = {
  args: { orientation: "vertical", active: 1 },
  render: (args) => (
    <Stepper {...args}>
      <Stepper.Step label="Account" description="Create your account">
        <Text>Step 1 content.</Text>
      </Stepper.Step>
      <Stepper.Step label="Profile" description="Set up your profile">
        <Text>Step 2 content.</Text>
      </Stepper.Step>
      <Stepper.Step label="Confirm" description="Review and confirm">
        <Text>Step 3 content.</Text>
      </Stepper.Step>
    </Stepper>
  ),
};

/** Elevation shadow ladder applied to the Stepper frame via the inherited `shadow` prop. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$xl">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} gap="$xs">
          <Text fontSize="$xs" color="$color11">
            {shadow}
          </Text>
          <Stepper {...args} shadow={shadow} active={1} padding="$md">
            <Stepper.Step label="First" />
            <Stepper.Step label="Second" />
            <Stepper.Step label="Third" />
          </Stepper>
        </Box>
      ))}
    </Box>
  ),
};

/** Controlled stepper — the parent owns `active` and wires navigation buttons. */
export const Controlled: Story = {
  render: (args) => {
    const [active, setActive] = React.useState(0);
    const total = 3;
    return (
      <Box gap="$lg">
        <Stepper {...args} active={active} onStepClick={setActive}>
          <Stepper.Step label="Account" description="Create your account">
            <Text>Step 1 — account details.</Text>
          </Stepper.Step>
          <Stepper.Step label="Profile" description="Set up your profile">
            <Text>Step 2 — profile information.</Text>
          </Stepper.Step>
          <Stepper.Step label="Confirm" description="Review and confirm">
            <Text>Step 3 — review and submit.</Text>
          </Stepper.Step>
          <Stepper.Completed>
            <Text>All done! Your submission was received.</Text>
          </Stepper.Completed>
        </Stepper>
        <Box flexDirection="row" gap="$md">
          <Text
            onPress={() => setActive((n) => Math.max(0, n - 1))}
            color="$color11"
            paddingHorizontal="$sm"
            paddingVertical="$xs"
          >
            ← Back
          </Text>
          <Text
            onPress={() => setActive((n) => Math.min(total, n + 1))}
            color="$color9"
            paddingHorizontal="$sm"
            paddingVertical="$xs"
          >
            Next →
          </Text>
        </Box>
        <Text fontSize={12} color="$color11">
          active: {active}
        </Text>
      </Box>
    );
  },
};

/** Stepper.Completed is shown when active is past the last step index. */
export const WithCompleted: Story = {
  args: { active: 3 },
  render: (args) => (
    <Stepper {...args}>
      <Stepper.Step label="Account" />
      <Stepper.Step label="Profile" />
      <Stepper.Step label="Confirm" />
      <Stepper.Completed>
        <Text>All steps complete — you are good to go!</Text>
      </Stepper.Completed>
    </Stepper>
  ),
};

/** A loading step shows a spinner inside the bubble instead of the step number. */
export const LoadingStep: Story = {
  args: { active: 1 },
  render: (args) => (
    <Stepper {...args}>
      <Stepper.Step label="Done" />
      <Stepper.Step label="Processing" description="Please wait…" loading>
        <Text>Waiting for the server response…</Text>
      </Stepper.Step>
      <Stepper.Step label="Review" />
    </Stepper>
  ),
};

/** Custom icons and completedIcon per step using unicode glyphs. */
export const CustomIcons: Story = {
  args: { active: 1 },
  render: (args) => (
    <Stepper {...args} completedIcon={<Text>✓</Text>}>
      <Stepper.Step label="Account" icon={<Text>👤</Text>} completedIcon={<Text>✓</Text>} />
      <Stepper.Step label="Payment" icon={<Text>💳</Text>} completedIcon={<Text>✓</Text>} />
      <Stepper.Step label="Shipping" icon={<Text>📦</Text>} completedIcon={<Text>✓</Text>} />
    </Stepper>
  ),
};

/** keepMounted preserves all step content in the DOM — useful for uncontrolled forms. */
export const KeepMounted: Story = {
  args: { active: 0, keepMounted: true },
  render: (args) => (
    <Box gap="$md">
      <Stepper {...args}>
        <Stepper.Step label="First">
          <Text>Content one (always mounted)</Text>
        </Stepper.Step>
        <Stepper.Step label="Second">
          <Text>Content two (always mounted, hidden)</Text>
        </Stepper.Step>
        <Stepper.Step label="Third">
          <Text>Content three (always mounted, hidden)</Text>
        </Stepper.Step>
      </Stepper>
      <Text fontSize={12} color="$color11">
        All step panels are in the DOM — only the active one is visible.
      </Text>
    </Box>
  ),
};

/**
 * Timeline variant — filled-dot bullets with each step's content inline (the
 * former `Timeline` component), here vertical.
 */
export const TimelineVertical: Story = {
  args: { variant: "timeline", orientation: "vertical", active: 1 },
  render: (args) => (
    <Stepper {...args}>
      <Stepper.Step label="Create account">Fill in your details to get started.</Stepper.Step>
      <Stepper.Step label="Verify email">Check your inbox and click the link.</Stepper.Step>
      <Stepper.Step label="Set up profile">Add a photo and a short bio.</Stepper.Step>
      <Stepper.Step label="Invite your team">Share the workspace with colleagues.</Stepper.Step>
    </Stepper>
  ),
};

/** The timeline variant also lays out horizontally. */
export const TimelineHorizontal: Story = {
  args: { variant: "timeline", orientation: "horizontal", active: 1 },
  render: (args) => (
    <Stepper {...args}>
      <Stepper.Step label="Queued">Request received.</Stepper.Step>
      <Stepper.Step label="Processing">Work is underway.</Stepper.Step>
      <Stepper.Step label="Done">Output is ready.</Stepper.Step>
    </Stepper>
  ),
};

/** Per-step `lineVariant` makes the connector solid, dashed, or dotted (timeline only). */
export const TimelineLineVariants: Story = {
  args: { variant: "timeline", orientation: "vertical", active: 1 },
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {(["solid", "dashed", "dotted"] as const).map((lineVariant) => (
        <Box key={lineVariant} width={180}>
          <Text fontWeight="600" marginBottom="$sm">
            {lineVariant}
          </Text>
          <Stepper {...args}>
            <Stepper.Step label="First" lineVariant={lineVariant}>
              body text
            </Stepper.Step>
            <Stepper.Step label="Second" lineVariant={lineVariant}>
              body text
            </Stepper.Step>
            <Stepper.Step label="Third" lineVariant={lineVariant}>
              body text
            </Stepper.Step>
          </Stepper>
        </Box>
      ))}
    </Box>
  ),
};

/** Custom bullets — pass any node (icon, number, emoji) via a step's `icon`. */
export const TimelineCustomBullets: Story = {
  args: { variant: "timeline", orientation: "vertical", active: 2 },
  render: (args) => (
    <Stepper {...args}>
      <Stepper.Step label="Order placed" icon={<Text>🛒</Text>}>
        Your order has been received and confirmed.
      </Stepper.Step>
      <Stepper.Step label="Payment processed" icon={<Text>💳</Text>}>
        Payment was successfully charged.
      </Stepper.Step>
      <Stepper.Step label="Shipped" icon={<Text>📦</Text>}>
        Your package is on its way.
      </Stepper.Step>
      <Stepper.Step label="Delivered" icon={<Text>✅</Text>}>
        Package delivered to your door.
      </Stepper.Step>
    </Stepper>
  ),
};

/** reverseActive counts completed steps from the end, so the last step completes first. */
export const TimelineReverseActive: Story = {
  args: { variant: "timeline", orientation: "vertical", reverseActive: true, active: 1 },
  render: (args) => (
    <Stepper {...args}>
      <Stepper.Step label="Step A">Will complete last.</Stepper.Step>
      <Stepper.Step label="Step B">Will complete second-to-last.</Stepper.Step>
      <Stepper.Step label="Step C">Will complete second.</Stepper.Step>
      <Stepper.Step label="Step D">Completes first (active from the end).</Stepper.Step>
    </Stepper>
  ),
};

/** Per-slot `styles` targets individual parts — here the `bubble`, `label` and `connector`. */
export const Styles: Story = {
  args: {
    active: 1,
    styles: {
      bubble: { borderColor: "$red9", borderWidth: 3 },
      label: { color: "$red9", fontWeight: "700" },
      connector: { backgroundColor: "$blue7" },
    },
  },
  render: (args) => (
    <Stepper {...args}>
      <Stepper.Step label="Account" description="Create your account" />
      <Stepper.Step label="Profile" description="Set up your profile" />
      <Stepper.Step label="Confirm" description="Review and confirm" />
    </Stepper>
  ),
};
