import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle } from "../types";
import { rotateLayout } from "./rotate";

const base = { size: 300, vertical: false };

/** Invoke a layout worklet at `progress` (index is irrelevant to these layouts). */
const at = (layout: AnimationStyle, progress: number): ViewStyle => layout(progress, 0);

/** Pull the single value of transform segment `key` from a style (or undefined). */
function seg(style: ViewStyle, key: string): number | string | undefined {
  const arr = style.transform as Array<Record<string, number | string>> | undefined;
  const found = arr?.find((s) => key in s);
  return found?.[key];
}

describe("rotateLayout", () => {
  const layout = rotateLayout(base, { rotateZDeg: 20 });

  it("tilts neighbours in opposite directions and keeps centre upright", () => {
    expect(seg(at(layout, 0), "rotateZ")).toBe("0deg");
    expect(seg(at(layout, 1), "rotateZ")).toBe("20deg");
    expect(seg(at(layout, -1), "rotateZ")).toBe("-20deg");
  });

  it("still translates one page per unit", () => {
    expect(seg(at(layout, 1), "translateX")).toBe(300);
  });
});
