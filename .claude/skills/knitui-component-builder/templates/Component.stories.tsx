// Template: rename to <Name>.stories.tsx. CSF3 + Storybook Vite builder.
import type { ComponentProps } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "../Text";
import { Widget } from "./Widget";

const VARIANTS = ["filled", "light", "outline", "subtle", "default"] as const;
const SIZES = ["xs", "sm", "md", "lg", "xl"] as const;

const meta = {
  title: "Inputs/Widget", // slot into the closest EXISTING category — check sibling titles
  component: Widget,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Widget maps `theme`/`variant`/`size` onto the shared palette ramp and control-metrics scale.",
      },
    },
  },
  args: { children: "Widget", variant: "filled", size: "md" },
  argTypes: {
    variant: { control: "select", options: VARIANTS, description: "Visual style" },
    size: { control: "inline-radio", options: SIZES },
    leftSection: { control: false },
    rightSection: { control: false },
  },
} satisfies Meta<typeof Widget>;
export default meta;

type Story = StoryObj<ComponentProps<typeof Widget>>;

/** The Controls playground. Always first, empty args. */
export const Playground: Story = {};

/** Every visual variant. */
export const Variants: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 8 }}>
      {VARIANTS.map((v) => (
        <Widget key={v} {...args} variant={v}>
          {v}
        </Widget>
      ))}
    </div>
  ),
};

/** Every size step. */
export const Sizes: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      {SIZES.map((sz) => (
        <Widget key={sz} {...args} size={sz}>
          {sz}
        </Widget>
      ))}
    </div>
  ),
};

/** Disabled state. */
export const Disabled: Story = { args: { disabled: true } };

/** Recolors from the active theme with no per-component logic. */
export const Themed: Story = {
  render: (args) => (
    <div style={{ display: "flex", gap: 8 }}>
      <Widget {...args} theme="red">
        red
      </Widget>
      <Widget {...args} theme="green">
        green
      </Widget>
    </div>
  ),
};

/** Full variant × size grid for visual regression. */
export const Matrix: Story = {
  render: (args) => (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${SIZES.length}, auto)`, gap: 8 }}>
      {VARIANTS.flatMap((v) =>
        SIZES.map((sz) => (
          <Widget key={`${v}-${sz}`} {...args} variant={v} size={sz}>
            {v}
          </Widget>
        )),
      )}
    </div>
  ),
};

/** Per-slot `styles` targets individual parts — here the `label`. Keep this story LAST. */
export const Styles: Story = {
  args: {
    children: "Continue",
    variant: "default",
    rightSection: <Text>→</Text>,
    styles: {
      label: { color: "$blue11", fontWeight: "700" },
    },
  },
};
