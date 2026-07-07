import * as React from "react";

import { act, renderHook } from "../test-utils";
import type { SwipeDeckProps, SwipeDeckRef } from "./types";
import { useSwipeDeck } from "./useSwipeDeck";

/**
 * The commit/advance logic is tested here on the controller directly: reanimated's
 * web animation loop does not progress under jsdom (see jest.setup.ts), so the
 * gesture → fling → `handleCommit` completion never fires in a rendered tree.
 * `handleCommit` is the exact function that path invokes, so driving it directly
 * exercises the real advance + callback logic deterministically.
 */
function setup(over: Partial<SwipeDeckProps<number>> = {}) {
  const ref = React.createRef<SwipeDeckRef>();
  const props: SwipeDeckProps<number> = {
    data: [10, 20, 30],
    renderCard: () => null,
    ...over,
  };
  const view = renderHook(() => useSwipeDeck(props, ref));
  return { ref, view };
}

describe("useSwipeDeck — commit advances the deck", () => {
  it("advances the top index and fires onSwipe + the directional callback", () => {
    const onSwipe = jest.fn();
    const onSwipeRight = jest.fn();
    const onActiveIndexChange = jest.fn();
    const { ref, view } = setup({ onSwipe, onSwipeRight, onActiveIndexChange });

    expect(view.result.current.topIndex).toBe(0);
    expect(ref.current?.getActiveIndex()).toBe(0);

    act(() => view.result.current.handleCommit("right"));

    expect(onSwipe).toHaveBeenCalledWith(10, 0, "right");
    expect(onSwipeRight).toHaveBeenCalledWith(10, 0);
    expect(onActiveIndexChange).toHaveBeenCalledWith(1);
    expect(view.result.current.topIndex).toBe(1);
    expect(ref.current?.getActiveIndex()).toBe(1);
  });

  it("routes each direction to its own callback", () => {
    const onSwipeLeft = jest.fn();
    const onSwipeUp = jest.fn();
    const { view } = setup({ onSwipeLeft, onSwipeUp });

    act(() => view.result.current.handleCommit("left"));
    expect(onSwipeLeft).toHaveBeenCalledWith(10, 0);

    act(() => view.result.current.handleCommit("up"));
    expect(onSwipeUp).toHaveBeenCalledWith(20, 1);
  });

  it("fires onEmpty when the last card is swiped", () => {
    const onEmpty = jest.fn();
    const { view } = setup({ data: [10], onEmpty });

    act(() => view.result.current.handleCommit("left"));

    expect(view.result.current.topIndex).toBe(1);
    expect(onEmpty).toHaveBeenCalledTimes(1);
  });
});

describe("useSwipeDeck — layout", () => {
  it("records the measured size on both the state and the shared values", () => {
    const { view } = setup();

    act(() =>
      view.result.current.onLayout({
        nativeEvent: { layout: { width: 300, height: 420, x: 0, y: 0 } },
      } as never),
    );

    expect(view.result.current.size).toEqual({ width: 300, height: 420 });
    expect(view.result.current.sizeW.value).toBe(300);
    expect(view.result.current.sizeH.value).toBe(420);
  });
});
