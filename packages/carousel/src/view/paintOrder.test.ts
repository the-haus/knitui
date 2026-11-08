import { normalLayout, stackLayout } from "../layouts";
import { coverflowLayout } from "../layouts/coverflow";
import { paintOrder } from "./paintOrder";

const base = { size: 100, vertical: true };
const window11 = Array.from({ length: 11 }, (_, i) => i);

/** Indices bottom → top. */
const order = (slots: ReturnType<typeof paintOrder>) => slots.map((s) => s.index);

describe("paintOrder (native view order + settled zIndex)", () => {
  const stack = stackLayout(base, { showLength: 3 });

  it.each([0, 1, 2, 3])(
    "non-loop stack at %i: front card above its deck, cards that left above it",
    (i) => {
      const o = order(paintOrder(window11, i, 20, false, stack));
      // Remaining deck, bottom → top, ends with the next two cards and the front.
      expect(o.filter((k) => k >= i).slice(-3)).toEqual([i + 2, i + 1, i]);
      // Cards that already flew off (opacity 0) sit above the front card.
      for (const k of o.filter((k) => k < i)) expect(o.indexOf(k)).toBeGreaterThan(o.indexOf(i));
    },
  );

  it("ranks are 0..n-1 in paint order and every stack slot carries a zIndex", () => {
    const slots = paintOrder(window11, 1, 20, false, stack);
    expect(slots.map((s) => s.rank)).toEqual(window11);
    for (const s of slots) expect(typeof s.z).toBe("number");
  });

  it("loops around the ring: the slide before 0 is the one that left", () => {
    const o = order(paintOrder([18, 19, 0, 1, 2], 0, 20, true, stack));
    expect(o.slice(0, 3)).toEqual([2, 1, 0]);
    expect(o.slice(3).sort()).toEqual([18, 19]);
  });

  it("centre-out layouts paint the centre last, nearer neighbours above farther", () => {
    const slots = order(paintOrder([0, 1, 2, 3, 4, 5, 6], 3, 7, false, coverflowLayout(base)));
    expect(slots[slots.length - 1]).toBe(3);
    expect(slots.indexOf(2)).toBeGreaterThan(slots.indexOf(1));
    expect(slots.indexOf(4)).toBeGreaterThan(slots.indexOf(5));
  });

  it("layouts without zIndex keep mount order and get no zIndex prop", () => {
    const slots = paintOrder([4, 5, 6], 5, 10, false, normalLayout(base));
    expect(order(slots)).toEqual([4, 5, 6]);
    expect(slots.every((s) => s.z === undefined)).toBe(true);
  });

  it("falls back to mount order when a custom worklet throws on the JS thread", () => {
    const slots = paintOrder([0, 1], 0, 2, false, () => {
      throw new Error("UI only");
    });
    expect(order(slots)).toEqual([0, 1]);
  });
});

describe("paintOrder — exit: back", () => {
  it("ranks the stepped-past card under the deck (Android view order)", () => {
    const back = stackLayout(base, { showLength: 3, exit: "back" });
    const o = order(paintOrder([0, 1, 2, 3, 4], 1, 20, false, back));
    expect(o.slice(-3)).toEqual([3, 2, 1]);
    expect(o.indexOf(0)).toBeLessThan(o.indexOf(3));
  });
});
