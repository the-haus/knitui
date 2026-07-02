import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Burger } from "./Burger";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Navigation/Burger",
  component: Burger,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'Burger renders a three-line hamburger icon that animates to an × when `opened` is true. It extends `UnstyledButton` so it has a `role="button"`, pointer cursor, focusVisible outline, and a `disabled` variant out of the box. Use the token-first `size` scale to set the icon dimensions and pass `aria-label` for accessibility.',
      },
    },
  },
  args: {
    "aria-label": "Toggle navigation",
    opened: false,
    size: "md",
    disabled: false,
    transitionDuration: 300,
    transitionTimingFunction: "ease",
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls the width and height of the burger icon.",
    },
    opened: {
      control: "boolean",
      description: "When true the burger morphs into an × (close) icon.",
    },
    disabled: {
      control: "boolean",
      description: "Disables interaction and dims the button.",
    },
    transitionDuration: {
      control: { type: "number", min: 0, max: 1000, step: 50 },
      description: "Morph animation duration in milliseconds.",
    },
    transitionTimingFunction: {
      control: "select",
      options: ["ease", "linear", "ease-in", "ease-out", "cubic-bezier(0.34,1.56,0.64,1)"],
      description: "CSS timing function for the morph animation.",
    },
    lineSize: {
      control: { type: "number", min: 1, max: 10 },
      description: "Explicit line thickness in px — derived from size by default.",
    },
    children: { control: false },
  },
} satisfies Meta<typeof Burger>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Burger>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Full token size scale rendered side by side for quick comparison. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Burger key={size} {...args} size={size} aria-label={`Toggle — ${size}`} />
      ))}
    </Box>
  ),
};

/** The opened (×) state — the full token size scale to show the morph result. */
export const Opened: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Burger key={size} {...args} size={size} opened aria-label={`Close — ${size}`} />
      ))}
    </Box>
  ),
};

/**
 * Elevation via the shared `shadow` ladder — inherited from `Box`, so every
 * component accepts it; no shadow unless set.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Burger key={shadow} {...args} shadow={shadow} aria-label={`Toggle — ${shadow}`} />
      ))}
    </Box>
  ),
};

/** Controlled toggle — click the burger to open and close it. */
export const Controlled: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Box flexDirection="row" gap="$md" alignItems="center">
        <Burger
          {...args}
          opened={opened}
          onPress={() => setOpened((o) => !o)}
          aria-label={opened ? "Close navigation" : "Open navigation"}
        />
        <Text>{opened ? "Menu is open" : "Menu is closed"}</Text>
      </Box>
    );
  },
};

/** Disabled state — interaction is suppressed and the button appears dimmed. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** With a child label rendered alongside the icon. */
export const WithLabel: Story = {
  args: {
    "aria-label": "Toggle navigation",
    children: <Text>Menu</Text>,
  },
};

/** Theme accent — line color follows the active theme tokens. */
export const ThemeAccent: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["red", "green", "blue", "orange"] as const).map((theme) => (
        <Burger key={theme} {...args} theme={theme} aria-label="Toggle navigation" />
      ))}
    </Box>
  ),
};

/** Slow transition — makes the morph animation visible for demonstration. */
export const SlowTransition: Story = {
  render: (args) => {
    const [opened, setOpened] = React.useState(false);
    return (
      <Burger
        {...args}
        opened={opened}
        transitionDuration={1200}
        transitionTimingFunction="cubic-bezier(0.34,1.56,0.64,1)"
        onPress={() => setOpened((o) => !o)}
        aria-label={opened ? "Close navigation" : "Open navigation"}
      />
    );
  },
};

/** Per-slot `styles` targets individual parts — here the `line` bars and `text` label. */
export const Styles: Story = {
  args: {
    "aria-label": "Toggle navigation",
    children: <Text>Menu</Text>,
    styles: {
      line: { backgroundColor: "$red9" },
      text: { color: "$blue11", fontWeight: "700" },
    },
  },
};
