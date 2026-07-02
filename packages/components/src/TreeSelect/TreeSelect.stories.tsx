import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { type TreeNodeData } from "../Tree";
import { TreeSelect } from "./TreeSelect";

/* -------------------------------------------------------------------------- */
/* Shared sample data                                                          */
/* -------------------------------------------------------------------------- */

const FOOD_DATA: TreeNodeData[] = [
  {
    value: "fruit",
    label: "Fruit",
    children: [
      { value: "apple", label: "Apple" },
      { value: "banana", label: "Banana" },
      {
        value: "citrus",
        label: "Citrus",
        children: [
          { value: "lemon", label: "Lemon" },
          { value: "orange", label: "Orange" },
        ],
      },
    ],
  },
  {
    value: "vegetables",
    label: "Vegetables",
    children: [
      { value: "carrot", label: "Carrot" },
      { value: "broccoli", label: "Broccoli" },
    ],
  },
  { value: "dairy", label: "Dairy" },
];

const GEO_DATA: TreeNodeData[] = [
  {
    value: "europe",
    label: "Europe",
    children: [
      { value: "netherlands", label: "Netherlands" },
      { value: "germany", label: "Germany" },
      { value: "france", label: "France" },
    ],
  },
  {
    value: "americas",
    label: "Americas",
    children: [
      { value: "usa", label: "United States" },
      { value: "canada", label: "Canada" },
    ],
  },
  { value: "asia", label: "Asia" },
];

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

/* -------------------------------------------------------------------------- */
/* Meta                                                                        */
/* -------------------------------------------------------------------------- */

const meta = {
  title: "Data Display/TreeSelect",
  component: TreeSelect,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "TreeSelect renders a hierarchical tree of nodes inside a `Combobox` dropdown. Clicking a leaf selects it and closes the dropdown; clicking a branch toggles expansion. Supports uncontrolled and controlled modes, optional search filtering, and a clear button.",
      },
    },
  },
  args: {
    data: FOOD_DATA,
    placeholder: "Pick a food…",
    size: "sm",
    clearable: false,
    searchable: false,
    disabled: false,
    allowDeselect: true,
    expandOnClick: true,
    withScrollArea: true,
    maxDropdownHeight: 250,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Control size — matches InputBase / Combobox size tokens.",
    },
    clearable: { control: "boolean" },
    searchable: { control: "boolean" },
    disabled: { control: "boolean" },
    allowDeselect: { control: "boolean" },
    expandOnClick: { control: "boolean" },
    withScrollArea: { control: "boolean" },
    maxDropdownHeight: { control: "number" },
    placeholder: { control: "text" },
    nothingFoundMessage: { control: "text" },
    value: { control: false },
    defaultValue: { control: false },
    onChange: { control: false },
    onClear: { control: false },
    tree: { control: false },
    comboboxProps: { control: false },
    clearButtonProps: { control: false },
  },
} satisfies Meta<typeof TreeSelect>;

export default meta;

type Story = StoryObj<ComponentProps<typeof TreeSelect>>;

/* -------------------------------------------------------------------------- */
/* Stories                                                                     */
/* -------------------------------------------------------------------------- */

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All seven sizes rendered side by side for quick visual comparison. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <TreeSelect key={size} {...args} size={size} placeholder={size} />
      ))}
    </Box>
  ),
};

/** The shadow elevation prop, inherited from Box, across all token levels. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SHADOWS.map((shadow) => (
        <TreeSelect key={shadow} {...args} shadow={shadow} placeholder={shadow} />
      ))}
    </Box>
  ),
};

/** Accent follows the Tamagui theme prop, not a Mantine-style color prop. */
export const Theme: Story = {
  args: { theme: "green", defaultValue: "dairy", clearable: true },
};

/** Disabled state — the input is inert and the dropdown cannot be opened. */
export const Disabled: Story = {
  args: { disabled: true, defaultValue: "apple" },
};

/** Read-only — the selected value is visible but locked; the dropdown does not open. */
export const ReadOnly: Story = {
  args: { readOnly: true, defaultValue: "apple" },
};

/** Pre-selected value supplied via `defaultValue` (uncontrolled). */
export const DefaultValue: Story = {
  args: { defaultValue: "banana", placeholder: "Pick a food…" },
};

/** Typing in the input filters the tree to matching nodes only. */
export const Searchable: Story = {
  args: {
    searchable: true,
    placeholder: "Search foods…",
    nothingFoundMessage: "No match",
  },
};

/** Shows a clear button next to the chevron when a value is selected. */
export const Clearable: Story = {
  args: { clearable: true, defaultValue: "carrot" },
};

/** A deep tree — three levels of nesting — shows nested expand/collapse. */
export const DeepTree: Story = {
  args: {
    data: GEO_DATA,
    placeholder: "Pick a location…",
    clearable: true,
    searchable: true,
  },
};

/** Fully controlled selection — selection state is owned by the parent. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string | null>(null);
    return (
      <Box gap="$md" alignItems="flex-start">
        <TreeSelect
          {...args}
          value={value}
          onChange={(next) => setValue(next)}
          clearable
          placeholder="Pick a food…"
        />
        <Text fontSize="$sm" color="$color10">
          Selected value: {value ?? <Text color="$color8">none</Text>}
        </Text>
      </Box>
    );
  },
};

/** `allowDeselect={false}` — pressing an already-selected node does not clear it. */
export const NoDeselect: Story = {
  args: {
    allowDeselect: false,
    defaultValue: "dairy",
    placeholder: "Cannot deselect",
  },
};

/** Per-slot `styles` targets individual parts — here the `trigger` and `chevron`. */
export const Styles: Story = {
  args: {
    defaultValue: "apple",
    styles: {
      trigger: { borderColor: "$blue7", borderWidth: 2 },
      chevron: { color: "$blue9" },
    },
  },
};
