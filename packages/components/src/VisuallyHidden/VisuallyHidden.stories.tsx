import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { VisuallyHidden } from "./VisuallyHidden";

const meta = {
  title: "Display/VisuallyHidden",
  component: VisuallyHidden,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "`VisuallyHidden` renders content that is invisible on screen but remains fully available to assistive technology (screen readers, VoiceOver, TalkBack). On web the standard `sr-only` clip technique is used; on native the node collapses to ~0 layout impact while staying in the accessibility tree. Use it to add screen-reader-only labels, descriptions, or announcements without affecting visual layout.",
      },
    },
  },
  args: {
    children: "Screen reader only text",
  },
  argTypes: {
    children: { control: "text" },
  },
} satisfies Meta<typeof VisuallyHidden>;

export default meta;

type Story = StoryObj<ComponentProps<typeof VisuallyHidden>>;

/** The interactive playground — tweak the children text from the Controls panel. */
export const Playground: Story = {};

/** Demonstrates that content is present in the DOM even though it is invisible; inspect the element to confirm. */
export const HiddenFromSight: Story = {
  render: (args) => (
    <Box gap="$md" alignItems="center">
      <Text>The paragraph below contains hidden text — visible only to assistive technology.</Text>
      <Text>
        Welcome{" "}
        <VisuallyHidden {...args}>
          (this text is hidden from sighted users but read by screen readers)
        </VisuallyHidden>
        !
      </Text>
    </Box>
  ),
  args: {
    children: "(this text is hidden from sighted users but read by screen readers)",
  },
};

/** An icon-only button pattern: the visible icon is accompanied by a VisuallyHidden label for screen readers. */
export const IconButtonLabel: Story = {
  render: (args) => (
    <Box flexDirection="row" gap="$md" alignItems="center">
      <Box
        borderWidth={1}
        borderRadius="$sm"
        padding="$sm"
        flexDirection="row"
        alignItems="center"
        role="button"
        aria-label="Close menu"
      >
        <Text>✕</Text>
        <VisuallyHidden {...args} />
      </Box>
      <Box
        borderWidth={1}
        borderRadius="$sm"
        padding="$sm"
        flexDirection="row"
        alignItems="center"
        role="button"
        aria-label="Search"
      >
        <Text>⭐</Text>
        <VisuallyHidden>Search</VisuallyHidden>
      </Box>
    </Box>
  ),
  args: {
    children: "Close menu",
  },
};

/** Forwarding an id attribute so the hidden text can be referenced via aria-labelledby or aria-describedby. */
export const WithId: Story = {
  render: (args) => (
    <Box gap="$md" alignItems="center">
      <VisuallyHidden {...args} id="sr-description" />
      <Box
        role="group"
        aria-describedby="sr-description"
        borderWidth={1}
        padding="$md"
        borderRadius="$sm"
      >
        <Text>This box is described by a hidden element (id="sr-description").</Text>
      </Box>
    </Box>
  ),
  args: {
    children: "This region contains the main navigation links.",
    id: "sr-description",
  },
};

/** Renders correctly with no children — useful for conditional label patterns that may produce no text. */
export const EmptyChildren: Story = {
  render: () => (
    <Box gap="$md" alignItems="center">
      <Text>The VisuallyHidden below has no children and renders without errors.</Text>
      <VisuallyHidden />
    </Box>
  ),
};

/** Multiple hidden labels used together — each independently available to assistive technology. */
export const MultipleLabels: Story = {
  render: (args) => (
    <Box gap="$md">
      <Box flexDirection="row" alignItems="center" gap="$sm">
        <Text>⭐</Text>
        <VisuallyHidden {...args}>Favourite item</VisuallyHidden>
        <Text>Item A</Text>
      </Box>
      <Box flexDirection="row" alignItems="center" gap="$sm">
        <Text>🔒</Text>
        <VisuallyHidden>Locked item</VisuallyHidden>
        <Text>Item B</Text>
      </Box>
      <Box flexDirection="row" alignItems="center" gap="$sm">
        <Text>✓</Text>
        <VisuallyHidden>Completed item</VisuallyHidden>
        <Text>Item C</Text>
      </Box>
    </Box>
  ),
};
