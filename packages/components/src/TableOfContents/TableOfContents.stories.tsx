import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { TableOfContents } from "./TableOfContents";

const VARIANTS = ["filled", "light", "none"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;
const DEPTH_OFFSETS = ["$xxs", "$xs", "$sm", "$md", "$lg", "$xl", "$xxl"] as const;

const SAMPLE_DATA = [
  { value: "Introduction", depth: 1 },
  { value: "Getting Started", depth: 1 },
  { value: "Installation", depth: 2 },
  { value: "Configuration", depth: 2 },
  { value: "Basic Usage", depth: 3 },
  { value: "Advanced Topics", depth: 1 },
  { value: "API Reference", depth: 2 },
];

const FLAT_DATA = [
  { value: "Overview", depth: 1 },
  { value: "Features", depth: 1 },
  { value: "Examples", depth: 1 },
  { value: "FAQ", depth: 1 },
];

const meta = {
  title: "Navigation/TableOfContents",
  component: TableOfContents,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "TableOfContents renders a list of heading entries as pressable controls. It supports controlled and uncontrolled active state, depth-based indentation, three visual variants, and seven sizes. Pass `data` (or the alias `initialData`) as an array of `{ value, depth }` objects.",
      },
    },
  },
  args: {
    data: SAMPLE_DATA,
    variant: "light",
    size: "md",
    defaultActive: 0,
    depthOffset: "$lg",
    minDepthToOffset: 1,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description: "Active-item highlight style.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls font-size and padding of every control.",
    },
    defaultActive: {
      control: { type: "number", min: -1, max: 6 },
      description: "Uncontrolled initial active index (-1 = none).",
    },
    depthOffset: {
      control: "select",
      options: DEPTH_OFFSETS,
      description: "Left-padding added per depth level.",
    },
    minDepthToOffset: {
      control: { type: "number", min: 1, max: 3 },
      description: "Minimum depth that starts receiving the offset.",
    },
    data: { control: false },
    active: { control: false },
    onChange: { control: false },
    getControlProps: { control: false },
  },
} satisfies Meta<typeof TableOfContents>;

export default meta;

type Story = StoryObj<ComponentProps<typeof TableOfContents>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All three visual variants of the active-item highlight, side by side. */
export const Variants: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {VARIANTS.map((variant) => (
        <Box key={variant} gap="$xs">
          <Text fontWeight="600" size="xs" color="$color10">
            {variant}
          </Text>
          <TableOfContents {...args} variant={variant} defaultActive={0} width={200} />
        </Box>
      ))}
    </Box>
  ),
};

/** The seven sizes from xxs to xxl, all using the same data. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {SIZES.map((size) => (
        <Box key={size} gap="$xs">
          <Text fontWeight="600" size="xs" color="$color10">
            {size}
          </Text>
          <TableOfContents {...args} size={size} defaultActive={0} data={FLAT_DATA} width={160} />
        </Box>
      ))}
    </Box>
  ),
};

/** The shadow elevation prop, inherited from Box, across all token levels. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} gap="$xs">
          <Text fontWeight="600" size="xs" color="$color10">
            {shadow}
          </Text>
          <TableOfContents
            {...args}
            shadow={shadow}
            defaultActive={0}
            data={FLAT_DATA}
            width={160}
          />
        </Box>
      ))}
    </Box>
  ),
};

/** Controlled active index — the parent drives which heading is highlighted. */
export const Controlled: Story = {
  render: (args) => {
    const [active, setActive] = React.useState(0);
    return (
      <Box gap="$md" alignItems="flex-start">
        <Text color="$color11" size="sm">
          Active index: <Text fontWeight="600">{active}</Text>
        </Text>
        <TableOfContents {...args} active={active} onChange={setActive} width={260} />
      </Box>
    );
  },
};

/** Deeply nested headings — shows how depthOffset and minDepthToOffset affect indentation. */
export const DeepNesting: Story = {
  args: {
    data: [
      { value: "Chapter 1", depth: 1 },
      { value: "Section 1.1", depth: 2 },
      { value: "Subsection 1.1.1", depth: 3 },
      { value: "Paragraph", depth: 4 },
      { value: "Chapter 2", depth: 1 },
      { value: "Section 2.1", depth: 2 },
    ],
    depthOffset: "$xl",
    minDepthToOffset: 1,
    defaultActive: 2,
    width: 280,
  },
};

/** No active selection — defaultActive is -1 so nothing is highlighted on mount. */
export const NoInitialActive: Story = {
  args: {
    defaultActive: -1,
    data: FLAT_DATA,
    width: 220,
  },
};

/** Custom control content via getControlProps — adds an icon prefix to each entry. */
export const CustomControlProps: Story = {
  args: {
    data: SAMPLE_DATA,
    defaultActive: 1,
    width: 260,
    getControlProps: ({ data: item }) => ({
      children: (
        <Text size="sm" color="$color11">
          <Text>⭐ </Text>
          {item.value}
        </Text>
      ),
    }),
  },
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$xl">
      {VARIANTS.map((variant) => (
        <Box key={variant} gap="$sm">
          <Text fontWeight="700" size="xs" color="$color10">
            variant="{variant}"
          </Text>
          <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
            {SIZES.map((size) => (
              <Box key={size} gap="$xs">
                <Text size="xxs" color="$color9">
                  size="{size}"
                </Text>
                <TableOfContents
                  variant={variant}
                  size={size}
                  defaultActive={0}
                  data={FLAT_DATA}
                  width={150}
                />
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `control` and `text`. */
export const Styles: Story = {
  args: {
    data: SAMPLE_DATA,
    defaultActive: 1,
    width: 260,
    styles: {
      control: { borderColor: "$blue7", borderWidth: 2 },
      text: { color: "$red9", fontWeight: "700" },
    },
  },
};

/** Accent color comes from Tamagui theme, not a public color prop. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {(["blue", "green", "red"] as const).map((theme) => (
        <Box key={theme} gap="$xs">
          <Text fontWeight="600" size="xs" color="$color10">
            theme="{theme}"
          </Text>
          <TableOfContents
            {...args}
            theme={theme}
            variant="filled"
            defaultActive={0}
            data={FLAT_DATA}
            width={180}
          />
        </Box>
      ))}
    </Box>
  ),
};
