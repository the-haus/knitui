import { describe, expect, it } from "vitest";

import {
  featureCollection,
  isAttributionEnabled,
  pointFeature,
  pressEvent,
  toVisibleBounds,
  viewStateChangeEvent,
} from "./MapView.helpers";

describe("pressEvent", () => {
  it("creates a PressEvent with lngLat and point", () => {
    const result = pressEvent([5.0, 52.0], [100, 200]);
    expect(result.lngLat).toEqual([5.0, 52.0]);
    expect(result.point).toEqual([100, 200]);
  });
});

describe("viewStateChangeEvent", () => {
  const viewState = {
    center: [5.0, 52.0] as [number, number],
    zoom: 10,
    bearing: 45,
    pitch: 30,
    bounds: [4.0, 51.0, 6.0, 53.0] as [number, number, number, number],
  };

  it("creates a ViewStateChangeEvent from ViewState", () => {
    const result = viewStateChangeEvent(viewState, true, false);
    expect(result.center).toEqual([5.0, 52.0]);
    expect(result.zoom).toBe(10);
    expect(result.bearing).toBe(45);
    expect(result.pitch).toBe(30);
    expect(result.bounds).toEqual([4.0, 51.0, 6.0, 53.0]);
    expect(result.animated).toBe(true);
    expect(result.userInteraction).toBe(false);
  });
});

describe("pointFeature", () => {
  it("creates a Point feature with coordinates", () => {
    const result = pointFeature([5.0, 52.0]);
    expect(result.type).toBe("Feature");
    expect(result.geometry.type).toBe("Point");
    expect((result.geometry as GeoJSON.Point).coordinates).toEqual([5.0, 52.0]);
    expect(result.properties).toBeNull();
  });

  it("includes properties when provided", () => {
    const result = pointFeature([5.0, 52.0], { screenPointX: 100, screenPointY: 200 });
    expect(result.properties).toEqual({ screenPointX: 100, screenPointY: 200 });
  });

  it("copies coordinates (no reference sharing)", () => {
    const coords = [5.0, 52.0];
    const result = pointFeature(coords);
    expect((result.geometry as GeoJSON.Point).coordinates).not.toBe(coords);
  });
});

describe("featureCollection", () => {
  it("returns an empty FeatureCollection by default", () => {
    const result = featureCollection();
    expect(result.type).toBe("FeatureCollection");
    expect(result.features).toEqual([]);
  });

  it("wraps provided features", () => {
    const features = [
      {
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [0, 0] },
        properties: null,
      },
    ];
    const result = featureCollection(features);
    expect(result.features).toBe(features);
    expect(result.features).toHaveLength(1);
  });
});

describe("isAttributionEnabled", () => {
  it("returns false for explicit false", () => {
    expect(isAttributionEnabled(false)).toBe(false);
  });

  it("returns true for true", () => {
    expect(isAttributionEnabled(true)).toBe(true);
  });

  it("returns true for undefined", () => {
    expect(isAttributionEnabled(undefined)).toBe(true);
  });

  it("returns true for attribution options object", () => {
    expect(isAttributionEnabled({ compact: true })).toBe(true);
  });
});

describe("toVisibleBounds", () => {
  it("parses valid [northEast, southWest] bounds", () => {
    const result = toVisibleBounds([
      [6.0, 53.0],
      [4.0, 51.0],
    ]);
    expect(result).toEqual([
      [6.0, 53.0],
      [4.0, 51.0],
    ]);
  });

  it("returns null for non-array input", () => {
    expect(toVisibleBounds(null)).toBeNull();
    expect(toVisibleBounds(undefined)).toBeNull();
    expect(toVisibleBounds("invalid")).toBeNull();
  });

  it("returns null for array with fewer than 2 elements", () => {
    expect(toVisibleBounds([[6.0, 53.0]])).toBeNull();
    expect(toVisibleBounds([])).toBeNull();
  });

  it("returns null when positions are invalid", () => {
    expect(
      toVisibleBounds([
        ["bad", 53],
        [4.0, 51.0],
      ]),
    ).toBeNull();
    expect(
      toVisibleBounds([
        [6.0, 53.0],
        [NaN, 51.0],
      ]),
    ).toBeNull();
  });

  it("copies values (no reference sharing)", () => {
    const ne = [6.0, 53.0];
    const sw = [4.0, 51.0];
    const result = toVisibleBounds([ne, sw]);
    expect(result![0]).not.toBe(ne);
    expect(result![1]).not.toBe(sw);
  });
});
