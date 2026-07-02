import { describe, expect, it, vi } from "vitest";

import { createThrottle, createTrailingDebounce, isFiniteNumber, isPosition } from "./utils";

describe("isFiniteNumber", () => {
  it("returns true for finite numbers", () => {
    expect(isFiniteNumber(0)).toBe(true);
    expect(isFiniteNumber(42)).toBe(true);
    expect(isFiniteNumber(-3.14)).toBe(true);
  });

  it("returns false for non-finite numbers", () => {
    expect(isFiniteNumber(Infinity)).toBe(false);
    expect(isFiniteNumber(-Infinity)).toBe(false);
    expect(isFiniteNumber(NaN)).toBe(false);
  });

  it("returns false for non-numbers", () => {
    expect(isFiniteNumber("42")).toBe(false);
    expect(isFiniteNumber(null)).toBe(false);
    expect(isFiniteNumber(undefined)).toBe(false);
    expect(isFiniteNumber(true)).toBe(false);
    expect(isFiniteNumber({})).toBe(false);
  });
});

describe("isPosition", () => {
  it("returns true for valid [lng, lat] positions", () => {
    expect(isPosition([5.0, 52.0])).toBe(true);
    expect(isPosition([-122.4, 37.8])).toBe(true);
    expect(isPosition([0, 0])).toBe(true);
  });

  it("returns true for positions with extra elements", () => {
    expect(isPosition([5.0, 52.0, 100])).toBe(true);
  });

  it("returns false for arrays with fewer than 2 elements", () => {
    expect(isPosition([5.0])).toBe(false);
    expect(isPosition([])).toBe(false);
  });

  it("returns false for non-numeric elements", () => {
    expect(isPosition(["5", "52"])).toBe(false);
    expect(isPosition([5, "52"])).toBe(false);
    expect(isPosition([null, 52])).toBe(false);
  });

  it("returns false for non-finite elements", () => {
    expect(isPosition([NaN, 52])).toBe(false);
    expect(isPosition([5, Infinity])).toBe(false);
  });

  it("returns false for non-arrays", () => {
    expect(isPosition(null)).toBe(false);
    expect(isPosition(undefined)).toBe(false);
    expect(isPosition({ 0: 5, 1: 52 })).toBe(false);
  });
});

describe("createTrailingDebounce", () => {
  it("calls function after the wait period", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = createTrailingDebounce(fn, 100);

    debounced.call("a");
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith("a");
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("resets the timer on subsequent calls", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = createTrailingDebounce(fn, 100);

    debounced.call("a");
    vi.advanceTimersByTime(50);
    debounced.call("b");
    vi.advanceTimersByTime(50);

    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(50);
    expect(fn).toHaveBeenCalledWith("b");
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("cancel prevents the callback", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const debounced = createTrailingDebounce(fn, 100);

    debounced.call("a");
    debounced.cancel();
    vi.advanceTimersByTime(200);

    expect(fn).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});

describe("createThrottle", () => {
  it("calls function immediately on first call", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = createThrottle(fn, 100);

    throttled.call("a");
    expect(fn).toHaveBeenCalledWith("a");
    expect(fn).toHaveBeenCalledTimes(1);

    vi.useRealTimers();
  });

  it("throttles subsequent calls within the wait period", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = createThrottle(fn, 100);

    throttled.call("a");
    throttled.call("b");
    throttled.call("c");
    expect(fn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenLastCalledWith("c");

    vi.useRealTimers();
  });

  it("cancel prevents the trailing call", () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const throttled = createThrottle(fn, 100);

    throttled.call("a");
    throttled.call("b");
    throttled.cancel();
    vi.advanceTimersByTime(200);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("a");

    vi.useRealTimers();
  });
});
