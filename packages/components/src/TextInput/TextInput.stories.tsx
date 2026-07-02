import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { TextInput } from "./TextInput";

const VARIANTS = ["default", "filled", "unstyled"] as const;

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/TextInput",
  component: TextInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "TextInput is a labeled single-line text field built on `InputBase` (`Input.Wrapper` + `Input`). It mirrors Mantine's `TextInput` API. `variant` controls the chrome style, `size` sets height and typography, and `theme` recolors the accent via the Tamagui palette ramp.",
      },
    },
  },
  args: {
    placeholder: "Enter text…",
    variant: "default",
    size: "md",
    disabled: false,
    loading: false,
    required: false,
    readOnly: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: VARIANTS,
      description: "Visual chrome style — default (bordered), filled (background), or unstyled.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, padding, radius and font size.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Tamagui accent theme applied to input focus/error-adjacent chrome.",
    },
    label: { control: "text", description: "Label rendered above the input." },
    description: { control: "text", description: "Helper text rendered below the label." },
    error: {
      control: "text",
      description: "Error message — also applies error styles to the input.",
    },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
    required: { control: "boolean" },
    readOnly: { control: "boolean" },
    leftSection: { control: false },
    rightSection: { control: false },
  },
} satisfies Meta<typeof TextInput>;

export default meta;

type Story = StoryObj<ComponentProps<typeof TextInput>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every visual variant side by side at the default size. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="flex-start">
      {VARIANTS.map((variant) => (
        <TextInput key={variant} {...args} variant={variant} label={variant} />
      ))}
    </Box>
  ),
};

/** All seven token sizes rendered together from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$md">
      {SIZES.map((size) => (
        <TextInput key={size} {...args} size={size} label={size} placeholder={`size ${size}`} />
      ))}
    </Box>
  ),
};

/** The shadow elevation prop, inherited from Box, across all token levels. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$md">
      {SHADOWS.map((shadow) => (
        <TextInput key={shadow} {...args} shadow={shadow} label={shadow} placeholder={shadow} />
      ))}
    </Box>
  ),
};

/** Theme accent — uses Tamagui's theme prop, not a Mantine color prop. */
export const Themed: Story = {
  args: {
    label: "Search",
    placeholder: "Search docs",
    theme: "green",
  },
};

/** With a label, description, and placeholder — the standard labeled field. */
export const WithLabel: Story = {
  args: {
    label: "Username",
    description: "Pick a unique username for your account.",
    placeholder: "e.g. jane_doe",
  },
};

/** Error state — displays the error message and applies error styling to the chrome. */
export const WithError: Story = {
  args: {
    label: "Email",
    placeholder: "you@example.com",
    error: "Enter a valid email address.",
    value: "not-an-email",
    onChange: () => {},
  },
};

/** Disabled state — reduced opacity and pointer events off. */
export const Disabled: Story = {
  args: {
    label: "Read-only field",
    value: "Cannot be changed",
    disabled: true,
    onChange: () => {},
  },
};

/** Loading state — shows a spinner inside the input. */
export const Loading: Story = {
  args: {
    label: "Searching…",
    placeholder: "Type to search",
    loading: true,
  },
};

/** Left and right sections hold icons, badges, or adornments. */
export const WithSections: Story = {
  args: {
    label: "Amount",
    placeholder: "0.00",
    leftSection: <Text>$</Text>,
    rightSection: <Text>USD</Text>,
  },
};

/** Controlled input — value and onChange wired up via React.useState. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("Hello, world!");
    return (
      <Box gap="$md">
        <TextInput
          {...args}
          label="Controlled"
          description="State is managed externally."
          value={value}
          onChangeText={setValue}
        />
        <Text>Current value: {value}</Text>
      </Box>
    );
  },
};

/** Uncontrolled input — the DOM owns the current value after the initial seed. */
export const Uncontrolled: Story = {
  args: {
    label: "Display name",
    defaultValue: "Jane Doe",
  },
};

/** Required field — an asterisk marks the label and the field is semantically required. */
export const Required: Story = {
  args: {
    label: "Password",
    placeholder: "••••••••",
    required: true,
    withAsterisk: true,
  },
};

/** Per-slot `styles` targets individual parts — here the `root` frame, `label` and `leftSection`. */
export const Styles: Story = {
  render: (args) => (
    <Box width={320}>
      <TextInput
        {...args}
        label="Styled field"
        leftSection={<Text>@</Text>}
        placeholder="username"
        styles={{
          root: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
          label: { color: "$blue11" },
          leftSection: { backgroundColor: "$red9" },
        }}
      />
    </Box>
  ),
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$lg">
      {VARIANTS.map((variant) => (
        <Box key={variant} flexDirection="row" flexWrap="wrap" gap="$md" alignItems="flex-end">
          {SIZES.map((size) => (
            <TextInput
              key={size}
              variant={variant}
              size={size}
              label={`${variant} / ${size}`}
              placeholder="Text"
            />
          ))}
        </Box>
      ))}
    </Box>
  ),
};
