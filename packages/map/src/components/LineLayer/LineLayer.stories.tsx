import type { Meta, StoryObj } from "@storybook/react-vite";

import { expr, ROUTE_LINE, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { LineLayer } from "../LineLayer";
import { Map } from "../MapView";
import { GeoJSONSource } from "../ShapeSource";

const meta = {
  title: "Layers/Line Layer",
  component: LineLayer,
  parameters: {
    docs: {
      description: {
        component:
          "`LineLayer` strokes `LineString` features. `lineCap` and `lineJoin` control end and corner shape, `lineDasharray` makes dashed strokes, and `lineWidth` (like every paint property) can be a constant or a zoom-driven expression for routes that thicken as you zoom in.",
      },
    },
  },
} satisfies Meta<typeof LineLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

const ROUTE_CENTER: [number, number] = [3.6, 51.0];

/** A simple constant-width stroke along the route. */
export const Basic: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: ROUTE_CENTER, zoom: 5.5 }} />
      <GeoJSONSource id="route" data={ROUTE_LINE}>
        <LineLayer
          id="route-basic"
          source="route"
          style={{
            lineColor: "#ef4444",
            lineWidth: 4,
            lineOpacity: 0.9,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * Data-driven: `lineWidth` is interpolated by `zoom`, so the route is a thin
 * hairline when zoomed out and a bold stroke when zoomed in.
 */
export const DataDriven: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: ROUTE_CENTER, zoom: 5.5 }} />
      <GeoJSONSource id="route" data={ROUTE_LINE}>
        <LineLayer
          id="route-by-zoom"
          source="route"
          style={{
            lineColor: "#2563eb",
            lineWidth: expr(["interpolate", ["linear"], ["zoom"], 4, 1, 12, 12]),
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/** A dashed line — good for boundaries, planned routes, or footpaths. */
export const Dashed: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: ROUTE_CENTER, zoom: 5.5 }} />
      <GeoJSONSource id="route" data={ROUTE_LINE}>
        <LineLayer
          id="route-dashed"
          source="route"
          style={{
            lineColor: "#7c3aed",
            lineWidth: 3,
            lineDasharray: [2, 2],
            lineCap: "butt",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/** A thick, rounded route casing — bold cap and join for a smooth path. */
export const ThickRoute: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: ROUTE_CENTER, zoom: 5.5 }} />
      <GeoJSONSource id="route" data={ROUTE_LINE}>
        <LineLayer
          id="route-thick"
          source="route"
          style={{
            lineColor: "#059669",
            lineWidth: 10,
            lineOpacity: 0.85,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * Styling variations: a soft, blurred glow stroke with a widened gap, layered
 * to read like a highlighted corridor.
 */
export const StylingVariations: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: ROUTE_CENTER, zoom: 5.5 }} />
      <GeoJSONSource id="route" data={ROUTE_LINE}>
        <LineLayer
          id="route-glow"
          source="route"
          style={{
            lineColor: "#f59e0b",
            lineWidth: 6,
            lineOpacity: 0.6,
            lineBlur: 4,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};
