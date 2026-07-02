import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Flex } from "./Flex";

const DIRECTIONS = ["row", "row-reverse", "column", "column-reverse"] as const;
const ALIGNS = ["flex-start", "center", "flex-end", "stretch", "baseline"] as const;
const JUSTIFIES = [
  "flex-start",
  "center",
  "flex-end",
  "space-between",
  "space-around",
  "space-evenly",
] as const;
const WRAPS = ["nowrap", "wrap", "wrap-reverse"] as const;

/** A reusable colored box child for layout demos. */
function Item({ label }: { label: string }) {
  return (
    <Box
      backgroundColor="$blue5"
      padding="$sm"
      borderRadius="$sm"
      minWidth="$xxl"
      alignItems="center"
    >
      <Text color="$blue11" fontSize="$sm" fontWeight="600">
        {label}
      </Text>
    </Box>
  );
}

const meta = {
  title: "Layout/Flex",
  component: Flex,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Flex is a flexbox layout primitive that mirrors Mantine's `Flex`. It exposes named flex props (`align`, `justify`, `wrap`, `direction`) as well as `gap`, `rowGap`, and `columnGap` inherited from `Box`.",
      },
    },
  },
  args: {
    direction: "row",
    align: "flex-start",
    justify: "flex-start",
    wrap: "nowrap",
    gap: "$md",
  },
  argTypes: {
    direction: {
      control: "select",
      options: DIRECTIONS,
      description: "Main-axis direction (maps to `flexDirection`).",
    },
    align: {
      control: "select",
      options: ALIGNS,
      description: "Cross-axis alignment of items (`alignItems`).",
    },
    justify: {
      control: "select",
      options: JUSTIFIES,
      description: "Main-axis distribution of items (`justifyContent`).",
    },
    wrap: {
      control: "select",
      options: WRAPS,
      description: "Whether items wrap onto multiple lines (`flexWrap`).",
    },
    gap: {
      control: "select",
      options: ["$xs", "$sm", "$md", "$lg", "$xl"],
      description: "Gap between flex items (Tamagui token).",
    },
    rowGap: {
      control: "select",
      options: [undefined, "$xs", "$sm", "$md", "$lg", "$xl"],
      description: "Row gap override when items wrap.",
    },
    columnGap: {
      control: "select",
      options: [undefined, "$xs", "$sm", "$md", "$lg", "$xl"],
      description: "Column gap override.",
    },
  },
} satisfies Meta<typeof Flex>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Flex>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Flex {...args}>
      <Item label="One" />
      <Item label="Two" />
      <Item label="Three" />
    </Flex>
  ),
};

/** All four `direction` values — row, row-reverse, column, column-reverse. */
export const Directions: Story = {
  args: {
    direction: "column",
  },

  render: () => (
    <Box gap="$lg">
      {DIRECTIONS.map((direction) => (
        <Box key={direction} gap="$xs">
          <Text fontSize="$sm" color="$color10">
            direction="{direction}"
          </Text>
          <Flex direction={direction} gap="$sm">
            <Item label="A" />
            <Item label="B" />
            <Item label="C" />
          </Flex>
        </Box>
      ))}
    </Box>
  ),
};

/** The `align` prop controls cross-axis alignment; shown in a fixed-height container. */
export const Alignment: Story = {
  render: () => (
    <Box gap="$lg">
      {ALIGNS.map((align) => (
        <Box key={align} gap="$xs">
          <Text fontSize="$sm" color="$color10">
            align="{align}"
          </Text>
          <Flex
            align={align}
            direction="row"
            gap="$sm"
            minHeight="$xxl"
            backgroundColor="$color3"
            borderRadius="$sm"
          >
            <Item label="Short" />
            <Box
              backgroundColor="$blue5"
              padding="$sm"
              borderRadius="$sm"
              minWidth="$xxl"
              height="$xl"
              alignItems="center"
              justifyContent="center"
            >
              <Text color="$blue11" fontSize="$sm" fontWeight="600">
                Tall
              </Text>
            </Box>
            <Item label="Short" />
          </Flex>
        </Box>
      ))}
    </Box>
  ),
};

/** The `justify` prop distributes items along the main axis. */
export const Justification: Story = {
  render: () => (
    <Box gap="$lg" width={400}>
      {JUSTIFIES.map((justify) => (
        <Box key={justify} gap="$xs">
          <Text fontSize="$sm" color="$color10">
            justify="{justify}"
          </Text>
          <Flex
            justify={justify}
            direction="row"
            gap="$sm"
            backgroundColor="$color3"
            borderRadius="$sm"
            padding="$xs"
          >
            <Item label="A" />
            <Item label="B" />
            <Item label="C" />
          </Flex>
        </Box>
      ))}
    </Box>
  ),
};

/** `wrap="wrap"` allows items to flow onto multiple lines when space is tight. */
export const Wrapping: Story = {
  render: () => (
    <Box gap="$lg">
      {WRAPS.map((wrap) => (
        <Box key={wrap} gap="$xs">
          <Text fontSize="$sm" color="$color10">
            wrap="{wrap}"
          </Text>
          <Flex
            wrap={wrap}
            direction="row"
            gap="$sm"
            width={220}
            backgroundColor="$color3"
            borderRadius="$sm"
            padding="$xs"
          >
            {["One", "Two", "Three", "Four", "Five"].map((label) => (
              <Item key={label} label={label} />
            ))}
          </Flex>
        </Box>
      ))}
    </Box>
  ),
};

/** `gap`, `rowGap`, and `columnGap` use Tamagui spacing tokens. */
export const GapTokens: Story = {
  render: () => (
    <Box gap="$lg">
      {(["$xs", "$sm", "$md", "$lg", "$xl"] as const).map((token) => (
        <Box key={token} gap="$xs">
          <Text fontSize="$sm" color="$color10">
            gap="{token}"
          </Text>
          <Flex direction="row" gap={token} wrap="wrap">
            <Item label="A" />
            <Item label="B" />
            <Item label="C" />
            <Item label="D" />
          </Flex>
        </Box>
      ))}
    </Box>
  ),
};

/** Flex composes naturally with `Box` children of varying sizes for real-world layouts. */
export const ComposedLayout: Story = {
  render: () => (
    <Flex direction="column" gap="$md" width={360}>
      <Flex direction="row" justify="space-between" align="center" gap="$sm">
        <Box backgroundColor="$blue5" padding="$sm" borderRadius="$sm" flex={1} alignItems="center">
          <Text color="$blue11" fontWeight="600">
            Nav
          </Text>
        </Box>
        <Box
          backgroundColor="$green5"
          padding="$sm"
          borderRadius="$sm"
          flex={2}
          alignItems="center"
        >
          <Text color="$green11" fontWeight="600">
            Content
          </Text>
        </Box>
        <Box backgroundColor="$blue5" padding="$sm" borderRadius="$sm" flex={1} alignItems="center">
          <Text color="$blue11" fontWeight="600">
            Aside
          </Text>
        </Box>
      </Flex>
      <Flex direction="row" wrap="wrap" gap="$sm" justify="center">
        {["Card 1", "Card 2", "Card 3", "Card 4", "Card 5"].map((label) => (
          <Box
            key={label}
            backgroundColor="$color3"
            padding="$sm"
            borderRadius="$sm"
            minWidth="$xxl"
            alignItems="center"
          >
            <Text fontSize="$sm">{label}</Text>
          </Box>
        ))}
      </Flex>
    </Flex>
  ),
};
