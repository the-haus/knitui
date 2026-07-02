import { describe, expect, it } from "vitest";

import { isLayoutProperty, resolvePaintLayout } from "./resolvePaintLayout";

describe("resolvePaintLayout", () => {
  it("returns empty object when nothing is provided", () => {
    expect(resolvePaintLayout()).toEqual({});
  });

  it("converts camelCase style paint keys to spec kebab-case", () => {
    expect(resolvePaintLayout({ circleColor: "red", circleRadius: 4 })).toEqual({
      paint: { "circle-color": "red", "circle-radius": 4 },
    });
  });

  it("routes layout-only style keys to layout, not paint", () => {
    expect(resolvePaintLayout({ visibility: "none", lineCap: "round" })).toEqual({
      layout: { visibility: "none", "line-cap": "round" },
    });
  });

  it("splits a mixed style object across paint and layout", () => {
    expect(resolvePaintLayout({ lineColor: "#000", lineCap: "round" })).toEqual({
      paint: { "line-color": "#000" },
      layout: { "line-cap": "round" },
    });
  });

  it("passes through explicit spec-shaped paint/layout untouched", () => {
    expect(
      resolvePaintLayout(undefined, { "fill-color": "green" }, { visibility: "visible" }),
    ).toEqual({
      paint: { "fill-color": "green" },
      layout: { visibility: "visible" },
    });
  });

  it("merges style into explicit paint/layout with style taking precedence", () => {
    expect(
      resolvePaintLayout({ fillColor: "blue" }, { "fill-color": "red", "fill-opacity": 0.5 }),
    ).toEqual({
      paint: { "fill-color": "blue", "fill-opacity": 0.5 },
    });
  });

  it("preserves expression values verbatim", () => {
    const expr = ["interpolate", ["linear"], ["get", "x"], 0, "blue", 100, "red"];
    expect(resolvePaintLayout({ circleColor: expr })).toEqual({
      paint: { "circle-color": expr },
    });
  });

  it("classifies layout vs paint keys", () => {
    expect(isLayoutProperty("visibility")).toBe(true);
    expect(isLayoutProperty("iconImage")).toBe(true);
    expect(isLayoutProperty("circleColor")).toBe(false);
    expect(isLayoutProperty("fillColor")).toBe(false);
  });
});
