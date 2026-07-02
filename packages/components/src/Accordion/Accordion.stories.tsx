import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box } from "../Box";
import { Text } from "../Text";
import { Accordion } from "./Accordion";

const VARIANTS = ["default", "contained", "filled", "separated"] as const;

const SHADOWS = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Navigation/Accordion",
  component: Accordion,
  parameters: {
    docs: {
      description: {
        component:
          "Accordion shows collapsible content panels. Compose `Accordion.Item` → `Accordion.Control` + `Accordion.Panel`. Single-open by default; pass `multiple` for several open at once. `variant` styles the container, `chevronPosition`/`chevron` control the indicator, and `order` promotes each control to a real heading level.",
      },
    },
  },
  args: {
    variant: "default",
    chevronPosition: "right",
    multiple: false,
    disableChevronRotation: false,
  },
  argTypes: {
    variant: {
      control: "inline-radio",
      options: VARIANTS,
    },
    chevronPosition: { control: "inline-radio", options: ["left", "right"] },
    multiple: { control: "boolean" },
    disableChevronRotation: { control: "boolean" },
    radius: { control: "text" },
  },
  decorators: [
    (Story) => (
      <Box width={"100%"} maw={380}>
        <Story />
      </Box>
    ),
  ],
} satisfies Meta<typeof Accordion>;

export default meta;

type Story = StoryObj<ComponentProps<typeof Accordion>>;

const items = [
  { value: "apples", label: "Apples", body: "Crisp and sweet." },
  { value: "oranges", label: "Oranges", body: "Citrus and tangy." },
  { value: "pears", label: "Pears", body: "Soft and mellow." },
];

function Items() {
  return (
    <>
      {items.map((it) => (
        <Accordion.Item key={it.value} value={it.value}>
          <Accordion.Control>{it.label}</Accordion.Control>
          <Accordion.Panel>
            <Text>{it.body}</Text>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </>
  );
}

/** Interactive playground — tweak any prop from the Controls panel. */
export const Playground: Story = {
  args: { defaultValue: "apples" },
  render: (args) => (
    <Accordion {...args}>
      <Items />
    </Accordion>
  ),
};

/** Each container variant. */
export const Variants: Story = {
  render: (args) => (
    <Box gap="$lg">
      {VARIANTS.map((variant) => (
        <Accordion key={variant} {...args} variant={variant} defaultValue="apples">
          <Items />
        </Accordion>
      ))}
    </Box>
  ),
};

/**
 * Elevation via the shared `shadow` ladder — inherited from `Box`, so every
 * component accepts it; no shadow unless set.
 */
export const Shadows: Story = {
  render: (args) => (
    <Box gap="$xl">
      {SHADOWS.map((shadow) => (
        <Accordion key={shadow} {...args} shadow={shadow} variant="contained" defaultValue="apples">
          <Items />
        </Accordion>
      ))}
    </Box>
  ),
};

/** Multiple panels open at once. */
export const Multiple: Story = {
  args: { multiple: true, defaultValue: ["apples", "pears"] },
  render: (args) => (
    <Accordion {...args}>
      <Items />
    </Accordion>
  ),
};

/** Chevron pinned to the left of the label. */
export const ChevronLeft: Story = {
  args: { chevronPosition: "left", defaultValue: "apples" },
  render: (args) => (
    <Accordion {...args}>
      <Items />
    </Accordion>
  ),
};

/** A custom chevron glyph replaces the default. */
export const CustomChevron: Story = {
  args: { defaultValue: "apples", chevron: <Text>＋</Text> },
  render: (args) => (
    <Accordion {...args}>
      <Items />
    </Accordion>
  ),
};

/** An icon to the left of each label. */
export const WithIcons: Story = {
  render: (args) => (
    <Accordion {...args} defaultValue="apples">
      {items.map((it) => (
        <Accordion.Item key={it.value} value={it.value}>
          <Accordion.Control icon={<Text>🍎</Text>}>{it.label}</Accordion.Control>
          <Accordion.Panel>
            <Text>{it.body}</Text>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion>
  ),
};

/** A disabled control cannot be toggled. */
export const DisabledControl: Story = {
  render: (args) => (
    <Accordion {...args} defaultValue="apples">
      <Accordion.Item value="apples">
        <Accordion.Control>Enabled</Accordion.Control>
        <Accordion.Panel>
          <Text>Open me.</Text>
        </Accordion.Panel>
      </Accordion.Item>
      <Accordion.Item value="oranges">
        <Accordion.Control disabled>Disabled</Accordion.Control>
        <Accordion.Panel>
          <Text>Unreachable.</Text>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  ),
};

/** `order` promotes each control to a real heading level for screen readers. */
export const HeadingOrder: Story = {
  args: { order: 3, defaultValue: "apples" },
  render: (args) => (
    <Accordion {...args}>
      <Items />
    </Accordion>
  ),
};

/** Controlled — the open item is owned by the parent. */
export const Controlled: Story = {
  render: (args) => {
    const [value, setValue] = React.useState<string | null>("apples");
    return (
      <Box gap="$sm">
        <Accordion
          {...args}
          value={value}
          onChange={(next) => setValue(Array.isArray(next) ? (next[0] ?? null) : next)}
        >
          <Items />
        </Accordion>
        <Text fontSize={12} color="$color11">
          open: {value ?? "—"}
        </Text>
      </Box>
    );
  },
};

/** Representative `size` keys — controls scale the header height and label font. */
export const Sizes: Story = {
  render: (args) => (
    <Box gap="$lg">
      {(["xs", "sm", "md", "lg", "xl"] as const).map((size) => (
        <Accordion key={size} {...args} size={size} defaultValue="apples">
          <Items />
        </Accordion>
      ))}
    </Box>
  ),
};

/** Per-slot `styles` targets individual parts — here the `control`, `label`, and `panel`. */
export const Styles: Story = {
  args: { defaultValue: "apples" },
  render: (args) => (
    <Accordion
      {...args}
      styles={{
        control: { backgroundColor: "$blue3" },
        label: { color: "$blue11", fontWeight: "700" },
        panel: { backgroundColor: "$blue2" },
      }}
    >
      <Items />
    </Accordion>
  ),
};
