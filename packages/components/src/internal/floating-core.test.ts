/**
 * Unit tests for the custom floating engine (`../floating` core). These
 * exercise the pure positioning math — placement, offset, flip, shift, limitShift
 * — in window coordinates, independent of any DOM/native measurement.
 */
import { arrow, computePosition, flip, limitShift, offset, shift } from "../floating";
import type { Rect } from "../floating";

// A 1000×800 viewport; reference is a small box near the middle-top.
const viewport: Rect = { x: 0, y: 0, width: 1000, height: 800 };
const reference: Rect = { x: 400, y: 100, width: 100, height: 40 };
const floating = { width: 200, height: 120 };

describe("computePosition — base placements", () => {
  it("places bottom-start directly under the reference's left edge", () => {
    const { x, y, placement } = computePosition(reference, floating, {
      placement: "bottom-start",
      boundary: viewport,
    });
    expect(placement).toBe("bottom-start");
    expect(x).toBe(reference.x); // 400
    expect(y).toBe(reference.y + reference.height); // 140
  });

  it("centers a plain 'bottom' placement on the reference", () => {
    const { x, y } = computePosition(reference, floating, {
      placement: "bottom",
      boundary: viewport,
    });
    expect(x).toBe(reference.x + reference.width / 2 - floating.width / 2); // 450 - 100 = 350
    expect(y).toBe(140);
  });

  it("places 'top' above the reference", () => {
    const { y } = computePosition(reference, floating, { placement: "top", boundary: viewport });
    expect(y).toBe(reference.y - floating.height); // 100 - 120 = -20
  });

  it("places 'right' to the right and vertically centered", () => {
    const { x, y } = computePosition(reference, floating, {
      placement: "right",
      boundary: viewport,
    });
    expect(x).toBe(reference.x + reference.width); // 500
    expect(y).toBe(reference.y + reference.height / 2 - floating.height / 2); // 120 - 60 = 60
  });
});

describe("offset middleware", () => {
  it("opens a main-axis gutter away from the reference", () => {
    const { y } = computePosition(reference, floating, {
      placement: "bottom",
      middleware: [offset(8)],
      boundary: viewport,
    });
    expect(y).toBe(140 + 8);
  });

  it("supports per-axis offsets", () => {
    const { x, y } = computePosition(reference, floating, {
      placement: "bottom",
      middleware: [offset({ mainAxis: 8, crossAxis: 10 })],
      boundary: viewport,
    });
    expect(x).toBe(350 + 10);
    expect(y).toBe(140 + 8);
  });
});

describe("flip middleware", () => {
  it("flips bottom → top when the floating element would overflow the bottom edge", () => {
    // Reference near the bottom: a bottom-placed floating box overflows.
    const lowRef: Rect = { x: 400, y: 760, width: 100, height: 40 };
    const { placement, y } = computePosition(lowRef, floating, {
      placement: "bottom",
      middleware: [flip()],
      boundary: viewport,
    });
    expect(placement).toBe("top");
    expect(y).toBe(lowRef.y - floating.height); // placed above
  });

  it("keeps the requested side when there is room", () => {
    const { placement } = computePosition(reference, floating, {
      placement: "bottom",
      middleware: [flip()],
      boundary: viewport,
    });
    expect(placement).toBe("bottom");
  });

  it("preserves alignment across a flip", () => {
    const lowRef: Rect = { x: 400, y: 760, width: 100, height: 40 };
    const { placement } = computePosition(lowRef, floating, {
      placement: "bottom-start",
      middleware: [flip()],
      boundary: viewport,
    });
    expect(placement).toBe("top-start");
  });
});

describe("shift middleware", () => {
  it("slides a cross-axis-overflowing floating box back into the viewport", () => {
    // Reference at the right edge → bottom placement pushes the floating box past
    // the right edge; shift pulls it back so its right edge sits at the boundary.
    const rightRef: Rect = { x: 960, y: 100, width: 40, height: 40 };
    const { x } = computePosition(rightRef, floating, {
      placement: "bottom",
      middleware: [shift({ padding: 0 })],
      boundary: viewport,
    });
    expect(x + floating.width).toBeLessThanOrEqual(viewport.width);
    expect(x).toBe(viewport.width - floating.width); // 800
  });

  it("respects padding from the edge", () => {
    const rightRef: Rect = { x: 960, y: 100, width: 40, height: 40 };
    const { x } = computePosition(rightRef, floating, {
      placement: "bottom",
      middleware: [shift({ padding: 12 })],
      boundary: viewport,
    });
    expect(x).toBe(viewport.width - floating.width - 12); // 788
  });

  it("limitShift keeps the floating box attached to the reference", () => {
    // A reference far off the left edge: an unlimited shift would detach the
    // floating box from it; limitShift caps the shift at the reference's span.
    const offscreenRef: Rect = { x: -500, y: 100, width: 40, height: 40 };
    const { x } = computePosition(offscreenRef, floating, {
      placement: "bottom",
      middleware: [shift({ padding: 0, limiter: limitShift() })],
      boundary: viewport,
    });
    // Without the limiter, shift would clamp x to 0 (viewport left). The limiter
    // instead keeps x within [refStart - floatWidth, refStart + refWidth].
    expect(x).toBeLessThanOrEqual(offscreenRef.x + offscreenRef.width);
    expect(x).toBeGreaterThanOrEqual(offscreenRef.x - floating.width);
  });
});

