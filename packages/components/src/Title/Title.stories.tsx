import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Title } from "./Title";

const ORDERS = [1, 2, 3, 4, 5, 6] as const;

const HEADING_SIZES = ["h1", "h2", "h3", "h4", "h5", "h6"] as const;

const TOKEN_SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

const meta = {
  title: "Typography/Title",
  component: Title,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Title renders a semantic heading element (`h1`–`h6`) driven by the `order` prop. `size` overrides the order-driven font size and accepts `h1`–`h6` heading-scale aliases, seven-step font-size tokens (`xxs`–`xxl`), or any arbitrary CSS value.",
      },
    },
  },
  args: {
    children: "The quick brown fox",
    order: 1,
  },
  argTypes: {
    order: {
      control: "inline-radio",
      options: ORDERS,
      description:
        "Semantic heading level — sets the rendered tag (`h1`–`h6`) and its default size.",
    },
    size: {
      control: "select",
      options: [...HEADING_SIZES, ...TOKEN_SIZES],
      description:
        "Overrides the order-driven font size. Accepts heading aliases (`h1`–`h6`), seven-step font-size tokens (`xxs`–`xxl`), or arbitrary CSS values.",
    },
    children: { control: "text" },
    lineClamp: { control: "number" },
    truncate: { control: "boolean" },
    textWrap: {
      control: "select",
      options: ["wrap", "nowrap", "balance", "pretty", "stable"],
      description: "CSS `text-wrap` value (web only).",
    },
  },
} satisfies Meta<typeof Title>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Title>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** All six heading orders rendered together to compare default sizing. */
export const Orders: Story = {
  render: (args) => (
    <Box gap="$sm">
      {ORDERS.map((order) => (
        <Title key={order} {...args} order={order}>
          Order {order} — h{order}
        </Title>
      ))}
    </Box>
  ),
};

/** Heading-scale size aliases (`h1`–`h6`) applied to a fixed order, showing that size overrides the default. */
export const HeadingSizes: Story = {
  render: (args) => (
    <Box gap="$sm">
      {HEADING_SIZES.map((size) => (
        <Title key={size} {...args} order={3} size={size}>
          size="{size}" on order 3
        </Title>
      ))}
    </Box>
  ),
};

/** Font-size tokens (`xxs`–`xxl`) used as a `size` override, showing the token-driven scale. */
export const TokenSizes: Story = {
  render: (args) => (
    <Box gap="$sm">
      {TOKEN_SIZES.map((size) => (
        <Title key={size} {...args} order={2} size={size}>
          size="{size}" on order 2
        </Title>
      ))}
    </Box>
  ),
};

/** Size override decoupled from semantic order — `order` sets the tag, `size` sets the visual weight. */
export const SizeOverridesOrder: Story = {
  render: (args) => (
    <Box gap="$sm">
      <Title {...args} order={1} size="h6">
        h1 tag, h6 size
      </Title>
      <Title {...args} order={6} size="h1">
        h6 tag, h1 size
      </Title>
      <Title {...args} order={3} size="xl">
        h3 tag, xl token size
      </Title>
      <Title {...args} order={4} size="sm">
        h4 tag, sm token size
      </Title>
    </Box>
  ),
};

/** Line clamping — long text is truncated after the given number of lines. */
export const LineClamp: Story = {
  args: {
    order: 2,
    lineClamp: 2,
    children:
      "This is a very long heading that will be clamped after two lines because the lineClamp prop is set to 2 and the container is narrow.",
  },
  decorators: [
    (Story) => (
      <Box width={320}>
        <Story />
      </Box>
    ),
  ],
};

/** `textWrap="balance"` distributes text evenly across lines (web only). */
export const TextWrapBalance: Story = {
  render: (args) => (
    <Box gap="$lg" width={400}>
      <Box gap="$xs">
        <Text fontSize="$sm" color="$colorSubtle">
          textWrap="balance"
        </Text>
        <Title {...args} order={2} textWrap="balance">
          A balanced heading that distributes words evenly across lines
        </Title>
      </Box>
      <Box gap="$xs">
        <Text fontSize="$sm" color="$colorSubtle">
          default (wrap)
        </Text>
        <Title {...args} order={2}>
          A heading without balance that may leave awkward short last lines
        </Title>
      </Box>
    </Box>
  ),
};
