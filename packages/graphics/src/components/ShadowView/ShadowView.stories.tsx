import * as React from "react";
import type { ComponentProps } from "react";

import type { Meta, StoryObj } from "@storybook/react-vite";

import { Text } from "@knitui/components";

// Imported via the platform-split entry (NOT `./ShadowView.web`) so the same
// stories render in the web Storybook AND in the cross-platform demo gallery:
// bundlers resolve `ShadowView.web.tsx` on web and `ShadowView.tsx` on native.
import { ShadowView } from "./ShadowView";

const meta = {
  title: "Graphics/Effects/ShadowView",
  component: ShadowView,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "A drop-in View that renders a drop shadow from React Native's `shadow*` inputs (`shadowColor`, `shadowOffset`, `shadowRadius`, `shadowOpacity`) consistently across platforms. On web it maps to a CSS `box-shadow`; the native counterpart (`ShadowView.native.tsx`) paints the shadow with Skia via `EffectView`, so it works on Android too — which ignores RN's `shadow*` style props natively. Pass the shadow as props or in `style`; on native the props are stripped from the underlying View so iOS doesn't double up. Geometry (size + corner radius) is read off `style`.",
      },
    },
  },
  args: {
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 20,
    shadowOpacity: 0.35,
  },
  render: ({ children, ...args }) => (
    <ShadowView
      {...args}
      style={{
        width: 200,
        height: 120,
        borderRadius: 20,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#ffffff",
        ...args.style,
      }}
    >
      <Text style={{ fontWeight: "600", color: "#0f172a" }}>{children ?? "ShadowView"}</Text>
    </ShadowView>
  ),
} satisfies Meta<typeof ShadowView>;

export default meta;

type Story = StoryObj<ComponentProps<typeof ShadowView>>;

/** A soft drop shadow under the card. */
export const Default: Story = {};

/** A tight, dark shadow offset down-right. */
export const Elevated: Story = {
  args: {
    shadowColor: "#000000",
    shadowOffset: { width: 6, height: 10 },
    shadowRadius: 12,
    shadowOpacity: 0.4,
  },
};

/** An inset shadow painted inside the box. */
export const Inner: Story = {
  args: {
    inner: true,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    shadowOpacity: 0.5,
  },
};

/** A colored glow-like shadow. */
export const Colored: Story = {
  args: {
    shadowColor: "#6366f1",
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 28,
    shadowOpacity: 0.6,
  },
};
