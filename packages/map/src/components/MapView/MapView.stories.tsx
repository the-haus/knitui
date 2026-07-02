import type { Meta, StoryObj } from "@storybook/react-vite";

import { AMSTERDAM, DEMO_STYLE, EUROPE_CENTER, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { Map } from "./index";

const meta = {
  title: "Map/MapView",
  component: Map,
  parameters: {
    docs: {
      description: {
        component:
          "`Map` is the cross-platform container. The same JSX renders via `maplibre-gl` on web and `@maplibre/maplibre-react-native` on native — the public props are RN-first and never leak engine types. Children (`Camera`, sources, layers, markers) configure the map through context.",
      },
    },
  },
  args: {
    mapStyle: DEMO_STYLE,
    compass: true,
    attribution: true,
    logo: false,
    scaleBar: false,
    dragPan: true,
    touchZoom: true,
    touchRotate: true,
    touchPitch: true,
  },
  argTypes: {
    mapStyle: {
      control: "select",
      options: ["demo", "streets"],
      mapping: { demo: DEMO_STYLE, streets: STREETS_STYLE },
      description: "MapLibre style URL or JSON style object.",
    },
    compass: { control: "boolean", description: "Show the compass ornament." },
    attribution: { control: "boolean", description: "Show the attribution control." },
    logo: { control: "boolean" },
    scaleBar: { control: "boolean" },
    dragPan: { control: "boolean" },
    touchZoom: { control: "boolean" },
    touchRotate: { control: "boolean" },
    touchPitch: { control: "boolean" },
  },
} satisfies Meta<typeof Map>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The simplest possible map — a style and an initial camera position. */
export const Basic: Story = {
  render: (args) => (
    <Map {...args}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
    </Map>
  ),
};

/** A vector basemap with streets and labels (Carto Positron). */
export const StreetsBasemap: Story = {
  args: { mapStyle: STREETS_STYLE },
  render: (args) => (
    <Map {...args}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 12 }} />
    </Map>
  ),
};

/** Ornaments toggled off for an embedded / minimal look. */
export const Minimal: Story = {
  args: { compass: false, attribution: false, logo: false, scaleBar: false },
  render: (args) => (
    <Map {...args}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
    </Map>
  ),
};

/** Gestures disabled — a static, non-interactive map. */
export const Static: Story = {
  args: {
    dragPan: false,
    touchZoom: false,
    touchRotate: false,
    touchPitch: false,
    doubleTapZoom: false,
  },
  render: (args) => (
    <Map {...args}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
    </Map>
  ),
};
