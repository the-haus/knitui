import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Card } from "./Card";

const meta = {
  title: "Display/Card",
  component: Card,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Card is a surface container composed with `Card.Header`, `Card.Footer`, and full-bleed `Card.Section` sub-components. `withBorder` adds an outline, `shadow` elevates with a drop shadow, `radius` rounds the corners, and `orientation` switches the main axis.",
      },
    },
  },
  args: {
    withBorder: false,
    shadow: undefined,
    radius: undefined,
    orientation: "vertical",
    padding: "$lg",
  },
  argTypes: {
    withBorder: { control: "boolean", description: "Adds a 1 px border around the card." },
    shadow: {
      control: "select",
      options: [undefined, "xs", "sm", "md", "lg", "xl"],
      description: "Drop-shadow depth token.",
    },
    radius: {
      control: "select",
      options: [undefined, "xs", "sm", "md", "lg", "xl"],
      description: "Border-radius token.",
    },
    orientation: {
      control: "inline-radio",
      options: ["vertical", "horizontal"],
      description: "Main flex axis of the card.",
    },
    padding: {
      control: "select",
      options: ["$xs", "$sm", "$md", "$lg", "$xl"],
      description: "Inner padding token.",
    },
  },
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Card>>;

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Card {...args}>
      <Card.Header>
        <Text fontWeight="600" fontSize="$md">
          Card heading
        </Text>
        <Text fontSize="$sm" color="$color11">
          Supporting subtitle text
        </Text>
      </Card.Header>
      <Text>
        This is the main body of the card. Any content can live here — paragraphs, images, lists, or
        other components.
      </Text>
      <Card.Footer>
        <Text fontSize="$xs" color="$color10">
          Footer note
        </Text>
      </Card.Footer>
    </Card>
  ),
};

/** Card.Header / Card.Footer compound sub-components in a fully composed card. */
export const CompoundAPI: Story = {
  render: (args) => (
    <Card {...args} withBorder>
      <Card.Header>
        <Text fontWeight="700" fontSize="$lg">
          Article title
        </Text>
        <Text fontSize="$sm" color="$color11">
          Published 31 May 2026
        </Text>
      </Card.Header>
      <Text lineHeight="$xl">
        A short excerpt that gives the reader a preview of what this card is about. Keep it concise
        and scannable.
      </Text>
      <Card.Footer>
        <Text fontSize="$xs" color="$color10">
          ⭐ 128 likes
        </Text>
        <Text fontSize="$xs" color="$color10">
          💬 34 comments
        </Text>
      </Card.Footer>
    </Card>
  ),
};

/** Card.Section spans edge-to-edge, negating the card padding; withBorder adds dividers. */
export const WithSections: Story = {
  render: (args) => (
    <Card {...args} withBorder padding="$lg">
      <Card.Section
        backgroundColor="$color4"
        height={140}
        justifyContent="center"
        alignItems="center"
      >
        <Text fontSize="$xxl">🖼️</Text>
      </Card.Section>
      <Text fontWeight="600" fontSize="$md" marginTop="$sm">
        Section with image area
      </Text>
      <Text fontSize="$sm" color="$color11">
        The top section bleeds to the card edges; body content stays inset.
      </Text>
      <Card.Section withBorder inheritPadding paddingVertical="$sm">
        <Text fontSize="$xs" color="$color10">
          ★ Featured content
        </Text>
      </Card.Section>
    </Card>
  ),
};

/** Horizontal orientation lays out children side by side — useful for media + text layouts. */
export const HorizontalOrientation: Story = {
  render: (args) => (
    <Card {...args} orientation="horizontal" withBorder padding="$md">
      <Card.Section
        backgroundColor="$color4"
        width={90}
        justifyContent="center"
        alignItems="center"
      >
        <Text fontSize="$xxl">📦</Text>
      </Card.Section>
      <Box flex={1} gap="$xs">
        <Text fontWeight="600" fontSize="$sm">
          Product name
        </Text>
        <Text fontSize="$sm" color="$color11">
          Short description of the product or item in this card.
        </Text>
        <Text fontSize="$sm" color="$color9" fontWeight="700">
          $29.99
        </Text>
      </Box>
    </Card>
  ),
};

/** Multiple shadow depths side by side — xs through xl. */
export const ShadowDepths: Story = {
  render: (args) => (
    <Box flexDirection="row" flexWrap="wrap" gap="$lg" alignItems="flex-start">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((shadow) => (
        <Card key={shadow} {...args} shadow={shadow} width={150}>
          <Text fontWeight="600" fontSize="$sm">
            shadow="{shadow}"
          </Text>
          <Text fontSize="$xs" color="$color11">
            Elevation level
          </Text>
        </Card>
      ))}
    </Box>
  ),
  decorators: [
    (Story) => (
      <Box padding="$xl">
        <Story />
      </Box>
    ),
  ],
};

/** withBorder outlines the card boundary without adding a shadow. */
export const WithBorder: Story = {
  args: { withBorder: true },
  render: (args) => (
    <Card {...args}>
      <Text fontWeight="600" fontSize="$sm">
        Bordered card
      </Text>
      <Text fontSize="$sm" color="$color11">
        A 1 px border wraps the entire surface, useful when cards sit on a background of the same
        colour.
      </Text>
    </Card>
  ),
};

/** Minimal card with no sub-components — plain body content only. */
export const Plain: Story = {
  render: (args) => (
    <Card {...args} withBorder>
      <Text>
        Sometimes a card is just a padded, rounded surface. No header, no footer, no sections — just
        content inside a container.
      </Text>
    </Card>
  ),
};

/** Per-slot `styles` targets individual parts — here the `header` and `footer`. */
export const Styles: Story = {
  args: {
    styles: {
      header: { backgroundColor: "$blue3", padding: "$sm", borderRadius: "$sm" },
      footer: { backgroundColor: "$red3", padding: "$sm", borderRadius: "$sm" },
    },
  },
  render: (args) => (
    <Card {...args} withBorder>
      <Card.Header>
        <Text fontWeight="600" fontSize="$md">
          Card heading
        </Text>
        <Text fontSize="$sm" color="$color11">
          Supporting subtitle text
        </Text>
      </Card.Header>
      <Text>
        The `header` and `footer` slots tint these regions while the body content stays untouched.
      </Text>
      <Card.Footer>
        <Text fontSize="$xs" color="$color10">
          Footer note
        </Text>
      </Card.Footer>
    </Card>
  ),
};
