import * as React from "react";
import { Gesture, type PanGesture } from "react-native-gesture-handler";
import { cancelAnimation, type SharedValue, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { clamp, settle } from "../engine";
import { applySettle } from "../motion/animations";
import type { ResolvedConfig } from "../motion/useCarouselCore";
import type { WithAnimation } from "../types";

export interface DragGestureParams {
  offset: SharedValue<number>;
  size: SharedValue<number>;
  config: ResolvedConfig;
  withAnimation: WithAnimation | undefined;
  maxScrollDistancePerSwipe?: number;
  minScrollDistancePerSwipe?: number;
  gestureConfig?: (gesture: PanGesture) => PanGesture;
  onStart: () => void;
  onSettle: () => void;
}

/**
 * The drag gesture, shared by native and web (RNGH supports both). Tracks the
 * finger into `offset` (with edge rubber-banding in non-loop mode) and runs the
 * pure `settle` on release to pick the resting offset.
 */
export function useDragGesture(params: DragGestureParams): PanGesture {
  const {
    offset,
    size,
    config,
    withAnimation,
    maxScrollDistancePerSwipe,
    minScrollDistancePerSwipe,
    gestureConfig,
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

  const panStart = useSharedValue(0);

  return React.useMemo(() => {
    const process = (value: number): number => {
      "worklet";
      const s = size.value;
      if (loop || !(s > 0)) return value;
      const min = -Math.max(0, count - 1) * s;
      if (!overscrollEnabled) return clamp(value, min, 0);
      // Rubber-band past either edge at half rate.
      if (value > 0) return value * 0.5;
      if (value < min) return min + (value - min) * 0.5;
      return value;
    };

    let gesture = Gesture.Pan().enabled(enabled);
    if (gestureConfig) gesture = gestureConfig(gesture);

    return gesture
      .onBegin(() => {
        "worklet";
        cancelAnimation(offset);
        panStart.value = offset.value;
        scheduleOnRN(onStart);
      })
      .onUpdate((e) => {
        "worklet";
        if (!(size.value > 0)) return;
        const translation = vertical ? e.translationY : e.translationX;
        offset.value = process(panStart.value + translation);
      })
      .onEnd((e) => {
        "worklet";
        if (!(size.value > 0)) return;
        const velocity = vertical ? e.velocityY : e.velocityX;
        const result = settle({
          offset: offset.value,
          velocity,
          size: size.value,
          count,
          loop,
          pagingEnabled,
          snapEnabled,
          startOffset: panStart.value,
          maxScrollDistancePerSwipe,
          minScrollDistancePerSwipe,
        });
        applySettle(offset, result, withAnimation, scrollAnimationDuration, onSettle);
      });
  }, [
    offset,
    size,
    panStart,
    enabled,
    vertical,
    loop,
    count,
    overscrollEnabled,
    pagingEnabled,
    snapEnabled,
    scrollAnimationDuration,
    withAnimation,
    maxScrollDistancePerSwipe,
    minScrollDistancePerSwipe,
    gestureConfig,
    onStart,
    onSettle,
  ]);
}
