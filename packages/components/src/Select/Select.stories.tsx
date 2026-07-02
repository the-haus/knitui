import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Select } from "./Select";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const FRUITS = ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"];

const GROUPED_DATA = [
  {
    group: "Fruits",
    items: ["Apple", "Banana", "Cherry"],
  },
  {
    group: "Vegetables",
    items: ["Artichoke", "Broccoli", "Carrot"],
  },
];

const LABELED_DATA = [
  { value: "apple", label: "Apple" },
  { value: "banana", label: "Banana" },
  { value: "cherry", label: "Cherry" },
  { value: "date", label: "Date" },
  { value: "elderberry", label: "Elderberry", disabled: true },
  { value: "fig", label: "Fig" },
  { value: "grape", label: "Grape" },
];

const meta = {
  title: "Inputs/Select",
  component: Select,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Select is a single-value dropdown built on `Combobox` + `InputBase`. It supports plain strings, `{ value, label, disabled }` objects, and grouped data. Enable `searchable` to filter options by typing. The `clearable` prop adds a clear button when a value is selected. Keyboard navigation (Arrow/Enter/Escape) works on web.",
      },
    },
  },
  args: {
    data: FRUITS,
    placeholder: "Pick a fruit",
    size: "sm",
    disabled: false,
    searchable: false,
    clearable: false,
    allowDeselect: true,
    withCheckIcon: true,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, padding, radius and font size.",
    },
    disabled: { control: "boolean" },
    searchable: {
      control: "boolean",
      description: "Allow filtering options by typing into the input.",
    },
    clearable: {
      control: "boolean",
      description: "Show a clear button when a value is selected.",
    },
    allowDeselect: {
      control: "boolean",
      description: "Deselect the current value by picking it again.",
    },
    withCheckIcon: {
      control: "boolean",
      description: "Show a check icon next to the selected option.",
    },
    checkIconPosition: {
      control: "inline-radio",
      options: ["left", "right"],
    },
    placeholder: { control: "text" },
    nothingFoundMessage: { control: "text" },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    data: { control: false },
  },
} satisfies Meta<typeof Select>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Select>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All seven sizes shown side by side. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Select key={size} {...args} size={size} placeholder={size} />
      ))}
    </Box>
  ),
};

/** Elevation shadow ladder applied via the inherited `shadow` prop. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Select key={shadow} {...args} shadow={shadow} placeholder={shadow} />
      ))}
    </Box>
  ),
};

/** Disabled state — the input is non-interactive and visually muted. */
export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: "Banana",
  },
};

/** Read-only — the selected value is visible but locked; the dropdown does not open. */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: "Banana",
  },
};

/** Clearable — shows a clear button when a value is selected. */
export const Clearable: Story = {
  args: {
    clearable: true,
    defaultValue: "Apple",
  },
};

/** Searchable — type to filter the option list in real time. */
export const Searchable: Story = {
  args: {
    searchable: true,
    nothingFoundMessage: "No match",
    data: FRUITS,
    placeholder: "Search fruits…",
  },
};

/** Grouped data — options organised under labelled group headings. */
export const Grouped: Story = {
  args: {
    data: GROUPED_DATA,
    placeholder: "Pick a vegetable or fruit",
  },
};

/** Disabled option — one entry in the list is non-selectable. */
export const WithDisabledOption: Story = {
  args: {
    data: LABELED_DATA,
    placeholder: "Elderberry is disabled",
  },
};

/** With label, description and error — demonstrates full InputBase field chrome. */
export const WithFieldChrome: Story = {
  args: {
    label: "Favourite fruit",
    description: "We will use this for personalised recipes.",
    error: "Please pick a fruit.",
    placeholder: "Pick a fruit",
    data: FRUITS,
  },
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
};

/** Controlled — the selected value is owned by the parent component. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string | null>(null);
    return (
      <Box gap="$sm" width={280}>
        <Select
          {...args}
          value={value}
          onChange={(next) => setValue(next)}
          clearable
          placeholder="Pick a fruit"
        />
        <Text fontSize="$xs" color="$color11">
          selected: {value ?? "none"}
        </Text>
      </Box>
    );
  },
};

/** All seven sizes stacked to compare metrics at a glance. */
export const SizeStack: Story = {
  render: (args) => (
    <Box gap="$md" width={280}>
      {SIZES.map((size) => (
        <Select key={size} {...args} size={size} placeholder={size} />
      ))}
    </Box>
  ),
};

/** Loading state — a spinner replaces the chevron; position via `loadingPosition`. */
export const Loading: Story = {
  render: (args) => (
    <Box gap="$sm" width={280}>
      <Select {...args} label="Loading right" loading loadingPosition="right" />
      <Select {...args} label="Loading left" loading loadingPosition="left" />
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `trigger` field and the `dropdown`. */
export const Styles: Story = {
  args: {
    data: FRUITS,
    placeholder: "Pick a fruit",
    styles: {
      trigger: { backgroundColor: "$blue3", borderColor: "$blue7" },
      dropdown: { backgroundColor: "$blue2" },
    },
  },
};
