import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "./index";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SAMPLE =
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.";

const meta = {
  title: "Typography/Text",
  component: Text,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`Text` is the kit's text primitive, built on Tamagui's `styled(TamaguiText)`. It exposes a Mantine-compatible API: `size` pairs font-size with line-height via the token scale, `lineClamp` truncates to N lines, `truncate` adds a single-line ellipsis, `inline` tightens line-height for inline usage, `inherit` forwards all font props from the parent, and `span` renders an inline `<span>` host element.",
      },
    },
  },
  args: {
    children: "Typography text",
    size: "md",
    truncate: undefined,
    inline: false,
    inherit: false,
    span: false,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Font-size + line-height pair from the token scale.",
    },
    lineClamp: {
      control: { type: "number", min: 1, max: 10 },
      description: "Clamp text to this many lines with a trailing ellipsis.",
    },
    truncate: {
      control: "select",
      options: [undefined, true, "end", "start"],
      description:
        'Single-line truncation. `true`/`"end"` adds trailing ellipsis; `"start"` clips the head.',
    },
    inline: {
      control: "boolean",
      description: "Tightens line-height for inline usage (verticalAlign: middle).",
    },
    inherit: {
      control: "boolean",
      description: "Inherits all font properties from the parent element.",
    },
    span: {
      control: "boolean",
      description: "Renders an inline `<span>` host element instead of a block.",
    },
    children: { control: "text" },
  },
} satisfies Meta<typeof Text>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Text>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All seven sizes from xxs to xxl rendered side by side. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md">
      {SIZES.map((size) => (
        <Text key={size} {...args} size={size}>
          {size} — {SAMPLE.slice(0, 48)}
        </Text>
      ))}
    </Box>
  ),
};

/** `lineClamp` limits text to N lines and appends an ellipsis. */
export const LineClamp: Story = {
  render: (args) => (
    <Box gap="$lg" maxWidth={400}>
      {([1, 2, 3] as const).map((n) => (
        <Box key={n} gap="$xs">
          <Text size="xs" c="$colorSubtle">
            lineClamp={n}
          </Text>
          <Text {...args} lineClamp={n}>
            {SAMPLE} {SAMPLE}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** Single-line truncation: `true`/`"end"` clips the tail; `"start"` clips the head. */
export const Truncate: Story = {
  render: (args) => (
    <Box gap="$lg" maxWidth={320}>
      {(["end", "start"] as const).map((mode) => (
        <Box key={mode} gap="$xs">
          <Text size="xs" c="$colorSubtle">
            truncate="{mode}"
          </Text>
          <Text {...args} truncate={mode}>
            {SAMPLE}
          </Text>
        </Box>
      ))}
    </Box>
  ),
};

/** `inline` tightens line-height so the text sits flush inside inline contexts. */
export const Inline: Story = {
  render: (args) => (
    <Box gap="$lg">
      <Box flexDirection="row" alignItems="center" gap="$xs">
        <Text>⭐</Text>
        <Text {...args} inline>
          Inline text — sits flush with an icon
        </Text>
      </Box>
      <Box flexDirection="row" alignItems="center" gap="$xs">
        <Text>⭐</Text>
        <Text {...args}>Non-inline text — default line-height</Text>
      </Box>
    </Box>
  ),
};

/** `inherit` forwards font-size, weight, line-height, and family from the parent. */
export const Inherit: Story = {
  render: (args) => (
    <Box gap="$md">
      <Text size="xl" fontWeight="700">
        Parent xl bold —{" "}
        <Text {...args} inherit span>
          inherited child text
        </Text>
      </Text>
      <Text size="sm" fontStyle="italic">
        Parent sm italic —{" "}
        <Text {...args} inherit span>
          inherited child text
        </Text>
      </Text>
    </Box>
  ),
};

/** `span` renders an inline host element, allowing Text to nest inside prose. */
export const AsSpan: Story = {
  render: (args) => (
    <Text size="md">
      This sentence has{" "}
      <Text {...args} span c="$blue10">
        an inline span
      </Text>{" "}
      in the middle of running prose.
    </Text>
  ),
};
