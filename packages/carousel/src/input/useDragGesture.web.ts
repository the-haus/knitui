import * as React from "react";
import type { PanGesture } from "react-native-gesture-handler";

import { clamp, settle } from "../engine";
import { applySettle } from "../motion/animations";
import { cancelAnimation, isAnimating } from "../motion/webMotion";
import type { DragGestureParams } from "./useDragGesture";
import { useWebPan } from "./webPan";

/**
 * Web twin of `./useDragGesture`: the same drag → `offset` tracking (edge
 * rubber-banding in non-loop mode) and the same pure `settle` on release, on
 * DOM pointer events (`./webPan`) instead of `react-native-gesture-handler`, so
 * no web bundle reaches the gesture library.
 *
 * Returned as the native `PanGesture` type so `Carousel` stays one file; at
 * runtime it is the web pan binding `DragDetector.web` attaches. `gestureConfig`
 * (a hook to tweak RNGH's `Gesture.Pan()`) has no meaning without RNGH and is
 * ignored on web.
 *
 * A press that interrupts a running snap stops it (as native does) and, if it
 * never turns into a drag, settles to the nearest page on release; a plain
 * press on a resting carousel fires no scroll callbacks.
 */
export function useDragGesture(params: DragGestureParams): PanGesture {
  const {
    offset,
    size,
    config,
    withAnimation,
    maxScrollDistancePerSwipe,
    minScrollDistancePerSwipe,
    onStart,
    onSettle,
  } = params;
  const {
    enabled,
    vertical,
    loop,
    count,
    overscrollEnabled,
    pagingEnabled,
    snapEnabled,
    scrollAnimationDuration,
  } = config;

  /** Where the drag started (engine offset), and whether it has begun moving. */
  const panStart = React.useRef(0);
  const started = React.useRef(false);

  const process = (value: number): number => {
    const s = size.value;
    if (loop || !(s > 0)) return value;
    const min = -Math.max(0, count - 1) * s;
    if (!overscrollEnabled) return clamp(value, min, 0);
    // Rubber-band past either edge at half rate.
    if (value > 0) return value * 0.5;
    if (value < min) return min + (value - min) * 0.5;
    return value;
  };

  const begin = () => {
    if (started.current) return;
    started.current = true;
    onStart();
  };

  const pan = useWebPan({
    enabled,
    axis: vertical ? "y" : "x",
    onBegin: () => {
      started.current = false;
      if (isAnimating(offset)) {
        cancelAnimation(offset);
        begin();
      }
      panStart.current = offset.value;
    },
    onUpdate: (tx, ty) => {
      if (!(size.value > 0)) return;
      begin();
      offset.value = process(panStart.current + (vertical ? ty : tx));
    },
    onEnd: (vx, vy) => {
      if (!started.current || !(size.value > 0)) return;
      const result = settle({
        offset: offset.value,
        velocity: vertical ? vy : vx,
        size: size.value,
        count,
        loop,
        pagingEnabled,
        snapEnabled,
        startOffset: panStart.current,
        maxScrollDistancePerSwipe,
        minScrollDistancePerSwipe,
      });
      applySettle(offset, result, withAnimation, scrollAnimationDuration, onSettle);
    },
  });

  return pan as unknown as PanGesture;
}
