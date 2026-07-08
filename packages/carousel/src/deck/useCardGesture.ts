import * as React from "react";
import { Gesture, type PanGesture } from "react-native-gesture-handler";
import { cancelAnimation, type SharedValue, withSpring, withTiming } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { decideSwipe, exitVectorFor } from "./decide";
import type { SwipeDirection } from "./types";

/** How long a committed card takes to fly off-screen, ms. */
const THROW_DURATION = 220;

export interface CardGestureParams {
  /** This card's own live drag translation (px). */
  tx: SharedValue<number>;
  ty: SharedValue<number>;
  /** Measured card size (px), read on the UI thread. */
  sizeW: SharedValue<number>;
  sizeH: SharedValue<number>;
  directions: SwipeDirection[];
  threshold: number;
  velocityThreshold: number;
  /** True only for the draggable top card (isTop && !disabled). */
  active: boolean;
  /** Fired (JS thread) when a card commits — the deck advances the top index. */
  onCommit: (direction: SwipeDirection) => void;
}

export interface CardGesture {
  gesture: PanGesture;
  /** Imperatively fling this card off toward `direction` (ref / button driven). */
  flyOff: (direction: SwipeDirection) => void;
}

/**
 * The card's pan gesture + fling logic, shared by the native and web card
 * variants (RNGH + reanimated worklets run on both platforms — same approach as
 * the carousel's `useDragGesture`). The top card tracks the finger into its own
 * `tx`/`ty` and, on release, runs the pure `decideSwipe` on the UI thread: past
 * the threshold it throws the card off-screen and (on finish) advances the deck;
 * short of it, it springs back.
 */
export function useCardGesture(params: CardGestureParams): CardGesture {
  const { tx, ty, sizeW, sizeH, directions, threshold, velocityThreshold, active, onCommit } =
    params;

  // Fling `tx`/`ty` off-screen and advance the deck when it settles. Callable
  // from the JS thread (ref / buttons) — setting `.value = withTiming(...)` from
  // JS schedules the animation on the UI thread (same as the carousel controller).
  const flyOff = React.useCallback(
    (direction: SwipeDirection) => {
      const w = sizeW.value;
      const h = sizeH.value;
      const target = exitVectorFor(direction, w, h, tx.value, ty.value);
      const onDone = (finished?: boolean) => {
        "worklet";
        if (finished) scheduleOnRN(onCommit, direction);
      };
      tx.value = withTiming(target.x, { duration: THROW_DURATION }, onDone);
      ty.value = withTiming(target.y, { duration: THROW_DURATION });
    },
    [tx, ty, sizeW, sizeH, onCommit],
  );

  const gesture = React.useMemo(() => {
    return Gesture.Pan()
      .enabled(active)
      .onBegin(() => {
        "worklet";
        cancelAnimation(tx);
        cancelAnimation(ty);
      })
      .onUpdate((e) => {
        "worklet";
        tx.value = e.translationX;
        ty.value = e.translationY;
      })
      .onEnd((e) => {
        "worklet";
        const w = sizeW.value;
        const h = sizeH.value;
        const direction = decideSwipe({
          dx: tx.value,
          dy: ty.value,
          vx: e.velocityX,
          vy: e.velocityY,
          width: w,
          height: h,
          threshold,
          directions,
          velocityThreshold,
        });
        if (direction) {
          const target = exitVectorFor(direction, w, h, tx.value, ty.value);
          const onDone = (finished?: boolean) => {
            "worklet";
            if (finished) scheduleOnRN(onCommit, direction);
          };
          tx.value = withTiming(target.x, { duration: THROW_DURATION }, onDone);
          ty.value = withTiming(target.y, { duration: THROW_DURATION });
        } else {
          // Below threshold — snap the card back to rest.
          tx.value = withSpring(0);
          ty.value = withSpring(0);
        }
      });
  }, [tx, ty, sizeW, sizeH, directions, threshold, velocityThreshold, active, onCommit]);

  return { gesture, flyOff };
}
