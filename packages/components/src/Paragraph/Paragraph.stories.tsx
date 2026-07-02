import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Paragraph } from "./Paragraph";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const SAMPLE_TEXT =
  "The quick brown fox jumps over the lazy dog. Pack my box with five dozen liquor jugs.";

const meta = {
  title: "Typography/Paragraph",
  component: Paragraph,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`Paragraph` is `Text` rendered as a semantic `<p>` element. It inherits all `Text` features including `size`, `truncate`, `lineClamp`, `inline`, and `inherit`.",
      },
    },
  },
  args: {
    children: SAMPLE_TEXT,
    size: "md",
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Font size and line-height token pair.",
    },
    truncate: {
      control: "select",
      options: [undefined, true, "end", "start"],
      description: "Truncates overflowing text with an ellipsis.",
    },
    lineClamp: {
      control: { type: "number", min: 1, max: 10 },
      description: "Clamps text to N lines.",
    },
    inline: {
      control: "boolean",
      description: "Tightens line-height for inline use.",
    },
    inherit: {
      control: "boolean",
      description: "Inherits font properties from the parent element.",
    },
    children: { control: "text" },
  },
} satisfies Meta<typeof Paragraph>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Paragraph>>;

/** The interactive playground - tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** The full seven-step type scale, each size on its own line. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md">
      {SIZES.map((size) => (
        <Paragraph key={size} {...args} size={size}>
          {size} - {SAMPLE_TEXT}
        </Paragraph>
      ))}
    </Box>
  ),
};

/** Truncate overflowing text with an end ellipsis in a fixed-width container. */
export const Truncate: Story = {
  args: { truncate: true },
  decorators: [
    (Story) => (
      <Box width={300}>
        <Story />
      </Box>
    ),
  ],
};

/** Clamp the paragraph to two lines regardless of how much text it contains. */
export const LineClamp: Story = {
  args: {
    lineClamp: 2,
    children:
      "Line one of a very long paragraph that will be clamped. " +
      "Line two continues here with even more content filling the space. " +
      "Line three is where the clamping takes effect and the rest is hidden.",
  },
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
};

/** Rich inline children with nested elements alongside plain text. */
export const RichChildren: Story = {
  render: (args) => (
    <Paragraph {...args}>
      This paragraph contains <strong>bold text</strong>, <em>italic text</em>, and a{" "}
      <strong>
        <em>bold italic</em>
      </strong>{" "}
      combination all flowing inline together.
    </Paragraph>
  ),
};

/** `inherit` forwards all font properties from a parent element. */
export const Inherit: Story = {
  render: (args) => (
    <Box gap="$sm">
      <Paragraph size="xl">
        Parent at xl - child below inherits:
        <Paragraph {...args} inherit size={undefined}>
          {" "}
          I inherit the xl font from my parent.
        </Paragraph>
      </Paragraph>
    </Box>
  ),
};

/** All sizes in a stacked comparison. */
export const ScaleComparison: Story = {
  render: () => (
    <Box gap="$lg">
      {SIZES.map((size) => (
        <Box key={size} flexDirection="row" alignItems="baseline" gap="$sm">
          <Paragraph size="xs" theme="gray" width="$md">
            {size}
          </Paragraph>
          <Paragraph size={size}>The quick brown fox jumps over the lazy dog.</Paragraph>
        </Box>
      ))}
    </Box>
  ),
};
