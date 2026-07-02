import { itemProgress } from "../itemProgress";

describe("itemProgress — non-loop", () => {
  it("is a plain line: index - scroll (next item is +1, to the right)", () => {
    expect(itemProgress(0, 0, 5, false)).toBe(0);
    expect(itemProgress(0, 1, 5, false)).toBe(1); // next item, +1
    expect(itemProgress(0, 3, 5, false)).toBe(3);
    expect(itemProgress(2, 1, 5, false)).toBe(-1); // previous item, -1
    expect(itemProgress(2.5, 2, 5, false)).toBeCloseTo(-0.5);
  });
});

describe("itemProgress — loop ring (count = 4)", () => {
  const count = 4;
  const loop = true;

  it("centers the active item at 0; next is +1, previous is -1 (shortest path)", () => {
    // scroll at item 0
    expect(itemProgress(0, 0, count, loop)).toBe(0);
    expect(itemProgress(0, 1, count, loop)).toBe(1); // next
    expect(itemProgress(0, 2, count, loop)).toBe(-2); // opposite → negative tie-break
    expect(itemProgress(0, 3, count, loop)).toBe(-1); // wraps to the previous (left) side
  });

  it("tracks as the scroll position advances", () => {
    // scroll at item 1
    expect(itemProgress(1, 0, count, loop)).toBe(-1);
    expect(itemProgress(1, 1, count, loop)).toBe(0);
    expect(itemProgress(1, 2, count, loop)).toBe(1);
    expect(itemProgress(1, 3, count, loop)).toBe(-2);
  });

  it("never returns a magnitude greater than count/2", () => {
    for (let s = -10; s <= 10; s += 0.5) {
      for (let i = 0; i < count; i++) {
        const p = itemProgress(s, i, count, loop);
        expect(p).toBeGreaterThanOrEqual(-count / 2);
        expect(p).toBeLessThan(count / 2);
      }
    }
  });

  it("is invariant under full laps (period = count)", () => {
    for (let i = 0; i < count; i++) {
      expect(itemProgress(0, i, count, loop)).toBeCloseTo(itemProgress(count, i, count, loop));
      expect(itemProgress(1.3, i, count, loop)).toBeCloseTo(
        itemProgress(1.3 + count, i, count, loop),
      );
    }
  });

  it("handles negative scroll (back-wrap): centered on item 3, next(0) is +1", () => {
    // rawIndex -1 ⇒ centered on item 3
    expect(itemProgress(-1, 3, count, loop)).toBe(0);
    expect(itemProgress(-1, 0, count, loop)).toBe(1); // next item after 3 wraps to 0
    expect(itemProgress(-1, 2, count, loop)).toBe(-1); // previous item
  });
});

describe("itemProgress — small rings", () => {
  it("count = 1 keeps the single item centered", () => {
    expect(itemProgress(0, 0, 1, true)).toBe(0);
    expect(itemProgress(3, 0, 1, true)).toBeCloseTo(0); // every lap re-centers
  });

  it("count = 2 needs no data duplication", () => {
    expect(itemProgress(0, 0, 2, true)).toBe(0);
    expect(itemProgress(0, 1, 2, true)).toBe(-1); // the other item, one page away
    expect(itemProgress(1, 0, 2, true)).toBe(-1);
    expect(itemProgress(1, 1, 2, true)).toBe(0);
  });
});

describe("itemProgress — defensive", () => {
  it("returns 0 for an empty ring", () => {
    expect(itemProgress(0, 0, 0, true)).toBe(0);
  });
});
