import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_STYLE, EUROPE_CENTER, STREETS_STYLE } from "../../_storybook-demo";
import { BackgroundLayer } from "../BackgroundLayer";
import { Camera } from "../Camera";
import { Map } from "../MapView";

const meta = {
  title: "Layers/Background Layer",
  component: BackgroundLayer,
  parameters: {
    docs: {
      description: {
        component:
          "`BackgroundLayer` paints a solid color (or pattern) across the entire map viewport. It is the one layer with **no source** — it has nothing to reference and is added as a direct child of `<Map>`. Drawn first it acts as a backdrop beneath other layers; with a translucent `backgroundColor` it tints whatever sits below it.",
      },
    },
  },
} satisfies Meta<typeof BackgroundLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A solid background color filling the map — no tiles, just a flat backdrop. */
export const SolidColor: Story = {
  render: () => (
    <Map mapStyle={DEMO_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
      <BackgroundLayer
        id="solid-bg"
        style={{
          backgroundColor: "#0f172a",
        }}
      />
    </Map>
  ),
};

/**
 * A semi-transparent tint laid over the basemap — useful for dimming or
 * warming the map without hiding it.
 */
export const TranslucentTint: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
      <BackgroundLayer
        id="tint-bg"
        style={{
          backgroundColor: "rgba(37, 99, 235, 0.25)",
        }}
      />
    </Map>
  ),
};
