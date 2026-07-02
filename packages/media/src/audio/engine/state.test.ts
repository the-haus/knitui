import {
  bufferedEndForTime,
  bufferedFractionOf,
  createInitialState,
  mergeState,
  progressOf,
} from "./state";

describe("audio engine: state", () => {
  it("creates a neutral initial snapshot", () => {
    const s = createInitialState();
    expect(s.status).toBe("idle");
    expect(s.playing).toBe(false);
    expect(s.volume).toBe(1);
    expect(s.bufferedPosition).toBe(-1);
    expect(s.shouldCorrectPitch).toBe(true);
    expect(s.metadata).toBeNull();
  });

  it("merges and returns the same ref when nothing changed", () => {
    const s = createInitialState();
    expect(mergeState(s, { playing: false })).toBe(s);
    const next = mergeState(s, { playing: true });
    expect(next).not.toBe(s);
    expect(next.playing).toBe(true);
  });

  it("ignores undefined patch values", () => {
    const s = createInitialState({ volume: 0.5 });
    expect(mergeState(s, { volume: undefined })).toBe(s);
  });

  it("computes progress as a safe fraction", () => {
    expect(progressOf({ currentTime: 50, duration: 100 })).toBe(0.5);
    expect(progressOf({ currentTime: 50, duration: 0 })).toBe(0);
    expect(progressOf({ currentTime: 200, duration: 100 })).toBe(1);
    expect(progressOf({ currentTime: 5, duration: Infinity })).toBe(0);
  });

  it("computes buffered fraction", () => {
    expect(bufferedFractionOf({ bufferedPosition: -1, duration: 100 })).toBe(0);
    expect(bufferedFractionOf({ bufferedPosition: 25, duration: 100 })).toBe(0.25);
  });

  it("finds the buffered end for the current time", () => {
    expect(bufferedEndForTime([[0, 30]], 10)).toBe(30);
    expect(
      bufferedEndForTime(
        [
          [0, 10],
          [20, 40],
        ],
        25,
      ),
    ).toBe(40);
    expect(bufferedEndForTime([[50, 60]], 10)).toBe(-1);
  });
});
