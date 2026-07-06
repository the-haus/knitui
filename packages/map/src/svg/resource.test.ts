import { describe, expect, it } from "vitest";

import { isSvgMarkup, isSvgUri, resolvePassthrough } from "./resource";

describe("isSvgMarkup", () => {
  it("recognizes inline SVG markup", () => {
    expect(isSvgMarkup("<svg viewBox='0 0 1 1'></svg>")).toBe(true);
    expect(isSvgMarkup("  <svg>\n</svg>")).toBe(true);
  });

  it("rejects URLs and non-SVG strings", () => {
    expect(isSvgMarkup("https://x/pin.svg")).toBe(false);
    expect(isSvgMarkup("pin.png")).toBe(false);
  });
});

describe("isSvgUri", () => {
  it("treats .svg URLs (with query/hash) as SVG", () => {
    expect(isSvgUri("https://x/pin.svg")).toBe(true);
    expect(isSvgUri("https://x/pin.svg?v=2")).toBe(true);
    expect(isSvgUri("/assets/pin.SVG#frag")).toBe(true);
  });

  it("treats data:image/svg+xml as SVG and other data URIs as raster", () => {
    expect(isSvgUri("data:image/svg+xml;utf8,<svg/>")).toBe(true);
    expect(isSvgUri("data:image/png;base64,AAAA")).toBe(false);
  });

  it("treats raster URLs as non-SVG", () => {
    expect(isSvgUri("https://x/pin.png")).toBe(false);
    expect(isSvgUri("https://x/pin.jpg?w=48")).toBe(false);
  });
});

describe("resolvePassthrough", () => {
  it("prefers an explicit source over a uri", () => {
    expect(resolvePassthrough(42, "https://x/pin.png")).toBe(42);
    expect(resolvePassthrough({ uri: "x" } as never, "y")).toEqual({ uri: "x" });
  });

  it("passes a raster uri straight through", () => {
    expect(resolvePassthrough(undefined, "https://x/pin.png")).toBe("https://x/pin.png");
  });

  it("does NOT pass an SVG uri through (it must be rasterized)", () => {
    expect(resolvePassthrough(undefined, "https://x/pin.svg")).toBeUndefined();
  });

  it("returns undefined with no source and no uri", () => {
    expect(resolvePassthrough(undefined, undefined)).toBeUndefined();
  });
});
