import * as React from "react";

import { Box, Text } from "@knitui/components";

import { Carousel } from "../index";
import { act, render, screen } from "../test-utils";

/**
 * The web drag runs on DOM pointer events (`./webPan`), not on
 * react-native-gesture-handler: a pointer drag past half a page on the
 * viewport moves the carousel one page, and a press that never travels doesn't
 * scroll it.
 */
function pointer(type: string, el: Element | Window, x: number, y = 0) {
  const event = new MouseEvent(type, {
    bubbles: true,
    cancelable: true,
    clientX: x,
    clientY: y,
    button: 0,
  });
  Object.defineProperty(event, "pointerId", { value: 1 });
  Object.defineProperty(event, "pointerType", { value: "mouse" });
  el.dispatchEvent(event);
}

function renderCarousel(onIndexChange: jest.Mock, onScrollStart: jest.Mock) {
  render(
    <Carousel
      testID="c"
      data={[0, 1, 2]}
      loop={false}
      itemSize={100}
      style={{ width: 100, height: 100 }}
      onIndexChange={onIndexChange}
      onScrollStart={onScrollStart}
      renderItem={({ item }) => (
        <Box>
          <Text>{`slide-${item}`}</Text>
        </Box>
      )}
    />,
  );
  // The viewport is the frame's first child: the element the pan attaches to.
  return screen.getByTestId("c").firstElementChild as HTMLElement;
}

describe("Carousel — web pointer drag", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("drags to the next page and settles there", () => {
    const onIndexChange = jest.fn();
    const onScrollStart = jest.fn();
    const viewport = renderCarousel(onIndexChange, onScrollStart);
    act(() => {
      pointer("pointerdown", viewport, 90);
      for (let x = 80; x >= 20; x -= 10) pointer("pointermove", window, x);
      pointer("pointerup", window, 20);
    });
    act(() => {
      jest.advanceTimersByTime(2000);
    });
    expect(onScrollStart).toHaveBeenCalled();
    expect(onIndexChange).toHaveBeenLastCalledWith(1);
  });

  it("leaves a resting carousel alone on a press that never moves", () => {
    const onIndexChange = jest.fn();
    const onScrollStart = jest.fn();
    const viewport = renderCarousel(onIndexChange, onScrollStart);
    onIndexChange.mockClear();
    act(() => {
      pointer("pointerdown", viewport, 50);
      pointer("pointerup", window, 51);
      jest.advanceTimersByTime(1000);
    });
    expect(onScrollStart).not.toHaveBeenCalled();
    expect(onIndexChange).not.toHaveBeenCalled();
  });

  it("gives a mostly-vertical move to the page", () => {
    const onScrollStart = jest.fn();
    const viewport = renderCarousel(jest.fn(), onScrollStart);
    act(() => {
      pointer("pointerdown", viewport, 50, 0);
      pointer("pointermove", window, 48, 40);
      pointer("pointermove", window, 10, 80);
      pointer("pointerup", window, 10, 80);
    });
    expect(onScrollStart).not.toHaveBeenCalled();
  });
});
