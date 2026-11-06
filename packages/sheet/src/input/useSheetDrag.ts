import * as React from "react";
import {
  type PanGesture,
  type PanGestureConfig,
  usePanGesture,
} from "react-native-gesture-handler";
import {
  cancelAnimation,
  type SharedValue,
  useSharedValue,
  type WithSpringConfig,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import {
  handoffStart,
  handoffUpdate,
  nearestSnapIndex,
  settle,
  type SettleResult,
  shouldSettleOnEnd,
} from "../engine";
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
  /**
   * How many `Sheet.ScrollView`s are mounted in the panel. The handoff applies only
   * while there is at least one: a sheet of plain content has no list offset to
   * read, and acting as if it had one drags the panel from a scrolled list.
   */
  scrollers?: SharedValue<number>;
  /**
   * Live vertical scroll offset (px, ≥0) of the `Sheet.ScrollView` under the finger.
   * While the sheet is fully expanded the list owns the drag, and the panel only
   * starts moving once the list is at the top and the finger pulls down.
   */
  scrollOffsetY?: SharedValue<number>;
  /** True while this Pan is active, so a scroller knows the drag is already claimed. */
  panActive?: SharedValue<boolean>;
  /** Fired (JS) when a drag begins — pauses any external sync. */
  onStart: () => void;
  /** Fired (JS) when a drag settles — commits the resting snap / dismiss. */
  onSettle: (result: SettleResult) => void;
  /**
   * Fired (JS) when a scroll-owned drag releases — the list was scrolling, so the
   * panel is not settled, but any external-sync pause must still be lifted.
   */
  onScrollRelease?: () => void;
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
    scrollers,
    scrollOffsetY,
    panActive,
    onStart,
    onSettle,
    onScrollRelease,
  } = params;

  const panStart = useSharedValue(0);
  // Whether this cycle ever activated (crossed the threshold into a real drag).
  // A bare tap begins + finalizes without activating, so this stays false and the
  // safety net leaves it alone.
  const active = useSharedValue(false);
  // Whether `onDeactivate` already committed a settle, so the `onFinalize` safety net
  // only runs when an activated drag was cancelled/interrupted before a clean end.
  const settled = useSharedValue(false);
  // Handoff bookkeeping (only meaningful when `coordinated`): whether the panel —
  // rather than the list — currently owns the drag, and the finger translation at
  // the moment the sheet took over (so the panel tracks from there with no jump).
  const sheetOwns = useSharedValue(false);
  const handoff = useSharedValue(0);
  const config = spring;

  // RNGH 3: the gesture is a hook taking ONE config object. Its identity is keyed
  // on that object (the hook clones + remaps it in a `useMemo([config])` and pushes
  // it to the native handler on change), so the config is memoized here with the
  // same dependencies the former builder memo had — a stable config
  // keeps the handler's config untouched across unrelated re-renders.
  const panConfig = React.useMemo<PanGestureConfig>(() => {
    const isCoordinated = () => {
      "worklet";
      return scrollers !== undefined && scrollers.value > 0;
    };
    const minOffset = offsets.length > 0 ? offsets[0] : 0;
    const maxOffset = dismissible
      ? closed
      : offsets.length > 0
        ? offsets[offsets.length - 1]
        : closed;

    return {
      enabled,
      // Only claim the touch once it has travelled vertically — taps, presses,
      // and horizontal swipes inside the panel are left to their own handlers.
      activeOffsetY: [-ACTIVATION_THRESHOLD, ACTIVATION_THRESHOLD],
      onBegin: () => {
        "worklet";
        // Touch-down (may still be a tap). Reset the cycle flags but leave any
        // running open/close/settle spring alone — cancelling here would freeze a
        // mid-flight panel under a tap that never becomes a drag.
        active.value = false;
        settled.value = false;
      },
      onActivate: () => {
        "worklet";
        // Activation (a real drag crossed the threshold). Catch the panel wherever
        // its spring currently is and hand it to the finger with no jump — capture
        // the live offset as the anchor, then stop the spring.
        panStart.value = offset.value;
        cancelAnimation(offset);
        active.value = true;
        if (panActive) panActive.value = true;
        // Handoff: decide who owns this drag (the panel, or a nested list). The
        // pure engine holds the rule; the shared values just carry it per frame.
        const start = handoffStart(isCoordinated(), offset.value, minOffset);
        sheetOwns.value = start.sheetOwns;
        handoff.value = start.handoff;
        scheduleOnRN(onStart);
      },
      onUpdate: (e) => {
        "worklet";
        const r = handoffUpdate({
          coordinated: isCoordinated(),
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
      },
      onDeactivate: (e) => {
        "worklet";
        // The list was scrolling, not the panel: don't settle the sheet (a
        // downward fling on the list must not collapse it) — let native momentum
        // run and just lift the external-sync pause on the JS side.
        if (!shouldSettleOnEnd(isCoordinated(), sheetOwns.value)) {
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
      },
      onFinalize: () => {
        "worklet";
        if (panActive) panActive.value = false;
        // Safety net for an *activated* drag that was interrupted/cancelled before
        // a clean `onDeactivate` (e.g. the OS stole the gesture) — it would otherwise
        // leave the panel parked wherever the finger left it. Re-settle to the
        // nearest *visible* snap. Deliberately never the closed offset: only a
        // real release (`onDeactivate`) or the overlay press may dismiss, so an aborted
        // drag can't accidentally close the sheet.
        if (!active.value || settled.value || offsets.length === 0) return;
        const i = nearestSnapIndex(offset.value, offsets);
        settleOffset(offset, offsets[i], 0, config);
        scheduleOnRN(onSettle, { index: i, offset: offsets[i], dismiss: false });
      },
    };
  }, [
    offset,
    panStart,
    active,
    settled,
    sheetOwns,
    handoff,
    scrollers,
    scrollOffsetY,
    panActive,
    offsets,
    closed,
    dismissible,
    enabled,
    config,
    onStart,
    onSettle,
    onScrollRelease,
  ]);

  return usePanGesture(panConfig);
}
