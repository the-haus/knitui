import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle } from "../types";
import { scaleLayout } from "./scale";

const base = { size: 300, vertical: false };

/** Invoke a layout worklet at `progress` (index is irrelevant to these layouts). */
const at = (layout: AnimationStyle, progress: number): ViewStyle => layout(progress, 0);

/** Pull the single value of transform segment `key` from a style (or undefined). */
function seg(style: ViewStyle, key: string): number | string | undefined {
  const arr = style.transform as Array<Record<string, number | string>> | undefined;
  const found = arr?.find((s) => key in s);
  return found?.[key];
}

describe("scaleLayout", () => {
  const layout = scaleLayout(base, { inactiveScale: 0.8 });

  it("travels one full page per unit of progress", () => {
    expect(seg(at(layout, 1), "translateX")).toBe(300);
    expect(seg(at(layout, -1), "translateX")).toBe(-300);
  });

  it("scales from 1 at centre to inactiveScale one page away", () => {
    expect(seg(at(layout, 0), "scale")).toBe(1);
    expect(seg(at(layout, 1), "scale")).toBeCloseTo(0.8);
    expect(seg(at(layout, -1), "scale")).toBeCloseTo(0.8);
  });

  it("honours a vertical axis", () => {
    const v = scaleLayout({ ...base, vertical: true });
    expect(seg(at(v, 1), "translateY")).toBe(300);
    expect(seg(at(v, 1), "translateX")).toBeUndefined();
  });
});
