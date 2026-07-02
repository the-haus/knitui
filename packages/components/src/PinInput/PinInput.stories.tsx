import * as React from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { PinInput } from "./PinInput";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/PinInput",
  component: PinInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "PinInput renders a row of single-character inputs for codes and OTP entry. Focus advances automatically between fields. `type` controls accepted characters, `mask` hides the value, and `size` sets the field metrics.",
      },
    },
  },
  args: {
    length: 4,
    type: "alphanumeric",
    size: "sm",
    mask: false,
    disabled: false,
    error: false,
    readOnly: false,
    placeholder: "○",
    manageFocus: true,
    oneTimeCode: true,
  },
  argTypes: {
    length: {
      control: { type: "number", min: 1, max: 10 },
      description: "Number of individual input fields.",
    },
    type: {
      control: "select",
      options: ["alphanumeric", "number"],
      description: "Character set accepted by each field.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls each field's width/height and font size.",
    },
    mask: { control: "boolean", description: "Renders fields as password inputs." },
    disabled: { control: "boolean" },
    error: { control: "boolean" },
    readOnly: { control: "boolean" },
    placeholder: { control: "text" },
    manageFocus: {
      control: "boolean",
      description: "Advance focus automatically to the next field after entry.",
    },
    oneTimeCode: {
      control: "boolean",
      description: 'Sets autocomplete="one-time-code" on each field.',
    },
  },
} satisfies Meta<typeof PinInput>;

export default meta;

type Story = StoryObj<typeof meta>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** The seven token sizes from xxs to xxl, rendered side by side. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$lg">
      {SIZES.map((size) => (
        <Box key={size} flexDirection="row" gap="$md" alignItems="center">
          <Box width={40}>
            <Text>{size}</Text>
          </Box>
          <PinInput {...args} size={size} />
        </Box>
      ))}
    </Box>
  ),
};

/** Each elevation of the inherited `shadow` prop applied to the field row. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$lg">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} flexDirection="row" gap="$md" alignItems="center">
          <Box width={40}>
            <Text>{shadow}</Text>
          </Box>
          <PinInput {...args} shadow={shadow} />
        </Box>
      ))}
    </Box>
  ),
};

/** Disabled state — all fields reject input and appear dimmed. */
export const Disabled: Story = {
  args: { disabled: true },
};

/** Error state — every field receives error styling and aria-invalid. */
export const WithError: Story = {
  args: { error: true },
};

/** Masked inputs — characters are hidden behind the platform password glyph. */
export const Masked: Story = {
  args: { mask: true, length: 6 },
};

/** Numeric-only mode — only digit characters (0–9) are accepted. */
export const NumberType: Story = {
  args: { type: "number", length: 6, placeholder: "0" },
};

/** Six-digit code length, suitable for TOTP or SMS OTP flows. */
export const SixDigits: Story = {
  args: { length: 6, type: "number" },
};

/** Controlled component — the parent holds the value in state and logs onComplete. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("");
    const [completed, setCompleted] = React.useState<string | null>(null);

    return (
      <Box gap="$md" alignItems="center">
        <PinInput
          {...args}
          value={value}
          onChange={setValue}
          onComplete={(v) => setCompleted(v)}
          length={4}
          type="number"
        />
        <Text>Value: "{value}"</Text>
        {completed !== null && <Text>Completed: "{completed}"</Text>}
      </Box>
    );
  },
};

/** Read-only — the pre-filled value is visible but cannot be changed. */
export const ReadOnly: Story = {
  args: { readOnly: true, value: "1234", length: 4, type: "number" },
};

/** Per-slot `styles` targets individual parts — here the `field` spread onto every per-character input. */
export const Styles: Story = {
  args: {
    length: 4,
    styles: {
      field: { wrapperProps: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 } },
    },
  },
};
