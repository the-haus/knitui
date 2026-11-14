import { clampSeekTarget, clampVolume, StallWatch } from "./playback";

describe("clampSeekTarget", () => {
  it("holds a target inside the track", () => {
    expect(clampSeekTarget(5, 30)).toBe(5);
    expect(clampSeekTarget(-3, 30)).toBe(0);
    expect(clampSeekTarget(45, 30)).toBe(30);
  });

  it("only refuses negatives while the duration is unknown", () => {
    expect(clampSeekTarget(45, 0)).toBe(45);
    expect(clampSeekTarget(45, Number.NaN)).toBe(45);
    expect(clampSeekTarget(45, Number.POSITIVE_INFINITY)).toBe(45);
    expect(clampSeekTarget(-1, 0)).toBe(0);
  });
});

describe("clampVolume", () => {
  it("holds a volume inside 0..1", () => {
    expect(clampVolume(0.4)).toBe(0.4);
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(3)).toBe(1);
  });
});

describe("StallWatch", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("fires once after the timeout, and not when cleared first", () => {
    const onStall = jest.fn();
    const watch = new StallWatch(1000, onStall);
    watch.arm();
    expect(watch.armed).toBe(true);
    jest.advanceTimersByTime(999);
    expect(onStall).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onStall).toHaveBeenCalledTimes(1);
    expect(watch.armed).toBe(false);

    watch.arm();
    watch.clear();
    jest.advanceTimersByTime(2000);
    expect(onStall).toHaveBeenCalledTimes(1);
  });

  it("does not push the deadline back when armed again, unless restarted", () => {
    const onStall = jest.fn();
    const watch = new StallWatch(1000, onStall);
    watch.arm();
    jest.advanceTimersByTime(600);
    watch.arm(); // a second stall report
    jest.advanceTimersByTime(400);
    expect(onStall).toHaveBeenCalledTimes(1);

    watch.arm();
    jest.advanceTimersByTime(600);
    watch.restart();
    jest.advanceTimersByTime(600);
    expect(onStall).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(400);
    expect(onStall).toHaveBeenCalledTimes(2);
  });
});
