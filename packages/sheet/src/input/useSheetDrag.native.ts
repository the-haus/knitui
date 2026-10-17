import * as React from "react";
import { Gesture, type GestureType, type PanGesture } from "react-native-gesture-handler";
import { cancelAnimation, type SharedValue, useSharedValue } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import {
  handoffStart,
  handoffUpdate,
  nearestSnapIndex,
  settle,
  shouldSettleOnEnd,
} from "../engine";
import { settleOffset } from "../motion/animate";
import { ACTIVATION_THRESHOLD, type SheetDrag, type SheetDragParams } from "./drag.types";

/**
 * The vertical drag gesture (NATIVE build; the web's is `useSheetDrag.ts`).
 * Tracks the finger into `offset` with rubber-band overdrag past both edges, and
 * on release runs the pure {@link settle} on the UI thread to pick the resting
 * snap (or dismiss), animating there with a spring before reporting the result
 * back to JS.
 */
export function useSheetDrag(params: SheetDragParams): SheetDrag {
  const { offsets, closed, dismissible, enabled, spring, onStart, onSettle, onScrollRelease } =
    params;
  // The SheetValues are reanimated SharedValues on native (`motion/value.native`).
  const offset = params.offset as SharedValue<number>;
  const scrollOffsetY = params.scrollOffsetY as SharedValue<number> | undefined;
  const scrollGesture = params.scrollGesture as GestureType | undefined;

  const panStart = useSharedValue(0);
  // Whether this cycle ever activated (crossed the threshold into a real drag).
  // A bare tap begins + finalizes without activating, so this stays false and the
  // safety net leaves it alone.
  const active = useSharedValue(false);
  // Whether `onEnd` already committed a settle, so the `onFinalize` safety net
  // only runs when an activated drag was cancelled/interrupted before a clean end.
  const settled = useSharedValue(false);
  // Handoff bookkeeping (only meaningful when `coordinated`): whether the panel —
  // rather than the list — currently owns the drag, and the finger translation at
  // the moment the sheet took over (so the panel tracks from there with no jump).
  const sheetOwns = useSharedValue(false);
  const handoff = useSharedValue(0);
  const config = spring;
  // Scroll-aware only when a nested ScrollView wired both the gesture + its offset.
  const coordinated = scrollGesture != null && scrollOffsetY != null;

  return React.useMemo((): PanGesture => {
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
        // Handoff: decide who owns this drag (the panel, or a nested list). The
        // pure engine holds the rule; the shared values just carry it per frame.
        const start = handoffStart(coordinated, offset.value, minOffset);
        sheetOwns.value = start.sheetOwns;
        handoff.value = start.handoff;
        scheduleOnRN(onStart);
      })
      .onUpdate((e) => {
        "worklet";
        const r = handoffUpdate({
          coordinated,
          translationY: e.translationY,
          scrollOffsetY: scrollOffsetY ? scrollOffsetY.value : 0,
          panStart: panStart.value,
          minOffset,
          maxOffset,
          sheetOwns: sheetOwns.value,
          handoff: handoff.value,
        });
        sheetOwns.value = r.sheetOwns;
        handoff.value = r.handoff;
        offset.value = r.offset;
      })
      .onEnd((e) => {
        "worklet";
        // The list was scrolling, not the panel: don't settle the sheet (a
        // downward fling on the list must not collapse it) — let native momentum
        // run and just lift the external-sync pause on the JS side.
        if (!shouldSettleOnEnd(coordinated, sheetOwns.value)) {
          settled.value = true;
          scheduleOnRN(onScrollRelease ?? onStart);
          return;
        }
        const result = settle({
          offset: offset.value,
          velocity: e.velocityY,
          // Where the drag began: a fling's one-step bias counts from here.
          startOffset: panStart.value,
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
    sheetOwns,
    handoff,
    coordinated,
    scrollOffsetY,
    offsets,
    closed,
    dismissible,
    enabled,
    config,
    scrollGesture,
    onStart,
    onSettle,
    onScrollRelease,
  ]);
}
