import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Input } from "./Input";

const VARIANTS = ["default", "filled", "unstyled"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/Input",
  component: Input,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Input is the base text-field primitive. It renders an `input` or `textarea` host (or a custom host via `component`), wrapped in themed chrome that supports left/right sections, loading indicators, error styling and the `Input.Wrapper`/`Input.Label`/`Input.Error`/`Input.Description` compound parts.",
      },
    },
  },
  args: {
    placeholder: "Type here…",
    variant: "default",
    size: "sm",
    disabled: false,
    loading: false,
    pointer: false,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description: "Visual variant of the input chrome.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, horizontal padding and font size.",
    },
    radius: {
      control: "text",
      description: "Theme radius token (e.g. `$sm`) or any CSS value.",
    },
    disabled: { control: "boolean" },
    pointer: { control: "boolean", description: "Use a pointer cursor (e.g. select-like inputs)." },
    loading: { control: "boolean" },
    loadingPosition: { control: "inline-radio", options: ["left", "right"] },
    error: { control: "text", description: "Error message / flag — toggles error styling." },
    placeholder: { control: "text" },
    leftSection: { control: false },
    rightSection: { control: false },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "pink"],
    },
  },
} satisfies Meta<typeof Input>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
};

/** The three chrome variants. */
export const Variants: Story = {
  render: (args) => (
    <Box gap="$md" width={320}>
      {VARIANTS.map((variant) => (
        <Input key={variant} {...args} variant={variant} placeholder={variant} />
      ))}
    </Box>
  ),
};

/** The seven token sizes from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md" width={320}>
      {SIZES.map((size) => (
        <Input key={size} {...args} size={size} placeholder={`size: ${size}`} />
      ))}
    </Box>
  ),
};

/** The inherited `shadow` elevation prop, from xs to xl. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$md" width={320}>
      {SHADOWS.map((shadow) => (
        <Input key={shadow} {...args} shadow={shadow} placeholder={shadow} />
      ))}
    </Box>
  ),
};

/** Left and right sections hold icons, prefixes or actions. */
export const WithSections: Story = {
  decorators: [(Story) => <Box width={320}>{<Story />}</Box>],
  render: (args) => (
    <Box gap="$md">
      <Input {...args} leftSection={<Text>@</Text>} placeholder="username" />
      <Input {...args} rightSection={<Text>.com</Text>} placeholder="domain" />
      <Input
        {...args}
        leftSection={<Text>$</Text>}
        rightSection={<Text>USD</Text>}
        placeholder="0.00"
      />
    </Box>
  ),
};

/** Loading indicator, positioned left or right. */
export const Loading: Story = {
  render: (args) => (
    <Box gap="$md" width={320}>
      <Input {...args} loading loadingPosition="right" placeholder="loading right" />
      <Input {...args} loading loadingPosition="left" placeholder="loading left" />
    </Box>
  ),
};

/** Disabled state. */
export const Disabled: Story = {
  args: { disabled: true, value: "Can't touch this" },
  decorators: [(Story) => <Box width={320}>{<Story />}</Box>],
};

/** Read-only — the value is visible and focusable but cannot be edited. */
export const ReadOnly: Story = {
  args: { readOnly: true, value: "Read-only value" },
  decorators: [(Story) => <Box width={320}>{<Story />}</Box>],
};

/** Error state — toggles the error border and `aria-invalid`. */
export const Error: Story = {
  args: { error: true, value: "invalid@", placeholder: "email" },
  decorators: [(Story) => <Box width={320}>{<Story />}</Box>],
};

/** Multiline renders a `textarea` host. */
export const Multiline: Story = {
  args: { multiline: true, rows: 4, placeholder: "Write a few lines…" },
  decorators: [(Story) => <Box width={320}>{<Story />}</Box>],
};

/**
 * `Input.Wrapper` ties together a label, description and error message with the
 * correct accessibility wiring, then renders the input as its child.
 */
export const WithWrapper: Story = {
  render: (args) => (
    <Box width={320}>
      <Input.Wrapper
        label="Email address"
        description="We'll never share it."
        error={args.error}
        required
      >
        <Input {...args} placeholder="you@example.com" />
      </Input.Wrapper>
    </Box>
  ),
  args: {
    error: "",
    size: "md",
  },
};

/** Per-slot `styles` targets individual parts — here the `root` frame and `leftSection`. */
export const Styles: Story = {
  decorators: [(Story) => <Box width={320}>{<Story />}</Box>],
  render: (args) => (
    <Input
      {...args}
      leftSection={<Text>@</Text>}
      placeholder="username"
      styles={{
        root: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
        leftSection: { backgroundColor: "$red9" },
      }}
    />
  ),
};

/** Controlled input demonstrating `onChangeText`. */
export const Controlled: Story = {
  decorators: [(Story) => <Box width={320}>{<Story />}</Box>],
  render: (args) => {
    const [value, setValue] = React.useState("");
    return (
      <Box gap="$sm">
        <Input {...args} value={value} onChangeText={setValue} placeholder="Type something" />
        <Text fontSize={12} color="$color11">
          value: {value || "—"}
        </Text>
      </Box>
    );
  },
};
