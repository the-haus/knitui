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
import { MOTION_CROSS, MOTION_MAIN, type ResolvedConfig } from "../motion/useCarouselCore";
import type { CarouselGestureConfig, WithAnimation } from "../types";
import {
  AXIS_LOCK_DISTANCE,
  decideAxis,
  LOCK_CROSS,
  LOCK_MAIN,
  LOCK_NONE,
  LOCK_REJECT,
} from "./axisLock";

/** The cross axis of a two-axis deck, as the gesture needs it. */
export interface DragCrossAxis {
  /** Cross-axis page size px. */
  size: SharedValue<number>;
  /** The core's `motionAxis` (which layout the slides render). */
  axis: SharedValue<number>;
}

export interface DragGestureParams {
  offset: SharedValue<number>;
  size: SharedValue<number>;
  config: ResolvedConfig;
  withAnimation: WithAnimation | undefined;
  maxScrollDistancePerSwipe?: number;
  minScrollDistancePerSwipe?: number;
  /** Extra pan config merged UNDER the kit's own (`enabled` may be overridden). */
  gestureConfig?: CarouselGestureConfig;
  /** Two-axis deck; null/undefined for a single-axis carousel. */
  cross?: DragCrossAxis | null;
  onStart: () => void;
  onSettle: () => void;
}

const LOCK_RANGE: [number, number] = [-AXIS_LOCK_DISTANCE, AXIS_LOCK_DISTANCE];

/** Did the caller configure activation themselves? Then the kit adds no defaults. */
function hasActivationConfig(c: CarouselGestureConfig | undefined): boolean {
  if (!c) return false;
  return (
    c.minDistance !== undefined ||
    c.activeOffsetX !== undefined ||
    c.activeOffsetY !== undefined ||
    c.failOffsetX !== undefined ||
    c.failOffsetY !== undefined
  );
}

