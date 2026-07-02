import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Container } from "./Container";

const SIZES = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
const SIZE_CAPS = {
  xxs: 360,
  xs: 540,
  sm: 720,
  md: 960,
  lg: 1140,
  xl: 1320,
  xxl: 1440,
} as const;

const meta = {
  title: "Layout/Container",
  component: Container,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Container is a centered, max-width content wrapper that mirrors Mantine's `Container`. `size` caps the max-width to a named breakpoint or an arbitrary value; `fluid` makes it span the full parent width, ignoring `size`. Centering is handled via automatic horizontal margins.",
      },
    },
  },
  args: {
    size: "md",
    fluid: false,
  },
  argTypes: {
    size: {
      control: "inline-radio",
      options: SIZES,
      description:
        "Caps the max-width to a named breakpoint. Also accepts a raw number or CSS string.",
    },
    fluid: {
      control: "boolean",
      description: "Span the full parent width; wins over `size`'s max-width.",
    },
    paddingHorizontal: { control: false },
  },
} satisfies Meta<typeof Container>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Container>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Container {...args}>
      <Box backgroundColor="$color3" padding="$md" borderRadius="$sm">
        <Text>Container content</Text>
      </Box>
    </Container>
  ),
};

/** All named sizes rendered sequentially to show each max-width cap. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$md">
      {SIZES.map((size) => (
        <Container key={size} {...args} size={size}>
          <Box backgroundColor="$color3" padding="$sm" borderRadius="$sm">
            <Text>{`size="${size}" — maxWidth: ${SIZE_CAPS[size]}px`}</Text>
          </Box>
        </Container>
      ))}
    </Box>
  ),
};

/** Fluid mode — the container spans the full parent width regardless of size. */
export const Fluid: Story = {
  args: { fluid: true },
  render: (args) => (
    <Container {...args}>
      <Box backgroundColor="$color5" padding="$md" borderRadius="$sm">
        <Text>Fluid container — no max-width constraint</Text>
      </Box>
    </Container>
  ),
};

/** A numeric size value sets an arbitrary max-width in pixels. */
export const NumericSize: Story = {
  render: (args) => (
    <Container {...args} size={800}>
      <Box backgroundColor="$color3" padding="$md" borderRadius="$sm">
        <Text>Custom numeric size — maxWidth: 800px</Text>
      </Box>
    </Container>
  ),
};

/** Realistic page layout — header, body copy and a footer inside a centered container. */
export const PageLayout: Story = {
  render: (args) => (
    <Container {...args} size="lg">
      <Box gap="$lg" padding="$md">
        <Box backgroundColor="$color5" padding="$md" borderRadius="$sm">
          <Text fontWeight="bold">Page Header</Text>
        </Box>
        <Box backgroundColor="$color3" padding="$md" borderRadius="$sm">
          <Text>
            Main content area. The container constrains the reading width so long lines of text
            remain comfortable to read on wide viewports.
          </Text>
        </Box>
        <Box backgroundColor="$color5" padding="$md" borderRadius="$sm">
          <Text>Page Footer</Text>
        </Box>
      </Box>
    </Container>
  ),
};

/** Nested containers — an outer fluid wrapper with an inner size-capped container. */
export const Nested: Story = {
  render: (args) => (
    <Container {...args} fluid>
      <Box backgroundColor="$color2" padding="$md">
        <Text>Outer fluid container</Text>
        <Container size="sm">
          <Box backgroundColor="$color5" padding="$md" borderRadius="$sm" marginTop="$sm">
            <Text>Inner size="sm" container (maxWidth: 720px)</Text>
          </Box>
        </Container>
      </Box>
    </Container>
  ),
};
