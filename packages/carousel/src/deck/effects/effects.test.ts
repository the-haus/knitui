import type { DeckCardState } from "../types";
import { deckEffects, resolveDeckEffect } from "./index";

const state = (over: Partial<DeckCardState>): DeckCardState => ({
  depth: 0,
  isTop: over.depth === undefined ? true : over.depth === 0,
  drag: { x: 0, y: 0 },
  size: { width: 300, height: 400 },
  ...over,
});

const names = Object.keys(deckEffects) as (keyof typeof deckEffects)[];

/** Every transform segment must carry a finite numeric/string value. */
function assertFiniteTransform(style: ReturnType<ReturnType<typeof resolveDeckEffect>>) {
  const t = style.transform as { [k: string]: number | string }[] | undefined;
  if (!t) return;
  for (const seg of t) {
    for (const k in seg) {
      const v = seg[k];
      if (typeof v === "number") expect(Number.isFinite(v)).toBe(true);
    }
  }
}

describe.each(names)("effect %s", (name) => {
  const effect = resolveDeckEffect(name, undefined);

  it("produces a finite zIndex and finite transforms at every depth", () => {
    for (let depth = 0; depth < 4; depth++) {
      const style = effect(state({ depth, isTop: depth === 0 }));
      expect(Number.isFinite(style.zIndex)).toBe(true);
      assertFiniteTransform(style);
    }
  });

  it("top card follows the drag translation on both axes", () => {
    const style = effect(state({ isTop: true, drag: { x: 120, y: -40 } }));
    const t = style.transform as { translateX?: number; translateY?: number }[];
    const tx = t.find((seg) => "translateX" in seg)?.translateX;
    const ty = t.find((seg) => "translateY" in seg)?.translateY;
    expect(tx).toBe(120);
    expect(ty).toBe(-40);
  });

  it("stays finite at extreme drag", () => {
    const style = effect(state({ isTop: true, drag: { x: 5000, y: -5000 } }));
    assertFiniteTransform(style);
    // Behind card mid-rise (fractional depth).
    assertFiniteTransform(effect(state({ depth: 0.5, isTop: false })));
  });
});

describe("resolveDeckEffect", () => {
  it("defaults to tinder and passes custom worklets through", () => {
    expect(typeof resolveDeckEffect(undefined, undefined)).toBe("function");
    const custom = () => ({ opacity: 0.5 });
    expect(resolveDeckEffect(custom, undefined)).toBe(custom);
  });

  it("honors effectConfig (tinder tilt)", () => {
    const tilted = resolveDeckEffect("tinder", { tiltDeg: 30 });
    const style = tilted({
      depth: 0,
      isTop: true,
      drag: { x: 300, y: 0 },
      size: { width: 300, height: 400 },
    });
    const rot = (style.transform as { rotateZ?: string }[]).find((s) => "rotateZ" in s)?.rotateZ;
    // Full-width drag → full tiltDeg.
    expect(rot).toBe("30deg");
  });
});