/**
 * The drag gesture, shared by native and web (RNGH supports both). Tracks the
 * finger into `offset` (with edge rubber-banding in non-loop mode) and runs the
 * pure `settle` on release to pick the resting offset.
 *
 * Axis handling:
 * - Single axis: the pan activates only along the carousel's axis and FAILS
 *   once the drag goes 10px across it (`activeOffset*` / `failOffset*`), so the
 *   other axis is left to a parent (a page, a map, an outer carousel).
 * - Two axes (`cross`): one pan activates on either axis, and the drag locks to
 *   the dominant axis of its first 10px (see `axisLock.ts`). A cross drag moves
 *   the SAME `offset`, scaled from cross px to main px, so index, progress,
 *   virtualization and every callback follow it untouched; `motionAxis` tells
 *   the slides to render the cross layout meanwhile.
 * A caller's own activation config (`minDistance`, `activeOffset*`,
 * `failOffset*`) replaces the kit's defaults.
 *
 * A touch that never activates (a tap, or a drag a parent won) still settles,
 * so `onScrollStart` always gets its `onScrollEnd` and an animation it
 * interrupted lands on a page instead of freezing between two.
 *
 * RNGH 3 hook API: the config object is memoized so `usePanGesture` (which keys
 * its native config push on config identity) only reconfigures the handler when
 * an input actually changes.
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
    cross,
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
  /** The axis this drag locked to (`LOCK_*`). */
  const lock = useSharedValue(LOCK_NONE);
  /** Whether this touch has been settled yet (deactivate or finalize). */
  const settled = useSharedValue(true);

  const crossSize = cross?.size;
  const motionAxis = cross?.axis;

  const panConfig = React.useMemo((): PanGestureConfig => {
    const twoAxis = crossSize !== undefined && motionAxis !== undefined;
    const customActivation = hasActivationConfig(gestureConfig);
    // A caller-configured single-axis pan keeps the old behaviour: every drag
    // the handler activates on moves the carousel (no kit-side lock).
    const skipLock = customActivation && !twoAxis;

    const activation: Partial<PanGestureConfig> = customActivation
      ? {}
      : twoAxis
        ? { activeOffsetX: LOCK_RANGE, activeOffsetY: LOCK_RANGE }
        : vertical
          ? { activeOffsetY: LOCK_RANGE, failOffsetX: LOCK_RANGE }
          : { activeOffsetX: LOCK_RANGE, failOffsetY: LOCK_RANGE };

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

    /** Main px per cross px (a cross page maps onto one main page). */
    const crossRatio = (): number => {
      "worklet";
      const cs = crossSize ? crossSize.value : 0;
      return cs > 0 ? size.value / cs : 1;
    };

    const resetAxis = () => {
      "worklet";
      if (motionAxis) motionAxis.value = MOTION_MAIN;
    };

    /** Lock the drag (once) from its translation; returns the lock. */
    const lockFor = (tx: number, ty: number): number => {
      "worklet";
      if (lock.value !== LOCK_NONE) return lock.value;
      const l = skipLock ? LOCK_MAIN : decideAxis(tx, ty, vertical, twoAxis);
      if (l === LOCK_NONE) return l;
      lock.value = l;
      if (motionAxis && l !== LOCK_REJECT) {
        motionAxis.value = l === LOCK_CROSS ? MOTION_CROSS : MOTION_MAIN;
      }
      return l;
    };

    /** Snap to the nearest page with no fling (a touch that didn't drag). */
    const snapBack = () => {
      "worklet";
      const crossMotion = motionAxis !== undefined && motionAxis.value === MOTION_CROSS;
      if (!(size.value > 0)) {
        scheduleOnRN(onSettle);
        return;
      }
      const result = settle({
        offset: offset.value,
        velocity: 0,
        size: size.value,
        count,
        loop,
        pagingEnabled,
        snapEnabled,
      });
      if (result.kind === "to" && result.target === offset.value) {
        // Already at rest on a page: nothing to animate.
        if (crossMotion) resetAxis();
        scheduleOnRN(onSettle);
        return;
      }
      applySettle(
        offset,
        result,
        withAnimation,
        scrollAnimationDuration,
        onSettle,
        crossMotion ? resetAxis : undefined,
      );
    };

    return {
      enabled,
      ...activation,
      // Caller config sits between the kit's defaults (overridable) and the
      // kit's callbacks (always win).
      ...gestureConfig,
      onBegin: () => {
        "worklet";
        cancelAnimation(offset);
        panStart.value = offset.value;
        lock.value = LOCK_NONE;
        settled.value = false;
        scheduleOnRN(onStart);
      },
      onUpdate: (e: PanGestureActiveEvent) => {
        "worklet";
        if (!(size.value > 0)) return;
        const l = lockFor(e.translationX, e.translationY);
        if (l === LOCK_NONE || l === LOCK_REJECT) return;
        if (l === LOCK_MAIN) {
          offset.value = process(panStart.value + (vertical ? e.translationY : e.translationX));
        } else {
          const t = vertical ? e.translationX : e.translationY;
          offset.value = process(panStart.value + t * crossRatio());
        }
      },
      // v3 `onDeactivate` == v2 `onEnd`: fires only when leaving ACTIVE.
      onDeactivate: (e) => {
        "worklet";
        settled.value = true;
        if (!(size.value > 0)) return;
        let l = lockFor(e.translationX, e.translationY);
        // Released before the lock distance: a main-axis snap.
        if (l === LOCK_NONE) l = LOCK_MAIN;
        if (l === LOCK_REJECT) {
          snapBack();
          return;
        }
        const velocity =
          l === LOCK_MAIN
            ? vertical
              ? e.velocityY
              : e.velocityX
            : (vertical ? e.velocityX : e.velocityY) * crossRatio();
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
        applySettle(
          offset,
          result,
          withAnimation,
          scrollAnimationDuration,
          onSettle,
          l === LOCK_CROSS ? resetAxis : undefined,
        );
      },
      // Fires after `onDeactivate` too; only settles a touch that never activated.
      onFinalize: () => {
        "worklet";
        if (settled.value) return;
        settled.value = true;
        snapBack();
      },
    };
  }, [
    offset,
    size,
    panStart,
    lock,
    settled,
    crossSize,
    motionAxis,
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
