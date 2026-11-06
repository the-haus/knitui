import * as React from "react";
import { Platform, RefreshControl } from "react-native";
import { GestureDetector, useNativeGesture } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { ScrollAreaHandle } from "@knitui/components";

import {
  clamp,
  EXPAND_EPSILON,
  OVERSCROLL_SLOP,
  overscrollPull,
  settle,
  shouldPinToTop,
} from "../engine";
import { settleOffset } from "../motion/animate";
import { useSheetScrollContext } from "./scrollContext";
import { SCROLL_AREA_ONLY_PROPS, type SheetScrollViewProps } from "./ScrollView.shared";

export type { SheetScrollViewProps } from "./ScrollView.shared";

/** The scroller methods `Sheet.ScrollView`'s handle calls. */
interface ScrollerHandle {
  scrollTo: (to: { x?: number; y?: number; animated?: boolean }) => void;
  scrollToEnd: (options?: { animated?: boolean }) => void;
}

const FILL = { flex: 1 } as const;
const HUG = { flexGrow: 0, flexShrink: 1 } as const;

/** iOS only: Android reports no negative offset, and its Pan can't lose this race. */
const HAS_RUBBER_BAND = Platform.OS === "ios";

/** The worklet inside a Reanimated scroll handler passed as `onScroll`, if it is one. */
function workletOf(handler: unknown): ((e: unknown) => void) | undefined {
  if (typeof handler !== "object" || handler === null) return undefined;
  return (handler as { workletEventHandler?: { worklet?: (e: unknown) => void } })
    .workletEventHandler?.worklet;
}

/**
 * The coordinated native scroller inside a `Sheet`. Its ref is the raw scroll view,
 * which is what `FlatList`'s `renderScrollComponent` needs.
 *
 *  - A native gesture of its own, simultaneous with the sheet's Pan, so the finger
 *    drives one continuous gesture and several scrollers can share a panel.
 *  - The scroll worklet publishes the offset the Pan reads to know the list is at the
 *    top, and pins the list there while the sheet isn't expanded, so a drag from a
 *    partly open sheet moves the panel.
 *  - A fallback for a Pan that loses the race on iOS. The list's recognizer can win
 *    outright, and then the list rubber-bands while the Pan never activates, leaving
 *    the handoff unreachable. Overscroll on a list the Pan hasn't claimed is the one
 *    signal that survives, so that drives the panel, and the release settles it.
 *
 * Outside a `Sheet` (no context) it is a plain scroller.
 */
