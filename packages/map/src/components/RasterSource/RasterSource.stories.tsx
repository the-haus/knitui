import type { Meta, StoryObj } from "@storybook/react-vite";

import { AMSTERDAM, EUROPE_CENTER, STREETS_STYLE } from "../../_storybook-demo";
import { Camera } from "../Camera";
import { Map } from "../MapView";
import { RasterLayer } from "../RasterLayer";
import { RasterSource } from "./index";

const OSM_TILES = ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"];
const OSM_ATTRIBUTION = "© OpenStreetMap contributors";

const meta = {
  title: "Sources/Raster Source",
  component: RasterSource,
  parameters: {
    docs: {
      description: {
        component:
          "`RasterSource` loads slippy-map raster tiles (XYZ `tiles` or a TileJSON `url`) and pairs with a `RasterLayer` to paint them. Use it as a full basemap, or stack it semi-transparently over a vector style for an overlay.",
      },
    },
  },
} satisfies Meta<typeof RasterSource>;

export default meta;
type Story = StoryObj<typeof meta>;

/** OpenStreetMap raster tiles as a full-screen basemap. */
export const OSMTiles: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 4 }} />
      <RasterSource id="osm" tiles={OSM_TILES} tileSize={256} attribution={OSM_ATTRIBUTION}>
        <RasterLayer id="osm-layer" source="osm" />
      </RasterSource>
    </Map>
  ),
};

/** The same OSM tiles at `rasterOpacity: 0.5`, blended over the streets basemap. */
export const SemiTransparentOverlay: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: AMSTERDAM, zoom: 11 }} />
      <RasterSource id="osm-overlay" tiles={OSM_TILES} tileSize={256} attribution={OSM_ATTRIBUTION}>
        <RasterLayer id="osm-overlay-layer" source="osm-overlay" style={{ rasterOpacity: 0.5 }} />
      </RasterSource>
    </Map>
  ),
};
