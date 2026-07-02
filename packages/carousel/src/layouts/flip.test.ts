import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle } from "../types";
import { flipLayout } from "./flip";

const base = { size: 300, vertical: false };

/** Invoke a layout worklet at `progress` (index is irrelevant to these layouts). */
const at = (layout: AnimationStyle, progress: number): ViewStyle => layout(progress, 0);

/** Pull the single value of transform segment `key` from a style (or undefined). */
function seg(style: ViewStyle, key: string): number | string | undefined {
  const arr = style.transform as Array<Record<string, number | string>> | undefined;
  const found = arr?.find((s) => key in s);
  return found?.[key];
}

describe("flipLayout", () => {
  const layout = flipLayout(base, { perspective: 600 });

  it("rotates 180° per page about the Y axis by default", () => {
    expect(seg(at(layout, 0), "rotateY")).toBe("0deg");
    expect(seg(at(layout, 1), "rotateY")).toBe("180deg");
    expect(seg(at(layout, -1), "rotateY")).toBe("-180deg");
  });

  it("hides the back face so only the front-facing slide shows", () => {
    expect(at(layout, 0).backfaceVisibility).toBe("hidden");
  });

  it("can flip about the X axis", () => {
    const x = flipLayout(base, { axis: "x" });
    expect(seg(at(x, 1), "rotateX")).toBe("180deg");
    expect(seg(at(x, 1), "rotateY")).toBeUndefined();
  });
});
