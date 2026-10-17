import { animateOffset, settleOffset } from "../animate";
import { MotionValue } from "../value";

describe("web springs", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("springs to the target, notifying listeners, and finishes once", () => {
    const value = new MotionValue(600);
    const seen: number[] = [];
    value.addListener(1, (v) => seen.push(v));
    const done = jest.fn();
    animateOffset(value, 100, undefined, done);
    expect(value.animating).toBe(true);
    jest.advanceTimersByTime(2000);
    expect(value.value).toBe(100);
    expect(value.animating).toBe(false);
    expect(done).toHaveBeenCalledTimes(1);
    expect(seen.length).toBeGreaterThan(5);
    expect(seen[seen.length - 1]).toBe(100);
  });

  it("stops when the value is assigned (a drag catches the panel)", () => {
    const value = new MotionValue(600);
    const done = jest.fn();
    animateOffset(value, 100, undefined, done);
    jest.advanceTimersByTime(50);
    const caught = value.value;
    value.value = caught;
    jest.advanceTimersByTime(2000);
    expect(value.value).toBe(caught);
    expect(done).not.toHaveBeenCalled();
  });

  it("replaces a running spring without finishing the old one", () => {
    const value = new MotionValue(600);
    const first = jest.fn();
    const second = jest.fn();
    animateOffset(value, 100, undefined, first);
    jest.advanceTimersByTime(50);
    settleOffset(value, 400, 0, undefined, second);
    jest.advanceTimersByTime(2000);
    expect(value.value).toBe(400);
    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("clamps at the target with overshootClamping", () => {
    const value = new MotionValue(600);
    let lowest = Infinity;
    value.addListener(1, (v) => {
      lowest = Math.min(lowest, v);
    });
    animateOffset(value, 100, { stiffness: 300, damping: 10, mass: 1, overshootClamping: true });
    jest.advanceTimersByTime(2000);
    expect(lowest).toBe(100);
  });

  it("jumps straight to the target under prefers-reduced-motion", () => {
    const original = window.matchMedia;
    window.matchMedia = ((query: string) =>
      ({ matches: query.includes("reduce"), media: query }) as MediaQueryList) as never;
    try {
      const value = new MotionValue(600);
      const done = jest.fn();
      animateOffset(value, 100, undefined, done);
      expect(value.value).toBe(100);
      expect(done).toHaveBeenCalledTimes(1);
    } finally {
      window.matchMedia = original;
    }
  });
});
