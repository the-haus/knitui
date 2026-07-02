import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { List } from "./List";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Data Display/List",
  component: List,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "List is a vertical list composed from `List` + `List.Item`. `type` switches between unordered (bullet) and ordered (numbered) rendering. `size` scales item text, `spacing` controls the gap between items, `icon` replaces the default marker for all items (overridable per item), and `center` aligns markers with their labels.",
      },
    },
  },
  args: {
    type: "unordered",
    size: "md",
    center: false,
    withPadding: false,
    reversed: false,
  },
  argTypes: {
    type: {
      control: "inline-radio",
      options: ["unordered", "ordered"],
      description: "Semantic element and default marker style.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls item font size and line height.",
    },
    spacing: {
      control: "text",
      description: "Gap between items — Tamagui token (e.g. `$sm`) or number.",
    },
    center: {
      control: "boolean",
      description: "Vertically center each marker with its label.",
    },
    withPadding: {
      control: "boolean",
      description: "Adds inline-start padding for visual nesting.",
    },
    reversed: {
      control: "boolean",
      description: "Reverse the numbering in an ordered list.",
    },
    start: {
      control: "number",
      description: "Starting number for ordered lists.",
    },
    icon: { control: false },
  },
} satisfies Meta<typeof List>;

export default meta;

type Story = StoryObj<ComponentProps<typeof List>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <List {...args}>
      <List.Item>Apples</List.Item>
      <List.Item>Oranges</List.Item>
      <List.Item>Pears</List.Item>
    </List>
  ),
};

/** Seven sizes from xxs to xxl — item text scales accordingly. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="flex-start">
      {SIZES.map((size) => (
        <Box key={size} gap="$xs">
          <Text fontSize="$xs" color="$color11">
            {size}
          </Text>
          <List {...args} size={size}>
            <List.Item>Apples</List.Item>
            <List.Item>Oranges</List.Item>
            <List.Item>Pears</List.Item>
          </List>
        </Box>
      ))}
    </Box>
  ),
};

/** Unordered list uses bullet markers; ordered list uses auto-incremented numbers. */
export const OrderedVsUnordered: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          unordered
        </Text>
        <List {...args} type="unordered">
          <List.Item>Apples</List.Item>
          <List.Item>Oranges</List.Item>
          <List.Item>Pears</List.Item>
        </List>
      </Box>
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          ordered
        </Text>
        <List {...args} type="ordered">
          <List.Item>First step</List.Item>
          <List.Item>Second step</List.Item>
          <List.Item>Third step</List.Item>
        </List>
      </Box>
    </Box>
  ),
};

/** The inherited `shadow` elevation prop, from xs to xl. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} gap="$xs">
          <Text fontSize="$xs" color="$color11">
            {shadow}
          </Text>
          <List {...args} shadow={shadow} style={{ padding: 12 }}>
            <List.Item>Apples</List.Item>
            <List.Item>Oranges</List.Item>
            <List.Item>Pears</List.Item>
          </List>
        </Box>
      ))}
    </Box>
  ),
};

/** A list-level icon replaces the default bullet for every item; a per-item icon overrides only that item. */
export const WithIcons: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          list-level icon
        </Text>
        <List {...args} icon={<Text>⭐</Text>}>
          <List.Item>Starred item one</List.Item>
          <List.Item>Starred item two</List.Item>
          <List.Item>Starred item three</List.Item>
        </List>
      </Box>
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          per-item icon override
        </Text>
        <List {...args} icon={<Text>⭐</Text>}>
          <List.Item>Default star</List.Item>
          <List.Item icon={<Text>✅</Text>}>Overridden with checkmark</List.Item>
          <List.Item icon="★">Overridden with string glyph</List.Item>
        </List>
      </Box>
    </Box>
  ),
};

/** `spacing` controls the gap between items using Tamagui tokens. */
export const Spacing: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {(["$xs", "$sm", "$md", "$lg"] as const).map((spacing) => (
        <Box key={spacing} gap="$xs">
          <Text fontSize="$xs" color="$color11">
            {spacing}
          </Text>
          <List {...args} spacing={spacing}>
            <List.Item>Apples</List.Item>
            <List.Item>Oranges</List.Item>
            <List.Item>Pears</List.Item>
          </List>
        </Box>
      ))}
    </Box>
  ),
};

/** `center` aligns the marker vertically with the label — useful for multi-line items or icon markers. */
export const CenteredMarkers: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          center=false (top-aligned)
        </Text>
        <List {...args} center={false} spacing="$sm" style={{ maxWidth: 220 }}>
          <List.Item>Short item</List.Item>
          <List.Item>
            A longer item that wraps onto multiple lines so the alignment difference is visible
          </List.Item>
        </List>
      </Box>
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          center=true (vertically centered)
        </Text>
        <List {...args} center spacing="$sm" style={{ maxWidth: 220 }}>
          <List.Item>Short item</List.Item>
          <List.Item>
            A longer item that wraps onto multiple lines so the alignment difference is visible
          </List.Item>
        </List>
      </Box>
    </Box>
  ),
};

/** Ordered list with `start` and `reversed` — numbering starts at 5 and counts down. */
export const OrderedStartAndReversed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          start=5
        </Text>
        <List {...args} type="ordered" start={5}>
          <List.Item>Fifth</List.Item>
          <List.Item>Sixth</List.Item>
          <List.Item>Seventh</List.Item>
        </List>
      </Box>
      <Box gap="$xs">
        <Text fontSize="$xs" color="$color11">
          reversed
        </Text>
        <List {...args} type="ordered" reversed>
          <List.Item>Third (rendered first)</List.Item>
          <List.Item>Second</List.Item>
          <List.Item>First (rendered last)</List.Item>
        </List>
      </Box>
    </Box>
  ),
};

/** `withPadding` adds inline-start padding, useful for visually nested sub-lists. */
export const NestedWithPadding: Story = {
  render: (args) => (
    <List {...args} spacing="$xs">
      <List.Item>Fruits</List.Item>
      <List withPadding spacing="$xs">
        <List.Item>Apples</List.Item>
        <List.Item>Oranges</List.Item>
      </List>
      <List.Item>Vegetables</List.Item>
      <List withPadding spacing="$xs">
        <List.Item>Carrots</List.Item>
        <List.Item>Broccoli</List.Item>
      </List>
    </List>
  ),
};

/** Per-slot `styles` targets individual parts of each item — here the `marker` and `label`. */
export const Styles: Story = {
  render: (args) => (
    <List {...args}>
      <List.Item
        styles={{ marker: { color: "$red9" }, label: { color: "$blue9", fontWeight: "700" } }}
      >
        Apples
      </List.Item>
      <List.Item
        styles={{ marker: { color: "$red9" }, label: { color: "$blue9", fontWeight: "700" } }}
      >
        Oranges
      </List.Item>
      <List.Item
        styles={{ marker: { color: "$red9" }, label: { color: "$blue9", fontWeight: "700" } }}
      >
        Pears
      </List.Item>
    </List>
  ),
};
