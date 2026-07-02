import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Fieldset } from "./Fieldset";

const VARIANTS = ["default", "filled", "unstyled"] as const;
const RADII = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/Fieldset",
  component: Fieldset,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Fieldset groups related form controls under an optional `legend`. `variant` controls the chrome style (`default` border, `filled` tinted background, `unstyled` no border/padding). `disabled` dims the group and blocks pointer interaction with every control inside.",
      },
    },
  },
  args: {
    legend: "Personal details",
    variant: "default",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description: "Visual style — how the fieldset border and background are rendered.",
    },
    disabled: {
      control: "boolean",
      description: "Dims the fieldset and blocks interaction with the controls inside it.",
    },
    legend: {
      control: "text",
      description: "Label rendered as the fieldset legend.",
    },
    radius: {
      control: "select",
      options: [undefined, ...RADII],
      description: "Border radius applied to the fieldset frame.",
    },
    shadow: {
      control: "select",
      options: [undefined, "xs", "sm", "md", "lg", "xl"],
      description: "Elevation — drop shadow from the shared ladder.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Accent theme used by tinted surfaces.",
    },
    children: { control: false },
  },
} satisfies Meta<typeof Fieldset>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Fieldset>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  args: {
    children: <Text>Form controls go here</Text>,
  },
};

/** Every visual variant side by side, each with a legend and placeholder content. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="flex-start">
      {VARIANTS.map((variant) => (
        <Fieldset key={variant} {...args} variant={variant} legend={variant}>
          <Text>Content for {variant}</Text>
        </Fieldset>
      ))}
    </Box>
  ),
};

/** Each elevation level from the shared shadow ladder. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="flex-start">
      {SHADOWS.map((shadow) => (
        <Fieldset key={shadow} {...args} shadow={shadow} legend={shadow}>
          <Text>Elevation {shadow}</Text>
        </Fieldset>
      ))}
    </Box>
  ),
};

/** Fieldset with a legend label identifying the group of controls. */
export const WithLegend: Story = {
  args: {
    legend: "Shipping address",
    children: <Text>Address fields go here</Text>,
  },
};

/** Fieldset with no legend — the border and padding remain, but no label is shown. */
export const WithoutLegend: Story = {
  args: {
    legend: undefined,
    children: <Text>Controls without a legend label</Text>,
  },
};

/** Disabled state — all controls inside are dimmed and not interactive. */
export const Disabled: Story = {
  args: {
    legend: "Disabled group",
    disabled: true,
    children: (
      <Box gap="$sm">
        <Text>These controls are all disabled</Text>
        <Text>They cannot be interacted with</Text>
      </Box>
    ),
  },
};

/** The `filled` variant uses a subtle background tint to distinguish the group. */
export const Filled: Story = {
  args: {
    variant: "filled",
    legend: "Filled variant",
    children: <Text>A tinted background groups these fields visually</Text>,
  },
};

/** Theme changes the tint used by the filled variant. */
export const Theme: Story = {
  args: {
    variant: "filled",
    theme: "green",
    legend: "Green theme",
    children: <Text>The filled surface follows the active theme ramp</Text>,
  },
};

/** The `unstyled` variant strips all chrome — no border, no padding, no radius. */
export const Unstyled: Story = {
  args: {
    variant: "unstyled",
    legend: "Unstyled variant",
    children: <Text>No border or padding — compose your own wrapper</Text>,
  },
};

/** Nested fieldsets — group sub-sections of a larger form. */
export const Nested: Story = {
  args: {
    legend: "Billing information",
    children: (
      <Box gap="$md">
        <Fieldset legend="Card details" variant="filled">
          <Text>Card number, expiry, CVV</Text>
        </Fieldset>
        <Fieldset legend="Billing address" variant="filled">
          <Text>Street, city, postcode</Text>
        </Fieldset>
      </Box>
    ),
  },
};

/** Per-slot `styles` targets individual parts — here the `root` and `legend`. */
export const Styles: Story = {
  args: {
    legend: "Custom styled group",
    children: <Text>The frame and legend are restyled via the styles map</Text>,
    styles: {
      root: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
      legend: { color: "$red9", fontWeight: "700" },
    },
  },
};
