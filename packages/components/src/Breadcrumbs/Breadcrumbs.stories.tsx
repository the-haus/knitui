import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Anchor } from "../Anchor";
import { Box } from "../Box";
import { Text } from "../Text";
import { Breadcrumbs } from "./Breadcrumbs";

const meta = {
  title: "Navigation/Breadcrumbs",
  component: Breadcrumbs,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          'Breadcrumbs renders a row of navigational crumbs separated by a `separator`. Children are interleaved with the separator — never trailing. String/number crumbs auto-wrap in themed text; element crumbs (e.g. `Anchor`) render as-is. The separator is dimmed via the theme ramp. Renders a semantic `<nav aria-label="Breadcrumb">`.',
      },
    },
  },
  args: {
    "aria-label": "Breadcrumb",
    separator: "/",
    separatorMargin: "$xs",
  },
  argTypes: {
    "aria-label": {
      control: "text",
      description: 'Accessible label for the navigation landmark. Defaults to "Breadcrumb".',
    },
    separator: {
      control: "text",
      description: 'Node placed between crumbs. Defaults to "/".',
    },
    separatorMargin: {
      control: "text",
      description: "Inline spacing around each separator. Tamagui token or CSS value.",
    },
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Breadcrumbs>>;

/** The interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  render: (args) => (
    <Breadcrumbs {...args}>
      <Anchor href="#">Home</Anchor>
      <Anchor href="#">Library</Anchor>
      <Text>Data</Text>
    </Breadcrumbs>
  ),
};

/** Default separator "/" interleaved between crumbs — never trailing. */
export const DefaultSeparator: Story = {
  render: (args) => (
    <Breadcrumbs {...args}>
      <Anchor href="#">Home</Anchor>
      <Anchor href="#">Library</Anchor>
      <Text>Data</Text>
    </Breadcrumbs>
  ),
};

/** A custom string separator in place of the default "/". */
export const CustomStringSeparator: Story = {
  args: { separator: ">" },
  render: (args) => (
    <Breadcrumbs {...args}>
      <Anchor href="#">Home</Anchor>
      <Anchor href="#">Library</Anchor>
      <Text>Data</Text>
    </Breadcrumbs>
  ),
};

/** A React element — such as a unicode glyph — used as the separator. */
export const CustomElementSeparator: Story = {
  args: { separator: <Text>›</Text> },
  render: (args) => (
    <Breadcrumbs {...args}>
      <Anchor href="#">Home</Anchor>
      <Anchor href="#">Library</Anchor>
      <Text>Data</Text>
    </Breadcrumbs>
  ),
};

/** Wider spacing around each separator via a larger token. */
export const LargeSeparatorMargin: Story = {
  args: { separatorMargin: "$lg" },
  render: (args) => (
    <Breadcrumbs {...args}>
      <Anchor href="#">Home</Anchor>
      <Anchor href="#">Library</Anchor>
      <Text>Data</Text>
    </Breadcrumbs>
  ),
};

/** String and number children are auto-wrapped as themed text without extra markup. */
export const StringCrumbs: Story = {
  render: (args) => (
    <Breadcrumbs {...args}>
      {"First"}
      {"Second"}
      {"Third"}
    </Breadcrumbs>
  ),
};

/** A single crumb renders without any separator. */
export const SingleCrumb: Story = {
  render: (args) => (
    <Breadcrumbs {...args}>
      <Text>Home</Text>
    </Breadcrumbs>
  ),
};

/** A custom landmark label distinguishes multiple breadcrumb trails on a page. */
export const CustomAriaLabel: Story = {
  args: { "aria-label": "Product category breadcrumb" },
  render: (args) => (
    <Breadcrumbs {...args}>
      <Anchor href="#">Home</Anchor>
      <Anchor href="#">Products</Anchor>
      <Text>Laptops</Text>
    </Breadcrumbs>
  ),
};

/** A long trail of crumbs wraps to the next line when space is limited. */
export const DeepTrail: Story = {
  decorators: [
    (Story) => (
      <Box width={360}>
        <Story />
      </Box>
    ),
  ],
  render: (args) => (
    <Breadcrumbs {...args}>
      <Anchor href="#">Home</Anchor>
      <Anchor href="#">Products</Anchor>
      <Anchor href="#">Electronics</Anchor>
      <Anchor href="#">Computers</Anchor>
      <Anchor href="#">Laptops</Anchor>
      <Text>Model XYZ</Text>
    </Breadcrumbs>
  ),
};

/** Several breadcrumb trails side by side to compare separator styles. */
export const SeparatorShowcase: Story = {
  render: () => (
    <Box gap="$lg">
      <Breadcrumbs separator="/">
        <Anchor href="#">Home</Anchor>
        <Anchor href="#">Library</Anchor>
        <Text>Current</Text>
      </Breadcrumbs>

      <Breadcrumbs separator=">">
        <Anchor href="#">Home</Anchor>
        <Anchor href="#">Library</Anchor>
        <Text>Current</Text>
      </Breadcrumbs>

      <Breadcrumbs separator="·">
        <Anchor href="#">Home</Anchor>
        <Anchor href="#">Library</Anchor>
        <Text>Current</Text>
      </Breadcrumbs>

      <Breadcrumbs separator={<Text>⭐</Text>}>
        <Anchor href="#">Home</Anchor>
        <Anchor href="#">Library</Anchor>
        <Text>Current</Text>
      </Breadcrumbs>
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `label` crumbs and `separator`. */
export const Styles: Story = {
  args: {
    styles: {
      label: { color: "$blue11", fontWeight: "700" },
      separator: { color: "$red9" },
    },
  },
  render: (args) => (
    <Breadcrumbs {...args}>
      {"Home"}
      {"Library"}
      {"Data"}
    </Breadcrumbs>
  ),
};
