import type { FilterSpecification } from "@maplibre/maplibre-gl-style-spec";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  BERLIN,
  BERLIN_SWARM,
  EUROPE_CENTER,
  EUROPEAN_CITIES,
  expr,
  RANDSTAD_POLYGON,
  ROUTE_LINE,
  STREETS_STYLE,
} from "../../_storybook-demo";
import { Camera } from "../Camera";
import { CircleLayer } from "../CircleLayer";
import { FillLayer } from "../FillLayer";
import { LineLayer } from "../LineLayer";
import { Map } from "../MapView";
import { GeoJSONSource } from "../ShapeSource";
import { SymbolLayer } from "../SymbolLayer";

const meta = {
  title: "Sources/GeoJSON Source",
  component: GeoJSONSource,
  // Each story drives the source through its own `render`; this satisfies the
  // required `data` prop for the args-aware story type.
  args: { data: EUROPEAN_CITIES },
  parameters: {
    docs: {
      description: {
        component:
          "`GeoJSONSource` (exported alias of `ShapeSource`) feeds inline GeoJSON — or a URL — into the map. Layers nested inside it reference it via `source` matching the source `id`, so the same data can drive circles, lines, fills, and clustered symbols. Set `cluster` to aggregate dense point sets into count bubbles.",
      },
    },
  },
} satisfies Meta<typeof GeoJSONSource>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Point features rendered as circles, sized by data via a `CircleLayer`. */
export const Points: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: EUROPE_CENTER, zoom: 3.5 }} />
      <GeoJSONSource id="cities" data={EUROPEAN_CITIES}>
        <CircleLayer
          id="cities-circles"
          source="cities"
          style={{
            circleRadius: 7,
            circleColor: "#2563eb",
            circleStrokeColor: "#ffffff",
            circleStrokeWidth: 2,
            circleOpacity: 0.9,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/** A `LineString` route drawn with a styled `LineLayer`. */
export const Route: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: [3.6, 51.0], zoom: 5.5 }} />
      <GeoJSONSource id="route" data={ROUTE_LINE}>
        <LineLayer
          id="route-line"
          source="route"
          style={{
            lineColor: "#ef4444",
            lineWidth: 4,
            lineOpacity: 0.9,
            lineCap: "round",
            lineJoin: "round",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/** A `Polygon` filled and outlined with a `FillLayer`. */
export const Polygon: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: [4.65, 52.15], zoom: 7.5 }} />
      <GeoJSONSource id="randstad" data={RANDSTAD_POLYGON}>
        <FillLayer
          id="randstad-fill"
          source="randstad"
          style={{
            fillColor: "#10b981",
            fillOpacity: 0.35,
            fillOutlineColor: "#047857",
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};

/**
 * Clustering: 400 points aggregated into count bubbles. A `CircleLayer`
 * (filtered to clusters) sizes and colors bubbles via a `step` expression on
 * `point_count`, a `SymbolLayer` prints the count, and a third `CircleLayer`
 * (filtered to non-clustered) draws the individual points.
 */
export const Clustering: Story = {
  render: () => (
    <Map mapStyle={STREETS_STYLE}>
      <Camera initialViewState={{ center: BERLIN, zoom: 9 }} />
      <GeoJSONSource id="swarm" data={BERLIN_SWARM} cluster clusterRadius={50} clusterMaxZoom={14}>
        <CircleLayer
          id="clusters"
          source="swarm"
          filter={["has", "point_count"] satisfies FilterSpecification}
          style={{
            circleColor: expr([
              "step",
              ["get", "point_count"],
              "#51bbd6",
              50,
              "#f1f075",
              150,
              "#f28cb1",
            ]),
            circleRadius: expr(["step", ["get", "point_count"], 16, 50, 22, 150, 30]),
            circleOpacity: 0.85,
          }}
        />
        <SymbolLayer
          id="cluster-counts"
          source="swarm"
          filter={["has", "point_count"] satisfies FilterSpecification}
          style={{
            textField: expr(["get", "point_count_abbreviated"]),
            textFont: ["Open Sans Regular"],
            textSize: 12,
            textColor: "#1f2937",
            textAllowOverlap: true,
          }}
        />
        <CircleLayer
          id="unclustered"
          source="swarm"
          filter={["!", ["has", "point_count"]] as FilterSpecification}
          style={{
            circleColor: "#2563eb",
            circleRadius: 5,
            circleStrokeColor: "#ffffff",
            circleStrokeWidth: 1.5,
          }}
        />
      </GeoJSONSource>
    </Map>
  ),
};
