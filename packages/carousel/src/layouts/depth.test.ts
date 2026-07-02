import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle } from "../types";
import { depthLayout } from "./depth";

const base = { size: 300, vertical: false };

/** Invoke a layout worklet at `progress` (index is irrelevant to these layouts). */
const at = (layout: AnimationStyle, progress: number): ViewStyle => layout(progress, 0);

/** Pull the single value of transform segment `key` from a style (or undefined). */
function seg(style: ViewStyle, key: string): number | string | undefined {
  const arr = style.transform as Array<Record<string, number | string>> | undefined;
  const found = arr?.find((s) => key in s);
  return found?.[key];
}

describe("depthLayout", () => {
  const layout = depthLayout(base, { inactiveScale: 0.8, outgoingScale: 1.4 });

  it("zooms the leaving slide up and the incoming slide from behind", () => {
    expect(seg(at(layout, 0), "scale")).toBe(1);
    expect(seg(at(layout, -1), "scale")).toBeCloseTo(1.4); // outgoing zooms through
    expect(seg(at(layout, 1), "scale")).toBeCloseTo(0.8); // incoming rises from behind
  });

  it("fades by distance and pins at the origin", () => {
    expect(at(layout, 0).opacity).toBe(1);
    expect(at(layout, 1).opacity).toBe(0);
    expect(seg(at(layout, 1), "translateX")).toBeUndefined();
  });
});
