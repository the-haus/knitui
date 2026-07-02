import * as React from "react";
import type { ComponentProps } from "react";

import { Canvas, Circle, Fill, vec } from "@shopify/react-native-skia";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { Box, Text } from "@knitui/components";

import { useGraphicsReady } from "./GraphicsContext";
import { GraphicsProvider } from "./GraphicsProvider";

function ReadyBadge() {
  const ready = useGraphicsReady();
  return (
    <Text fontSize={13} style={{ color: ready ? "#16a34a" : "#b45309" }}>
      Skia runtime: <Text fontWeight="700">{ready ? "ready" : "loading…"}</Text>
    </Text>
  );
}

const meta = {
  title: "Graphics/Core/GraphicsProvider",
  component: GraphicsProvider,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Initializes the Skia graphics runtime. On native it's a pass-through (Skia is linked into the app); on web it loads the CanvasKit WASM blob and renders `fallback` until it's ready, exposing the state via `useGraphicsReady()`. Wrap your app once, near the root — every graphics component must render beneath it on web. (Storybook already wraps all stories in one, so this is just for illustration.)",
      },
    },
  },
  argTypes: {
    children: { control: false },
    fallback: { control: false },
    locateFile: { control: false },
  },
  render: () => (
    <GraphicsProvider fallback={<Text>Loading Skia…</Text>}>
      <Box gap={12} alignItems="center">
        <ReadyBadge />
        <Canvas style={{ width: 160, height: 160 }}>
          <Fill color="#0f172a" />
          <Circle c={vec(80, 80)} r={48} color="#38bdf8" />
        </Canvas>
      </Box>
    </GraphicsProvider>
  ),
} satisfies Meta<typeof GraphicsProvider>;

export default meta;

type Story = StoryObj<ComponentProps<typeof GraphicsProvider>>;

export const Usage: Story = {};
