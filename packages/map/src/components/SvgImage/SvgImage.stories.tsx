import type { FilterSpecification } from "@maplibre/maplibre-gl-style-spec";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  AMSTERDAM,
  BERLIN,
  EUROPE_CENTER,
  expr,
  PARIS,
  STREETS_STYLE,
} from "../../_storybook-demo";
import { Camera } from "../Camera";
import { CircleLayer } from "../CircleLayer";
import { Map } from "../MapView";
import { GeoJSONSource } from "../ShapeSource";
import { SymbolLayer } from "../SymbolLayer";
import { SvgImage } from "./SvgImage";

const meta = {
  title: "Sources/SVG Icon",
  component: SvgImage,
  parameters: {
    docs: {
      description: {
        component:
          "`SvgImage` registers an SVG as a named MapLibre image so a `SymbolLayer` can draw it as a **fixed-size icon** (`iconImage` + `iconSize`) that stays the same screen size at every zoom level — the usual pin/marker behaviour. On web the SVG rasterizes from a data URI; on native pass a raster `source` (PNG), since MapLibre native can't decode SVG icons.",
      },
    },
  },
} satisfies Meta<typeof SvgImage>;

export default meta;
type Story = StoryObj<typeof meta>;

const PIN = `
<svg viewBox="0 0 24 24">
  <path d="M12 2 C7.6 2 4 5.6 4 10 c0 5.2 8 12 8 12 s8-6.8 8-12 C20 5.6 16.4 2 12 2 Z"
        fill="#ef4444" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="12" cy="10" r="3" fill="#ffffff"/>
</svg>`;

const POINTS: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [AMSTERDAM, BERLIN, PARIS].map((coordinates) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates },
    properties: {},
  })),
};

// Deterministic scatter of N points across a [west, south, east, north] box so
// the stories render identically every run (no Math.random).
function scatter(
  count: number,
  [west, south, east, north]: [number, number, number, number],
): GeoJSON.FeatureCollection {
  let seed = 0x2f6e2b1;
  const rand = (): number => {
    // Mulberry32 PRNG — stable, well-distributed.
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const features: GeoJSON.Feature[] = [];
  for (let i = 0; i < count; i++) {
    features.push({
      type: "Feature",
      id: i,
      geometry: {
        type: "Point",
        coordinates: [west + rand() * (east - west), south + rand() * (north - south)],
      },
      properties: { id: i },
    });
  }
  return { type: "FeatureCollection", features };
}

const EUROPE_BOX: [number, number, number, number] = [-2, 43, 20, 56];
const TEN_THOUSAND = scatter(10_000, EUROPE_BOX);
const HAS_COUNT = ["has", "point_count"] as FilterSpecification;
const NO_COUNT = ["!", ["has", "point_count"]] as FilterSpecification;

/**
 * The SVG pin is drawn as a 40px icon at three cities. Zoom in/out — the pins
 * keep their pixel size instead of scaling with the map.
 */
export const FixedSizeIcons: Story = {
  args: { id: "pin", svg: PIN, width: 40, height: 40 },
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 4 }} />
      <SvgImage id="pin" svg={PIN} width={40} height={40} pixelRatio={2} />
      <GeoJSONSource id="cities" data={POINTS}>
        <SymbolLayer
          id="city-pins"
          source="cities"
          style={{
            iconImage: "pin",
            iconSize: 0.5, // bitmap is 2× (pixelRatio) → 40px on screen
            iconAllowOverlap: true,
            iconAnchor: "bottom",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * 10,000 SVG-icon markers, **unclustered** — every point is its own symbol.
 * `iconAllowOverlap`/`iconIgnorePlacement` keep them all visible (no collision
 * thinning), which is the stress case for this many symbols.
 */
export const TenThousandMarkers: Story = {
  args: { id: "pin", svg: PIN, width: 24, height: 24 },
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 4 }} />
      <SvgImage id="pin" svg={PIN} width={24} height={24} pixelRatio={2} />
      <GeoJSONSource id="markers" data={TEN_THOUSAND}>
        <SymbolLayer
          id="marker-pins"
          source="markers"
          style={{
            iconImage: "pin",
            iconSize: 0.5,
            iconAllowOverlap: true,
            iconIgnorePlacement: true,
            iconAnchor: "bottom",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * The same 10,000 points, **clustered**. The source aggregates dense points into
 * count bubbles (`cluster`); a `CircleLayer` + `SymbolLayer` render the clusters
 * (sized/colored by `point_count`), and individual leaves fall back to the SVG
 * pin. Zoom in to break clusters apart.
 */
export const TenThousandClustered: Story = {
  args: { id: "pin", svg: PIN, width: 24, height: 24 },
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 4 }} />
      <SvgImage id="pin" svg={PIN} width={24} height={24} pixelRatio={2} />
      <GeoJSONSource
        id="markers"
        data={TEN_THOUSAND}
        cluster
        clusterRadius={50}
        clusterMaxZoom={14}
      >
        <CircleLayer
          id="clusters"
          source="markers"
          filter={HAS_COUNT}
          style={{
            circleColor: expr([
              "step",
              ["get", "point_count"],
              "#51bbd6",
              100,
              "#f1f075",
              750,
              "#f28cb1",
            ]),
            circleRadius: expr(["step", ["get", "point_count"], 16, 100, 24, 750, 32]),
            circleOpacity: 0.85,
            circleStrokeColor: "#ffffff",
            circleStrokeWidth: 1.5,
          }}
        />
        <SymbolLayer
          id="cluster-counts"
          source="markers"
          filter={HAS_COUNT}
          style={{
            textField: expr(["get", "point_count_abbreviated"]),
            textFont: ["Open Sans Regular"],
            textSize: 12,
            textColor: "#1f2937",
            textAllowOverlap: true,
          }}
        />
        <SymbolLayer
          id="unclustered-pins"
          source="markers"
          filter={NO_COUNT}
          style={{
            iconImage: "pin",
            iconSize: 0.5,
            iconAllowOverlap: true,
            iconAnchor: "bottom",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};
