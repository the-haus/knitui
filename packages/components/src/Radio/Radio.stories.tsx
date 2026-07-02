import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Radio } from "./Radio";

const VARIANTS = ["filled", "outline"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const meta = {
  title: "Inputs/Radio",
  component: Radio,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Radio is a single-selection control. Use `Radio.Group` to manage a set of mutually exclusive options, `Radio.Card` for a card-style selection surface, and `Radio.Indicator` as a standalone visual indicator. `variant` controls how the active colour ramp is applied; `size` sets the circle metrics.",
      },
    },
  },
  args: {
    label: "Radio option",
    variant: "filled",
    size: "sm",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description: "Visual style — filled fills the circle, outline keeps it transparent.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls the circle diameter.",
    },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    disabled: { control: "boolean" },
    labelPosition: {
      control: "inline-radio",
      options: ["left", "right"],
      description: "Side the label appears on.",
    },
  },
} satisfies Meta<typeof Radio>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Radio>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every visual variant side by side at the default size. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {VARIANTS.map((variant) => (
        <Radio key={variant} {...args} variant={variant} label={variant} />
      ))}
    </Box>
  ),
};

/** All seven sizes from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Radio key={size} {...args} size={size} label={size} />
      ))}
    </Box>
  ),
};

/** Theme changes the active accent ramp. */
export const Theme: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Radio {...args} theme="blue" defaultChecked label="Blue" />
      <Radio {...args} theme="green" defaultChecked label="Green" />
      <Radio {...args} theme="red" defaultChecked label="Red" />
    </Box>
  ),
};

/** Disabled state — the control is visually dimmed and cannot be toggled. */
export const Disabled: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Radio {...args} disabled label="Unchecked disabled" />
      <Radio {...args} disabled defaultChecked label="Checked disabled" />
    </Box>
  ),
};

/** Label, description, and error message all together. */
export const WithDescription: Story = {
  args: {
    label: "Email notifications",
    description: "We will send you a weekly digest.",
  },
};

/** An error message is shown below the label when `error` is set. */
export const WithError: Story = {
  args: {
    label: "Accept terms",
    error: "You must accept the terms to continue.",
  },
};

/** Label positioned to the left of the circle. */
export const LabelLeft: Story = {
  args: { label: "Label on the left", labelPosition: "left" },
};

/** Controlled — the checked state is owned by the parent component. */
export const Controlled: Story = {
  render: (args) => {
    const [checked, setChecked] = React.useState(false);
    return (
      <Box gap="$sm">
        <Radio
          {...args}
          checked={checked}
          onChange={setChecked}
          label={checked ? "Checked" : "Unchecked"}
        />
        <Text fontSize="$xs" color="$color11">
          checked: {String(checked)}
        </Text>
      </Box>
    );
  },
};

/** `Radio.Group` — mutually exclusive selection managed by a surrounding group. */
export const Group: Story = {
  render: (args) => (
    <Radio.Group label="Favourite fruit" description="Pick exactly one." defaultValue="apple">
      <Radio {...args} value="apple" label="Apple" />
      <Radio {...args} value="orange" label="Orange" />
      <Radio {...args} value="pear" label="Pear" />
    </Radio.Group>
  ),
};

/** `Radio.Group` in a controlled state — selection is owned by the parent. */
export const GroupControlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>("apple");
    return (
      <Box gap="$sm">
        <Radio.Group label="Favourite fruit" value={value} onChange={setValue}>
          <Radio {...args} value="apple" label="Apple" />
          <Radio {...args} value="orange" label="Orange" />
          <Radio {...args} value="pear" label="Pear" />
        </Radio.Group>
        <Text fontSize="$xs" color="$color11">
          selected: {value}
        </Text>
      </Box>
    );
  },
};

/** A disabled `Radio.Group` prevents toggling any of its children. */
export const GroupDisabled: Story = {
  render: (args) => (
    <Radio.Group label="Disabled group" disabled defaultValue="orange">
      <Radio {...args} value="apple" label="Apple" />
      <Radio {...args} value="orange" label="Orange" />
      <Radio {...args} value="pear" label="Pear" />
    </Radio.Group>
  ),
};

/** A read-only `Radio.Group` keeps the selection visible but prevents changing it. */
export const GroupReadOnly: Story = {
  render: (args) => (
    <Radio.Group label="Read-only group" readOnly defaultValue="orange">
      <Radio {...args} value="apple" label="Apple" />
      <Radio {...args} value="orange" label="Orange" />
      <Radio {...args} value="pear" label="Pear" />
    </Radio.Group>
  ),
};

/** `Radio.Card` — a card-shaped selection surface that wraps arbitrary content. */
export const Card: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>("standard");
    return (
      <Radio.Group value={value} onChange={setValue}>
        <Box flexDirection="row" flexWrap="wrap" gap="$md">
          {(
            [
              { value: "standard", title: "Standard", description: "5–7 business days" },
              { value: "express", title: "Express", description: "2–3 business days" },
              { value: "overnight", title: "Overnight", description: "Next business day" },
            ] as const
          ).map((option) => (
            <Radio.Card key={option.value} value={option.value} padding="$md" width={160}>
              <Box flexDirection="row" alignItems="center" gap="$sm">
                <Radio.Indicator
                  checked={value === option.value}
                  variant={args.variant}
                  size={args.size}
                />
                <Box>
                  <Text fontWeight="600">{option.title}</Text>
                  <Text fontSize="$xs" color="$color11">
                    {option.description}
                  </Text>
                </Box>
              </Box>
            </Radio.Card>
          ))}
        </Box>
      </Radio.Group>
    );
  },
};

/** `Radio.Card` with the `shadow` elevation prop across the shadow ladder. */
export const CardShadows: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string>("md");
    return (
      <Radio.Group value={value} onChange={setValue}>
        <Box flexDirection="row" flexWrap="wrap" gap="$lg" padding="$md">
          {(["xs", "sm", "md", "lg", "xl"] as const).map((shadow) => (
            <Radio.Card key={shadow} value={shadow} shadow={shadow} padding="$md" width={140}>
              <Box flexDirection="row" alignItems="center" gap="$sm">
                <Radio.Indicator
                  checked={value === shadow}
                  variant={args.variant}
                  size={args.size}
                />
                <Text fontWeight="600">{shadow}</Text>
              </Box>
            </Radio.Card>
          ))}
        </Box>
      </Radio.Group>
    );
  },
};

/** `Radio.Indicator` — a standalone visual-only indicator not tied to any input. */
export const Indicator: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Box key={size} flexDirection="row" gap="$sm" alignItems="center">
          <Radio.Indicator size={size} variant={args.variant} checked={false} />
          <Radio.Indicator size={size} variant={args.variant} checked />
        </Box>
      ))}
    </Box>
  ),
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$lg">
      {VARIANTS.map((variant) => (
        <Box key={variant} flexDirection="row" gap="$md" alignItems="center">
          {SIZES.map((size) => (
            <Radio
              key={size}
              variant={variant}
              size={size}
              defaultChecked
              label={`${variant} ${size}`}
            />
          ))}
        </Box>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `circle` and the `label`. */
export const Styles: Story = {
  args: {
    label: "Custom styled radio",
    defaultChecked: true,
    styles: {
      circle: { borderColor: "$blue7", borderWidth: 2 },
      label: { color: "$blue9", fontWeight: "700" },
    },
  },
};
