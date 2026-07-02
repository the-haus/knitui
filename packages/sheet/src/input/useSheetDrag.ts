import * as React from "react";
import { Gesture, type PanGesture } from "react-native-gesture-handler";
import {
  cancelAnimation,
  type SharedValue,
  useSharedValue,
  type WithSpringConfig,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { clampOffset, nearestSnapIndex, settle, type SettleResult } from "../engine";
import { settleOffset } from "../motion/animate";

/**
 * Vertical travel (px) the finger must cover before the pan claims the touch.
 * Below this the touch is left to the children — a tap on the scrim still
 * dismisses, a press on a control still fires, a horizontal swipe inside the
 * content is never stolen.
 */
const ACTIVATION_THRESHOLD = 8;

export interface SheetDragParams {
  /** Panel translateY (px) — the gesture tracks the finger into this. */
  offset: SharedValue<number>;
  /** Snap offsets, ascending. */
  offsets: number[];
  /** Fully-closed offset (the dismiss target). */
  closed: number;
  /** Whether a release past the lowest snap may dismiss. */
  dismissible: boolean;
  /** Disable all drag handling. */
  enabled: boolean;
  /** Spring config for the settle animation. */
  spring?: WithSpringConfig;
  /** Allow a child ScrollView to take over (handoff) — RNGH ref to compose with. */
  scrollGesture?: ReturnType<typeof Gesture.Native>;
  /** Fired (JS) when a drag begins — pauses any external sync. */
  onStart: () => void;
  /** Fired (JS) when a drag settles — commits the resting snap / dismiss. */
  onSettle: (result: SettleResult) => void;
}

/**
 * The vertical drag gesture, shared by native and web (RNGH supports both).
 * Tracks the finger into `offset` with rubber-band overdrag past both edges, and
 * on release runs the pure {@link settle} on the UI thread to pick the resting
 * snap (or dismiss), animating there with a spring before reporting the result
 * back to JS.
 */
export function useSheetDrag(params: SheetDragParams): PanGesture {
  const {
    offset,
    offsets,
    closed,
    dismissible,
    enabled,
    spring,
    scrollGesture,
    onStart,
    onSettle,
  } = params;

  const panStart = useSharedValue(0);
  // Whether this cycle ever activated (crossed the threshold into a real drag).
  // A bare tap begins + finalizes without activating, so this stays false and the
  // safety net leaves it alone.
  const active = useSharedValue(false);
  // Whether `onEnd` already committed a settle, so the `onFinalize` safety net
  // only runs when an activated drag was cancelled/interrupted before a clean end.
  const settled = useSharedValue(false);
  const config = spring;

  return React.useMemo(() => {
    const minOffset = offsets.length > 0 ? offsets[0] : 0;
    const maxOffset = dismissible
      ? closed
      : offsets.length > 0
        ? offsets[offsets.length - 1]
        : closed;

    let gesture = Gesture.Pan()
      .enabled(enabled)
      // Only claim the touch once it has travelled vertically — taps, presses,
      // and horizontal swipes inside the panel are left to their own handlers.
      .activeOffsetY([-ACTIVATION_THRESHOLD, ACTIVATION_THRESHOLD]);
    // Coordinate with a child ScrollView so scroll-at-top hands off to the sheet
    // and the two never fight (the handoff path; see useScrollHandoff).
    if (scrollGesture) gesture = gesture.simultaneousWithExternalGesture(scrollGesture);

    return gesture
      .onBegin(() => {
        "worklet";
        // Touch-down (may still be a tap). Reset the cycle flags but leave any
        // running open/close/settle spring alone — cancelling here would freeze a
        // mid-flight panel under a tap that never becomes a drag.
        active.value = false;
        settled.value = false;
      })
      .onStart(() => {
        "worklet";
        // Activation (a real drag crossed the threshold). Catch the panel wherever
        // its spring currently is and hand it to the finger with no jump — capture
        // the live offset as the anchor, then stop the spring.
        panStart.value = offset.value;
        cancelAnimation(offset);
        active.value = true;
        scheduleOnRN(onStart);
      })
      .onUpdate((e) => {
        "worklet";
        // Hard clamp to the travel range (no rubber-band overshoot): the panel
        // can't be dragged above the most-open snap or below the lowest snap
        // (or the closed offset when dismissible). The finger simply stops at the
        // limit instead of pulling the sheet past it.
        offset.value = clampOffset(panStart.value + e.translationY, minOffset, maxOffset, false);
      })
      .onEnd((e) => {
        "worklet";
        const result = settle({
          offset: offset.value,
          velocity: e.velocityY,
          offsets,
          dismissOffset: closed,
          dismissible,
        });
        // Settle on the UI thread carrying the release velocity for a continuous,
        // hitch-free finger-lift; the JS callback only commits React state.
        settled.value = true;
        settleOffset(offset, result.offset, e.velocityY, config);
        scheduleOnRN(onSettle, result);
      })
      .onFinalize(() => {
        "worklet";
        // Safety net for an *activated* drag that was interrupted/cancelled before
        // a clean `onEnd` (e.g. the OS stole the gesture) — it would otherwise
        // leave the panel parked wherever the finger left it. Re-settle to the
        // nearest *visible* snap. Deliberately never the closed offset: only a
        // real release (`onEnd`) or the overlay press may dismiss, so an aborted
        // drag can't accidentally close the sheet.
        if (!active.value || settled.value || offsets.length === 0) return;
        const i = nearestSnapIndex(offset.value, offsets);
        settleOffset(offset, offsets[i], 0, config);
        scheduleOnRN(onSettle, { index: i, offset: offsets[i], dismiss: false });
      });
  }, [
    offset,
    panStart,
    active,
    settled,
    offsets,
    closed,
    dismissible,
    enabled,
    config,
    scrollGesture,
    onStart,
    onSettle,
  ]);
}
