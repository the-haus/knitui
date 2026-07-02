import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Separator } from "./Separator";

const VARIANTS = ["solid", "dashed", "dotted"] as const;

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const meta = {
  title: "Display/Separator",
  component: Separator,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "Separator renders a divider line — mirrors Mantine's `Divider`. Supports `variant` (solid/dashed/dotted), `size` (thickness), `orientation` (horizontal/vertical), and an optional `label` anchored left, center, or right.",
      },
    },
  },
  args: {
    orientation: "horizontal",
    variant: "solid",
    size: "xs",
  },
  argTypes: {
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Whether the line runs horizontally or vertically.",
    },
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description: "Border style of the line.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Thickness of the line — xxs→xxl or an explicit px number.",
    },
    label: {
      control: "text",
      description: "Optional text label rendered over a horizontal line.",
    },
    labelPosition: {
      control: "inline-radio",
      options: ["left", "center", "right"],
      description: "Where the label sits along the horizontal line.",
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Separator>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every line style (solid, dashed, dotted) shown side by side. */
export const Variants: Story = {
  render: (args) => (
    <Box gap="$md" width={320}>
      {VARIANTS.map((variant) => (
        <Box key={variant} gap="$xs">
          <Text fontSize="$sm" color="$color11">
            {variant}
          </Text>
          <Separator {...args} variant={variant} />
        </Box>
      ))}
    </Box>
  ),
};

/** All seven thickness levels from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md" width={320}>
      {SIZES.map((size) => (
        <Box key={size} gap="$xs">
          <Text fontSize="$sm" color="$color11">
            {size}
          </Text>
          <Separator {...args} size={size} />
        </Box>
      ))}
    </Box>
  ),
};

/** Vertical orientation — useful inside flex rows to divide sections. */
export const Vertical: Story = {
  render: (args) => (
    <Box flexDirection="row" alignItems="center" gap="$md" height={80}>
      <Text>Left</Text>
      <Separator {...args} orientation="vertical" size="sm" />
      <Text>Middle</Text>
      <Separator {...args} orientation="vertical" size="sm" />
      <Text>Right</Text>
    </Box>
  ),
};

/** Label centered over the line — the default labelPosition. */
export const WithLabelCenter: Story = {
  args: {
    label: "Section",
    labelPosition: "center",
  },
  render: (args) => (
    <Box width={320}>
      <Separator {...args} />
    </Box>
  ),
};

/** Label pinned to the left edge of the line. */
export const WithLabelLeft: Story = {
  args: {
    label: "OR",
    labelPosition: "left",
  },
  render: (args) => (
    <Box width={320}>
      <Separator {...args} />
    </Box>
  ),
};

/** Label pinned to the right edge of the line. */
export const WithLabelRight: Story = {
  args: {
    label: "Continue",
    labelPosition: "right",
  },
  render: (args) => (
    <Box width={320}>
      <Separator {...args} />
    </Box>
  ),
};

/** Label accepts any ReactNode — here a small icon is embedded inline. */
export const WithIconLabel: Story = {
  args: {
    label: <Text>⭐ Featured</Text>,
    labelPosition: "center",
  },
  render: (args) => (
    <Box width={320}>
      <Separator {...args} />
    </Box>
  ),
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$xl" width={360}>
      {VARIANTS.map((variant) => (
        <Box key={variant} gap="$sm">
          <Text fontSize="$sm" color="$color11" fontWeight="bold">
            {variant}
          </Text>
          {SIZES.map((size) => (
            <Box key={size} gap="$xs">
              <Text fontSize="$xs" color="$color10">
                {size}
              </Text>
              <Separator variant={variant} size={size} />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `line` and the `label`. */
export const Styles: Story = {
  args: {
    label: "Section",
    labelPosition: "center",
    styles: {
      line: { borderColor: "$blue7" },
      label: { color: "$blue9", fontWeight: "700" },
    },
  },
  render: (args) => (
    <Box width={320}>
      <Separator {...args} />
    </Box>
  ),
};
