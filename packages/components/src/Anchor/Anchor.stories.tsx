import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Anchor } from "./Anchor";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const UNDERLINES = ["always", "hover", "not-hover", "never"] as const;

const meta = {
  title: "Typography/Anchor",
  component: Anchor,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'Anchor is link text built on `Text`. It renders an `<a>` (`role="link"`), inherits the full `Text` surface (`size`, `truncate`, `lineClamp`, `inline`, `inherit`) and adds `underline`, which controls WHEN the underline shows. The default link color is the theme accent ramp (`$color11`); recolor via the `theme` prop, never a `color` prop.',
      },
    },
  },
  args: {
    children: "Anchor link",
    href: "https://example.com",
    underline: "hover",
  },
  argTypes: {
    underline: {
      control: "inline-radio",
      options: UNDERLINES,
      description: "When the underline is shown.",
    },
    size: {
      control: "inline-radio",
      options: SIZES,
      description: "Text size from the token scale.",
    },
    href: { control: "text" },
    children: { control: "text" },
    theme: {
      control: "select",
      options: [undefined, "blue", "red", "green", "pink"],
      description: "Active theme accent — recolors the link via the palette ramp.",
    },
  },
} satisfies Meta<typeof Anchor>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Anchor>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {};

/** Default link text. */
export const Default: Story = {};

/** Each `underline` value, hover to see the difference. */
export const Underline: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$sm" alignItems="flex-start">
      {UNDERLINES.map((underline) => (
        <Anchor key={underline} {...args} underline={underline}>
          underline: {underline}
        </Anchor>
      ))}
    </Box>
  ),
};

/** The full seven-step text size scale. */
export const Sizes: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$sm" alignItems="flex-start">
      {SIZES.map((size) => (
        <Anchor key={size} {...args} size={size}>
          size: {size}
        </Anchor>
      ))}
    </Box>
  ),
};

/** A link with no `href` still carries the link role. */
export const WithoutHref: Story = {
  args: { href: undefined, children: "No href" },
};

/** `truncate` clamps overflowing link text to a single line with an ellipsis. */
export const Truncated: Story = {
  args: {
    truncate: true,
    children: "A very long anchor label that does not fit on a single line and gets clamped",
  },
  decorators: [
    (Story) => (
      <Box width={200}>
        <Story />
      </Box>
    ),
  ],
};

/** The accent ramp follows the active theme — same link, different accent. */
export const Themed: Story = {
  render: (args) => (
    <Box flexDirection="column" gap="$sm" alignItems="flex-start">
      {(["blue", "red", "green", "pink"] as const).map((theme) => (
        <Anchor key={theme} {...args} theme={theme}>
          {theme}
        </Anchor>
      ))}
    </Box>
  ),
};
