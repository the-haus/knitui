import type { Meta, StoryObj } from "@storybook/react-vite";

import { BERLIN, BUILDING_FOOTPRINTS, expr, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { FillExtrusionLayer } from "../FillExtrusionLayer";
import { Light } from "../Light";
import { Map } from "../MapView";
import { GeoJSONSource } from "../ShapeSource";

const meta = {
  title: "Layers/Fill Extrusion Layer",
  component: FillExtrusionLayer,
  parameters: {
    docs: {
      description: {
        component:
          "`FillExtrusionLayer` renders polygons as extruded 3D volumes. `fillExtrusionHeight` (and optional `fillExtrusionBase`) drive each shape's vertical extent — typically from a data-driven `height` property — and are best viewed with a tilted `Camera` (`pitch`/`bearing`). Shading responds to the map's `<Light>`. It must live inside a source and reference it via `source`.",
      },
    },
  },
} satisfies Meta<typeof FillExtrusionLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 3D buildings extruded by each footprint's `height` property, viewed at a tilt. */
export const Buildings3D: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: BERLIN, zoom: 15, pitch: 50, bearing: -20 }} />
      <GeoJSONSource id="buildings" data={BUILDING_FOOTPRINTS}>
        <FillExtrusionLayer
          id="buildings-3d"
          source="buildings"
          style={{
            fillExtrusionColor: "#9fb3c8",
            fillExtrusionHeight: expr(["get", "height"]),
            fillExtrusionBase: 0,
            fillExtrusionOpacity: 0.9,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/** Height-driven color ramp: shorter buildings are light, taller ones deepen to blue. */
export const ColoredByHeight: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: BERLIN, zoom: 15, pitch: 50, bearing: 30 }} />
      <GeoJSONSource id="buildings" data={BUILDING_FOOTPRINTS}>
        <FillExtrusionLayer
          id="buildings-colored"
          source="buildings"
          style={{
            fillExtrusionColor: expr([
              "interpolate",
              ["linear"],
              ["get", "height"],
              0,
              "#d6eaff",
              200,
              "#1565c0",
            ]),
            fillExtrusionHeight: expr(["get", "height"]),
            fillExtrusionBase: 0,
            fillExtrusionOpacity: 0.95,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * The same extrusions paired with a `<Light>`: a warm, low-anchored directional
 * light shifts how the building faces are shaded.
 */
export const WithLight: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: BERLIN, zoom: 15, pitch: 50, bearing: -20 }} />
      <Light
        style={{
          anchor: "viewport",
          color: "#ffe6c2",
          intensity: 0.7,
          position: [1.5, 90, 60],
        }}
      />
      <GeoJSONSource id="buildings" data={BUILDING_FOOTPRINTS}>
        <FillExtrusionLayer
          id="buildings-lit"
          source="buildings"
          style={{
            fillExtrusionColor: "#c9d6e2",
            fillExtrusionHeight: expr(["get", "height"]),
            fillExtrusionBase: 0,
            fillExtrusionOpacity: 1,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};
