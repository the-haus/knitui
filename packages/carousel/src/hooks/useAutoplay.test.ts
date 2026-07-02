import { renderHook } from "@testing-library/react";

import type { CarouselRef } from "../types";
import { useAutoplay } from "./useAutoplay";

function mockController(): CarouselRef {
  return {
    next: jest.fn(),
    prev: jest.fn(),
    scrollTo: jest.fn(),
    getCurrentIndex: jest.fn(() => 0),
  };
}

describe("useAutoplay", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("advances after the interval and re-arms on finish", () => {
    const controller = mockController();
    (controller.next as jest.Mock).mockImplementation((opts) => opts?.onFinished?.());
    renderHook(() => useAutoplay({ enabled: true, reverse: false, interval: 1000, controller }));

    jest.advanceTimersByTime(1000);
    expect(controller.next).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(1000);
    expect(controller.next).toHaveBeenCalledTimes(2);
  });

  it("uses prev when reversed", () => {
    const controller = mockController();
    renderHook(() => useAutoplay({ enabled: true, reverse: true, interval: 500, controller }));
    jest.advanceTimersByTime(500);
    expect(controller.prev).toHaveBeenCalledTimes(1);
    expect(controller.next).not.toHaveBeenCalled();
  });

  it("does nothing when disabled", () => {
    const controller = mockController();
    renderHook(() => useAutoplay({ enabled: false, reverse: false, interval: 500, controller }));
    jest.advanceTimersByTime(2000);
    expect(controller.next).not.toHaveBeenCalled();
  });

  it("pause() stops the timer and resume() restarts it", () => {
    const controller = mockController();
    const { result } = renderHook(() =>
      useAutoplay({ enabled: true, reverse: false, interval: 1000, controller }),
    );
    result.current.pause();
    jest.advanceTimersByTime(3000);
    expect(controller.next).not.toHaveBeenCalled();

    result.current.resume();
    jest.advanceTimersByTime(1000);
    expect(controller.next).toHaveBeenCalledTimes(1);
  });
});
