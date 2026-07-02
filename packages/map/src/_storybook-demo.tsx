/**
 * Shared fixtures for @knitui/map Storybook examples.
 *
 * Not a story file (doesn't match `*.stories.tsx`) and never exported from the
 * package barrel — it only feeds the examples. All tile sources used here are
 * public and keyless (MapLibre demo tiles + Carto basemaps), so every story
 * renders a real map with no configuration.
 */
import type { StyleSpecification } from "@maplibre/maplibre-gl-style-spec";

import { positronStyle } from "./styles/positronStyle";
import type { Expression } from "./types/LayerStyles";

// ── Map styles ──────────────────────────────────────────────────────

/**
 * The bundled styles are vendored JSON blobs whose `version` widens to
 * `number`; cast them to the engine's `StyleSpecification` at the boundary so
 * stories can hand them straight to `mapStyle`.
 */
const asStyle = (s: unknown): StyleSpecification => s as StyleSpecification;

/** Self-contained MapLibre demo tiles (country polygons). */
export const DEMO_STYLE = "https://demotiles.maplibre.org/style.json";

/** Light Carto basemap with streets + labels — good for overlays. */
export const STREETS_STYLE = asStyle(positronStyle);

export { asStyle };

// ── Camera presets ──────────────────────────────────────────────────

export const AMSTERDAM: [number, number] = [4.9041, 52.3676];
export const BERLIN: [number, number] = [13.405, 52.52];
export const PARIS: [number, number] = [2.3522, 48.8566];
export const SF: [number, number] = [-122.4194, 37.7749];
export const EUROPE_CENTER: [number, number] = [8, 50];

// ── Expression helper ───────────────────────────────────────────────

/**
 * MapLibre style expressions are typed as a readonly tuple whose first member
 * is an `ExpressionName`. Array literals don't infer to that tuple, so this
 * cast keeps the call sites terse while still flowing through the typed
 * `style` props (which accept `T | Expression`).
 */
export const expr = (value: readonly unknown[]): Expression => value as unknown as Expression;

// ── Sample data ─────────────────────────────────────────────────────

export type CityProps = { name: string; population: number };

export const EUROPEAN_CITIES: GeoJSON.FeatureCollection<GeoJSON.Point, CityProps> = {
  type: "FeatureCollection",
  features: [
    { name: "Amsterdam", population: 905234, coordinates: AMSTERDAM },
    { name: "Brussels", population: 1208542, coordinates: [4.3517, 50.8503] },
    { name: "Paris", population: 2161000, coordinates: PARIS },
    { name: "Berlin", population: 3769000, coordinates: BERLIN },
    { name: "London", population: 8982000, coordinates: [-0.1276, 51.5072] },
    { name: "Madrid", population: 3223000, coordinates: [-3.7038, 40.4168] },
    { name: "Rome", population: 2873000, coordinates: [12.4964, 41.9028] },
    { name: "Vienna", population: 1897000, coordinates: [16.3738, 48.2082] },
    { name: "Copenhagen", population: 644431, coordinates: [12.5683, 55.6761] },
    { name: "Prague", population: 1309000, coordinates: [14.4378, 50.0755] },
  ].map((c) => ({
    type: "Feature",
    geometry: { type: "Point", coordinates: c.coordinates },
    properties: { name: c.name, population: c.population },
  })),
};

/** Many random points around Berlin — for clustering / heatmap demos. */
export const BERLIN_SWARM: GeoJSON.FeatureCollection<GeoJSON.Point> = {
  type: "FeatureCollection",
  features: Array.from({ length: 400 }, (_, i) => {
    // Deterministic pseudo-scatter so stories are stable across reloads.
    const a = Math.sin(i * 12.9898) * 43758.5453;
    const b = Math.sin(i * 78.233) * 12543.4321;
    const jx = (a - Math.floor(a) - 0.5) * 0.6;
    const jy = (b - Math.floor(b) - 0.5) * 0.4;
    return {
      type: "Feature" as const,
      geometry: { type: "Point" as const, coordinates: [BERLIN[0] + jx, BERLIN[1] + jy] },
      properties: { id: i, weight: (i % 5) + 1 },
    };
  }),
};

/** A simple route line through three cities. */
export const ROUTE_LINE: GeoJSON.Feature<GeoJSON.LineString> = {
  type: "Feature",
  properties: {},
  geometry: {
    type: "LineString",
    coordinates: [AMSTERDAM, [4.3517, 50.8503], PARIS],
  },
};

/** A polygon roughly covering the Netherlands' Randstad. */
export const RANDSTAD_POLYGON: GeoJSON.Feature<GeoJSON.Polygon> = {
  type: "Feature",
  properties: { name: "Randstad" },
  geometry: {
    type: "Polygon",
    coordinates: [
      [
        [4.3, 52.4],
        [5.0, 52.5],
        [5.1, 51.9],
        [4.2, 51.85],
        [4.3, 52.4],
      ],
    ],
  },
};

/** Footprint polygons with a `height` property for 3D extrusion demos. */
export const BUILDING_FOOTPRINTS: GeoJSON.FeatureCollection<GeoJSON.Polygon, { height: number }> = {
  type: "FeatureCollection",
  features: Array.from({ length: 16 }, (_, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    const x = BERLIN[0] + (col - 1.5) * 0.004;
    const y = BERLIN[1] + (row - 1.5) * 0.004;
    const s = 0.0014;
    return {
      type: "Feature" as const,
      properties: { height: 40 + ((i * 37) % 160) },
      geometry: {
        type: "Polygon" as const,
        coordinates: [
          [
            [x - s, y - s],
            [x + s, y - s],
            [x + s, y + s],
            [x - s, y + s],
            [x - s, y - s],
          ],
        ],
      },
    };
  }),
};
