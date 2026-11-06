import { keepNumericStyleKeys } from "./keep-numeric-style-keys";

describe("keepNumericStyleKeys", () => {
  it("holds a dropped key at its resting value", () => {
    const seen = new Set<string>();
    keepNumericStyleKeys({ opacity: 0.6, borderTopLeftRadius: 8 }, seen);

    expect(keepNumericStyleKeys({ backgroundColor: "red" }, seen)).toEqual({
      backgroundColor: "red",
      opacity: 1,
      borderTopLeftRadius: 0,
    });
  });

  it("returns the same style when nothing dropped out", () => {
    const seen = new Set<string>();
    const style = { opacity: 0.6, width: 10 };

    expect(keepNumericStyleKeys(style, seen)).toBe(style);
    expect(keepNumericStyleKeys(style, seen)).toBe(style);
  });

  it("leaves keys alone that are safe to clear", () => {
    const seen = new Set<string>();
    keepNumericStyleKeys({ width: 10, height: 10 }, seen);

    expect(keepNumericStyleKeys({}, seen)).toEqual({});
  });
});
