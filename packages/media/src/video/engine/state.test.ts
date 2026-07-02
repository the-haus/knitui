import {
  bufferedEndForTime,
  bufferedFractionOf,
  createInitialState,
  mergeState,
  progressOf,
} from "./state";

describe("createInitialState", () => {
  it("starts idle with neutral values", () => {
    const s = createInitialState();
    expect(s.status).toBe("idle");
    expect(s.playing).toBe(false);
    expect(s.currentTime).toBe(0);
    expect(s.bufferedPosition).toBe(-1);
    expect(s.volume).toBe(1);
  });

  it("applies overrides", () => {
    expect(createInitialState({ muted: true, volume: 0.5 })).toMatchObject({
      muted: true,
      volume: 0.5,
    });
  });
});

describe("mergeState", () => {
  it("returns the same reference when nothing changes", () => {
    const s = createInitialState();
    expect(mergeState(s, { status: "idle", playing: false })).toBe(s);
  });

  it("returns a new reference on a real change", () => {
    const s = createInitialState();
    const next = mergeState(s, { playing: true });
    expect(next).not.toBe(s);
    expect(next.playing).toBe(true);
  });

  it("ignores undefined patch values", () => {
    const s = createInitialState();
    expect(mergeState(s, { status: undefined })).toBe(s);
  });
});

describe("progressOf", () => {
  it("computes a fraction", () => {
    expect(progressOf({ currentTime: 25, duration: 100 })).toBe(0.25);
  });

  it("returns 0 for unknown/zero/non-finite duration", () => {
    expect(progressOf({ currentTime: 25, duration: 0 })).toBe(0);
    expect(progressOf({ currentTime: 25, duration: Number.POSITIVE_INFINITY })).toBe(0);
  });

  it("clamps to [0, 1]", () => {
    expect(progressOf({ currentTime: 200, duration: 100 })).toBe(1);
  });
});

describe("bufferedFractionOf", () => {
  it("returns 0 when unknown", () => {
    expect(bufferedFractionOf({ bufferedPosition: -1, duration: 100 })).toBe(0);
  });

  it("computes the fraction", () => {
    expect(bufferedFractionOf({ bufferedPosition: 40, duration: 100 })).toBe(0.4);
  });
});

describe("bufferedEndForTime", () => {
  it("finds the range containing the current time", () => {
    expect(
      bufferedEndForTime(
        [
          [0, 10],
          [20, 40],
        ],
        25,
      ),
    ).toBe(40);
  });

  it("falls back to the furthest range starting before the time", () => {
    expect(
      bufferedEndForTime(
        [
          [0, 10],
          [30, 50],
        ],
        15,
      ),
    ).toBe(10);
  });

  it("returns -1 when no range qualifies", () => {
    expect(bufferedEndForTime([[30, 50]], 10)).toBe(-1);
  });
});
