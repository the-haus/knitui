import { describe, expect, it } from "vitest";

import { resolveSvgSize, svgToImageDataUri } from "./svgToImage";

function decode(uri: string): string {
  return decodeURIComponent(uri.replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));
}

describe("svgToImageDataUri", () => {
  it("returns an svg+xml data URI", () => {
    const uri = svgToImageDataUri(`<svg viewBox="0 0 24 24"><rect width="24" height="24"/></svg>`);
    expect(uri.startsWith("data:image/svg+xml;charset=utf-8,")).toBe(true);
    expect(decode(uri)).toContain("<svg");
  });

  it("sizes the root svg from explicit options", () => {
    const uri = svgToImageDataUri(`<svg viewBox="0 0 24 24"><rect width="24" height="24"/></svg>`, {
      width: 48,
      height: 48,
    });
    const svg = decode(uri);
    expect(svg).toContain('width="48"');
    expect(svg).toContain('height="48"');
    expect(svg).toContain('viewBox="0 0 24 24"'); // preserved so content scales
  });

  it("applies pixelRatio to the bitmap size", () => {
    const uri = svgToImageDataUri(`<svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg>`, {
      width: 20,
      pixelRatio: 2,
    });
    expect(decode(uri)).toContain('width="40"');
  });

  it("falls back to intrinsic size from the viewBox", () => {
    const uri = svgToImageDataUri(`<svg viewBox="0 0 32 16"><rect width="32" height="16"/></svg>`);
    const svg = decode(uri);
    expect(svg).toContain('width="32"');
    expect(svg).toContain('height="16"');
  });

  it("injects the SVG namespace so browsers can decode the <img>", () => {
    // Without xmlns the browser silently fails to load the data URI.
    const uri = svgToImageDataUri(`<svg viewBox="0 0 10 10"><rect width="10" height="10"/></svg>`);
    expect(decode(uri)).toContain('xmlns="http://www.w3.org/2000/svg"');
  });

  it("adds xmlns:xlink when the markup uses xlink", () => {
    const uri = svgToImageDataUri(`<svg viewBox="0 0 10 10"><use xlink:href="#a"/></svg>`);
    expect(decode(uri)).toContain('xmlns:xlink="http://www.w3.org/1999/xlink"');
  });

  it("does not duplicate an existing namespace", () => {
    const uri = svgToImageDataUri(
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10"/></svg>`,
    );
    const matches = decode(uri).match(/xmlns=/g) ?? [];
    expect(matches).toHaveLength(1);
  });

  it("resolveSvgSize derives pixel size from viewBox × pixelRatio", () => {
    expect(resolveSvgSize(`<svg viewBox="0 0 24 12"/>`, { pixelRatio: 2 })).toMatchObject({
      width: 48,
      height: 24,
      viewBox: "0 0 24 12",
    });
    expect(resolveSvgSize(`<svg viewBox="0 0 10 10"/>`, { width: 40 })).toMatchObject({
      width: 40,
      height: 10,
    });
  });

  it("injects a viewBox when missing so content scales", () => {
    const uri = svgToImageDataUri(
      `<svg width="50" height="50"><rect width="50" height="50"/></svg>`,
      {
        width: 100,
      },
    );
    expect(decode(uri)).toContain('viewBox="0 0 50 50"');
  });
});
