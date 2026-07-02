import type { Meta, StoryObj } from "@storybook/react-vite";

import { expr, RANDSTAD_POLYGON, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { FillLayer } from "../FillLayer";
import { Map } from "../MapView";
import { GeoJSONSource } from "../ShapeSource";

const meta = {
  title: "Layers/Fill Layer",
  component: FillLayer,
  parameters: {
    docs: {
      description: {
        component:
          "`FillLayer` paints the interior of `Polygon` features. `fillColor` and `fillOpacity` set the fill, `fillOutlineColor` adds a 1px crisp edge, and `fillColor` can be a data-driven expression to choropleth-shade regions by a property.",
      },
    },
  },
} satisfies Meta<typeof FillLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Local fixture: three side-by-side regions, each with a `density` value, to
 * demonstrate property-driven choropleth shading.
 */
const REGIONS: GeoJSON.FeatureCollection<GeoJSON.Polygon, { name: string; density: number }> = {
  type: "FeatureCollection",
  features: [
    { name: "West", density: 200, x: 4.0 },
    { name: "Mid", density: 1200, x: 4.8 },
    { name: "East", density: 2600, x: 5.6 },
  ].map((r) => ({
    type: "Feature" as const,
    properties: { name: r.name, density: r.density },
    geometry: {
      type: "Polygon" as const,
      coordinates: [
        [
          [r.x, 52.4],
          [r.x + 0.7, 52.4],
          [r.x + 0.7, 51.9],
          [r.x, 51.9],
          [r.x, 52.4],
        ],
      ],
    },
  })),
};

const RANDSTAD_CENTER: [number, number] = [4.65, 52.15];

/** A single translucent fill over one polygon. */
export const Basic: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: RANDSTAD_CENTER, zoom: 7.5 }} />
      <GeoJSONSource id="randstad" data={RANDSTAD_POLYGON}>
        <FillLayer
          id="randstad-basic"
          source="randstad"
          style={{
            fillColor: "#10b981",
            fillOpacity: 0.35,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * Data-driven: `fillColor` is interpolated from each region's `density`,
 * producing a choropleth from pale to deep red.
 */
export const DataDriven: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: [4.8, 52.15], zoom: 7.2 }} />
      <GeoJSONSource id="regions" data={REGIONS}>
        <FillLayer
          id="regions-choropleth"
          source="regions"
          style={{
            fillColor: expr([
              "interpolate",
              ["linear"],
              ["get", "density"],
              200,
              "#fee5d9",
              1200,
              "#fc9272",
              2600,
              "#de2d26",
            ]),
            fillOpacity: 0.7,
            fillOutlineColor: "#ffffff",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/** A fill with a contrasting outline color to crisply delineate the polygon. */
export const WithOutline: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: RANDSTAD_CENTER, zoom: 7.5 }} />
      <GeoJSONSource id="randstad" data={RANDSTAD_POLYGON}>
        <FillLayer
          id="randstad-outline"
          source="randstad"
          style={{
            fillColor: "#3b82f6",
            fillOpacity: 0.25,
            fillOutlineColor: "#1d4ed8",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * Styling variations: a near-solid, high-opacity fill with antialiasing
 * disabled for a flat, poster-like region block.
 */
export const StylingVariations: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: RANDSTAD_CENTER, zoom: 7.5 }} />
      <GeoJSONSource id="randstad" data={RANDSTAD_POLYGON}>
        <FillLayer
          id="randstad-solid"
          source="randstad"
          style={{
            fillColor: "#f59e0b",
            fillOpacity: 0.85,
            fillAntialias: false,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};
