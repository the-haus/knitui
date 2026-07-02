import * as React from "react";
import { Gesture, type PanGesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  type SharedValue,
  useSharedValue,
  withSpring,
  type WithSpringConfig,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { shouldDismiss } from "./engine";

/**
 * Spring for the dismiss / spring-back settle. Tuned (like `@knitui/sheet`) for a
 * natural settle — roughly a 0.84 damping ratio so the panel lands with a hint of
 * give rather than a robotic dead-stop. Overridable per-instance via `spring`.
 */
export const DEFAULT_DISMISS_SPRING: WithSpringConfig = {
  damping: 29,
  stiffness: 300,
  mass: 1,
  overshootClamping: false,
};

/**
 * Travel (px) the finger must cover along the drag axis before the pan claims the
 * touch. Below this a tap on the scrim still dismisses, a press on a control still
 * fires, and a swipe across the other axis is never stolen.
 */
const ACTIVATION_THRESHOLD = 8;

export type DragAxis = "x" | "y";

export interface DragDismissParams {
  /** Travel toward the dismiss edge (px); the gesture writes the finger into it. */
  offset: SharedValue<number>;
  /** Drag axis. */
  axis: DragAxis;
  /** Screen direction that dismisses (+1 = right/down, -1 = left/up). */
  sign: 1 | -1;
  /** Panel size along the axis (px); the threshold is a fraction of this. */
  extent: number;
  /**
   * Distance the panel springs on a committed dismiss to slide fully off-screen
   * (px). Defaults to `extent`, which is correct for an edge-pinned surface (a
   * Drawer travels its own size to clear the edge). A centred / top-anchored
   * panel (Modal) sits away from the edge and must travel further — pass the
   * viewport size along the axis so it leaves the screen instead of springing
   * back to `extent` and hanging on-screen until the close fires.
   */
  dismissTravel?: number;
  /** Enable the gesture (off until measured / when `dragToDismiss` is false). */
  enabled: boolean;
  /** Dismiss threshold as a fraction of `extent`. @default 0.3 */
  threshold?: number;
  /** Spring override for the settle. */
  spring?: WithSpringConfig;
  /** Fired (JS) when the panel has animated off-screen and should close. */
  onDismiss: () => void;
}

/**
 * A single-axis drag-to-dismiss `Gesture.Pan`, shared by `Modal` (axis `y`,
 * sign `-1` — drag up) and `Drawer` (per-edge axis/sign). Tracks the finger toward the
 * dismiss edge into `offset` (rubber-banding the wrong way), and on release runs
 * the pure {@link shouldDismiss} on the UI thread: dismiss → spring off-screen
 * then `onDismiss`; otherwise spring back to rest. Works on web and native (RNGH
 * `Gesture.Pan` supports both).
 */
export function useDragDismiss(params: DragDismissParams): PanGesture {
  const { offset, axis, sign, extent, dismissTravel, enabled, threshold, spring, onDismiss } =
    params;
  const panStart = useSharedValue(0);
  // Whether this cycle activated (crossed the threshold into a real drag). A bare
  // tap begins + finalizes without activating, so this stays false.
  const active = useSharedValue(false);
  // Whether `onEnd` already committed a settle, so the `onFinalize` safety net only
  // runs for an activated drag that was cancelled/interrupted before a clean end.
  const settled = useSharedValue(false);
  const config = spring ?? DEFAULT_DISMISS_SPRING;
  // How far the panel travels to clear the screen on a committed dismiss. The
  // decision threshold still measures against `extent` (a fraction of the panel);
  // only the settle target differs (see `dismissTravel`).
  const exitTo = dismissTravel != null && dismissTravel > extent ? dismissTravel : extent;

  return React.useMemo(() => {
    // Only claim the touch once it has travelled along the drag axis — taps,
    // control presses, and cross-axis swipes are left to their own handlers.
    const threshold2: [number, number] = [-ACTIVATION_THRESHOLD, ACTIVATION_THRESHOLD];
    const gesture =
      axis === "x"
        ? Gesture.Pan().enabled(enabled).activeOffsetX(threshold2)
        : Gesture.Pan().enabled(enabled).activeOffsetY(threshold2);

    return gesture
      .onBegin(() => {
        "worklet";
        // Touch-down (may still be a tap). Reset the cycle flags but leave any
        // running settle spring alone — cancelling here would freeze a mid-flight
        // panel under a tap that never becomes a drag.
        active.value = false;
        settled.value = false;
      })
      .onStart(() => {
        "worklet";
        // Activation (a real drag crossed the threshold). Catch the panel wherever
        // its spring currently is and hand it to the finger with no jump — grabbing
        // a flying panel back cancels its pending dismiss (the `finished` callback
        // below only fires `onDismiss` when the off-screen spring completes cleanly).
        panStart.value = offset.value;
        cancelAnimation(offset);
        active.value = true;
      })
      .onUpdate((e) => {
        "worklet";
        const raw = axis === "x" ? e.translationX : e.translationY;
        // Map screen translation into dismiss-direction travel. Hard-clamp the
        // wrong way to 0: the panel rests fully on-screen, so it can only travel
        // TOWARD the edge — never further into the screen than its open position.
        const d = panStart.value + raw * sign;
        offset.value = d > 0 ? d : 0;
      })
      .onEnd((e) => {
        "worklet";
        const velocity = (axis === "x" ? e.velocityX : e.velocityY) * sign;
        settled.value = true;
        // Carry the release velocity into the settle so the motion is continuous
        // through the finger-lift (no hitch from a spring restarting at rest). On a
        // committed dismiss spring off-screen, then fire `onDismiss` from the
        // spring's completion callback — `scheduleOnRN` hops back to JS. This runs
        // entirely on the UI runtime (no JS-thread `addListener`, which Reanimated
        // forbids on native). Re-grabbing the panel cancels the spring, so the
        // callback never fires for a caught dismiss; otherwise spring back to rest.
        if (shouldDismiss({ offset: offset.value, velocity, extent, threshold })) {
          offset.value = withSpring(exitTo, { ...config, velocity }, (finished) => {
            "worklet";
            if (finished) scheduleOnRN(onDismiss);
          });
        } else {
          offset.value = withSpring(0, { ...config, velocity });
        }
      })
      .onFinalize(() => {
        "worklet";
        // Safety net for an activated drag interrupted/cancelled before a clean
        // `onEnd` (e.g. the OS stole the gesture) — spring back to rest. Never
        // dismisses: only a real release may close the panel.
        if (!active.value || settled.value) return;
        offset.value = withSpring(0, config);
      });
  }, [
    offset,
    panStart,
    active,
    settled,
    axis,
    sign,
    extent,
    exitTo,
    enabled,
    threshold,
    config,
    onDismiss,
  ]);
}
