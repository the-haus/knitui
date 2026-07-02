import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle } from "../types";
import { fadeLayout } from "./fade";

const base = { size: 300, vertical: false };

/** Invoke a layout worklet at `progress` (index is irrelevant to these layouts). */
const at = (layout: AnimationStyle, progress: number): ViewStyle => layout(progress, 0);

/** Pull the single value of transform segment `key` from a style (or undefined). */
function seg(style: ViewStyle, key: string): number | string | undefined {
  const arr = style.transform as Array<Record<string, number | string>> | undefined;
  const found = arr?.find((s) => key in s);
  return found?.[key];
}

describe("fadeLayout", () => {
  const layout = fadeLayout(base);

  it("is fully opaque and unscaled at centre, transparent one page away", () => {
    expect(at(layout, 0).opacity).toBe(1);
    expect(at(layout, 1).opacity).toBe(0);
    expect(at(layout, -1).opacity).toBe(0);
    expect(seg(at(layout, 0), "scale")).toBe(1);
  });

  it("pins slides at the origin (no translation)", () => {
    expect(seg(at(layout, 1), "translateX")).toBeUndefined();
    expect(seg(at(layout, -1), "translateX")).toBeUndefined();
  });

  it("shrinks the fading slide when a scale is configured", () => {
    const zoom = fadeLayout(base, { scale: 0.5 });
    expect(seg(at(zoom, 1), "scale")).toBeCloseTo(0.5);
  });

  it("keeps the centred slide on top", () => {
    expect(at(layout, 0).zIndex!).toBeGreaterThan(at(layout, 1).zIndex!);
  });
});
