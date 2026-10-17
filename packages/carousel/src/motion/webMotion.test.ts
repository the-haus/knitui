import {
  Extrapolation as RExtrapolation,
  interpolate as rInterpolate,
} from "react-native-reanimated";

import {
  animate,
  cancelAnimation,
  Extrapolation,
  interpolate,
  isAnimating,
  makeMutable,
  withDecay,
  withSpring,
  withTiming,
} from "./webMotion";

describe("webMotion — interpolate matches Reanimated's", () => {
  const ranges: [number[], number[]][] = [
    [
      [0, 1],
      [0, 100],
    ],
    [
      [-1, 0, 1],
      [0.8, 1, 0.8],
    ],
    [
      [0, 50, 100],
      [100, 0, -40],
    ],
    [
      [2, 2],
      [5, 9],
    ],
  ];
  const kinds = [
    undefined,
    Extrapolation.CLAMP,
    Extrapolation.EXTEND,
    Extrapolation.IDENTITY,
    { extrapolateLeft: Extrapolation.CLAMP, extrapolateRight: Extrapolation.IDENTITY },
  ] as const;
  it.each(ranges)("for %j → %j, inside and past both edges", (input, output) => {
    for (const kind of kinds) {
      for (const x of [-3, -1, -0.5, 0, 0.25, 1, 1.5, 2, 25, 75, 150]) {
        expect(interpolate(x, input, output, kind)).toBeCloseTo(
          rInterpolate(x, input, output, kind as never),
          10,
        );
      }
    }
  });

  it("uses the same Extrapolation strings", () => {
    expect(Extrapolation.CLAMP).toBe(RExtrapolation.CLAMP);
    expect(Extrapolation.EXTEND).toBe(RExtrapolation.EXTEND);
    expect(Extrapolation.IDENTITY).toBe(RExtrapolation.IDENTITY);
  });
});

describe("webMotion — shared values and animations", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("notifies listeners on every write", () => {
    const sv = makeMutable(0);
    const seen: number[] = [];
    sv.addListener(1, (v) => seen.push(v));
    sv.value = 3;
    sv.set(5);
    sv.removeListener(1);
    sv.value = 9;
    expect(seen).toEqual([3, 5]);
  });

  it("runs a timing animation to its target, then reports it finished", () => {
    const sv = makeMutable(0);
    const done = jest.fn();
    animate(sv, withTiming(100, { duration: 200 }), done);
    expect(isAnimating(sv)).toBe(true);
    jest.advanceTimersByTime(100);
    expect(sv.value).toBeGreaterThan(0);
    expect(sv.value).toBeLessThan(100);
    jest.advanceTimersByTime(400);
    expect(sv.value).toBe(100);
    expect(done).toHaveBeenCalledWith(true);
    expect(isAnimating(sv)).toBe(false);
  });

  it("settles a spring on its target", () => {
    const sv = makeMutable(0);
    const done = jest.fn();
    animate(sv, withSpring(-300), done);
    jest.advanceTimersByTime(3000);
    expect(sv.value).toBe(-300);
    expect(done).toHaveBeenCalledWith(true);
  });

  it("glides a decay in the direction of its velocity and comes to rest", () => {
    const sv = makeMutable(0);
    const done = jest.fn();
    animate(sv, withDecay({ velocity: -1000, deceleration: 0.999 }), done);
    jest.advanceTimersByTime(10_000);
    expect(sv.value).toBeLessThan(-500);
    expect(done).toHaveBeenCalledWith(true);
  });

  it("is cancelled by a direct write, by cancelAnimation, and by the next animation", () => {
    const sv = makeMutable(0);
    const first = jest.fn();
    animate(sv, withTiming(100, { duration: 300 }), first);
    jest.advanceTimersByTime(50);
    sv.value = 7;
    expect(first).toHaveBeenCalledWith(false);
    jest.advanceTimersByTime(500);
    expect(sv.value).toBe(7);

    const second = jest.fn();
    animate(sv, withTiming(50, { duration: 300 }), second);
    cancelAnimation(sv);
    expect(second).toHaveBeenCalledWith(false);

    const third = jest.fn();
    const fourth = jest.fn();
    animate(sv, withTiming(50, { duration: 300 }), third);
    animate(sv, withTiming(60, { duration: 300 }), fourth);
    expect(third).toHaveBeenCalledWith(false);
    jest.advanceTimersByTime(500);
    expect(sv.value).toBe(60);
    expect(fourth).toHaveBeenCalledWith(true);
  });

  it("lands without moving through in-between values under reduced motion", () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes("reduce"),
    })) as unknown as typeof window.matchMedia;
    try {
      const sv = makeMutable(0);
      const seen: number[] = [];
      sv.addListener(1, (v) => seen.push(v));
      const done = jest.fn();
      animate(sv, withTiming(100, { duration: 500 }), done);
      jest.advanceTimersByTime(20);
      expect(seen).toEqual([100]);
      expect(done).toHaveBeenCalledWith(true);
    } finally {
      window.matchMedia = matchMedia;
    }
  });

  it("drives a value it doesn't own, and stops when someone else writes it", () => {
    // A consumer's own shared value (e.g. `scrollOffsetValue`) is a plain
    // `.value` holder to the animator.
    const external = { value: 0 } as unknown as Parameters<typeof animate>[0];
    const done = jest.fn();
    animate(external, withTiming(10, { duration: 100 }), done);
    jest.advanceTimersByTime(40);
    external.value = -1;
    jest.advanceTimersByTime(40);
    expect(done).toHaveBeenCalledWith(false);
    expect(external.value).toBe(-1);
  });
});
