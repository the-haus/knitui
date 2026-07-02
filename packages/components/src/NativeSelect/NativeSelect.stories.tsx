import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { NativeSelect } from "./NativeSelect";

const VARIANTS = ["default", "filled", "unstyled"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const COLORS = ["Red", "Green", "Blue", "Yellow", "Purple"];
const COLORS_DATA = COLORS.map((c) => ({ value: c.toLowerCase(), label: c }));

const meta = {
  title: "Inputs/NativeSelect",
  component: NativeSelect,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "NativeSelect renders a real `<select>` element wrapped in the shared input chrome. Options are supplied either via the `data` prop (strings or `{ value, label, disabled }` objects, including `{ group, items }` groups) or as raw `<option>`/`<optgroup>` children. The outer `InputWrapper` provides `label`, `description` and `error` accessibility wiring.",
      },
    },
  },
  args: {
    data: COLORS_DATA,
    variant: "default",
    size: "sm",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
      description: "Visual variant of the input chrome.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, horizontal padding and font size.",
    },
    label: { control: "text" },
    description: { control: "text" },
    error: {
      control: "text",
      description: "Error message — also toggles error styling when truthy.",
    },
    disabled: { control: "boolean" },
    required: { control: "boolean" },
    leftSection: { control: false },
    rightSection: { control: false },
    data: { control: false },
    children: { control: false },
  },
} satisfies Meta<typeof NativeSelect>;

export default meta;

type Story = StoryObj<ComponentProps<typeof NativeSelect>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  decorators: [
    (Story) => (
      <Box width={280}>
        <Story />
      </Box>
    ),
  ],
};

/** The three chrome variants side by side. */
export const Variants: Story = {
  render: (args) => (
    <Box gap="$md" width={280}>
      {VARIANTS.map((variant) => (
        <NativeSelect key={variant} {...args} variant={variant} label={variant} />
      ))}
    </Box>
  ),
};

/** The seven token sizes, from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md" width={280}>
      {SIZES.map((size) => (
        <NativeSelect key={size} {...args} size={size} label={`size: ${size}`} />
      ))}
    </Box>
  ),
};

/** Each elevation of the inherited `shadow` prop applied to the input frame. */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$md" width={280}>
      {SHADOWS.map((shadow) => (
        <NativeSelect key={shadow} {...args} shadow={shadow} label={shadow} />
      ))}
    </Box>
  ),
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$lg">
      {VARIANTS.map((variant) => (
        <Box key={variant} flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
          {SIZES.map((size) => (
            <Box key={size} width={200}>
              <NativeSelect
                data={COLORS_DATA}
                variant={variant}
                size={size}
                label={`${variant} / ${size}`}
              />
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  ),
};

/** Label, description and required asterisk wired up via InputWrapper. */
export const WithLabel: Story = {
  args: {
    label: "Favourite colour",
    description: "Pick the colour you like most.",
    required: true,
  },
  decorators: [
    (Story) => (
      <Box width={280}>
        <Story />
      </Box>
    ),
  ],
};

/** Error state — toggles the error border and `aria-invalid`. */
export const WithError: Story = {
  args: {
    label: "Colour",
    error: "Please select a valid colour.",
  },
  decorators: [
    (Story) => (
      <Box width={280}>
        <Story />
      </Box>
    ),
  ],
};

/** Disabled state — reduced opacity and interaction blocked. */
export const Disabled: Story = {
  args: {
    label: "Colour",
    disabled: true,
  },
  decorators: [
    (Story) => (
      <Box width={280}>
        <Story />
      </Box>
    ),
  ],
};

/** Left and right sections for icons or adornments. */
export const WithSections: Story = {
  args: {
    label: "Colour",
    leftSection: <Text>🎨</Text>,
  },
  decorators: [
    (Story) => (
      <Box width={280}>
        <Story />
      </Box>
    ),
  ],
};

/** Raw `<option>` and `<optgroup>` children take precedence over the `data` prop. */
export const WithChildren: Story = {
  render: (args) => (
    <Box width={280}>
      <NativeSelect {...args} data={undefined} label="Framework">
        <optgroup label="Frontend">
          <option value="react">React</option>
          <option value="vue">Vue</option>
          <option value="svelte">Svelte</option>
        </optgroup>
        <optgroup label="Backend">
          <option value="node">Node.js</option>
          <option value="django">Django</option>
        </optgroup>
      </NativeSelect>
    </Box>
  ),
};

/** Grouped options via the `data` prop using `{ group, items }` objects. */
export const Grouped: Story = {
  render: (args) => (
    <Box width={280}>
      <NativeSelect
        {...args}
        label="Animal"
        data={[
          {
            group: "Birds",
            items: [
              { value: "eagle", label: "Eagle" },
              { value: "parrot", label: "Parrot" },
            ],
          },
          {
            group: "Mammals",
            items: [
              { value: "lion", label: "Lion" },
              { value: "whale", label: "Whale", disabled: true },
            ],
          },
        ]}
      />
    </Box>
  ),
};

/** Loading state — a spinner replaces the chevron; position via `loadingPosition`. */
export const Loading: Story = {
  render: (args) => (
    <Box gap="$md" width={280}>
      <NativeSelect {...args} label="Loading right" loading loadingPosition="right" />
      <NativeSelect {...args} label="Loading left" loading loadingPosition="left" />
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `root` frame, `label` and `leftSection`. */
export const Styles: Story = {
  decorators: [
    (Story) => (
      <Box width={280}>
        <Story />
      </Box>
    ),
  ],
  render: (args) => (
    <NativeSelect
      {...args}
      label="Styled colour"
      leftSection={<Text>🎨</Text>}
      styles={{
        root: { backgroundColor: "$blue3", borderColor: "$blue7", borderWidth: 2 },
        label: { color: "$blue11" },
        leftSection: { backgroundColor: "$red9" },
      }}
    />
  ),
};

/** Controlled selection — current value is reflected below the field. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("red");
    return (
      <Box gap="$sm" width={280}>
        <NativeSelect
          {...args}
          label="Colour"
          value={value}
          onChange={(e) => setValue(e.target.value)}
        />
        <Text fontSize={12} color="$color11">
          selected: {value}
        </Text>
      </Box>
    );
  },
};
