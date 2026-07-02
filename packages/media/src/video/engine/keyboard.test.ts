import { resolveKeyAction } from "./keyboard";

describe("resolveKeyAction", () => {
  it("toggles play on space and k", () => {
    expect(resolveKeyAction(" ")).toEqual({ type: "togglePlay" });
    expect(resolveKeyAction("k")).toEqual({ type: "togglePlay" });
    expect(resolveKeyAction("K")).toEqual({ type: "togglePlay" });
  });

  it("seeks with arrows and j/l", () => {
    expect(resolveKeyAction("ArrowLeft")).toEqual({ type: "seekBy", seconds: -5 });
    expect(resolveKeyAction("ArrowRight")).toEqual({ type: "seekBy", seconds: 5 });
    expect(resolveKeyAction("j")).toEqual({ type: "seekBy", seconds: -10 });
    expect(resolveKeyAction("l")).toEqual({ type: "seekBy", seconds: 10 });
  });

  it("honors a custom seek step", () => {
    expect(resolveKeyAction("ArrowRight", { seekStep: 15 })).toEqual({
      type: "seekBy",
      seconds: 15,
    });
  });

  it("adjusts volume with up/down", () => {
    expect(resolveKeyAction("ArrowUp")).toEqual({ type: "adjustVolume", delta: 0.1 });
    expect(resolveKeyAction("ArrowDown")).toEqual({ type: "adjustVolume", delta: -0.1 });
  });

  it("maps digits to timeline fractions", () => {
    expect(resolveKeyAction("0")).toEqual({ type: "seekToFraction", fraction: 0 });
    expect(resolveKeyAction("5")).toEqual({ type: "seekToFraction", fraction: 0.5 });
    expect(resolveKeyAction("9")).toEqual({ type: "seekToFraction", fraction: 0.9 });
  });

  it("maps Home/End to start/end", () => {
    expect(resolveKeyAction("Home")).toEqual({ type: "seekToFraction", fraction: 0 });
    expect(resolveKeyAction("End")).toEqual({ type: "seekToFraction", fraction: 1 });
  });

  it("maps m/f/p and rate keys", () => {
    expect(resolveKeyAction("m")).toEqual({ type: "toggleMute" });
    expect(resolveKeyAction("f")).toEqual({ type: "toggleFullscreen" });
    expect(resolveKeyAction("p")).toEqual({ type: "togglePictureInPicture" });
    expect(resolveKeyAction(">")).toEqual({ type: "adjustRate", delta: 0.25 });
    expect(resolveKeyAction("<")).toEqual({ type: "adjustRate", delta: -0.25 });
  });

  it("returns null for unmapped keys", () => {
    expect(resolveKeyAction("a")).toBeNull();
    expect(resolveKeyAction("Tab")).toBeNull();
    expect(resolveKeyAction("Enter")).toBeNull();
  });
});
