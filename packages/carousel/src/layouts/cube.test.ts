import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle } from "../types";
import { cubeLayout } from "./cube";

const base = { size: 300, vertical: false };

/** Invoke a layout worklet at `progress` (index is irrelevant to these layouts). */
const at = (layout: AnimationStyle, progress: number): ViewStyle => layout(progress, 0);

/** Pull the single value of transform segment `key` from a style (or undefined). */
function seg(style: ViewStyle, key: string): number | string | undefined {
  const arr = style.transform as Array<Record<string, number | string>> | undefined;
  const found = arr?.find((s) => key in s);
  return found?.[key];
}

describe("cubeLayout", () => {
  const layout = cubeLayout(base, { perspective: 800 });

  it("hinges on the inner edge depending on the side", () => {
    expect(at(layout, 0.5).transformOrigin).toBe("0% 50%"); // right side → left edge
    expect(at(layout, -0.5).transformOrigin).toBe("100% 50%"); // left side → right edge
  });

  it("folds ±90° and translates one page per unit", () => {
    expect(seg(at(layout, 1), "rotateY")).toBe("-90deg");
    expect(seg(at(layout, -1), "rotateY")).toBe("90deg");
    expect(seg(at(layout, 1), "translateX")).toBe(300);
  });

  it("hides faces beyond one page", () => {
    expect(at(layout, 0).opacity).toBe(1);
    expect(at(layout, 0.9).opacity).toBe(1);
    expect(at(layout, 1).opacity).toBe(0);
    expect(at(layout, 2).opacity).toBe(0);
  });
});
