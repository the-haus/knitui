import { areCellPropsEqual } from "./are-cell-props-equal";

describe("areCellPropsEqual", () => {
  it("treats identical primitive props as equal", () => {
    expect(
      areCellPropsEqual({ date: "2026-07-01", tabIndex: 0 }, { date: "2026-07-01", tabIndex: 0 }),
    ).toBe(true);
  });

  it("detects a changed primitive", () => {
    expect(
      areCellPropsEqual({ date: "2026-07-01", tabIndex: 0 }, { date: "2026-07-01", tabIndex: -1 }),
    ).toBe(false);
  });

  it("looks ONE level into plain objects — the whole point of the comparator", () => {
    // This is what `getDayProps`/`getMonthControlProps` hand back: a freshly built
    // object with identical contents on every render.
    expect(
      areCellPropsEqual(
        { controlProps: { selected: false, inRange: false } },
        { controlProps: { selected: false, inRange: false } },
      ),
    ).toBe(true);
  });

  it("detects a change inside a nested plain object", () => {
    expect(
      areCellPropsEqual(
        { controlProps: { selected: false, inRange: false } },
        { controlProps: { selected: true, inRange: false } },
      ),
    ).toBe(false);
  });

  it("detects a nested object gaining or losing a key", () => {
    expect(areCellPropsEqual({ p: { a: 1 } }, { p: { a: 1, b: 2 } })).toBe(false);
    expect(areCellPropsEqual({ p: { a: 1, b: 2 } }, { p: { a: 1 } })).toBe(false);
  });

  it("detects a differing prop count", () => {
    expect(areCellPropsEqual({ a: 1 }, { a: 1, b: 2 } as unknown as { a: number })).toBe(false);
  });

  it("degrades safely: a fresh function reads as changed", () => {
    expect(areCellPropsEqual({ onPress: () => {} }, { onPress: () => {} })).toBe(false);
  });

  it("degrades safely: it does NOT recurse two levels, so a nested object reads as changed", () => {
    // Deliberate — the comparator stays O(props). Anything it cannot prove equal
    // simply re-renders the cell.
    expect(areCellPropsEqual({ p: { q: { deep: 1 } } }, { p: { q: { deep: 1 } } })).toBe(false);
  });

  it("does not treat an array as a plain object", () => {
    expect(areCellPropsEqual({ p: [1, 2] }, { p: [1, 2] })).toBe(false);
  });

  it("handles null and undefined values without throwing", () => {
    expect(areCellPropsEqual({ p: null }, { p: null })).toBe(true);
    expect(areCellPropsEqual({ p: undefined }, { p: undefined })).toBe(true);
    expect(areCellPropsEqual({ p: null }, { p: { a: 1 } })).toBe(false);
    expect(areCellPropsEqual({ p: { a: 1 } }, { p: null })).toBe(false);
  });

  it("treats a same-identity nested object as equal via the fast path", () => {
    const shared = { q: { deep: 1 } };
    expect(areCellPropsEqual({ p: shared }, { p: shared })).toBe(true);
  });
});
