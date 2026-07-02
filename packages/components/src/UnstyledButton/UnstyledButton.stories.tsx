import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { UnstyledButton } from "./UnstyledButton";

const meta = {
  title: "Inputs/UnstyledButton",
  component: UnstyledButton,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'UnstyledButton is an accessible pressable base with no visual styling beyond a reset (transparent background, no border) plus interaction affordances (`role="button"`, pointer cursor, `focusVisible` outline, a `disabled` variant). It is the building block for custom controls — use it whenever you need a semantic button without pre-applied styles.',
      },
    },
  },
  args: {
    children: "Press me",
    disabled: false,
  },
  argTypes: {
    disabled: { control: "boolean", description: "Reduces opacity and disables pointer events." },
    onPress: { action: "pressed", description: "Called when the button is activated." },
    children: { control: "text" },
  },
} satisfies Meta<typeof UnstyledButton>;

export default meta;

type Story = StoryObj<ComponentProps<typeof UnstyledButton>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

/** The shadow elevation prop, inherited from Box, across all token levels. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <UnstyledButton
          key={shadow}
          {...args}
          shadow={shadow}
          padding="$md"
          borderRadius="$md"
          backgroundColor="$color2"
        >
          <Text>{shadow}</Text>
        </UnstyledButton>
      ))}
    </Box>
  ),
};

/** Disabled state — opacity is reduced and pointer events are turned off. */
export const Disabled: Story = {
  args: { disabled: true, children: "Disabled" },
};

/** Custom styled content — UnstyledButton intentionally carries no visual style so you bring your own. */
export const CustomStyled: Story = {
  render: (args) => (
    <UnstyledButton
      {...args}
      padding="$md"
      borderRadius="$md"
      backgroundColor="$blue8"
      pressStyle={{ opacity: 0.8 }}
      hoverStyle={{ backgroundColor: "$blue9" }}
    >
      <Text color="$color1" fontWeight="700">
        Custom styled
      </Text>
    </UnstyledButton>
  ),
};

/** With an icon — since UnstyledButton is a Box, layout children freely. */
export const WithIcon: Story = {
  render: (args) => (
    <UnstyledButton
      {...args}
      flexDirection="row"
      alignItems="center"
      gap="$sm"
      padding="$sm"
      borderRadius="$sm"
      hoverStyle={{ backgroundColor: "$color4" }}
    >
      <Text>⭐</Text>
      <Text>Favourite</Text>
    </UnstyledButton>
  ),
};

/** Multiple unstyled buttons in a row, demonstrating composition as a toolbar. */
export const Grouped: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["Bold", "Italic", "Underline"] as const).map((label) => (
        <UnstyledButton
          key={label}
          {...args}
          padding="$sm"
          borderRadius="$sm"
          hoverStyle={{ backgroundColor: "$color4" }}
        >
          <Text fontWeight="700">{label}</Text>
        </UnstyledButton>
      ))}
    </Box>
  ),
};

/** Controlled press counter — demonstrates that onPress fires and state updates correctly. */
export const PressCounter: Story = {
  render: (args) => {
    const [count, setCount] = React.useState(0);
    return (
      <Box alignItems="center" gap="$md">
        <UnstyledButton
          {...args}
          onPress={() => setCount((c) => c + 1)}
          padding="$md"
          borderRadius="$md"
          backgroundColor="$color4"
          hoverStyle={{ backgroundColor: "$color5" }}
          pressStyle={{ opacity: 0.7 }}
        >
          <Text>Click me</Text>
        </UnstyledButton>
        <Text>
          Pressed {count} time{count === 1 ? "" : "s"}
        </Text>
      </Box>
    );
  },
};
