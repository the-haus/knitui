import type { ViewStyle } from "@knitui/core";

import type { AnimationStyle } from "../types";
import { stackLayout } from "./stack";

const base = { size: 300, vertical: false };

/** Invoke a layout worklet at `progress` (index is irrelevant to this layout). */
const at = (layout: AnimationStyle, progress: number): ViewStyle => layout(progress, 0);

/** Pull the single value of transform segment `key` from a style (or undefined). */
function seg(style: ViewStyle, key: string): number | string | undefined {
  const arr = style.transform as Array<Record<string, number | string>> | undefined;
  const found = arr?.find((s) => key in s);
  return found?.[key];
}

describe("stackLayout", () => {
  const layout = stackLayout(base, { showLength: 3 });

  it("keeps the active card on top of the stacked deck", () => {
    // 0 = active, 1 = next card behind it, 2 = card further back.
    expect(at(layout, 0).zIndex!).toBeGreaterThan(at(layout, 1).zIndex!);
    expect(at(layout, 1).zIndex!).toBeGreaterThan(at(layout, 2).zIndex!);
  });

  it("raises a leaving card above the active card as it flies off", () => {
    expect(at(layout, -1).zIndex!).toBeGreaterThan(at(layout, 0).zIndex!);
  });

  it("never emits a negative zIndex (unsafe against a relative-positioned viewport)", () => {
    // A negative zIndex can drop the deck behind the Viewport frame on native,
    // hiding the cards meant to peek out behind the active one.
    for (const p of [-3, -2, -1, 0, 1, 2, 3, 4, 5]) {
      expect(at(layout, p).zIndex!).toBeGreaterThanOrEqual(0);
    }
  });

  it("steps the deck along the chosen axis", () => {
    expect(seg(at(layout, 1), "translateX")).toBeGreaterThan(0);
    const vertical = stackLayout({ ...base, vertical: true }, { showLength: 3 });
    expect(seg(at(vertical, 1), "translateY")).toBeGreaterThan(0);
  });
});
