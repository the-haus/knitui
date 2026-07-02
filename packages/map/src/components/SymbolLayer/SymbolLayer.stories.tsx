import type { Meta, StoryObj } from "@storybook/react-vite";

import { EUROPE_CENTER, EUROPEAN_CITIES, expr, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { Images } from "../Images";
import { Map } from "../MapView";
import { GeoJSONSource } from "../ShapeSource";
import { SymbolLayer } from "../SymbolLayer";

const meta = {
  title: "Layers/Symbol Layer",
  component: SymbolLayer,
  parameters: {
    docs: {
      description: {
        component:
          "`SymbolLayer` places text labels and/or icons at point features. `textField` (commonly an expression reading a feature property) supplies the label; `textHaloColor`/`textHaloWidth` keep it legible over any basemap; `iconImage` references a sprite registered via `<Images>`. Glyphs are loaded from the map style, so use a style that ships a `glyphs` endpoint (e.g. the Carto streets style). It must live inside a source and reference it via `source`.",
      },
    },
  },
} satisfies Meta<typeof SymbolLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Plain text labels reading each city's `name`. */
export const TextLabels: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
      <GeoJSONSource id="cities" data={EUROPEAN_CITIES}>
        <SymbolLayer
          id="city-labels"
          source="cities"
          style={{
            textField: expr(["get", "name"]),
            textSize: 14,
            textColor: "#1e293b",
            textFont: ["Open Sans Regular"],
            textAllowOverlap: true,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * Styled labels with a white halo for legibility over busy areas, offset
 * upward and anchored from the top.
 */
export const HaloLabels: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
      <GeoJSONSource id="cities" data={EUROPEAN_CITIES}>
        <SymbolLayer
          id="city-labels-halo"
          source="cities"
          style={{
            textField: expr(["get", "name"]),
            textSize: 15,
            textColor: "#7c2d12",
            textHaloColor: "#ffffff",
            textHaloWidth: 1.6,
            textFont: ["Open Sans Regular"],
            textOffset: [0, 1],
            textAnchor: "top",
            textAllowOverlap: true,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * An icon registered via `<Images>` placed at each city, with the name labelled
 * beneath it. `iconImage` references the sprite by the key it was registered under.
 */
export const WithIcon: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
      <Images
        images={{
          marker: "https://maplibre.org/maplibre-gl-js/docs/assets/custom_marker.png",
        }}
      />
      <GeoJSONSource id="cities" data={EUROPEAN_CITIES}>
        <SymbolLayer
          id="city-markers"
          source="cities"
          style={{
            iconImage: "marker",
            iconSize: 0.6,
            iconAllowOverlap: true,
            textField: expr(["get", "name"]),
            textSize: 13,
            textColor: "#1e293b",
            textHaloColor: "#ffffff",
            textHaloWidth: 1.4,
            textFont: ["Open Sans Regular"],
            textOffset: [0, 1.4],
            textAnchor: "top",
            textAllowOverlap: true,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};