export const SheetScrollable = React.forwardRef<ScrollerHandle, SheetScrollViewProps>(
  function SheetScrollable(props, ref) {
    const {
      children,
      style,
      onScroll,
      scrollbars,
      type,
      onRefresh,
      refreshing,
      refreshColor,
      onScrollPositionChange,
      scrollValueY,
      scrollValueX,
      ...rest
    } = props;
    const passthrough: Record<string, unknown> = { ...rest };
    for (const key of SCROLL_AREA_ONLY_PROPS) delete passthrough[key];

    const ctx = useSheetScrollContext();
    const aref = useAnimatedRef<Animated.ScrollView>();
    const setRef = React.useCallback(
      (node: Animated.ScrollView | null) => {
        (aref as unknown as (n: unknown) => void)(node);
        if (typeof ref === "function") ref(node as never);
        else if (ref) (ref as React.RefObject<unknown>).current = node;
      },
      [aref, ref],
    );

    const scrollers = ctx?.scrollers;
    React.useEffect(() => {
      if (!scrollers) return undefined;
      scrollers.value += 1;
      return () => {
        scrollers.value -= 1;
      };
    }, [scrollers]);

    const localY = useSharedValue(0);
    const underFinger = useSharedValue(false);
    const panelFromList = useSharedValue(false);
    const dragging = useSharedValue(false);
    const pullStart = useSharedValue(0);
    const dragStart = useSharedValue(0);

    const scrollOffsetY = ctx?.scrollOffsetY;
    const sheetOffset = ctx?.sheetOffset;
    const panActive = ctx?.panActive;
    const offsets = ctx?.offsets;
    const expandedOffset = ctx?.expandedOffset ?? 0;
    const closed = ctx?.closed ?? 0;
    const dismissible = ctx?.dismissible ?? false;
    const spring = ctx?.spring;
    const onSettle = ctx?.onSettle;
    const handoffEnabled = ctx?.handoffEnabled ?? false;

    // The Pan reads one offset, so the scroller that took the touch publishes its own
    // the moment the finger lands, before the Pan can activate.
    const gesture = useNativeGesture(
      React.useMemo(
        () => ({
          simultaneousWith: ctx?.panGesture,
          onBegin: () => {
            "worklet";
            underFinger.value = true;
            if (scrollOffsetY) scrollOffsetY.value = localY.value;
          },
          onFinalize: () => {
            "worklet";
            underFinger.value = false;
          },
        }),
        [ctx?.panGesture, underFinger, scrollOffsetY, localY],
      ),
    );

    // JS `onScroll` listeners, `FlatList`'s among them, get the event a plain
    // `ScrollView` would give them. The handler has to be a worklet, so they hop back.
    const callerWorklet = workletOf(onScroll);
    const jsOnScroll = callerWorklet ? undefined : (onScroll as ((e: unknown) => void) | undefined);
    const hasJsOnScroll = jsOnScroll !== undefined;
    const hasPositionChange = onScrollPositionChange !== undefined;
    const latest = React.useRef({ jsOnScroll, onScrollPositionChange });
    latest.current = { jsOnScroll, onScrollPositionChange };
    const emit = React.useCallback((nativeEvent: { contentOffset: { x: number; y: number } }) => {
      latest.current.jsOnScroll?.({ nativeEvent, timeStamp: Date.now() });
      latest.current.onScrollPositionChange?.(nativeEvent.contentOffset);
    }, []);

    const handler = useAnimatedScrollHandler({
      onBeginDrag: (e) => {
        "worklet";
        dragging.value = true;
        panelFromList.value = false;
        callerWorklet?.(e);
      },
      onScroll: (e) => {
        "worklet";
        callerWorklet?.(e);
        const y = e.contentOffset.y;
        localY.value = y;
        if (scrollValueY) scrollValueY.value = y;
        if (scrollValueX) scrollValueX.value = e.contentOffset.x;
        if (hasJsOnScroll || hasPositionChange) scheduleOnRN(emit, e);
        if (!scrollOffsetY || !sheetOffset || !offsets) return;
        if (underFinger.value || dragging.value) scrollOffsetY.value = y;

        const unclaimed = dragging.value && !panActive?.value;
        const takeOver = () => {
          "worklet";
          if (panelFromList.value) return;
          panelFromList.value = true;
          pullStart.value = sheetOffset.value;
          dragStart.value = sheetOffset.value;
          cancelAnimation(sheetOffset);
        };
        if (HAS_RUBBER_BAND && handoffEnabled && unclaimed) {
          if (y < -OVERSCROLL_SLOP) {
            takeOver();
            const pull = overscrollPull(-y, e.layoutMeasurement.height);
            const max = dismissible ? closed : offsets[offsets.length - 1];
            sheetOffset.value = clamp(pullStart.value + pull, expandedOffset, max);
            return;
          }
          // A drag up on a partly open sheet: the panel rises first. The list would only
          // be pinned back to the top here, so its travel is the panel's.
          if (y > 0 && sheetOffset.value > expandedOffset + EXPAND_EPSILON) {
            takeOver();
            const next = Math.max(expandedOffset, sheetOffset.value - y);
            sheetOffset.value = next;
            pullStart.value = next;
            scrollTo(aref, 0, 0, false);
            scrollOffsetY.value = 0;
            localY.value = 0;
            return;
          }
        }
        // While the sheet isn't fully expanded, keep the list pinned to the top so the
        // drag drives the panel (and a mid-collapse list can't scroll).
        if (
          !panelFromList.value &&
          shouldPinToTop(handoffEnabled, sheetOffset.value, expandedOffset, y)
        ) {
          scrollTo(aref, 0, 0, false);
          scrollOffsetY.value = 0;
          localY.value = 0;
        }
      },
      onEndDrag: (e) => {
        "worklet";
        callerWorklet?.(e);
        dragging.value = false;
        const fromList = panelFromList.value;
        panelFromList.value = false;
        // The Pan caught up mid-drag: its own release settles the panel.
        if (!fromList || panActive?.value || !sheetOffset || !offsets || !onSettle) return;
        // `velocity.y` is pt/ms of scrolling; a pull down scrolls toward negative y.
        const velocity = -(e.velocity?.y ?? 0) * 1000;
        const result = settle({
          offset: sheetOffset.value,
          velocity,
          startOffset: dragStart.value,
          offsets,
          dismissOffset: closed,
          dismissible,
        });
        settleOffset(sheetOffset, result.offset, velocity, spring);
        scheduleOnRN(onSettle, result);
      },
    });
    const refreshControl =
      onRefresh !== undefined ? (
        <RefreshControl
          refreshing={Boolean(refreshing)}
          onRefresh={onRefresh}
          tintColor={refreshColor}
          colors={refreshColor ? [refreshColor] : undefined}
        />
      ) : undefined;

    const scroller = (
      <Animated.ScrollView
        ref={setRef}
        scrollEventThrottle={16}
        nestedScrollEnabled
        showsVerticalScrollIndicator={scrollbars !== false && type !== "never"}
        refreshControl={refreshControl}
        {...passthrough}
        style={[ctx?.fit ? HUG : FILL, style as never]}
        onScroll={handler}
      >
        {children}
      </Animated.ScrollView>
    );

    if (!ctx) return scroller;
    return <GestureDetector gesture={gesture}>{scroller}</GestureDetector>;
  },
);

/**
 * Scrollable content region of a `Sheet` (React Native). Dragging its content moves
 * the panel until the sheet is expanded, then scrolls the list; pulling a list that
 * is back at the top takes the panel with it. The ref matches the web build's
 * `ScrollAreaHandle`.
 */
export const SheetScrollView = React.forwardRef<ScrollAreaHandle, SheetScrollViewProps>(
  function SheetScrollView(props, ref) {
    const scroller = React.useRef<ScrollerHandle>(null);
    const lastY = React.useRef(0);
    const { onScrollPositionChange } = props;
    const onPosition = React.useCallback(
      (position: { x: number; y: number }) => {
        lastY.current = position.y;
        onScrollPositionChange?.(position);
      },
      [onScrollPositionChange],
    );

    React.useImperativeHandle(
      ref,
      (): ScrollAreaHandle => ({
        scrollTo: ({ x, y, animated }) =>
          scroller.current?.scrollTo({ x, y, animated: Boolean(animated) }),
        scrollToTop: (animated) =>
          scroller.current?.scrollTo({ y: 0, animated: Boolean(animated) }),
        scrollToBottom: (animated) =>
          scroller.current?.scrollToEnd({ animated: Boolean(animated) }),
        scrollToEnd: (animated) => scroller.current?.scrollToEnd({ animated: Boolean(animated) }),
        scrollIntoView: () => {
          // Selector-based revealing is a no-op on native (see ScrollArea.native).
        },
        getViewport: () => scroller.current as never,
        getScrollPosition: () => ({ x: 0, y: lastY.current }),
      }),
      [],
    );

    return <SheetScrollable {...props} ref={scroller} onScrollPositionChange={onPosition} />;
  },
);
