import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { PasswordInput } from "./PasswordInput";

const VARIANTS = ["default", "filled", "unstyled"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/PasswordInput",
  component: PasswordInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "PasswordInput is a masked text field built on `InputBase`. It renders a visibility-toggle button in the right section that switches the native input between `password` and `text` types. The toggle is hidden when `disabled` or `withVisibilityToggle={false}`. A caller-supplied `rightSection` takes precedence over the built-in toggle, matching Mantine's API.",
      },
    },
  },
  args: {
    placeholder: "Enter password…",
    size: "sm",
    disabled: false,
    withVisibilityToggle: true,
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
    disabled: { control: "boolean" },
    withVisibilityToggle: {
      control: "boolean",
      description: "Whether the visibility toggle button is rendered.",
    },
    visible: {
      control: "boolean",
      description: "Controlled visibility state — when set, the caller owns the toggle state.",
    },
    defaultVisible: {
      control: "boolean",
      description: "Uncontrolled initial visibility. Defaults to false (hidden).",
    },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text", description: "Error message — toggles error styling." },
    required: { control: "boolean" },
    placeholder: { control: "text" },
    visibilityToggleIcon: { control: false },
    visibilityToggleButtonProps: { control: false },
    rightSection: { control: false },
    leftSection: { control: false },
  },
} satisfies Meta<typeof PasswordInput>;

export default meta;

type Story = StoryObj<ComponentProps<typeof PasswordInput>>;

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

/** The three input chrome variants — default, filled and unstyled. */
export const Variants: Story = {
  render: (args) => (
    <Box gap="$md" width={320}>
      {VARIANTS.map((variant) => (
        <PasswordInput key={variant} {...args} variant={variant} placeholder={variant} />
      ))}
    </Box>
  ),
};

/** The full seven-step size scale from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md" width={320}>
      {SIZES.map((size) => (
        <PasswordInput key={size} {...args} size={size} placeholder={`size: ${size}`} />
      ))}
    </Box>
  ),
};

/** Each elevation of the inherited `shadow` prop applied to the input frame. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$md" width={320}>
      {SHADOWS.map((shadow) => (
        <PasswordInput key={shadow} {...args} shadow={shadow} placeholder={shadow} />
      ))}
    </Box>
  ),
};

/** Disabled state — the toggle button is hidden and the field is inert. */
export const Disabled: Story = {
  args: { disabled: true, value: "super-secret" },
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
};

/** WithLabel — shows how label, description and required marker render together. */
export const WithLabel: Story = {
  args: {
    label: "New password",
    description: "Must be at least 8 characters.",
    required: true,
    placeholder: "Enter new password…",
  },
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
};

/** Error state — red border and inline error message beneath the field. */
export const WithError: Story = {
  args: {
    label: "Password",
    error: "Password must be at least 8 characters.",
    value: "abc",
  },
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
};

/** Toggle hidden — `withVisibilityToggle={false}` removes the reveal button entirely. */
export const NoToggle: Story = {
  args: { withVisibilityToggle: false, placeholder: "Hidden forever…" },
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
};

/** Controlled visibility — the parent owns `visible` and calls `onVisibilityChange` to update it. */
export const ControlledVisibility: Story = {
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
  render: (args) => {
    const [visible, setVisible] = React.useState(false);
    return (
      <Box gap="$sm">
        <PasswordInput
          {...args}
          label="Password"
          visible={visible}
          onVisibilityChange={setVisible}
          placeholder="Controlled visibility"
        />
        <Text fontSize="$xs" color="$color11">
          visible: {visible ? "true" : "false"}
        </Text>
      </Box>
    );
  },
};

/** Custom toggle icon — replaces the default eye glyph with a caller-supplied component. */
export const CustomToggleIcon: Story = {
  args: {
    label: "Password",
    placeholder: "Custom icon toggle",
    visibilityToggleIcon: ({ reveal }) => <Text>{reveal ? "🔓" : "🔒"}</Text>,
  },
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
};

/** Per-slot `styles` targets individual parts — here the `label` and the `visibilityToggle` button. */
export const Styles: Story = {
  args: {
    label: "Styled password",
    placeholder: "Enter password…",
    styles: {
      label: { color: "$blue9", fontWeight: "700" },
      visibilityToggle: { variant: "filled" },
    },
  },
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$lg">
      {VARIANTS.map((variant) => (
        <Box key={variant} gap="$sm">
          <Text fontSize="$xxs" color="$color11">
            {variant}
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
            {SIZES.map((size) => (
              <PasswordInput
                key={size}
                variant={variant}
                size={size}
                placeholder={`${variant} / ${size}`}
              />
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  ),
};
