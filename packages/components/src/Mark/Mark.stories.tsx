import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Mark } from "./Mark";

const THEMES = ["yellow", "blue", "red", "green", "pink", "gray"] as const;

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const meta = {
  title: "Typography/Mark",
  component: Mark,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Mark renders highlighted inline text — a semantic `<mark>` on web with a tinted fill. The tint comes from the active theme ramp (`$color5` fill, `$color12` text), so the `theme` prop recolors it with no per-component logic. Inherits the full `Text` surface (`size`, `fw`, `truncate`, …).",
      },
    },
  },
  args: {
    children: "highlighted text",
  },
  argTypes: {
    children: { control: "text" },
    theme: {
      control: "select",
      options: [undefined, ...THEMES],
      description: "Active theme accent — recolors the mark via the palette ramp.",
    },
    size: {
      control: "select",
      options: SIZES,
      description: "Font-size + line-height pair inherited from the Text surface.",
    },
    fontWeight: {
      control: "select",
      options: ["400", "500", "600", "700", "800", "900"],
      description: "Font weight inherited from the Text surface.",
    },
  },
} satisfies Meta<typeof Mark>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Mark>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Every accent theme applied to the same highlighted word. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {THEMES.map((t) => (
        <Mark key={t} {...args} theme={t}>
          {t}
        </Mark>
      ))}
    </Box>
  ),
};

/** Inherited Text sizes from xxs to xxl. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$md" alignItems="center">
      {SIZES.map((size) => (
        <Mark key={size} {...args} size={size}>
          {size}
        </Mark>
      ))}
    </Box>
  ),
};

/** Mark used inline inside a paragraph of running text — the typical use case. */
export const InParagraph: Story = {
  render: () => (
    <Text size="md" maxWidth={480}>
      The quick brown fox jumps over the <Mark theme="yellow">lazy dog</Mark>. Highlights can appear{" "}
      <Mark theme="blue">anywhere inside</Mark> a sentence without disrupting the line height.
    </Text>
  ),
};

/** Multiple marks in sequence to verify spacing and line-height remain consistent. */
export const MultipleMarks: Story = {
  render: () => (
    <Text size="md" maxWidth={480}>
      Use <Mark theme="green">semantic</Mark> markup to make{" "}
      <Mark theme="yellow">important terms</Mark> stand out when <Mark theme="red">scanning</Mark> a
      document.
    </Text>
  ),
};

/** Heavier font weight for emphasis alongside the background tint. */
export const BoldMark: Story = {
  args: {
    children: "important term",
    fontWeight: "700",
    theme: "yellow",
  },
};

/** Long text with truncate enabled — the highlight clips to a single line. */
export const Truncated: Story = {
  render: (args) => (
    <Box width={200}>
      <Mark {...args} truncate theme="blue">
        This highlighted text is intentionally very long and will be truncated
      </Mark>
    </Box>
  ),
};
