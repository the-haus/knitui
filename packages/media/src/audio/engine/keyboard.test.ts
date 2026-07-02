import { resolveKeyAction } from "./keyboard";

describe("audio engine: resolveKeyAction", () => {
  it("maps space / k to togglePlay", () => {
    expect(resolveKeyAction(" ")).toEqual({ type: "togglePlay" });
    expect(resolveKeyAction("k")).toEqual({ type: "togglePlay" });
    expect(resolveKeyAction("K")).toEqual({ type: "togglePlay" });
  });

  it("maps arrows to seek and volume", () => {
    expect(resolveKeyAction("ArrowLeft")).toEqual({ type: "seekBy", seconds: -5 });
    expect(resolveKeyAction("ArrowRight")).toEqual({ type: "seekBy", seconds: 5 });
    expect(resolveKeyAction("ArrowUp")).toEqual({ type: "adjustVolume", delta: 0.1 });
    expect(resolveKeyAction("ArrowDown")).toEqual({ type: "adjustVolume", delta: -0.1 });
  });

  it("maps digits to fractional seeks", () => {
    expect(resolveKeyAction("0")).toEqual({ type: "seekToFraction", fraction: 0 });
    expect(resolveKeyAction("5")).toEqual({ type: "seekToFraction", fraction: 0.5 });
  });

  it("maps j/l, m, and rate keys", () => {
    expect(resolveKeyAction("j")).toEqual({ type: "seekBy", seconds: -10 });
    expect(resolveKeyAction("l")).toEqual({ type: "seekBy", seconds: 10 });
    expect(resolveKeyAction("m")).toEqual({ type: "toggleMute" });
    expect(resolveKeyAction(">")).toEqual({ type: "adjustRate", delta: 0.25 });
    expect(resolveKeyAction("<")).toEqual({ type: "adjustRate", delta: -0.25 });
  });

  it("returns null for non-shortcut keys", () => {
    expect(resolveKeyAction("a")).toBeNull();
    expect(resolveKeyAction("Tab")).toBeNull();
  });
});
