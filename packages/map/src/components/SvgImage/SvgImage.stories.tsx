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
import { SvgImage, SvgImages } from "./SvgImage";

const meta = {
  title: "Sources/SVG Icon",
  component: SvgImage,
  parameters: {
    docs: {
      description: {
        component:
          "`SvgImage` registers an SVG resource as a named MapLibre image so a `SymbolLayer` can draw it as a **fixed-size icon** (`iconImage` + `iconSize`) that stays the same screen size at every zoom level — the usual pin/marker behaviour. SVG resources are rasterized to a bitmap via **react-native-svg on both web and native** (identical output on each platform); the marker is then drawn on the GPU by MapLibre, so a single icon backs thousands of markers with **no per-marker DOM or native view**. Raster resources (a `source` asset, or a non-SVG `uri`) are registered directly.",
      },
    },
  },
} satisfies Meta<typeof SvgImage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A teardrop pin, parameterised by fill colour so we can build an icon set. */
const pin = (fill: string): string => `
<svg viewBox="0 0 24 24">
  <path d="M12 2 C7.6 2 4 5.6 4 10 c0 5.2 8 12 8 12 s8-6.8 8-12 C20 5.6 16.4 2 12 2 Z"
        fill="${fill}" stroke="#ffffff" stroke-width="1.5"/>
  <circle cx="12" cy="10" r="3" fill="#ffffff"/>
</svg>`;

const PIN = pin("#ef4444");

const POINTS: GeoJSON.FeatureCollection = {
  type: "FeatureCollection",
  features: [AMSTERDAM, BERLIN, PARIS].map((coordinates) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates },
    properties: {},
  })),
};

// Deterministic scatter of N points across a [west, south, east, north] box so
// the stories render identically every run (no Math.random). Optionally tag each
// feature with `category` in [0, categories) for data-driven icon selection.
function scatter(
  count: number,
  [west, south, east, north]: [number, number, number, number],
  categories = 1,
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
      properties: { id: i, category: Math.floor(rand() * categories) },
    });
  }
  return { type: "FeatureCollection", features };
}

const EUROPE_BOX: [number, number, number, number] = [-2, 43, 20, 56];
const TEN_THOUSAND = scatter(10_000, EUROPE_BOX);
const TEN_THOUSAND_CATEGORIZED = scatter(10_000, EUROPE_BOX, 3);
const FIFTY_THOUSAND = scatter(50_000, EUROPE_BOX);
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
            iconSize: 1, // 40px icon; pixelRatio only affects crispness, not size
            iconAllowOverlap: true,
            iconAnchor: "bottom",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * The icon is loaded from a URL rather than inline markup. An `.svg` (or
 * `data:image/svg+xml`) URL is fetched and rasterized; here we use a `data:` URL
 * so the story runs offline, but any CORS-enabled `https://…/pin.svg` works the
 * same way.
 */
export const FromUrl: Story = {
  args: { id: "pin", svg: PIN, width: 40, height: 40 },
  render: () => {
    const url = `data:image/svg+xml;utf8,${encodeURIComponent(pin("#2563eb"))}`;
    return (
      <Map mapStyle={STREETS_STYLE}>
        <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 4 }} />
        <SvgImage id="pin" uri={url} width={40} height={40} pixelRatio={2} />
        <GeoJSONSource id="cities" data={POINTS}>
          <SymbolLayer
            id="city-pins"
            source="cities"
            style={{
              iconImage: "pin",
              iconSize: 1,
              iconAllowOverlap: true,
              iconAnchor: "bottom",
            }}
          />
        </GeoJSONSource>
      </Map>
    );
  },
};

/**
 * Several distinct icons registered at once via `SvgImages`, with each marker
 * choosing its icon from its `category` property through a data-driven
 * `iconImage` expression. Still a single GPU `SymbolLayer`.
 */
export const DataDrivenIcons: Story = {
  args: { id: "pin", svg: PIN, width: 32, height: 32 },
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 4 }} />
      <SvgImages
        images={{
          "pin-0": { svg: pin("#ef4444"), width: 32, height: 32, pixelRatio: 2 },
          "pin-1": { svg: pin("#2563eb"), width: 32, height: 32, pixelRatio: 2 },
          "pin-2": { svg: pin("#16a34a"), width: 32, height: 32, pixelRatio: 2 },
        }}
      />
      <GeoJSONSource id="cities" data={scatter(60, EUROPE_BOX, 3)}>
        <SymbolLayer
          id="typed-pins"
          source="cities"
          style={{
            iconImage: expr(["concat", "pin-", ["to-string", ["get", "category"]]]),
            iconSize: 1,
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
            iconSize: 1,
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
 * 10,000 markers across **three** icon types selected by `category`, unclustered.
 * One rasterized bitmap per type, one GPU `SymbolLayer` drawing them all.
 */
export const TenThousandDataDriven: Story = {
  args: { id: "pin", svg: PIN, width: 24, height: 24 },
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 4 }} />
      <SvgImages
        images={{
          "pin-0": { svg: pin("#ef4444"), width: 24, height: 24, pixelRatio: 2 },
          "pin-1": { svg: pin("#2563eb"), width: 24, height: 24, pixelRatio: 2 },
          "pin-2": { svg: pin("#16a34a"), width: 24, height: 24, pixelRatio: 2 },
        }}
      />
      <GeoJSONSource id="markers" data={TEN_THOUSAND_CATEGORIZED}>
        <SymbolLayer
          id="marker-pins"
          source="markers"
          style={{
            iconImage: expr(["concat", "pin-", ["to-string", ["get", "category"]]]),
            iconSize: 1,
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
            iconSize: 1,
            iconAllowOverlap: true,
            iconAnchor: "bottom",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

// ── Performance stress stories ──────────────────────────────────────
// One rasterized bitmap per icon backs every marker, so pixel work is O(icons),
// not O(markers), and MapLibre draws the symbols in a single GPU batch. Note a
// MapLibre limit: a single symbol bucket tops out around ~32k symbols, so past
// ~30k points in one view you MUST cluster (below) rather than draw them all
// unclustered — the 10k unclustered stories above are within that budget.

/**
 * **50,000** markers, **clustered** — the recommended way to show this many
 * points. `supercluster` aggregates dense points into count bubbles that split
 * apart as you zoom in, keeping the visible symbol count low at every zoom and
 * well under MapLibre's per-bucket symbol limit.
 */
export const FiftyThousandClustered: Story = {
  args: { id: "pin", svg: PIN, width: 24, height: 24 },
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 4 }} />
      <SvgImage id="pin" svg={PIN} width={24} height={24} pixelRatio={2} />
      <GeoJSONSource
        id="markers"
        data={FIFTY_THOUSAND}
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
          style={{ iconImage: "pin", iconSize: 1, iconAllowOverlap: true, iconAnchor: "bottom" }}
        />
      </GeoJSONSource>
    </Map>
  ),
};
