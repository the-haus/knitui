import * as React from "react";
import type { PanGesture } from "react-native-gesture-handler";

import { useWebPan } from "../input/webPan";
import { animate, cancelAnimation, withSpring, withTiming } from "../motion/webMotion";
import { decideSwipe, exitVectorFor } from "./decide";
import type { CardGesture, CardGestureParams } from "./useCardGesture";

export type { CardGesture, CardGestureParams } from "./useCardGesture";

/** How long a committed card takes to fly off-screen, ms (as native). */
const THROW_DURATION = 220;

/**
 * Web twin of `./useCardGesture`: the same drag → `tx`/`ty`, the same pure
 * `decideSwipe` on release (throw off past the threshold, spring back short of
 * it), on DOM pointer events (`../input/webPan`) and the web motion runtime —
 * so no web bundle reaches `react-native-gesture-handler`,
 * `react-native-reanimated` or `react-native-worklets`. The gesture is returned
 * as the native `PanGesture` type for the shared call site; `DragDetector.web`
 * attaches it.
 */
export function useCardGesture(params: CardGestureParams): CardGesture {
  const { tx, ty, sizeW, sizeH, directions, threshold, velocityThreshold, active, onCommit } =
    params;

  const throwOff = React.useCallback(
    (direction: Parameters<CardGestureParams["onCommit"]>[0]) => {
      const target = exitVectorFor(direction, sizeW.value, sizeH.value, tx.value, ty.value);
      animate(tx, withTiming(target.x, { duration: THROW_DURATION }), (finished) => {
        if (finished) onCommit(direction);
      });
      animate(ty, withTiming(target.y, { duration: THROW_DURATION }));
    },
    [tx, ty, sizeW, sizeH, onCommit],
  );

  const pan = useWebPan({
    enabled: active,
    axis: "both",
    onBegin: () => {
      cancelAnimation(tx);
      cancelAnimation(ty);
    },
    onUpdate: (dx, dy) => {
      tx.value = dx;
      ty.value = dy;
    },
    onEnd: (vx, vy, activated) => {
      if (!activated) return;
      const direction = decideSwipe({
        dx: tx.value,
        dy: ty.value,
        vx,
        vy,
        width: sizeW.value,
        height: sizeH.value,
        threshold,
        directions,
        velocityThreshold,
      });
      if (direction) {
        throwOff(direction);
      } else {
        // Below threshold — snap the card back to rest.
        animate(tx, withSpring(0));
        animate(ty, withSpring(0));
      }
    },
  });

  return { gesture: pan as unknown as PanGesture, flyOff: throwOff };
}
