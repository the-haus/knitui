import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, type BoxProps } from "../Box";
import { Text } from "../Text";
import { ColorPicker } from "./ColorPicker";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const SAMPLE_SWATCHES = [
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
  title: "Inputs/ColorPicker",
  component: ColorPicker,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "ColorPicker provides a draggable saturation area, a hue slider (and optional alpha slider for alpha formats), and an optional predefined swatch grid. The `format` prop controls the output string format. Accent comes from the Tamagui `theme` prop — no Mantine `color` prop.",
      },
    },
  },
  args: {
    defaultValue: "#228be6",
    format: "hex",
    size: "md",
    withPicker: true,
    fullWidth: false,
    focusable: true,
  },
  argTypes: {
    format: {
      control: "select",
      options: ["hex", "hexa", "rgb", "rgba", "hsl", "hsla"],
      description:
        "Output color format. Alpha formats (hexa / rgba / hsla) also render the alpha slider.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Controls the overall width and the height of the saturation / slider areas.",
    },
    withPicker: {
      control: "boolean",
      description: "When false only the swatch grid is shown — no saturation or hue controls.",
    },
    fullWidth: { control: "boolean" },
    focusable: { control: "boolean" },
    defaultValue: { control: "color" },
    value: { control: false },
    onChange: { control: false },
    onChangeEnd: { control: false },
    onColorSwatchClick: { control: false },
    swatches: { control: false },
    saturationLabel: { control: "text" },
    hueLabel: { control: "text" },
    alphaLabel: { control: "text" },
    name: { control: "text" },
  },
} satisfies Meta<typeof ColorPicker>;

export default meta;

type Story = StoryObj<ComponentProps<typeof ColorPicker>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All seven sizes displayed side by side to compare the picker footprint. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="flex-start">
      {SIZES.map((size) => (
        <Box key={size} flexDirection="column" gap="$xs" alignItems="center">
          <ColorPicker {...args} size={size} />
          <Text fontSize="$sm" color="$color11">
            {size}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** The inherited `shadow` elevation ladder, from `xs` to `xl`. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="flex-start">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} flexDirection="column" gap="$xs" alignItems="center">
          <ColorPicker {...args} shadow={shadow} />
          <Text fontSize="$sm" color="$color11">
            {shadow}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Alpha formats (hexa / rgba / hsla) add an alpha slider and a preview swatch. */
export const AlphaFormat: Story = {
  args: {
    format: "rgba",
    defaultValue: "rgba(34, 139, 230, 0.5)",
  },
};

/** Predefined swatch grid shown below the picker — clicking a swatch jumps to that color. */
export const WithSwatches: Story = {
  args: {
    swatches: SAMPLE_SWATCHES,
    swatchesPerRow: 7,
  },
};

/** Hides the saturation / hue controls; only the swatch grid is rendered. */
export const SwatchesOnly: Story = {
  args: {
    withPicker: false,
    swatches: SAMPLE_SWATCHES,
    swatchesPerRow: 7,
  },
};

/** Accessible labels wired to the saturation, hue, and alpha sliders for screen readers. */
export const AccessibleLabels: Story = {
  args: {
    format: "rgba",
    saturationLabel: "Saturation",
    hueLabel: "Hue",
    alphaLabel: "Alpha",
  },
};

/** Per-slot `styles` targets individual parts — here the `saturation` area, `hueSlider`, and `thumb`. */
export const Styles: Story = {
  args: {
    defaultValue: "#228be6",
    format: "hex",
    size: "md",
    styles: {
      saturation: { borderRadius: "$lg" },
      hueSlider: { borderRadius: "$sm" },
      thumb: { borderColor: "$red9", borderWidth: 3 },
    },
  },
};

/** Controlled picker — current color value is displayed and kept in sync via React state. */
export const Controlled: Story = {
  render: (args) => {
    const [color, setColor] = React.useState("#228be6");
    return (
      <Box flexDirection="column" gap="$md" alignItems="center">
        <ColorPicker
          {...args}
          value={color}
          onChange={setColor}
          swatches={SAMPLE_SWATCHES}
          swatchesPerRow={7}
        />
        <Box
          flexDirection="row"
          alignItems="center"
          gap="$sm"
          paddingHorizontal="$md"
          paddingVertical="$xs"
          borderRadius="$sm"
          borderWidth={1}
          borderColor="$color5"
        >
          <Box
            width={18}
            height={18}
            borderRadius="$xs"
            backgroundColor={color as BoxProps["backgroundColor"]}
            borderWidth={1}
            borderColor="$color5"
          />
          <Text fontSize="$sm">{color}</Text>
        </Box>
      </Box>
    );
  },
};
