import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { ColorInput } from "./ColorInput";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const SWATCHES = [
  "#2e2e2e",
  "#868e96",
  "#fa5252",
  "#e64980",
  "#be4bdb",
  "#7950f2",
  "#4c6ef5",
  "#228be6",
  "#15aabf",
  "#12b886",
  "#40c057",
  "#82c91e",
  "#fab005",
  "#fd7e14",
];

const meta = {
  title: "Inputs/ColorInput",
  component: ColorInput,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ColorInput combines an `InputBase` with a `Popover`-hosted `ColorPicker` dropdown. Typing a valid color updates the preview swatch in the left section; the picker drives the value back. The `withPicker`, `swatches`, `disallowInput` and `format` props control what appears in the dropdown.",
      },
    },
  },
  args: {
    placeholder: "Pick a color",
    size: "sm",
    withPicker: true,
    withPreview: true,
    disallowInput: false,
    fixOnBlur: true,
    closeOnColorSwatchClick: false,
    disabled: false,
    format: "hex",
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls height, horizontal padding, radius and font size.",
    },
    format: {
      control: "select",
      options: ["hex", "hexa", "rgb", "rgba", "hsl", "hsla", "hsv", "hsva"],
      description: "Output color format for onChange / onChangeEnd.",
    },
    withPicker: {
      control: "boolean",
      description: "Render the saturation + slider picker in the dropdown.",
    },
    withPreview: {
      control: "boolean",
      description: "Show the current color as a swatch in the left section.",
    },
    disallowInput: {
      control: "boolean",
      description: "Forbid typing — value can only be chosen via the picker.",
    },
    fixOnBlur: {
      control: "boolean",
      description: "Reset to last valid value on blur when the field contains an invalid color.",
    },
    closeOnColorSwatchClick: {
      control: "boolean",
      description: "Close the dropdown when a predefined swatch is clicked.",
    },
    disabled: { control: "boolean" },
    placeholder: { control: "text" },
    value: { control: "text" },
    label: { control: "text" },
    description: { control: "text" },
    error: { control: "text" },
    swatches: { control: false },
    popoverProps: { control: false },
    eyeDropperIcon: { control: false },
  },
} satisfies Meta<typeof ColorInput>;

export default meta;

type Story = StoryObj<ComponentProps<typeof ColorInput>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** The five sizes rendered side by side for quick visual comparison. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <ColorInput key={size} {...args} size={size} placeholder={size} />
      ))}
    </Box>
  ),
};

/** The inherited `shadow` elevation ladder, from `xs` to `xl`. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <ColorInput key={shadow} {...args} shadow={shadow} placeholder={shadow} />
      ))}
    </Box>
  ),
};

/** Disabled state — the field is non-interactive and visually muted. */
export const Disabled: Story = {
  args: {
    disabled: true,
    value: "#228be6",
    placeholder: "Pick a color",
  },
};

/** Input is read-only; the value can only be changed via the picker dropdown. */
export const DisallowInput: Story = {
  args: {
    disallowInput: true,
    value: "#fa5252",
    placeholder: "Click to pick",
  },
};

/** Read-only — the value is visible but locked; the picker dropdown does not open. */
export const ReadOnly: Story = {
  args: {
    readOnly: true,
    value: "#228be6",
    placeholder: "Pick a color",
  },
};

/** Predefined swatches appear below the picker for quick selection. */
export const WithSwatches: Story = {
  args: {
    swatches: SWATCHES,
    swatchesPerRow: 7,
    value: "#228be6",
  },
};

/** Swatches-only dropdown — the gradient/slider picker is hidden. */
export const SwatchesOnly: Story = {
  args: {
    withPicker: false,
    swatches: SWATCHES,
    swatchesPerRow: 7,
    closeOnColorSwatchClick: true,
    value: "#40c057",
    placeholder: "Choose a swatch",
  },
};

/** Outputs RGBA strings instead of the default hex format. */
export const RgbaFormat: Story = {
  args: {
    format: "rgba",
    value: "rgba(34, 139, 230, 1)",
    placeholder: "rgba(…)",
  },
};

/** Fully controlled — value and onChange are wired through local state. */
export const Controlled: Story = {
  render: (args) => {
    const [color, setColor] = React.useState("#be4bdb");
    return (
      <Box gap="$md" alignItems="flex-start">
        <ColorInput {...args} value={color} onChange={setColor} />
        <Box flexDirection="row" gap="$sm" alignItems="center">
          <Text>Selected:</Text>
          <Text fontWeight="600">{color || "—"}</Text>
        </Box>
      </Box>
    );
  },
};

/** With a label, description and error message — standard field anatomy. */
export const WithFieldProps: Story = {
  args: {
    label: "Brand color",
    description: "Used in exported assets and reports.",
    error: "Please enter a valid hex color.",
    value: "notacolor",
    placeholder: "#000000",
  },
};

/** Per-slot `styles` targets individual parts — here the `label` chrome and the `preview` swatch. */
export const Styles: Story = {
  args: {
    label: "Brand color",
    value: "#228be6",
    placeholder: "Pick a color",
    styles: {
      label: { color: "$blue9", fontWeight: "700" },
      preview: { radius: "$lg", withShadow: false },
    },
  },
};