describe("arrow middleware", () => {
  it("centers the arrow on the reference for a plain placement", () => {
    const { x, middlewareData } = computePosition(reference, floating, {
      placement: "bottom",
      middleware: [arrow({ size: 10 })],
      boundary: viewport,
    });
    // Tip (arrow x + half size, in floating-relative coords) sits on the
    // reference center: 450 (window) − 350 (floating x) = 100 → arrow x 95.
    expect(x).toBe(350);
    expect(middlewareData.arrow).toEqual({ x: 95, centerOffset: 0 });
  });

  it("tracks the reference center after shift slides the floating box", () => {
    // Reference at the right edge: shift pulls the floating box back to x=800,
    // so a statically centered arrow (x=95, tip at 900) would miss the target.
    const rightRef: Rect = { x: 960, y: 100, width: 40, height: 40 };
    const { x, middlewareData } = computePosition(rightRef, floating, {
      placement: "bottom",
      middleware: [shift({ padding: 0 }), arrow({ size: 10 })],
      boundary: viewport,
    });
    expect(x).toBe(800);
    // Tip at the reference center: 980 − 800 = 180 → arrow x 175.
    expect(middlewareData.arrow).toEqual({ x: 175, centerOffset: 0 });
  });

  it("pins a side-positioned arrow at `offset` from the aligned edge", () => {
    const { middlewareData } = computePosition(reference, floating, {
      placement: "bottom-start",
      middleware: [arrow({ size: 10, position: "side", offset: 5 })],
      boundary: viewport,
    });
    expect(middlewareData.arrow?.x).toBe(5);
  });

  it("pulls a side-pinned arrow back over a reference the shift slid away from", () => {
    // Tiny reference at the left edge with bottom-end: the floating box wants
    // x = −180 and shift clamps it to 0, so the end-pinned spot (x=185, tip 190)
    // would point at nothing. The arrow is clamped so its tip stays within the
    // reference span [0, 20].
    const edgeRef: Rect = { x: 0, y: 100, width: 20, height: 40 };
    const { x, middlewareData } = computePosition(edgeRef, floating, {
      placement: "bottom-end",
      middleware: [shift({ padding: 0 }), arrow({ size: 10, position: "side", offset: 5 })],
      boundary: viewport,
    });
    expect(x).toBe(0);
    // Tip at 15 + 5 = 20 → the reference's right edge.
    expect(middlewareData.arrow).toEqual({ x: 15, centerOffset: -10 });
  });

  it("writes `y` for horizontal placements", () => {
    const { y, middlewareData } = computePosition(reference, floating, {
      placement: "right",
      middleware: [arrow({ size: 10 })],
      boundary: viewport,
    });
    expect(y).toBe(60);
    // Tip on the reference's vertical center: 120 − 60 = 60 → arrow y 55.
    expect(middlewareData.arrow).toEqual({ y: 55, centerOffset: 0 });
    expect(middlewareData.arrow?.x).toBeUndefined();
  });

  it("never lets the arrow escape the floating box (corner padding wins)", () => {
    // Reference fully left of the floating box (limitShift keeps a corner
    // attached): pointing at its center would need a negative arrow x.
    const farRef: Rect = { x: -500, y: 100, width: 40, height: 40 };
    const { middlewareData } = computePosition(farRef, floating, {
      placement: "bottom",
      middleware: [shift({ padding: 0, limiter: limitShift() }), arrow({ size: 10, padding: 4 })],
      boundary: viewport,
    });
    expect(middlewareData.arrow?.x).toBe(4);
  });

  it("holds the arrow off a rounded corner by the radius plus its rotation overhang", () => {
    // Same far-left reference as above, but `cornerRadius` exceeds `padding`, so the
    // keepout is `cornerRadius + (√2−1)·size/2` (the rotated diamond's overhang) — not
    // the bare `padding`. size 10 → overhang ≈ 2.071; cornerRadius 8 → edge ≈ 10.071.
    const farRef: Rect = { x: -500, y: 100, width: 40, height: 40 };
    const { middlewareData } = computePosition(farRef, floating, {
      placement: "bottom",
      middleware: [
        shift({ padding: 0, limiter: limitShift() }),
        arrow({ size: 10, padding: 4, cornerRadius: 8 }),
      ],
      boundary: viewport,
    });
    expect(middlewareData.arrow?.x).toBeCloseTo(8 + (Math.SQRT2 - 1) * 5, 5);
  });

  it("ignores `cornerRadius` when the bare `padding` keepout is already larger", () => {
    const farRef: Rect = { x: -500, y: 100, width: 40, height: 40 };
    const { middlewareData } = computePosition(farRef, floating, {
      placement: "bottom",
      middleware: [
        shift({ padding: 0, limiter: limitShift() }),
        arrow({ size: 10, padding: 20, cornerRadius: 4 }),
      ],
      boundary: viewport,
    });
    expect(middlewareData.arrow?.x).toBe(20);
  });
});
