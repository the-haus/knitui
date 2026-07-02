import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { TagsInput } from "./TagsInput";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const FRUITS = ["Apple", "Banana", "Cherry", "Date", "Elderberry", "Fig", "Grape"];

const meta = {
  title: "Inputs/TagsInput",
  component: TagsInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Free-text tags input built on `Combobox` + `PillsInput`. Tags are committed on `Enter`, a split character (default `,`), or blur, and render as removable `Pill`s. Optionally accepts `data` suggestions shown in a dropdown.",
      },
    },
  },
  args: {
    placeholder: "Add tag…",
    size: "sm",
    disabled: false,
    readOnly: false,
    clearable: false,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, padding, and font size of the input and pills.",
    },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    clearable: { control: "boolean" },
    placeholder: { control: "text" },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    maxTags: { control: "number" },
    allowDuplicates: { control: "boolean" },
    nothingFoundMessage: { control: "text" },
  },
} satisfies Meta<typeof TagsInput>;

export default meta;

type Story = StoryObj<ComponentProps<typeof TagsInput>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All seven sizes rendered side by side so metrics can be compared at a glance. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md">
      {SIZES.map((size) => (
        <TagsInput
          key={size}
          {...args}
          size={size}
          label={size}
          defaultValue={[size]}
          placeholder="Add tag…"
        />
      ))}
    </Box>
  ),
};

/** The shadow elevation prop, inherited from Box, across all token levels. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$md">
      {SHADOWS.map((shadow) => (
        <TagsInput
          key={shadow}
          {...args}
          shadow={shadow}
          label={shadow}
          defaultValue={[shadow]}
          placeholder="Add tag…"
        />
      ))}
    </Box>
  ),
};

/** Disabled state — the field and remove buttons are inert. */
export const Disabled: Story = {
  args: {
    disabled: true,
    label: "Disabled",
    defaultValue: ["alpha", "beta"],
  },
};

/** Read-only state — the dropdown opens but tags cannot be added or removed. */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    label: "Read-only",
    defaultValue: ["alpha", "beta"],
  },
};

/** With label, description, and inline error message to verify field chrome. */
export const WithFieldChrome: Story = {
  args: {
    label: "Interests",
    description: "Add up to five topics that interest you.",
    error: "At least one tag is required.",
    placeholder: "Add interest…",
  },
};

/** Suggestions dropdown — type to filter; pick an option to add it as a tag. */
export const WithSuggestions: Story = {
  args: {
    label: "Favourite fruits",
    placeholder: "Type or pick a fruit…",
    data: FRUITS,
    nothingFoundMessage: "No matching fruit",
  },
};

/** Clearable — shows an × button when at least one tag is present. */
export const Clearable: Story = {
  args: {
    clearable: true,
    label: "Tags",
    defaultValue: ["one", "two", "three"],
  },
};

/** Maximum tags — adding more than `maxTags` is silently ignored. */
export const MaxTags: Story = {
  args: {
    maxTags: 3,
    label: "Up to 3 tags",
    description: "You cannot add more than 3 tags.",
    defaultValue: ["alpha", "beta"],
    placeholder: "One more allowed…",
  },
};

/** Controlled — the parent owns the tag list and wires onChange. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string[]>(["react", "tamagui"]);
    return (
      <Box gap="$md">
        <TagsInput
          {...args}
          label="Controlled tags"
          value={value}
          onChange={setValue}
          placeholder="Add tag…"
        />
        <Text>Current value: {value.join(", ") || "(empty)"}</Text>
      </Box>
    );
  },
};

/** Per-slot `styles` targets individual parts — here the `pill` and `trigger`. */
export const Styles: Story = {
  args: {
    label: "Styled tags",
    defaultValue: ["alpha", "beta", "gamma"],
    placeholder: "Add tag…",
    styles: {
      pill: { backgroundColor: "$blue3" },
      trigger: { borderColor: "$blue7" },
    },
  },
};
