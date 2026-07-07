import * as React from "react";
import { type SharedValue, useSharedValue } from "react-native-reanimated";

import type { LayoutChangeEvent } from "@knitui/core";

import type { SwipeDeckProps, SwipeDeckRef, SwipeDirection } from "./types";

/** The current top card's imperative API, registered by whichever card is on top. */
export interface TopCardApi {
  flyOff: (direction: SwipeDirection) => void;
}

export interface SwipeDeckController {
  /** Index of the current top card in `data`. */
  topIndex: number;
  /** Measured deck size (px) — cards fill this. */
  size: { width: number; height: number };
  /** Measured size on the UI thread, for the card/gesture worklets. */
  sizeW: SharedValue<number>;
  sizeH: SharedValue<number>;
  onLayout: (event: LayoutChangeEvent) => void;
  /** Advance the deck + fire callbacks when a card commits (JS thread). Stable. */
  handleCommit: (direction: SwipeDirection) => void;
  /** The top card registers its `flyOff` here so the imperative `ref` can drive it. */
  registerTop: (api: TopCardApi | null) => void;
}

/**
 * Deck-level state + imperative wiring for `<SwipeDeck>`. Owns the top index and
 * the measured size; each card owns its own drag and animates its own stack slot
 * (`depth`), so there is no deck-wide shared value that must reset in lockstep
 * with the React index bump — which is what removes the end-of-swipe flicker.
 * `handleCommit` is the single place a swipe advances the deck and fires the
 * `onSwipe*` callbacks, shared by gesture-commits and imperative `ref` swipes.
 */
export function useSwipeDeck<T>(
  props: SwipeDeckProps<T>,
  ref: React.Ref<SwipeDeckRef>,
): SwipeDeckController {
  const [topIndex, setTopIndex] = React.useState(0);
  const [size, setSize] = React.useState({ width: 0, height: 0 });

  const sizeW = useSharedValue(0);
  const sizeH = useSharedValue(0);

  // Keep the latest props/index reachable from the stable `handleCommit` without
  // rebuilding it (and re-arming every card's gesture) on each render.
  const latest = React.useRef(props);
  latest.current = props;
  const topIndexRef = React.useRef(topIndex);
  topIndexRef.current = topIndex;

  const topApiRef = React.useRef<TopCardApi | null>(null);
  const registerTop = React.useCallback((api: TopCardApi | null) => {
    topApiRef.current = api;
  }, []);

  const onLayout = React.useCallback(
    (event: LayoutChangeEvent) => {
      const { width, height } = event.nativeEvent.layout;
      sizeW.value = width;
      sizeH.value = height;
      setSize((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height },
      );
    },
    [sizeW, sizeH],
  );

  const handleCommit = React.useCallback((direction: SwipeDirection) => {
    const p = latest.current;
    const i = topIndexRef.current;
    const item = p.data[i];
    if (item !== undefined) {
      p.onSwipe?.(item, i, direction);
      if (direction === "left") p.onSwipeLeft?.(item, i);
      else if (direction === "right") p.onSwipeRight?.(item, i);
      else if (direction === "up") p.onSwipeUp?.(item, i);
      else p.onSwipeDown?.(item, i);
    }
    const next = i + 1;
    topIndexRef.current = next;
    setTopIndex(next);
    p.onActiveIndexChange?.(next);
    if (next >= p.data.length) p.onEmpty?.();
  }, []);

  React.useImperativeHandle(
    ref,
    (): SwipeDeckRef => ({
      swipe: (direction) => topApiRef.current?.flyOff(direction),
      swipeLeft: () => topApiRef.current?.flyOff("left"),
      swipeRight: () => topApiRef.current?.flyOff("right"),
      swipeUp: () => topApiRef.current?.flyOff("up"),
      getActiveIndex: () => topIndexRef.current,
    }),
    [],
  );

  return { topIndex, size, sizeW, sizeH, onLayout, handleCommit, registerTop };
}
