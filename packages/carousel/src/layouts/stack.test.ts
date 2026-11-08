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

describe("stackLayout — the deck past showLength", () => {
  const cfg = { showLength: 3, stackInterval: 16, scaleInterval: 0.04, opacityInterval: 0.1 };
  const layout = stackLayout(base, cfg);
  const valid = cfg.showLength - 1;

  it("shows exactly showLength cards: front + showLength-1 behind, the rest at opacity 0", () => {
    expect(at(layout, 0).opacity).toBe(1);
    expect(at(layout, 1).opacity).toBeCloseTo(0.9);
    expect(at(layout, valid).opacity).toBeCloseTo(0.8);
    for (const p of [valid + 1, valid + 2, 5, 10, 19]) expect(at(layout, p).opacity).toBe(0);
  });

  it("fades the next card in between valid+1 and valid (no pop)", () => {
    const mid = at(layout, valid + 0.5).opacity as number;
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(0.8);
  });

  it("keeps a card fading in BELOW the last visible card", () => {
    expect(at(layout, valid).zIndex!).toBeGreaterThan(at(layout, valid + 0.5).zIndex!);
    expect(at(layout, valid + 0.5).zIndex!).toBeGreaterThanOrEqual(at(layout, valid + 1).zIndex!);
  });

  it("steps translate and scale once per card, clamped at the back", () => {
    expect(seg(at(layout, 1), "translateX")).toBeCloseTo(16);
    expect(seg(at(layout, 2), "translateX")).toBeCloseTo(32);
    expect(seg(at(layout, 5), "translateX")).toBeCloseTo(32);
    expect(seg(at(layout, 1), "scale")).toBeCloseTo(0.96);
    expect(seg(at(layout, 2), "scale")).toBeCloseTo(0.92);
  });

  it("snapDirection right mirrors the deck steps", () => {
    const right = stackLayout(base, { ...cfg, snapDirection: "right" });
    expect(seg(at(right, 1), "translateX")).toBeCloseTo(-16);
    expect(at(right, 3).opacity).toBe(0);
  });

  it("the leaving card flies along the active axis, invisible once gone", () => {
    const h = at(layout, -1);
    expect(seg(h, "translateX")).toBeCloseTo(-300);
    expect(seg(h, "translateY")).toBeUndefined();
    expect(h.opacity).toBe(0);
    const v = at(stackLayout({ ...base, vertical: true }, cfg), -1);
    expect(seg(v, "translateY")).toBeCloseTo(-300);
    expect(seg(v, "translateX")).toBeUndefined();
    expect(seg(at(stackLayout({ ...base, vertical: true }, cfg), -0.5), "translateY")).toBeLessThan(
      0,
    );
  });

  it("paints strictly front-to-back across the whole window", () => {
    const zs = [-1, 0, 1, 2, 3].map((p) => at(layout, p).zIndex!);
    for (let k = 1; k < zs.length; k++) expect(zs[k - 1]!).toBeGreaterThan(zs[k]!);
  });
});
