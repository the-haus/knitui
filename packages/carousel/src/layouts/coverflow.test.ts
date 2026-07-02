import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle } from "../types";
import { coverflowLayout } from "./coverflow";

const base = { size: 300, vertical: false };

/** Invoke a layout worklet at `progress` (index is irrelevant to these layouts). */
const at = (layout: AnimationStyle, progress: number): ViewStyle => layout(progress, 0);

/** Pull the single value of transform segment `key` from a style (or undefined). */
function seg(style: ViewStyle, key: string): number | string | undefined {
  const arr = style.transform as Array<Record<string, number | string>> | undefined;
  const found = arr?.find((s) => key in s);
  return found?.[key];
}

describe("coverflowLayout", () => {
  const layout = coverflowLayout(base, { rotateYDeg: 60, spacing: 0.5, perspective: 900 });

  it("leads with the perspective transform", () => {
    expect(seg(at(layout, 0), "perspective")).toBe(900);
  });

  it("overlaps neighbours by the spacing fraction", () => {
    expect(seg(at(layout, 1), "translateX")).toBe(150); // 300 * 0.5
  });

  it("rotates side slides toward the centre (opposite signs)", () => {
    expect(seg(at(layout, 1), "rotateY")).toBe("-60deg");
    expect(seg(at(layout, -1), "rotateY")).toBe("60deg");
    expect(seg(at(layout, 0), "rotateY")).toBe("0deg");
  });

  it("keeps the centred slide on top", () => {
    expect(at(layout, 0).zIndex!).toBeGreaterThan(at(layout, 1).zIndex!);
  });

  it("omits perspective when disabled", () => {
    const flat = coverflowLayout(base, { perspective: 0 });
    expect(seg(at(flat, 0), "perspective")).toBeUndefined();
  });
});
