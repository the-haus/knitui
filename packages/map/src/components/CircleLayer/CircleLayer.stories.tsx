import type { Meta, StoryObj } from "@storybook/react-vite";

import { EUROPE_CENTER, EUROPEAN_CITIES, expr, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { CircleLayer } from "../CircleLayer";
import { Map } from "../MapView";
import { GeoJSONSource } from "../ShapeSource";

const meta = {
  title: "Layers/Circle Layer",
  component: CircleLayer,
  parameters: {
    docs: {
      description: {
        component:
          "`CircleLayer` renders point features as filled circles. Each paint property — `circleRadius`, `circleColor`, `circleStrokeColor`, `circleOpacity` — accepts a constant or a data-driven expression, so circles can be styled per-feature or by zoom. It must live inside a source and reference it via `source`.",
      },
    },
  },
} satisfies Meta<typeof CircleLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A single constant style applied to every point. */
export const Basic: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
      <GeoJSONSource id="cities" data={EUROPEAN_CITIES}>
        <CircleLayer
          id="cities-circles"
          source="cities"
          style={{
            circleRadius: 8,
            circleColor: "#2563eb",
            circleOpacity: 0.85,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * Data-driven: both radius and color are interpolated from each city's
 * `population`, so larger cities render as bigger, darker circles.
 */
export const DataDriven: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
      <GeoJSONSource id="cities" data={EUROPEAN_CITIES}>
        <CircleLayer
          id="cities-by-population"
          source="cities"
          style={{
            circleRadius: expr([
              "interpolate",
              ["linear"],
              ["get", "population"],
              500000,
              5,
              9000000,
              28,
            ]),
            circleColor: expr([
              "interpolate",
              ["linear"],
              ["get", "population"],
              500000,
              "#90caf9",
              3000000,
              "#1565c0",
            ]),
            circleOpacity: 0.8,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/** Stroked circles: a white halo plus a colored ring around each point. */
export const Stroked: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
      <GeoJSONSource id="cities" data={EUROPEAN_CITIES}>
        <CircleLayer
          id="cities-stroked"
          source="cities"
          style={{
            circleRadius: 10,
            circleColor: "#f97316",
            circleOpacity: 0.9,
            circleStrokeColor: "#ffffff",
            circleStrokeWidth: 3,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * Styling variations: a soft, blurred glow with a translucent fill and a
 * thin tinted stroke — useful for ambient / heatmap-like point markers.
 */
export const StylingVariations: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
      <GeoJSONSource id="cities" data={EUROPEAN_CITIES}>
        <CircleLayer
          id="cities-glow"
          source="cities"
          style={{
            circleRadius: 16,
            circleColor: "#a855f7",
            circleOpacity: 0.45,
            circleBlur: 0.8,
            circleStrokeColor: "#7c3aed",
            circleStrokeWidth: 1,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};
