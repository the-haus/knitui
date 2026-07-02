import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { InputBase } from "./InputBase";

const VARIANTS = ["default", "filled", "unstyled"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/InputBase",
  component: InputBase,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "InputBase composes `Input` + `Input.Wrapper` into a single component. It forwards all wrapper props (label, description, error) and all input props (variant, size, sections, etc.) through a single API surface.",
      },
    },
  },
  args: {
    placeholder: "Enter value…",
    variant: "default",
    size: "md",
    disabled: false,
    readOnly: false,
    required: false,
    withAsterisk: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: VARIANTS,
      description: "Visual style — default (bordered), filled (background) or unstyled.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, padding and font size.",
    },
    label: { control: "text", description: "Label rendered above the input." },
    description: { control: "text", description: "Helper text rendered below the label." },
    error: {
      control: "text",
      description: "Error message — also triggers error styles on the input.",
    },
    placeholder: { control: "text" },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    required: { control: "boolean" },
    withAsterisk: {
      control: "boolean",
      description: "Append a required asterisk without setting required.",
    },
    leftSection: { control: false },
    rightSection: { control: false },
  },
} satisfies Meta<typeof InputBase>;

export default meta;

type Story = StoryObj<ComponentProps<typeof InputBase>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All three visual variants side by side. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {VARIANTS.map((variant) => (
        <InputBase
          key={variant}
          {...args}
          variant={variant}
          label={variant}
          placeholder={variant}
        />
      ))}
    </Box>
  ),
};

/** The seven token sizes, from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <InputBase key={size} {...args} size={size} label={size} placeholder={size} />
      ))}
    </Box>
  ),
};

/** The inherited `shadow` elevation prop, from xs to xl. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SHADOWS.map((shadow) => (
        <InputBase key={shadow} {...args} shadow={shadow} label={shadow} placeholder={shadow} />
      ))}
    </Box>
  ),
};

/** Label, description and error message rendered together via wrapper props. */
export const WithLabelAndDescription: Story = {
  args: {
    label: "Username",
    description: "Must be at least 3 characters.",
    placeholder: "john_doe",
  },
};

/** Error state — activates error styling on the chrome and shows the error message. */
export const WithError: Story = {
  args: {
    label: "Email address",
    error: "Enter a valid email address.",
    placeholder: "you@example.com",
  },
};

/** Required field — asterisk appended to the label, native required attribute set. */
export const Required: Story = {
  args: {
    label: "Password",
    withAsterisk: true,
    placeholder: "••••••••",
  },
};

/** Disabled state — reduced opacity, pointer events off. */
export const Disabled: Story = {
  args: {
    label: "Read-only account",
    placeholder: "Cannot edit",
    disabled: true,
  },
};

/** Read-only state — visually similar to disabled but still focusable and selectable. */
export const ReadOnly: Story = {
  args: {
    label: "Computed value",
    value: "generated-token-abc123",
    readOnly: true,
  },
};

/** Left and right sections for icons, badges or action buttons. */
export const WithSections: Story = {
  args: {
    label: "Search",
    placeholder: "Type to search…",
    leftSection: <Text>🔍</Text>,
    rightSection: <Text>⌘K</Text>,
  },
};

/** Multiline textarea variant — rows controls the visible height. */
export const Multiline: Story = {
  args: {
    label: "Notes",
    description: "Add any additional information.",
    placeholder: "Enter your notes here…",
    multiline: true,
    rows: 4,
  },
};

/** Per-slot `styles` targets individual parts — here the `root` frame, `label` and `leftSection`. */
export const Styles: Story = {
  decorators: [(Story) => <Box width={320}>{<Story />}</Box>],
  render: (args) => (
    <InputBase
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
  ),
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$lg">
      {VARIANTS.map((variant) => (
        <Box key={variant} gap="$sm">
          {SIZES.map((size) => (
            <InputBase
              key={size}
              variant={variant}
              size={size}
              label={`${variant} / ${size}`}
              placeholder={`${variant} – ${size}`}
            />
          ))}
        </Box>
      ))}
    </Box>
  ),
};
