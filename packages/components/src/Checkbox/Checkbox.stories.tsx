import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Stack } from "../Stack";
import { Text } from "../Text";
import { Checkbox } from "./Checkbox";

const VARIANTS = ["filled", "outline"] as const;

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const meta = {
  title: "Inputs/Checkbox",
  component: Checkbox,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Checkbox is a cross-platform toggle control. `variant` sets how the active colour ramp is applied; `size` scales the box, icon and label together. Compose `Checkbox.Group` for multi-select lists, `Checkbox.Card` for card-style toggles, and `Checkbox.Indicator` for a read-only presentational box.",
      },
    },
  },
  args: {
    label: "Accept terms and conditions",
    variant: "filled",
    size: "sm",
    disabled: false,
    indeterminate: false,
    readOnly: false,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description:
        "Visual style — filled fills the box with the accent colour; outline tints the border and icon only.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls the box dimensions, icon size and label metrics.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Accent theme applied to the checkbox box and icon.",
    },
    labelPosition: {
      control: "inline-radio",
      options: ["left", "right"],
      description: "Position of the label relative to the checkbox box.",
    },
    disabled: { control: "boolean" },
    indeterminate: { control: "boolean" },
    readOnly: { control: "boolean" },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Checkbox>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  args: {
    readOnly: true,
  },
};

/** Both visual variants at the default size, checked and unchecked. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {VARIANTS.map((variant) => (
        <Checkbox key={variant} {...args} variant={variant} defaultChecked label={variant} />
      ))}
    </Box>
  ),
};

/** Full seven-step size scale. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Checkbox key={size} {...args} size={size} defaultChecked label={size} />
      ))}
    </Box>
  ),
};

/** Disabled state — the box is dimmed and cannot be toggled. */
export const Disabled: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$md">
      <Checkbox {...args} disabled label="Disabled unchecked" />
      <Checkbox {...args} disabled defaultChecked label="Disabled checked" />
    </Box>
  ),
};

/** Indeterminate state — aria-checked is "mixed" to indicate partial selection. */
export const Indeterminate: Story = {
  args: { indeterminate: true, label: "Select all" },
};

/** Label, description and error message rendered together. */
export const WithLabelAndDescription: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$lg">
      <Checkbox
        {...args}
        label="I agree to the terms"
        description="You must accept before continuing."
      />
      <Checkbox
        {...args}
        label="I agree to the terms"
        description="You must accept before continuing."
        error="This field is required."
      />
    </Box>
  ),
};

/** Controlled — checked state is owned by the parent; prints current value below. */
export const Controlled: Story = {
  render: (args) => {
    const [checked, setChecked] = React.useState(false);
    return (
      <Box flexDirection="column" gap="$sm" alignItems="flex-start">
        <Checkbox {...args} checked={checked} onChange={setChecked} label="Controlled checkbox" />
        <Text fontSize="$xs" color="$color11">
          checked: {String(checked)}
        </Text>
      </Box>
    );
  },
};

/** Read-only — the value is visible but cannot be changed. */
export const ReadOnly: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$md">
      <Checkbox {...args} readOnly label="Read-only unchecked" />
      <Checkbox {...args} readOnly defaultChecked label="Read-only checked" />
    </Box>
  ),
};

/** `Checkbox.Group` manages an array of selected values across multiple checkboxes. */
export const Group: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string[]>(["react"]);
    return (
      <Box flexDirection="column" gap="$sm" alignItems="flex-start">
        <Checkbox.Group
          value={value}
          onChange={setValue}
          label="Favourite frameworks"
          description="Pick one or more."
          size={args.size}
        >
          <Checkbox value="react" label="React" />
          <Checkbox value="vue" label="Vue" />
          <Checkbox value="svelte" label="Svelte" />
          <Checkbox value="solid" label="Solid" />
        </Checkbox.Group>
        <Text fontSize="$xs" color="$color11">
          selected: [{value.join(", ")}]
        </Text>
      </Box>
    );
  },
};

/** `Checkbox.Group` with a maximum number of selections enforced. */
export const GroupMaxValues: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string[]>(["react"]);
    return (
      <Box flexDirection="column" gap="$sm" alignItems="flex-start">
        <Checkbox.Group
          value={value}
          onChange={setValue}
          label="Pick up to 2"
          maxSelectedValues={2}
          size={args.size}
        >
          <Checkbox value="react" label="React" />
          <Checkbox value="vue" label="Vue" />
          <Checkbox value="svelte" label="Svelte" />
          <Checkbox value="solid" label="Solid" />
        </Checkbox.Group>
        <Text fontSize="$xs" color="$color11">
          selected: [{value.join(", ")}]
        </Text>
      </Box>
    );
  },
};

/** `Checkbox.Card` renders a pressable card that functions as a checkbox. */
export const Card: Story = {
  render: (args) => {
    const [checked, setChecked] = React.useState(false);
    return (
      <Checkbox.Card checked={checked} onChange={setChecked} radius="md" width={240}>
        <Box flexDirection="row" gap="$sm" alignItems="center">
          <Checkbox.Indicator checked={checked} variant={args.variant} size={args.size} />
          <Stack gap="$xxs">
            <Text fontWeight="600">Enable notifications</Text>
            <Text fontSize="$xs" color="$color11">
              Receive alerts for new activity.
            </Text>
          </Stack>
        </Box>
      </Checkbox.Card>
    );
  },
};

/** `Checkbox.Card` with the `shadow` elevation prop across the shadow ladder. */
export const CardShadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" padding="$md">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((shadow) => (
        <Checkbox.Card key={shadow} shadow={shadow} radius="md" width={200}>
          <Box flexDirection="row" gap="$sm" alignItems="center">
            <Checkbox.Indicator checked variant={args.variant} size={args.size} />
            <Text fontWeight="600">{shadow}</Text>
          </Box>
        </Checkbox.Card>
      ))}
    </Box>
  ),
};

/** `Checkbox.Indicator` is a presentational-only box with no press handler. */
export const Indicator: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      <Checkbox.Indicator checked={false} variant={args.variant} size={args.size} />
      <Checkbox.Indicator checked variant={args.variant} size={args.size} />
      <Checkbox.Indicator indeterminate variant={args.variant} size={args.size} />
      <Checkbox.Indicator checked disabled variant={args.variant} size={args.size} />
    </Box>
  ),
};

/** Accent themes use Tamagui `theme`, not a public color prop. */
export const Themes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "yellow", "pink", "gray"] as const).map((theme) => (
        <Checkbox key={theme} {...args} theme={theme} defaultChecked label={theme} />
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
            <Checkbox key={size} variant={variant} size={size} defaultChecked label={size} />
          ))}
        </Box>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `box` square and the `label`. */
export const Styles: Story = {
  args: {
    label: "Accept terms and conditions",
    defaultChecked: true,
    styles: {
      box: { backgroundColor: "$blue9", borderColor: "$blue7", borderWidth: 2 },
      label: { color: "$red9", fontWeight: "700" },
    },
  },
};
