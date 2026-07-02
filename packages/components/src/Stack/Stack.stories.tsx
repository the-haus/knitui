import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Stack } from "./Stack";

const ALIGNS = ["stretch", "flex-start", "center", "flex-end"] as const;
const JUSTIFIES = ["flex-start", "center", "flex-end", "space-between", "space-around"] as const;
const GAPS = ["$xxs", "$xs", "$sm", "$md", "$lg", "$xl", "$xxl"] as const;

const meta = {
  title: "Layout/Stack",
  component: Stack,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Stack is a vertical flex column built on `Box`. It mirrors Mantine's `Stack`: `gap` takes a Tamagui space token, `align` maps to `alignItems`, and `justify` maps to `justifyContent`.",
      },
    },
  },
  args: {
    gap: "$md",
    align: "stretch",
    justify: "flex-start",
  },
  argTypes: {
    gap: {
      control: "select",
      options: GAPS,
      description: "Spacing between children — a Tamagui space token.",
    },
    align: {
      control: "select",
      options: ALIGNS,
      description: "Cross-axis alignment (alignItems).",
    },
    justify: {
      control: "select",
      options: JUSTIFIES,
      description: "Main-axis distribution (justifyContent).",
    },
  },
} satisfies Meta<typeof Stack>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Stack>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Stack {...args} width={240}>
      <Box backgroundColor="$color5" padding="$sm" borderRadius="$sm">
        <Text>First</Text>
      </Box>
      <Box backgroundColor="$color5" padding="$sm" borderRadius="$sm">
        <Text>Second</Text>
      </Box>
      <Box backgroundColor="$color5" padding="$sm" borderRadius="$sm">
        <Text>Third</Text>
      </Box>
    </Stack>
  ),
};

/** Every align value side by side so cross-axis alignment differences are visible. */
export const AlignVariants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {ALIGNS.map((align) => (
        <Box key={align} gap="$xs">
          <Text size="sm" color="$color10">
            {align}
          </Text>
          <Stack {...args} align={align} width={140} backgroundColor="$color3" padding="$sm">
            <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
              <Text>Wide item</Text>
            </Box>
            <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm" alignSelf="auto">
              <Text>Short</Text>
            </Box>
            <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
              <Text>Medium item</Text>
            </Box>
          </Stack>
        </Box>
      ))}
    </Box>
  ),
};

/** Every justify value in a fixed-height container so main-axis distribution is visible. */
export const JustifyVariants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {JUSTIFIES.map((justify) => (
        <Box key={justify} gap="$xs">
          <Text size="sm" color="$color10">
            {justify}
          </Text>
          <Stack
            {...args}
            justify={justify}
            height={200}
            width={120}
            backgroundColor="$color3"
            padding="$sm"
          >
            <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
              <Text>A</Text>
            </Box>
            <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
              <Text>B</Text>
            </Box>
            <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
              <Text>C</Text>
            </Box>
          </Stack>
        </Box>
      ))}
    </Box>
  ),
};

/** Gap tokens from xxs to xxl — spacing between children grows with each step. */
export const GapSizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {GAPS.map((gap) => (
        <Box key={gap} gap="$xs">
          <Text size="sm" color="$color10">
            {gap}
          </Text>
          <Stack {...args} gap={gap} width={120} backgroundColor="$color3" padding="$sm">
            <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
              <Text>One</Text>
            </Box>
            <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
              <Text>Two</Text>
            </Box>
            <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
              <Text>Three</Text>
            </Box>
          </Stack>
        </Box>
      ))}
    </Box>
  ),
};

/** Centred layout — both align and justify set to "center" for a vertically and horizontally centred card-like pattern. */
export const Centered: Story = {
  render: (args) => (
    <Stack {...args} align="center" justify="center" height={280} backgroundColor="$color3">
      <Text>⭐</Text>
      <Text>Centred content</Text>
      <Text size="sm" color="$color10">
        align=center · justify=center
      </Text>
    </Stack>
  ),
};

/** Deeply nested Stacks illustrate how gap and alignment compose across levels. */
export const Nested: Story = {
  render: (args) => (
    <Stack {...args} gap="$lg" width={300} backgroundColor="$color3" padding="$md">
      <Text color="$color11">Outer Stack</Text>
      <Stack gap="$sm" backgroundColor="$color5" padding="$sm">
        <Text color="$color11">Inner Stack A</Text>
        <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
          <Text>Item 1</Text>
        </Box>
        <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
          <Text>Item 2</Text>
        </Box>
      </Stack>
      <Stack gap="$xs" backgroundColor="$color5" padding="$sm">
        <Text color="$color11">Inner Stack B (tight gap)</Text>
        <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
          <Text>Item 3</Text>
        </Box>
        <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
          <Text>Item 4</Text>
        </Box>
        <Box backgroundColor="$color7" padding="$xs" borderRadius="$sm">
          <Text>Item 5</Text>
        </Box>
      </Stack>
    </Stack>
  ),
};

/** A realistic form layout — stacked labels and inputs with a consistent gap. */
export const FormLayout: Story = {
  render: (args) => (
    <Stack {...args} gap="$md" width={320}>
      <Stack gap="$xs">
        <Text size="sm" color="$color11">
          Full name
        </Text>
        <Box
          backgroundColor="$color3"
          borderWidth={1}
          borderColor="$color7"
          borderRadius="$sm"
          padding="$sm"
        >
          <Text color="$color9">Jane Doe</Text>
        </Box>
      </Stack>
      <Stack gap="$xs">
        <Text size="sm" color="$color11">
          Email
        </Text>
        <Box
          backgroundColor="$color3"
          borderWidth={1}
          borderColor="$color7"
          borderRadius="$sm"
          padding="$sm"
        >
          <Text color="$color9">jane@example.com</Text>
        </Box>
      </Stack>
      <Stack gap="$xs">
        <Text size="sm" color="$color11">
          Message
        </Text>
        <Box
          backgroundColor="$color3"
          borderWidth={1}
          borderColor="$color7"
          borderRadius="$sm"
          padding="$sm"
          height={80}
        >
          <Text color="$color9">Hello…</Text>
        </Box>
      </Stack>
    </Stack>
  ),
};
