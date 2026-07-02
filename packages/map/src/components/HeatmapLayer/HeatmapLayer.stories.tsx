import type { Meta, StoryObj } from "@storybook/react-vite";

import { BERLIN, BERLIN_SWARM, expr, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { HeatmapLayer } from "../HeatmapLayer";
import { Map } from "../MapView";
import { GeoJSONSource } from "../ShapeSource";

const meta = {
  title: "Layers/Heatmap Layer",
  component: HeatmapLayer,
  parameters: {
    docs: {
      description: {
        component:
          "`HeatmapLayer` renders point density as a smooth, color-graded surface. `heatmapWeight` weights individual points, `heatmapRadius` controls the blur kernel, `heatmapIntensity` scales the overall signal, and `heatmapColor` maps the `heatmap-density` ramp (0 → 1) to colors. It must live inside a source and reference it via `source`.",
      },
    },
  },
} satisfies Meta<typeof HeatmapLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A density heatmap from ~400 scattered points around Berlin. */
export const Density: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: BERLIN, zoom: 10.5 }} />
      <GeoJSONSource id="swarm" data={BERLIN_SWARM}>
        <HeatmapLayer
          id="swarm-heat"
          source="swarm"
          style={{
            heatmapWeight: expr(["interpolate", ["linear"], ["get", "weight"], 0, 0, 5, 1]),
            heatmapRadius: 20,
            heatmapIntensity: 1,
            heatmapOpacity: 0.8,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/** Larger radius and higher intensity produce a softer, hotter bloom. */
export const RadiusAndIntensity: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: BERLIN, zoom: 10.5 }} />
      <GeoJSONSource id="swarm" data={BERLIN_SWARM}>
        <HeatmapLayer
          id="swarm-heat-strong"
          source="swarm"
          style={{
            heatmapWeight: expr(["interpolate", ["linear"], ["get", "weight"], 0, 0, 5, 1]),
            heatmapRadius: 45,
            heatmapIntensity: 2.5,
            heatmapOpacity: 0.85,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * A custom `heatmapColor` ramp: transparent blue at low density rising through
 * royal blue, lime and yellow to red at the hottest cores.
 */
export const CustomColorRamp: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: BERLIN, zoom: 10.5 }} />
      <GeoJSONSource id="swarm" data={BERLIN_SWARM}>
        <HeatmapLayer
          id="swarm-heat-ramp"
          source="swarm"
          style={{
            heatmapWeight: expr(["interpolate", ["linear"], ["get", "weight"], 0, 0, 5, 1]),
            heatmapRadius: 30,
            heatmapIntensity: 1.5,
            heatmapOpacity: 0.85,
            heatmapColor: expr([
              "interpolate",
              ["linear"],
              ["heatmap-density"],
              0,
              "rgba(0,0,255,0)",
              0.2,
              "royalblue",
              0.5,
              "lime",
              0.8,
              "yellow",
              1,
              "red",
            ]),
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};
