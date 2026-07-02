import { dragOverlayOpacity, shouldDismiss } from "./engine";

const EXTENT = 400;

describe("shouldDismiss", () => {
  it("returns false before measured (extent 0)", () => {
    expect(shouldDismiss({ offset: 999, velocity: 0, extent: 0 })).toBe(false);
  });

  it("dismisses on a slow release past the threshold (default 0.3)", () => {
    expect(shouldDismiss({ offset: 0.31 * EXTENT, velocity: 0, extent: EXTENT })).toBe(true);
  });

  it("springs back on a slow release below the threshold", () => {
    expect(shouldDismiss({ offset: 0.2 * EXTENT, velocity: 0, extent: EXTENT })).toBe(false);
  });

  it("a fling toward the edge always dismisses, even from a short drag", () => {
    expect(shouldDismiss({ offset: 10, velocity: 800, extent: EXTENT })).toBe(true);
  });

  it("a fling back always returns, even from a long drag", () => {
    expect(shouldDismiss({ offset: 0.9 * EXTENT, velocity: -800, extent: EXTENT })).toBe(false);
  });

  it("honours a custom threshold", () => {
    expect(
      shouldDismiss({ offset: 0.55 * EXTENT, velocity: 0, extent: EXTENT, threshold: 0.5 }),
    ).toBe(true);
    expect(
      shouldDismiss({ offset: 0.45 * EXTENT, velocity: 0, extent: EXTENT, threshold: 0.5 }),
    ).toBe(false);
  });

  it("honours a custom flick velocity", () => {
    expect(shouldDismiss({ offset: 5, velocity: 300, extent: EXTENT, flickVelocity: 250 })).toBe(
      true,
    );
    expect(shouldDismiss({ offset: 5, velocity: 300, extent: EXTENT, flickVelocity: 1000 })).toBe(
      false,
    );
  });
});

describe("dragOverlayOpacity", () => {
  it("is full at rest and fades to 0 across the extent", () => {
    expect(dragOverlayOpacity(0, EXTENT)).toBe(1);
    expect(dragOverlayOpacity(EXTENT / 2, EXTENT)).toBeCloseTo(0.5, 5);
    expect(dragOverlayOpacity(EXTENT, EXTENT)).toBe(0);
  });

  it("clamps past the extent and never goes negative", () => {
    expect(dragOverlayOpacity(EXTENT * 1.5, EXTENT)).toBe(0);
  });

  it("scales by maxOpacity", () => {
    expect(dragOverlayOpacity(0, EXTENT, 0.6)).toBeCloseTo(0.6, 5);
    expect(dragOverlayOpacity(EXTENT / 2, EXTENT, 0.6)).toBeCloseTo(0.3, 5);
  });

  it("returns maxOpacity for a degenerate extent", () => {
    expect(dragOverlayOpacity(10, 0)).toBe(1);
  });
});
