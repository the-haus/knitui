import type { Meta, StoryObj } from "@storybook/react-vite";

import { BERLIN, BUILDING_FOOTPRINTS, expr, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { FillExtrusionLayer } from "../FillExtrusionLayer";
import { Light } from "../Light";
import { Map } from "../MapView";
import { GeoJSONSource } from "../ShapeSource";

const meta = {
  title: "Layers/Light",
  component: Light,
  parameters: {
    docs: {
      description: {
        component:
          "`Light` configures the global illumination used to shade 3D `FillExtrusion` geometry. It takes no source and is added as a direct child of `<Map>`, affecting every extrusion layer at once. `anchor` ties the light to the `map` or the `viewport`, `position` is a radial `[r, azimuth, polar]` direction, and `color`/`intensity` set its tone and strength.",
      },
    },
  },
} satisfies Meta<typeof Light>;

export default meta;
type Story = StoryObj<typeof meta>;

const Buildings = () => (
  <GeoJSONSource id="buildings" data={BUILDING_FOOTPRINTS}>
    <FillExtrusionLayer
      id="buildings-3d"
      source="buildings"
      style={{
        fillExtrusionColor: "#c9d6e2",
        fillExtrusionHeight: expr(["get", "height"]),
        fillExtrusionBase: 0,
        fillExtrusionOpacity: 1,
      }}
    />
  </GeoJSONSource>
);

/** Default-ish overhead light: high intensity, neutral color, anchored to the viewport. */
export const Overhead: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: BERLIN, zoom: 15, pitch: 50, bearing: -20 }} />
      <Light
        style={{
          anchor: "viewport",
          color: "#ffffff",
          intensity: 0.8,
          position: [1.5, 0, 30],
        }}
      />
      <Buildings />
    </Map>
  ),
};

/**
 * A warm, low, side-angled light — the lower polar angle and amber color cast
 * longer, sunset-like shading across the same buildings.
 */
export const WarmLowAngle: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: BERLIN, zoom: 15, pitch: 50, bearing: -20 }} />
      <Light
        style={{
          anchor: "map",
          color: "#ff9d4d",
          intensity: 0.6,
          position: [1.5, 210, 75],
        }}
      />
      <Buildings />
    </Map>
  ),
};

/**
 * A dim, cool light — low intensity with a blue tint produces flatter, moodier
 * shading.
 */
export const CoolDim: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: BERLIN, zoom: 15, pitch: 50, bearing: 40 }} />
      <Light
        style={{
          anchor: "viewport",
          color: "#9db8ff",
          intensity: 0.35,
          position: [1.5, 120, 50],
        }}
      />
      <Buildings />
    </Map>
  ),
};
