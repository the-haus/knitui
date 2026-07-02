import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { MultiSelect } from "./MultiSelect";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const FRAMEWORKS = ["React", "Vue", "Svelte", "Angular", "Solid", "Qwik", "Ember"];

const GROUPED_DATA = [
  {
    group: "Frontend",
    items: ["React", "Vue", "Svelte", "Angular"],
  },
  {
    group: "Backend",
    items: ["Node.js", "Deno", "Bun", "Express"],
  },
  {
    group: "Fullstack",
    items: ["Next.js", "Nuxt", "SvelteKit", "Remix"],
  },
];

const meta = {
  title: "Inputs/MultiSelect",
  component: MultiSelect,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "MultiSelect renders selected values as removable pills inside a `PillsInput`, backed by a `Combobox` dropdown. It supports controlled/uncontrolled values, search, grouped options, a max-values cap, and a clear button. Accent follows the active Tamagui theme via the palette ramp.",
      },
    },
  },
  args: {
    data: FRAMEWORKS,
    placeholder: "Pick a framework",
    size: "sm",
    searchable: false,
    clearable: false,
    disabled: false,
    readOnly: false,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Control size — height, padding, radius and font size.",
    },
    searchable: {
      control: "boolean",
      description: "Allow filtering options by typing into the field.",
    },
    clearable: {
      control: "boolean",
      description: "Show a clear button when at least one value is selected.",
    },
    disabled: { control: "boolean" },
    readOnly: { control: "boolean" },
    placeholder: { control: "text" },
    maxValues: {
      control: { type: "number", min: 1 },
      description: "Maximum number of values that can be selected.",
    },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    nothingFoundMessage: { control: "text" },
    withCheckIcon: { control: "boolean" },
    hidePickedOptions: { control: "boolean" },
    data: { control: false },
    value: { control: false },
    defaultValue: { control: false },
    onChange: { control: false },
    renderOption: { control: false },
    renderPill: { control: false },
  },
} satisfies Meta<typeof MultiSelect>;

export default meta;

type Story = StoryObj<ComponentProps<typeof MultiSelect>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string[]>([]);
    return <MultiSelect {...args} value={value} onChange={setValue} />;
  },
};

/** The seven sizes side by side with a pre-selected value so pills are visible. */
export const Sizes: Story = {
  render: (args) => {
    const [values, setValues] = React.useState<Record<string, string[]>>({
      xxs: ["React"],
      xs: ["React"],
      sm: ["React"],
      md: ["React"],
      lg: ["React"],
      xl: ["React"],
      xxl: ["React"],
    });
    return (
      <Box gap="$lg">
        {SIZES.map((size) => (
          <MultiSelect
            key={size}
            {...args}
            size={size}
            label={size}
            value={values[size]}
            onChange={(v) => setValues((prev) => ({ ...prev, [size]: v }))}
            placeholder="Pick a framework"
          />
        ))}
      </Box>
    );
  },
};

/** Each elevation of the inherited `shadow` prop applied to the field frame. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$xl">
      {SHADOWS.map((shadow) => (
        <MultiSelect
          key={shadow}
          {...args}
          shadow={shadow}
          label={shadow}
          defaultValue={["React"]}
          placeholder="Pick a framework"
        />
      ))}
    </Box>
  ),
};

/** Disabled state — pills render but the dropdown cannot be opened and values cannot change. */
export const Disabled: Story = {
  args: {
    disabled: true,
    defaultValue: ["React", "Vue"],
    label: "Frameworks",
  },
};

/** ReadOnly mode — the dropdown opens but selecting and removing values is not possible. */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    defaultValue: ["React", "Svelte"],
    label: "Frameworks (read-only)",
  },
};

/** Searchable — the field accepts keyboard input to filter the options list. */
export const Searchable: Story = {
  args: {
    searchable: true,
    nothingFoundMessage: "Nothing found",
    label: "Search frameworks",
    placeholder: "Type to filter…",
  },
};

/** Clearable — a clear button appears once at least one value is selected. */
export const Clearable: Story = {
  args: {
    clearable: true,
    defaultValue: ["React", "Vue"],
    label: "Clearable",
  },
};

/** MaxValues — limits selection to two items; onMaxValues fires when the cap is hit. */
export const MaxValues: Story = {
  args: {
    maxValues: 2,
    label: "Pick up to 2",
    description: "You can select at most 2 frameworks.",
    nothingFoundMessage: "Limit reached",
  },
};

/** Grouped options — data contains `{ group, items }` entries rendered under section headers. */
export const Grouped: Story = {
  args: {
    data: GROUPED_DATA,
    searchable: true,
    placeholder: "Pick from groups",
    label: "Tech stack",
    nothingFoundMessage: "Nothing found",
  },
};

/** WithLabel — label, description and error props attach accessible text around the field. */
export const WithLabel: Story = {
  args: {
    label: "Frameworks",
    description: "Choose the frameworks used in this project.",
    error: "At least one framework is required.",
    defaultValue: [],
    placeholder: "Pick a framework",
  },
};

/** HidePickedOptions — already-selected values disappear from the dropdown. */
export const HidePickedOptions: Story = {
  args: {
    hidePickedOptions: true,
    searchable: true,
    defaultValue: ["React"],
    label: "Pick remaining",
    placeholder: "Already picked options are hidden",
  },
};

/** CustomRenderOption — each option renders with a custom icon alongside its label. */
export const CustomRenderOption: Story = {
  args: {
    label: "Custom options",
    renderOption: ({ option }) => (
      <Box flexDirection="row" gap="$sm" alignItems="center">
        <Text>⭐</Text>
        <Text>{option.label}</Text>
      </Box>
    ),
  },
};

/** Per-slot `styles` targets individual parts — here the `pill` chips and the dropdown `option` rows. */
export const Styles: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string[]>(["React", "Vue"]);
    return (
      <MultiSelect
        {...args}
        value={value}
        onChange={setValue}
        label="Styled MultiSelect"
        defaultDropdownOpened
        styles={{
          pill: { backgroundColor: "$blue4" },
          option: { backgroundColor: "$red3" },
        }}
      />
    );
  },
};

/** Controlled — value and onChange are wired to React state; pills reflect external state. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string[]>(["React"]);
    return (
      <Box gap="$md">
        <MultiSelect
          {...args}
          value={value}
          onChange={setValue}
          label="Controlled MultiSelect"
          description={`Selected: ${value.length === 0 ? "none" : value.join(", ")}`}
          placeholder="Pick frameworks"
          clearable
        />
      </Box>
    );
  },
};
