import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Kbd } from "./Kbd";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const meta = {
  title: "Typography/Kbd",
  component: Kbd,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Kbd renders a semantic keyboard key (`<kbd>`). Monospace bold text on a tinted surface with a thicker bottom border gives the pressed-key look. `size` scales the whole keycap — font, padding (height), and corner radius; `theme` recolors the surface and border via the palette ramp.",
      },
    },
  },
  args: {
    children: "Ctrl",
    size: "sm",
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Scales the keycap — font, padding (height), and corner radius.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description:
        "Active theme accent — recolors the key surface and border via the palette ramp.",
    },
    children: { control: "text" },
  },
} satisfies Meta<typeof Kbd>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Kbd>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** The seven sizes side by side, from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Kbd key={size} {...args} size={size}>
          {size}
        </Kbd>
      ))}
    </Box>
  ),
};

/** Common single-key labels shown at the default size. */
export const CommonKeys: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {["Ctrl", "Alt", "Shift", "Tab", "Esc", "Enter", "⌘", "⌥", "⇧"].map((key) => (
        <Kbd key={key} {...args}>
          {key}
        </Kbd>
      ))}
    </Box>
  ),
};

/** Keyboard shortcuts composed of multiple Kbd keys separated by a plus sign. */
export const Shortcut: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xs" alignItems="center">
      <Kbd {...args}>Ctrl</Kbd>
      <Text>+</Text>
      <Kbd {...args}>Shift</Kbd>
      <Text>+</Text>
      <Kbd {...args}>K</Kbd>
    </Box>
  ),
};

/** The palette ramp follows the active theme — same component, different accent. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "yellow", "pink", "gray"] as const).map((theme) => (
        <Kbd key={theme} {...args} theme={theme}>
          {theme}
        </Kbd>
      ))}
    </Box>
  ),
};

/** Larger key labels such as function keys and navigation keys. */
export const SpecialKeys: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {["F1", "F2", "F5", "F12", "PgUp", "PgDn", "Home", "End", "Del", "Ins"].map((key) => (
        <Kbd key={key} {...args} size="md">
          {key}
        </Kbd>
      ))}
    </Box>
  ),
};
