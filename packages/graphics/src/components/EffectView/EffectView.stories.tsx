import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "@knitui/components";

// Imported via the platform-split entry (NOT `./EffectView.web`) so the same
// stories render in the web Storybook AND in the cross-platform demo gallery:
// bundlers resolve `EffectView.web.tsx` on web and `EffectView.tsx` on native.
import { EffectView } from "./EffectView";

const meta = {
  title: "Graphics/Effects/EffectView",
  component: EffectView,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A drop-in `<div>` replacement that paints a stack of Skia effects onto itself. Pass `effects` as one array of `{ effect, ...props }` descriptors — frame paints (`fill`, `border`, `glow`, `shadow`) and component-backed effects (`dottedGrid`, `checkerboard`, `noise`, `image`, `blurredImage`). Array order is stacking order; you pass data, never a component. Geometry (corner radius and size) is read off the element's own `style`. All layers paint into at most two shared Skia canvases (one behind the content, one in front), clipped with a Skia `Group`. A native counterpart (`View.native.tsx`) wraps a React Native `View`.",
      },
    },
  },
  render: ({ children, ...args }) => (
    <EffectView
      {...args}
      style={{
        width: 220,
        height: 130,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        ...args.style,
      }}
    >
      <Text style={{ fontWeight: "600", color: "#e2e8f0" }}>{children ?? "View"}</Text>
    </EffectView>
  ),
} satisfies Meta<typeof EffectView>;

export default meta;

type Story = StoryObj<ComponentProps<typeof EffectView>>;

/** A gradient border offset outward from the box, with a soft drop shadow under it. */
export const Playground: Story = {
  args: {
    style: { backgroundColor: "#0f172a" },
    effects: [
      { effect: "shadow", dy: 16, blur: 32, color: "rgba(99, 102, 241, 0.35)" },
      {
        effect: "border",
        width: 3,
        offset: 6,
        colors: ["#6366f1", "#ec4899", "#f59e0b"],
        angle: 45,
      },
    ],
    children: "Gradient border",
  },
};

/** A conic (sweep) gradient border hugging the box edge. */
export const SweepBorder: Story = {
  args: {
    style: { backgroundColor: "#0b1120" },
    effects: [
      {
        effect: "border",
        type: "sweep",
        width: 4,
        colors: ["#22d3ee", "#a855f7", "#f43f5e", "#22d3ee"],
      },
    ],
    children: "Sweep",
  },
};

/** A Skia gradient `fill` painted into the rounded box, plus a soft glow. */
export const GradientFill: Story = {
  args: {
    effects: [
      { effect: "fill", type: "linear", angle: 135, colors: ["#0ea5e9", "#1e1b4b"] },
      { effect: "glow", blur: 22, spread: 1, opacity: 0.7, color: "#0ea5e9" },
    ],
    children: "Gradient fill",
  },
};

/**
 * Stacking component-backed effects: a `noise` texture and a `dottedGrid` filling
 * the box (clipped to its rounded corners), under a gradient border. One array,
 * bottom-to-top — no components passed in.
 */
export const Layers: Story = {
  args: {
    style: { backgroundColor: "#0b1120" },
    effects: [
      { effect: "noise", opacity: 0.06 },
      { effect: "dottedGrid", gap: 16, color: "rgba(129, 140, 248, 0.35)" },
      { effect: "glow", blur: 18, spread: 1, opacity: 0.6, color: "#818cf8" },
      { effect: "border", width: 2, offset: 4, colors: ["#38bdf8", "#818cf8"], angle: 90 },
    ],
    children: "Layers",
  },
};

/** Everything at once: gradient fill, offset gradient border, outer + inner shadows. */
export const Combined: Story = {
  args: {
    effects: [
      { effect: "fill", type: "radial", colors: ["#1e293b", "#020617"] },
      { effect: "shadow", dy: 18, blur: 36, color: "rgba(129, 140, 248, 0.4)" },
      { effect: "shadow", dy: 2, blur: 8, color: "rgba(255, 255, 255, 0.25)", inner: true },
      {
        effect: "border",
        width: 2,
        offset: 4,
        colors: ["#f472b6", "#818cf8", "#22d3ee"],
        angle: 90,
      },
    ],
    children: "Combined",
  },
};
