import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Autocomplete } from "./Autocomplete";

const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const FRAMEWORKS = ["React", "Vue", "Angular", "Svelte", "SolidJS", "Ember", "Preact"];

const GROUPED_DATA = [
  { group: "Frontend", items: ["React", "Vue", "Angular", "Svelte"] },
  { group: "Backend", items: ["Node.js", "Django", "Rails", "Laravel"] },
  { group: "Mobile", items: ["React Native", "Flutter", "Ionic"] },
];

const meta = {
  title: "Inputs/Autocomplete",
  component: Autocomplete,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Free-text input with a suggestion dropdown. Suggestions filter as the user types; selecting one fills the input. Built on `Combobox` + `InputBase`. Accent follows the active Tamagui theme.",
      },
    },
  },
  args: {
    data: FRAMEWORKS,
    placeholder: "Search frameworks…",
    size: "sm",
    disabled: false,
    clearable: false,
    openOnFocus: true,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, padding, radius and font size.",
    },
    disabled: { control: "boolean" },
    clearable: { control: "boolean" },
    openOnFocus: { control: "boolean", description: "Open dropdown when input is focused." },
    selectFirstOptionOnChange: {
      control: "boolean",
      description: "Highlight the first matching suggestion after each keystroke.",
    },
    autoSelectOnBlur: {
      control: "boolean",
      description: "Commit the highlighted suggestion when the input loses focus.",
    },
    limit: {
      control: "number",
      description: "Maximum number of suggestions shown at once.",
    },
    nothingFoundMessage: { control: "text" },
    placeholder: { control: "text" },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    value: { control: false },
    onChange: { control: false },
    renderOption: { control: false },
    filter: { control: false },
  },
} satisfies Meta<typeof Autocomplete>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Autocomplete>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All five sizes displayed side by side. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Autocomplete key={size} {...args} size={size} placeholder={size} />
      ))}
    </Box>
  ),
};

/**
 * Elevation via the shared `shadow` ladder — inherited from `Box`, so every
 * component accepts it; no shadow unless set.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Autocomplete key={shadow} {...args} shadow={shadow} placeholder={shadow} />
      ))}
    </Box>
  ),
};

/** Disabled state — input is inert and visually muted. */
export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: "Not available",
  },
};

/** Read-only — the value is shown and focusable but cannot be edited (distinct from disabled, no dimming). */
export const ReadOnly: Story = {
  args: {
    label: "Framework",
    description: "This value is locked and cannot be changed.",
    defaultValue: "React",
    readOnly: true,
  },
};

/** Theme accent — uses Tamagui theme instead of a Mantine-style color prop. */
export const Theme: Story = {
  args: {
    theme: "red",
    label: "Framework",
    defaultValue: "React",
    clearable: true,
  },
};

/** Clearable — a clear button appears once the input has a value. */
export const Clearable: Story = {
  args: {
    clearable: true,
    defaultValue: "React",
    placeholder: "Type to filter…",
  },
};

/** With a label, description and error message using InputBase adornments. */
export const WithLabelAndError: Story = {
  args: {
    label: "Framework",
    description: "Start typing to filter available frameworks.",
    error: "Please select a valid framework.",
    placeholder: "e.g. React",
  },
};

/** Grouped suggestions — data is provided as an array of `{ group, items }` objects. */
export const Grouped: Story = {
  args: {
    data: GROUPED_DATA,
    placeholder: "Search all technologies…",
    nothingFoundMessage: "No match found",
  },
};

/** Shows a "nothing found" message when no suggestion matches the typed text. */
export const NothingFound: Story = {
  args: {
    defaultValue: "Fortran",
    nothingFoundMessage: "No frameworks matched your search.",
  },
};

/** Controlled — value and onChange wired externally; selected value is shown below. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("Vue");
    return (
      <Box gap="$md" width={280}>
        <Autocomplete {...args} value={value} onChange={setValue} clearable />
        <Text>Selected: {value || <Text theme="gray">(empty)</Text>}</Text>
      </Box>
    );
  },
  args: {
    label: "Controlled autocomplete",
    placeholder: "Type to filter…",
  },
};

/** Custom renderOption — each suggestion shows a star icon alongside the label. */
export const CustomRenderOption: Story = {
  args: {
    renderOption: ({ option }) => (
      <Box flexDirection="row" gap="$sm" alignItems="center">
        <Text>⭐</Text>
        <Text>{option.label}</Text>
      </Box>
    ),
    placeholder: "Pick a starred framework…",
    nothingFoundMessage: "Nothing here",
  },
};

/** Per-slot `styles` targets individual parts — here the `trigger` field and `dropdown` surface. */
export const Styles: Story = {
  args: {
    placeholder: "Styled field…",
    defaultValue: "React",
    styles: {
      trigger: { backgroundColor: "$blue3" },
      dropdown: { backgroundColor: "$blue2", borderColor: "$blue7", borderWidth: 2 },
    },
  },
};
