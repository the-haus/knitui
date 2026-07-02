import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Loader } from "./Loader";

const TYPES = ["oval", "dots", "bars"] as const;
const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Display/Loader",
  component: Loader,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Loader is a multi-type loading indicator (`oval` | `dots` | `bars`). Accent color comes from the active theme ramp via the `theme` prop. Motion honours the user's `prefers-reduced-motion` preference and animates identically on web and native.",
      },
    },
  },
  args: {
    type: "oval",
    size: "md",
  },
  argTypes: {
    type: {
      control: "inline-radio",
      options: TYPES,
      description: "Loader rendition — spinning ring, pulsing dots, or rising bars.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Size key (xxs–xxl) or an explicit pixel number.",
    },
    "aria-label": {
      control: "text",
      description: 'Accessible label read by screen readers. Defaults to "Loading".',
    },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "yellow", "pink", "gray"],
      description: "Active theme accent — recolors the loader via the palette ramp.",
    },
  },
} satisfies Meta<typeof Loader>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Loader>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All three loader types side by side at the default size. */
export const Types: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {TYPES.map((type) => (
        <Box key={type} alignItems="center" gap="$sm">
          <Loader {...args} type={type} />
          <Text>{type}</Text>
        </Box>
      ))}
    </Box>
  ),
};

/** The seven size keys, from xxs to xxl, using the default oval type. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
      {SIZES.map((size) => (
        <Box key={size} alignItems="center" gap="$sm">
          <Loader {...args} size={size} />
          <Text>{size}</Text>
        </Box>
      ))}
    </Box>
  ),
};

/** The inherited `shadow` elevation prop, from xs to xl. */
export const Shadows: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {SHADOWS.map((shadow) => (
        <Box key={shadow} alignItems="center" gap="$sm">
          <Loader {...args} shadow={shadow} />
          <Text>{shadow}</Text>
        </Box>
      ))}
    </Box>
  ),
};

/** An explicit pixel size — useful when the preset keys don't match a specific layout. */
export const CustomSize: Story = {
  args: { size: 64 },
};

/** The palette ramp follows the active theme — same component, different accent. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$xl" alignItems="center">
      {(["blue", "red", "green", "yellow", "pink"] as const).map((theme) => (
        <Box key={theme} alignItems="center" gap="$sm">
          <Loader {...args} theme={theme} />
          <Text>{theme}</Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Custom accessibility label — overrides the default "Loading" for screen readers. */
export const CustomLabel: Story = {
  args: { "aria-label": "Please wait, uploading file..." },
};

/** Full type × size matrix for visual regression. */
export const Matrix: Story = {
  render: () => (
    <Box gap="$xl">
      {TYPES.map((type) => (
        <Box key={type} gap="$sm">
          <Text fontWeight="600">{type}</Text>
          <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="center">
            {SIZES.map((size) => (
              <Box key={size} alignItems="center" gap="$xs">
                <Loader type={type} size={size} />
                <Text fontSize="$xs">{size}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      ))}
    </Box>
  ),
};
