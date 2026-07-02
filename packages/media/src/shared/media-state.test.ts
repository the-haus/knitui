import { bufferedEndForTime, bufferedFractionOf, mergeState, progressOf } from "./media-state";

describe("shared: media-state helpers", () => {
  describe("mergeState", () => {
    it("returns the SAME reference when nothing changes (cheap subscriber bail)", () => {
      const s = { a: 1, b: 2 };
      expect(mergeState(s, { a: 1 })).toBe(s);
      expect(mergeState(s, {})).toBe(s);
    });

    it("returns a NEW reference with the patch applied when something changes", () => {
      const s = { a: 1, b: 2 };
      const next = mergeState(s, { b: 3 });
      expect(next).not.toBe(s);
      expect(next).toEqual({ a: 1, b: 3 });
      expect(s).toEqual({ a: 1, b: 2 }); // original untouched
    });

    it("treats an all-undefined patch as 'no change' (short-circuit to same ref)", () => {
      const s = { a: 1, b: 2 };
      expect(mergeState(s, { a: undefined })).toBe(s);
      expect(mergeState(s, { a: undefined, b: undefined })).toBe(s);
    });

    it("only short-circuits CHANGE DETECTION on undefined — a real change still spreads the patch", () => {
      // Documents the contract: once any key changes, the merge is `{...prev, ...patch}`,
      // so an `undefined` sharing the patch is written through rather than dropped.
      const s = { a: 1, b: 2 };
      const next = mergeState(s, { a: undefined, b: 9 });
      expect(next).not.toBe(s);
      expect(next.b).toBe(9);
      expect("a" in next).toBe(true);
    });
  });

  describe("progressOf", () => {
    it("computes a fraction in [0, 1]", () => {
      expect(progressOf({ currentTime: 50, duration: 100 })).toBe(0.5);
    });

    it("clamps out-of-range values", () => {
      expect(progressOf({ currentTime: -10, duration: 100 })).toBe(0);
      expect(progressOf({ currentTime: 200, duration: 100 })).toBe(1);
    });

    it("returns 0 for unknown / non-finite / zero duration (live)", () => {
      expect(progressOf({ currentTime: 5, duration: 0 })).toBe(0);
      expect(progressOf({ currentTime: 5, duration: -1 })).toBe(0);
      expect(progressOf({ currentTime: 5, duration: Infinity })).toBe(0);
      expect(progressOf({ currentTime: 5, duration: NaN })).toBe(0);
    });
  });

  describe("bufferedFractionOf", () => {
    it("computes a fraction in [0, 1]", () => {
      expect(bufferedFractionOf({ bufferedPosition: 25, duration: 100 })).toBe(0.25);
    });

    it("returns 0 for the unknown sentinel (-1)", () => {
      expect(bufferedFractionOf({ bufferedPosition: -1, duration: 100 })).toBe(0);
    });

    it("returns 0 for unknown / non-finite / zero duration", () => {
      expect(bufferedFractionOf({ bufferedPosition: 25, duration: 0 })).toBe(0);
      expect(bufferedFractionOf({ bufferedPosition: 25, duration: Infinity })).toBe(0);
    });

    it("clamps when buffered overshoots duration", () => {
      expect(bufferedFractionOf({ bufferedPosition: 200, duration: 100 })).toBe(1);
    });
  });

  describe("bufferedEndForTime", () => {
    it("returns the end of the range containing the current time", () => {
      expect(
        bufferedEndForTime(
          [
            [0, 10],
            [20, 30],
          ],
          5,
        ),
      ).toBe(10);
    });

    it("falls back to the furthest range end among ranges that begin before the current time", () => {
      // currentTime 11 is inside no range; both ranges start before it, so the
      // furthest end (8) wins over the nearer one (5).
      expect(
        bufferedEndForTime(
          [
            [0, 5],
            [2, 8],
          ],
          11,
        ),
      ).toBe(8);
    });

    it("returns -1 when no range begins at or before the current time", () => {
      expect(bufferedEndForTime([[20, 30]], 5)).toBe(-1);
      expect(bufferedEndForTime([], 5)).toBe(-1);
    });
  });
});
