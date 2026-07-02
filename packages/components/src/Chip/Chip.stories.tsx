import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Chip } from "./Chip";

const VARIANTS = ["outline", "filled", "light"] as const;

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/Chip",
  component: Chip,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Chip is a pill-shaped toggle that functions as a checkbox or radio button. Accent comes from the active theme palette ramp via the `theme` prop. Inside a `Chip.Group` it defers its checked state to the group for single- or multi-select behaviour.",
      },
    },
  },
  args: {
    children: "Chip",
    variant: "outline",
    size: "sm",
    disabled: false,
  },
  argTypes: {
    variant: {
      control: "select",
      options: VARIANTS,
      description: "Visual style — how the theme color ramp is applied.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, horizontal padding, gap and font size.",
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Accent theme applied to the checked state.",
    },
    disabled: { control: "boolean" },
    checked: { control: "boolean" },
    defaultChecked: { control: "boolean" },
    children: { control: "text" },
    icon: { control: false },
  },
} satisfies Meta<typeof Chip>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Chip>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every visual variant side by side, unchecked and checked. */
export const Variants: Story = {
  render: (args) => (
    <Box gap="$md">
      <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
        {VARIANTS.map((variant) => (
          <Chip key={variant} {...args} variant={variant}>
            {variant}
          </Chip>
        ))}
      </Box>
      <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
        {VARIANTS.map((variant) => (
          <Chip key={variant} {...args} variant={variant} defaultChecked>
            {variant} (on)
          </Chip>
        ))}
      </Box>
    </Box>
  ),
};

/** Full seven-step size scale. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Chip key={size} {...args} size={size}>
          {size}
        </Chip>
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
        <Chip key={shadow} {...args} shadow={shadow}>
          {shadow}
        </Chip>
      ))}
    </Box>
  ),
};

/** Accent themes use Tamagui `theme`, not a public color prop. */
export const Themes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {(["blue", "red", "green", "yellow", "pink", "gray"] as const).map((theme) => (
        <Chip key={theme} {...args} theme={theme} defaultChecked>
          {theme}
        </Chip>
      ))}
    </Box>
  ),
};

/** Disabled state — reduced opacity and no interaction. */
export const Disabled: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {VARIANTS.map((variant) => (
        <Chip key={variant} {...args} variant={variant} disabled>
          {variant}
        </Chip>
      ))}
    </Box>
  ),
};

/** Checked by default (uncontrolled) — shows the built-in check glyph. */
export const DefaultChecked: Story = {
  args: { defaultChecked: true, children: "Selected" },
};

/** Custom icon replaces the default check glyph when the chip is toggled on. */
export const CustomIcon: Story = {
  args: {
    defaultChecked: true,
    icon: <Text>⭐</Text>,
    children: "Favourite",
  },
};

/** Controlled chip — parent owns the checked state via React.useState. */
export const Controlled: Story = {
  render: (args) => {
    const [on, setOn] = React.useState(false);
    return (
      <Box gap="$md" alignItems="center">
        <Chip {...args} checked={on} onChange={setOn}>
          {on ? "On" : "Off"}
        </Chip>
        <Text>checked: {String(on)}</Text>
      </Box>
    );
  },
};

/** Chip.Group (single-select) — clicking a chip deselects the previous one. */
export const GroupSingleSelect: Story = {
  render: (args) => {
    const [value, setValue] = React.useState("react");
    return (
      <Box gap="$sm" alignItems="flex-start">
        <Chip.Group value={value} onChange={(v) => setValue(v as string)}>
          <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
            {["react", "vue", "svelte", "solid"].map((label) => (
              <Chip key={label} {...args} value={label}>
                {label}
              </Chip>
            ))}
          </Box>
        </Chip.Group>
        <Text>selected: {value}</Text>
      </Box>
    );
  },
};

/** Chip.Group (multiple) — chips act as checkboxes; any number can be selected. */
export const GroupMultiSelect: Story = {
  render: (args) => {
    const [values, setValues] = React.useState<string[]>(["ts"]);
    return (
      <Box gap="$sm" alignItems="flex-start">
        <Chip.Group multiple value={values} onChange={(v) => setValues(v as string[])}>
          <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
            {["ts", "js", "rust", "go", "python"].map((label) => (
              <Chip key={label} {...args} value={label}>
                {label}
              </Chip>
            ))}
          </Box>
        </Chip.Group>
        <Text>selected: {values.join(", ") || "(none)"}</Text>
      </Box>
    );
  },
};

/** Full variant × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$lg">
      {VARIANTS.map((variant) => (
        <Box key={variant} flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
          {SIZES.map((size) => (
            <Chip key={size} variant={variant} size={size}>
              {variant} {size}
            </Chip>
          ))}
        </Box>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `root` frame and the `label`. */
export const Styles: Story = {
  args: {
    children: "Chip",
    variant: "outline",
    size: "sm",
    defaultChecked: true,
    styles: {
      root: { borderColor: "$blue7", borderWidth: 2 },
      label: { color: "$blue9", fontWeight: "700" },
      icon: { color: "$blue9" },
    },
  },
};
