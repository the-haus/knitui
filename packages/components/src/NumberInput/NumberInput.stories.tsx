import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { NumberInput, type NumberInputHandlers } from "./NumberInput";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/NumberInput",
  component: NumberInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "NumberInput is a numeric text field built on `InputBase` with built-in increment/decrement controls and keyboard stepping. It mirrors the Mantine `NumberInput` API and supports min/max clamping, decimal scale, negative numbers and a hold-to-step mode.",
      },
    },
  },
  args: {
    placeholder: "Enter a number",
    size: "sm",
    disabled: false,
    readOnly: false,
    hideControls: false,
    allowNegative: true,
    allowDecimal: true,
    step: 1,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, horizontal padding and font size.",
    },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    hideControls: { control: "boolean", description: "Hides the up/down stepper controls." },
    allowNegative: { control: "boolean" },
    allowDecimal: { control: "boolean" },
    step: { control: "number", description: "Amount added/subtracted per step." },
    min: { control: "number" },
    max: { control: "number" },
    decimalScale: { control: "number", description: "Decimal digits limit." },
    clampBehavior: {
      control: "select",
      options: ["blur", "strict", "none"],
      description: "When out-of-range values are clamped.",
    },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    placeholder: { control: "text" },
    leftSection: { control: false },
    rightSection: { control: false },
    handlersRef: { control: false },
  },
} satisfies Meta<typeof NumberInput>;

export default meta;

type Story = StoryObj<ComponentProps<typeof NumberInput>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Seven sizes displayed side by side, from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <NumberInput key={size} {...args} size={size} placeholder={size} />
      ))}
    </Box>
  ),
};

/** Each elevation of the inherited `shadow` prop applied to the input frame. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <NumberInput key={shadow} {...args} shadow={shadow} label={shadow} defaultValue={42} />
      ))}
    </Box>
  ),
};

/** Disabled state — the field is not interactive and has reduced opacity. */
export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: 42,
    label: "Amount",
  },
};

/** Read-only state — the value is visible but cannot be changed; controls are hidden. */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: 100,
    label: "Read-only amount",
  },
};

/** Min and max bounds clamp the value on blur (the default `clampBehavior`). */
export const WithMinMax: Story = {
  args: {
    label: "Quantity (1–10)",
    description: "Value is clamped to the 1–10 range on blur.",
    min: 1,
    max: 10,
    defaultValue: 5,
    clampBehavior: "blur",
  },
};

/** Decimal scale limits the number of digits after the decimal point. */
export const DecimalScale: Story = {
  args: {
    label: "Price",
    description: "Two decimal places, step 0.01.",
    defaultValue: 9.99,
    allowDecimal: true,
    decimalScale: 2,
    step: 0.01,
    leftSection: <Text>$</Text>,
  },
};

/** Hides the built-in stepper controls while keeping keyboard stepping active. */
export const HiddenControls: Story = {
  args: {
    label: "Score",
    description: "Arrow keys still increment/decrement the value.",
    hideControls: true,
    defaultValue: 0,
    min: 0,
    max: 100,
  },
};

/** Controlled value managed via React.useState — demonstrates the onChange callback. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<number | string>(0);
    return (
      <Box gap="$md">
        <NumberInput
          {...args}
          label="Controlled count"
          value={value}
          onChange={setValue}
          min={0}
          max={20}
          step={1}
        />
        <Text>Current value: {String(value)}</Text>
      </Box>
    );
  },
};

/** External increment/decrement via `handlersRef` — useful for custom control UIs. */
export const ExternalHandlers: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<number | string>(5);
    const handlers = React.useRef<NumberInputHandlers>(null);
    return (
      <Box gap="$md">
        <NumberInput
          {...args}
          label="Amount"
          value={value}
          onChange={setValue}
          handlersRef={handlers}
          hideControls
        />
        <Box flexDirection="row" gap="$sm">
          <Box
            paddingHorizontal="$md"
            paddingVertical="$xs"
            backgroundColor="$color4"
            borderRadius="$sm"
            style={{ cursor: "pointer" }}
            onPress={() => handlers.current?.decrement()}
          >
            <Text>− Decrement</Text>
          </Box>
          <Box
            paddingHorizontal="$md"
            paddingVertical="$xs"
            backgroundColor="$color4"
            borderRadius="$sm"
            style={{ cursor: "pointer" }}
            onPress={() => handlers.current?.increment()}
          >
            <Text>+ Increment</Text>
          </Box>
        </Box>
      </Box>
    );
  },
};

/** With a label, helper description and inline error message. */
export const WithLabelAndError: Story = {
  args: {
    label: "Age",
    description: "Must be between 18 and 120.",
    error: "Value is out of range",
    min: 18,
    max: 120,
    defaultValue: 15,
    clampBehavior: "none",
  },
};

/** Per-slot `styles` targets individual parts — here the `label`, `increment` and `decrement` controls. */
export const Styles: Story = {
  args: {
    label: "Styled stepper",
    defaultValue: 5,
    styles: {
      label: { color: "$blue9", fontWeight: "700" },
      increment: { backgroundColor: "$green3" },
      decrement: { backgroundColor: "$red3" },
    },
  },
};
