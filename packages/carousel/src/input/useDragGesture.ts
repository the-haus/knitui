import * as React from "react";
import {
  type PanGesture,
  type PanGestureActiveEvent,
  type PanGestureConfig,
  usePanGesture,
} from "react-native-gesture-handler";
import { cancelAnimation, type SharedValue, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { clamp, settle } from "../engine";
import { applySettle } from "../motion/animations";
import type { ResolvedConfig } from "../motion/useCarouselCore";
import type { CarouselGestureConfig, WithAnimation } from "../types";

export interface DragGestureParams {
  offset: SharedValue<number>;
  size: SharedValue<number>;
  config: ResolvedConfig;
  withAnimation: WithAnimation | undefined;
  maxScrollDistancePerSwipe?: number;
  minScrollDistancePerSwipe?: number;
  /** Extra pan config merged UNDER the kit's own (`enabled` may be overridden). */
  gestureConfig?: CarouselGestureConfig;
  onStart: () => void;
  onSettle: () => void;
}

/**
 * The drag gesture, shared by native and web (RNGH supports both). Tracks the
 * finger into `offset` (with edge rubber-banding in non-loop mode) and runs the
 * pure `settle` on release to pick the resting offset.
 *
 * RNGH 3 hook API: the config object is memoized so `usePanGesture` (which keys
 * its native config push on config identity) only reconfigures the handler when
 * an input actually changes — same cadence as the old memoized builder.
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

  const panConfig = React.useMemo((): PanGestureConfig => {
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

    return {
      enabled,
      // Caller config sits between `enabled` (overridable, as the old builder
      // callback could) and the kit's callbacks (always win).
      ...gestureConfig,
      onBegin: () => {
        "worklet";
        cancelAnimation(offset);
        panStart.value = offset.value;
        scheduleOnRN(onStart);
      },
      onUpdate: (e: PanGestureActiveEvent) => {
        "worklet";
        if (!(size.value > 0)) return;
        const translation = vertical ? e.translationY : e.translationX;
        offset.value = process(panStart.value + translation);
      },
      // v3 `onDeactivate` == v2 `onEnd`: fires only when leaving ACTIVE.
      onDeactivate: (e) => {
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
      },
    };
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

  return usePanGesture(panConfig);
}
