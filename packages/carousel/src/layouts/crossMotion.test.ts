import type { ViewStyle } from "@knitui/core";

import { CROSS_MOTION_Z, crossMotion, keepsDeck, mainMotion } from "./crossMotion";
import { fadeLayout } from "./fade";
import { normalLayout, stackLayout } from "./index";

function seg(style: ViewStyle, key: string): number | string | undefined {
  const arr = style.transform as Array<Record<string, number | string>> | undefined;
  return arr?.find((s) => key in s)?.[key];
}

describe("crossMotion — a vertical stack paged sideways", () => {
  const main = stackLayout({ size: 100, vertical: true }, { showLength: 3 });
  const cross = normalLayout({ size: 320, vertical: false });
  const motion = crossMotion(main, cross, true);

  it("the front card / leaving card slides along X, above the deck", () => {
    const s = motion(-0.25, 0);
    expect(seg(s, "translateX")).toBeCloseTo(-80);
    expect(seg(s, "translateY")).toBeUndefined();
    expect(s.zIndex).toBe(CROSS_MOTION_Z);
    expect(s.opacity).toBe(1);
  });

  it("the deck behind keeps the stack layout (next card comes forward)", () => {
    expect(motion(0.75, 1)).toEqual(mainMotion(main)(0.75, 1));
    expect(seg(motion(0.75, 1), "translateX")).toBeUndefined();
  });

  it("meets the stack layout at rest (progress 0) — no jump when the axis switches", () => {
    expect(seg(motion(0, 0), "translateY")).toBe(0);
    expect(seg(motion(-1e-9, 0), "translateX")).toBeCloseTo(0);
  });
});

describe("crossMotion — non-stack modes", () => {
  it("every slide takes the cross motion, with neutral defaults for stale keys", () => {
    const motion = crossMotion(
      fadeLayout({ size: 100, vertical: true }),
      normalLayout({ size: 100, vertical: false }),
      false,
    );
    const s = motion(1, 1);
    expect(seg(s, "translateX")).toBe(100);
    // fade's opacity 0 must not linger once the normal layout takes over.
    expect(s.opacity).toBe(1);
    expect(s.backfaceVisibility).toBe("visible");
  });

  it("keepsDeck is true only for the stack modes", () => {
    expect(keepsDeck("vertical-stack")).toBe(true);
    expect(keepsDeck("horizontal-stack")).toBe(true);
    expect(keepsDeck("normal")).toBe(false);
    expect(keepsDeck(undefined)).toBe(false);
  });
});
