import * as React from "react";
import { type LayoutChangeEvent, type ScrollView } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  cancelAnimation,
  useAnimatedReaction,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withDecay,
  withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

import { styled, type TamaguiElement, withStaticProperties } from "@knitui/core";
import { useDebouncedCallback, useMove, useReducedMotion } from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import { useReducedTransition } from "../internal/motion";
import { animateOnlyProps } from "../internal/style-props";
import { slotStyles } from "../internal/styles";
import {
  DEFAULT_HIDE_DELAY,
  DEFAULT_IDLE_SCROLLBAR_SIZE,
  DEFAULT_SCROLLBAR_SIZE,
  DEFAULT_SHADOW_SIZE,
  DEFAULT_STICK_THRESHOLD,
  type Edge,
  type EdgeState,
  getReachedEdges,
  getThumbGeometry,
  isClickOnThumb,
  isNearBottom,
  isScrollbarVisible,
  MIN_THUMB_SIZE,
  pageScrollTarget,
  resolveAxes,
  resolveShadowEdges,
  SCROLL_AREA_SLOTS,
  SCROLL_END_DELAY,
  type ScrollAreaHandle,
  type ScrollAreaOwnProps,
  scrollFromThumbPosition,
  type ScrollIntoViewOptions,
  type ScrollPosition,
  type ScrollToOptions,
  shouldOffsetAxis,
} from "./ScrollArea.shared";

export type {
  Edge,
  EdgeState,
  ScrollAreaHandle,
  ScrollAreaScrollbars,
  ScrollAreaType,
  ScrollIntoViewOptions,
  ScrollPosition,
  ScrollToOptions,
} from "./ScrollArea.shared";

/* Hoisted `animateOnly` property list (see web build) — module-level so it is not
   reallocated per render. */
const ANIMATE_OPACITY = ["opacity"];

/* Movement (px) on an enabled axis before the Pan claims the gesture. Below this a
   touch is treated as a tap so pressable children still fire; once exceeded the Pan
   activates and (on Android) wins over an ANCESTOR ScrollView — which is why every
   scrollable case uses the Pan engine, not a native nested ScrollView. */
const PAN_ACTIVATE_THRESHOLD = 8;

/**
 * How often (ms) a scroll may cross to the JS thread when the ONLY consumer is the
 * scrollbar auto-hide (`type="hover"`/`"scroll"` with no scroll callbacks — the
 * default). The flash is a boolean plus a ~1s trailing timer, so a few hops per
 * second is indistinguishable from every frame, while a per-frame `runOnJS` piled
 * work onto the JS thread precisely while it was rendering the content being flung.
 */
const SCROLL_FLASH_INTERVAL_MS = 120;

/* -------------------------------------------------------------------------- */
/* UI-thread worklet helpers                                                  */
/* -------------------------------------------------------------------------- */

/** `clamp`, inlined as a worklet so the thumb-geometry math runs on the UI thread. */
function clampW(value: number, min: number, max: number): number {
  "worklet";
  return value < min ? min : value > max ? max : value;
}

/**
 * UI-thread rate limiter for the `runOnJS` hop. Returns `true` (and re-arms) when a
 * report is due: always, when `intervalMs` is 0, otherwise at most once per interval.
 */
function shouldReportW(last: { value: number }, intervalMs: number): boolean {
  "worklet";
  if (intervalMs <= 0) return true;
  const now = Date.now();
  if (now - last.value < intervalMs) return false;
  last.value = now;
  return true;
}

/**
 * Thumb length + offset along one axis, computed entirely on the UI thread.
 * Mirrors {@link getThumbGeometry} (the JS twin used for layout decisions) but is
 * a worklet so {@link useAnimatedStyle} can drive the thumb from a shared scroll
 * value without ever crossing back to the JS thread.
 */
function thumbGeometryW(
  contentSize: number,
  viewportSize: number,
  trackSize: number,
  scrollOffset: number,
): { size: number; offset: number } {
  "worklet";
  if (!(contentSize > viewportSize + 1) || viewportSize <= 0) return { size: 0, offset: 0 };
  const ratio = viewportSize / contentSize;
  const size = clampW(
    Math.round(ratio * trackSize),
    Math.min(MIN_THUMB_SIZE, trackSize),
    trackSize,
  );
  const maxScroll = contentSize - viewportSize;
  const maxThumbOffset = trackSize - size;
  const progress = maxScroll > 0 ? clampW(scrollOffset / maxScroll, 0, 1) : 0;
  return { size, offset: Math.round(progress * maxThumbOffset) };
}

/* -------------------------------------------------------------------------- */
/* Styled frames (shared visual language with the web build)                  */
/* -------------------------------------------------------------------------- */

/**
 * `ScrollArea` (React Native) — a scrollable viewport with **custom overlay
 * scrollbars** drawn on top, so the scrollbars look and behave the same as on web
 * (`ScrollArea.tsx`) and are fully themeable.
 *
 * Scroll engine: a single **gesture-handler `Pan` + reanimated translate** engine
 * drives every scrollable case (`x` / `y` / `xy`). The content is laid out once and
 * translated by `scrollX`/`scrollY` shared values, with `withDecay` momentum on
 * release. Two reasons this beats RN's native `ScrollView` here:
 *  1. Native `ScrollView` only pans ONE axis, so `xy` needs nesting — which collapses
 *     the cross-axis layout on Android and can't scroll diagonally. The Pan engine
 *     does true diagonal scrolling.
 *  2. A native `ScrollView` nested inside another `ScrollView` (very common — e.g. a
 *     ScrollArea inside a scrolling page) loses the drag to the ancestor on Android.
 *     The Pan claims the gesture once it passes {@link PAN_ACTIVATE_THRESHOLD}, so the
 *     area scrolls reliably even when nested.
 *
 * Because the offset lives in shared values, each thumb is an `Animated.View`
 * positioned by a {@link useAnimatedStyle} worklet and scrolling never re-renders
 * React. JS-side callbacks (`onScrollPositionChange` / reach / stick-to-bottom /
 * `onScrollEnd`) and the scrollbar auto-hide go through a gated `runOnJS`, only when a
 * consumer needs them.
 *
 * `ScrollArea.Autosize` is the one exception: it grows with its content up to a max
 * height, which needs content-driven sizing, so it uses a native `Animated.ScrollView`.
 *
 * Keyboard scrolling is web-only; edge fades degrade to a translucent scrim (no
 * cross-platform gradient primitive) unless `renderShadow` is supplied.
 */
const ScrollAreaFrame = styled(Box, {
  name: "ScrollArea",
  position: "relative",
  overflow: "hidden",
});

/**
 * Composable viewport part, exposed as `ScrollArea.Viewport` for surface parity
 * with the web build. The live scroller is the Pan engine's clip (or, for Autosize,
 * an RN `ScrollView`); this is a marker/styling handle rather than the live scroller.
 */
const ScrollAreaViewport = styled(Box, {
  name: "ScrollAreaViewport",
  width: "100%",
  height: "100%",
});

const ScrollAreaScrollbar = styled(Box, {
  name: "ScrollAreaScrollbar",
  position: "absolute",
  backgroundColor: "$colorTransparent",
  padding: 2,
  zIndex: 2,
});

const ScrollAreaThumb = styled(Box, {
  name: "ScrollAreaThumb",
  position: "absolute",
  backgroundColor: "$color8",
  borderRadius: 9999,
  opacity: 0.7,
  pressStyle: { opacity: 1 },
});

const ScrollAreaCorner = styled(Box, {
  name: "ScrollAreaCorner",
  position: "absolute",
  right: 0,
  bottom: 0,
  backgroundColor: "$colorTransparent",
  zIndex: 2,
});

const ScrollAreaShadow = styled(Box, {
  name: "ScrollAreaShadow",
  position: "absolute",
  zIndex: 1,
  pointerEvents: "none",
});

// `shadowColor` is also a Box (RN) shadow style prop; the edge-fade `shadowColor`
// from `ScrollAreaOwnProps` (a plain string) wins, so it is omitted from BoxProps.
export interface ScrollAreaProps
  extends Omit<BoxProps, "type" | "shadowColor">, ScrollAreaOwnProps {}

/** Internal: `ScrollArea.Autosize` forwards this so the component uses the native
 *  `ScrollView` path (content-driven sizing) instead of the Pan engine. */
type InternalProps = ScrollAreaProps & { autosize?: boolean };

/** Viewport + content dimensions. Updated only on layout/content-size change
 *  (never per scroll frame), so it can decide rail/corner layout cheaply. */
interface Size {
  viewportW: number;
  viewportH: number;
  contentW: number;
  contentH: number;
}

const ZERO_SIZE: Size = { viewportW: 0, viewportH: 0, contentW: 0, contentH: 0 };

/** Geometry for one edge's fade overlay box (absolute placement + size). */
const shadowBoxProps = (edge: Edge, size: number): Partial<BoxProps> => {
  switch (edge) {
    case "top":
      return { top: 0, left: 0, right: 0, height: size };
    case "bottom":
      return { bottom: 0, left: 0, right: 0, height: size };
    case "left":
      return { top: 0, bottom: 0, left: 0, width: size };
    case "right":
      return { top: 0, bottom: 0, right: 0, width: size };
  }
};

const ScrollAreaComponent = React.forwardRef<ScrollAreaHandle, ScrollAreaProps>(
  function ScrollArea(props, ref) {
    const {
      scrollbars = "xy",
      type = "hover",
      scrollbarSize = DEFAULT_SCROLLBAR_SIZE,
      idleScrollbarSize = DEFAULT_IDLE_SCROLLBAR_SIZE,
      offsetScrollbars = false,
      scrollHideDelay = DEFAULT_HIDE_DELAY,
      onScrollPositionChange,
      scrollValueX,
      scrollValueY,
      viewportRef,
      viewportProps,
      keyboardShouldPersistTaps,
      scrollbarProps,
      thumbProps,
      cornerProps,
      styles,
      handleRef,
      shadows = false,
      shadowSize = DEFAULT_SHADOW_SIZE,
      shadowColor,
      renderShadow,
      onReachTop,
      onReachBottom,
      onReachStart,
      onReachEnd,
      onScrollEnd,
      reachThreshold = 0,
      stickToBottom = false,
      stickToBottomThreshold = DEFAULT_STICK_THRESHOLD,
      trackClickBehavior = "jump",
      // keyboardScrolling / keyStep are web-only; accepted and ignored here.
      keyboardScrolling: _keyboardScrolling,
      keyStep: _keyStep,
      // Internal: Autosize uses the native ScrollView path.
      autosize = false,
      children,
      ...rest
    } = props as InternalProps;

    const axes = resolveAxes(scrollbars);
    const both = axes.x && axes.y;
    const scrollable = axes.x || axes.y;
    // Only `xy` needs the Pan engine (RN can't scroll two axes in one ScrollView, and
    // nesting two collapses the layout on Android). Single-axis stays on a native
    // `Animated.ScrollView` with `nestedScrollEnabled` — native momentum/bounce, and
    // it scrolls FIRST when nested in another ScrollView (then hands off to the parent
    // at its edge), which a custom Pan can't do for a same-axis ancestor.
    const usePan = both && !autosize;
    // Uniform per-slot styling is low-precedence sugar: it layers UNDER the discrete
    // `*Props`, so explicit per-part props win (Pillar B).
    const slots = slotStyles(styles, SCROLL_AREA_SLOTS, "ScrollArea");
    const mergedViewportProps = slots.merge("viewport", viewportProps);
    const mergedScrollbarProps = slots.merge("scrollbar", scrollbarProps);
    const mergedThumbProps = slots.merge("thumb", thumbProps);
    const mergedCornerProps = slots.merge("corner", cornerProps);
    const reducedMotion = useReducedMotion();

    // The live native scroller (Autosize only; the Pan engine has none).
    const scrollViewRef = React.useRef<ScrollView | null>(null);

    // ── UI-thread state (shared values) ──────────────────────────────────────
    // Scroll offset lives here, not in React state: the thumb worklet reads it every
    // frame on the UI thread, so scrolling never re-renders React.
    const scrollX = useSharedValue(0);
    const scrollY = useSharedValue(0);
    // Hover-grow inset, animated on drag start/end (UI thread).
    const insetSV = useSharedValue(0);
    // Pan engine: scrollable bounds + the offset captured at gesture start.
    const maxXSV = useSharedValue(0);
    const maxYSV = useSharedValue(0);
    const panStartX = useSharedValue(0);
    const panStartY = useSharedValue(0);

    // Edge-fade overlays are opt-in (`shadows`); resolve eligibility early so the JS
    // scroll path can opt in to the per-frame samples they need.
    const shadowEligible = resolveShadowEdges(shadows, axes);
    const anyShadow =
      shadowEligible.top || shadowEligible.bottom || shadowEligible.left || shadowEligible.right;

    // ── React state (changes rarely: layout + visibility) ────────────────────
    const [size, setSize] = React.useState<Size>(ZERO_SIZE);
    const [scrolling, setScrolling] = React.useState(false);
    const [dragging, setDragging] = React.useState(false);
    // Which edges have content beyond them — the ONLY thing the (opt-in) edge fades
    // need. Keeping the BOOLEANS in state (rather than mirroring the raw offset, as
    // this used to) means a fling re-renders at most four times over its whole length
    // — once per edge crossing — instead of once per frame.
    const [edges, setEdges] = React.useState<EdgeState>({
      top: false,
      bottom: false,
      left: false,
      right: false,
    });
    const hideTimeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    // Mirrors `scrolling` so the flash can skip a redundant setState per sample.
    const scrollingRef = React.useRef(false);

    const scrubRef = React.useRef<{ pending: boolean; paging: boolean }>({
      pending: false,
      paging: false,
    });
    const reachedRef = React.useRef<EdgeState>({
      top: false,
      bottom: false,
      left: false,
      right: false,
    });
    const stuckRef = React.useRef(stickToBottom);
    // Latest size, read synchronously by reach/stick logic without React state lag.
    const sizeRef = React.useRef<Size>(ZERO_SIZE);

    React.useEffect(() => () => clearTimeout(hideTimeout.current), []);

    const flashScrollbars = React.useCallback(() => {
      if (type !== "hover" && type !== "scroll") return;
      // Guarded by a ref: React only bails on a same-value update after re-entering
      // the component, so the unguarded version cost a render pass per sample.
      if (!scrollingRef.current) {
        scrollingRef.current = true;
        setScrolling(true);
      }
      clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => {
        scrollingRef.current = false;
        setScrolling(false);
      }, scrollHideDelay);
    }, [type, scrollHideDelay]);

    const debouncedScrollEnd = useDebouncedCallback((pos: ScrollPosition) => {
      onScrollEnd?.(pos);
    }, SCROLL_END_DELAY);

    const fireReachCallbacks = React.useCallback(
      (x: number, y: number) => {
        const sz = sizeRef.current;
        const reached = getReachedEdges({
          viewportW: sz.viewportW,
          viewportH: sz.viewportH,
          contentW: sz.contentW,
          contentH: sz.contentH,
          scrollX: x,
          scrollY: y,
          threshold: reachThreshold,
        });
        const prev = reachedRef.current;
        if (reached.top && !prev.top) onReachTop?.();
        if (reached.bottom && !prev.bottom) onReachBottom?.();
        if (reached.left && !prev.left) onReachStart?.();
        if (reached.right && !prev.right) onReachEnd?.();
        reachedRef.current = reached;
      },
      [reachThreshold, onReachTop, onReachBottom, onReachStart, onReachEnd],
    );

    // Re-derive the edge-fade booleans from an offset + the measured size, re-rendering
    // only when one actually flips. No-op unless `shadows` is set.
    const syncEdges = React.useCallback(
      (x: number, y: number) => {
        if (!anyShadow) return;
        const sz = sizeRef.current;
        const next: EdgeState = {
          top: y > 1,
          bottom: sz.contentH - sz.viewportH - y > 1,
          left: x > 1,
          right: sz.contentW - sz.viewportW - x > 1,
        };
        setEdges((prev) =>
          prev.top === next.top &&
          prev.bottom === next.bottom &&
          prev.left === next.left &&
          prev.right === next.right
            ? prev
            : next,
        );
      },
      [anyShadow],
    );

    // A size change can flip an edge without any scroll (content grew/shrank), and the
    // fades are no longer derived during render — so re-sync when the size lands.
    React.useEffect(() => {
      syncEdges(scrollX.value, scrollY.value);
    }, [syncEdges, size, scrollX, scrollY]);

    // Single JS entry point for a scroll sample — invoked from the UI thread via
    // `runOnJS`, and ONLY when something on the JS side actually consumes it.
    const reportScroll = React.useCallback(
      (x: number, y: number) => {
        onScrollPositionChange?.({ x, y });
        flashScrollbars();
        syncEdges(x, y);
        if (stickToBottom) {
          const sz = sizeRef.current;
          stuckRef.current = isNearBottom(y, sz.contentH, sz.viewportH, stickToBottomThreshold);
        }
        fireReachCallbacks(x, y);
        if (onScrollEnd) debouncedScrollEnd({ x, y });
      },
      [
        onScrollPositionChange,
        flashScrollbars,
        syncEdges,
        fireReachCallbacks,
        debouncedScrollEnd,
        onScrollEnd,
        stickToBottom,
        stickToBottomThreshold,
      ],
    );

    // Does a consumer need the ACTUAL per-frame samples (a value it reads, a threshold
    // it crosses)? Only then may the offset cross to the JS thread every frame.
    const needsScrollSamples =
      stickToBottom ||
      anyShadow ||
      Boolean(
        onScrollPositionChange ||
        onScrollEnd ||
        onReachTop ||
        onReachBottom ||
        onReachStart ||
        onReachEnd,
      );
    // The DEFAULT configuration (`type="hover"`, no callbacks) needs the JS thread for
    // one thing only: showing the scrollbars while the user scrolls. That is a boolean
    // with a ~1s trailing timer, so hopping the bridge 60–120×/s for it was pure waste
    // — and the worst kind, since `runOnJS` lands its work on the JS thread exactly
    // while it is busy rendering the list being flung. Throttled to a few hops/s below.
    const needsScrollFlash = type === "hover" || type === "scroll";
    const needsJsScroll = needsScrollSamples || needsScrollFlash;
    // 0 = every frame (a real consumer); otherwise the flash cadence.
    const reportIntervalMs = needsScrollSamples ? 0 : SCROLL_FLASH_INTERVAL_MS;
    // Timestamp of the last `runOnJS` hop, kept on the UI thread.
    const lastReportSV = useSharedValue(0);

    /* ---------------- size tracking ---------------- */

    const updateSize = React.useCallback(
      (patch: Partial<Size>) => {
        const prev = sizeRef.current;
        const next: Size = { ...prev, ...patch };
        if (
          next.viewportW === prev.viewportW &&
          next.viewportH === prev.viewportH &&
          next.contentW === prev.contentW &&
          next.contentH === prev.contentH
        ) {
          return;
        }
        sizeRef.current = next;
        maxXSV.value = Math.max(0, next.contentW - next.viewportW);
        maxYSV.value = Math.max(0, next.contentH - next.viewportH);
        // Keep the offset in bounds if the content shrank under the cursor.
        if (scrollX.value > maxXSV.value) scrollX.value = maxXSV.value;
        if (scrollY.value > maxYSV.value) scrollY.value = maxYSV.value;
        setSize(next);
      },
      [maxXSV, maxYSV, scrollX, scrollY],
    );

    // The frame's measured size is the viewport on both axes.
    const handleFrameLayout = React.useCallback(
      (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        updateSize({ viewportW: width, viewportH: height });
      },
      [updateSize],
    );

    // Native (Autosize) scroller content size; also drives stick-to-bottom follow.
    const handleContentSizeChange = React.useCallback(
      (w: number, h: number) => {
        updateSize({ contentW: w, contentH: h });
        if (stickToBottom && stuckRef.current && axes.y) {
          scrollViewRef.current?.scrollToEnd({ animated: false });
        }
      },
      [updateSize, stickToBottom, axes.y],
    );

    // Pan engine measures its (absolutely-positioned) content view directly.
    const handleContentLayout = React.useCallback(
      (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        updateSize({ contentW: width, contentH: height });
        if (stickToBottom && stuckRef.current) {
          scrollY.value = Math.max(0, height - sizeRef.current.viewportH);
        }
      },
      [updateSize, stickToBottom, scrollY],
    );

    /* ---------------- native (Autosize) scroll handler ---------------- */

    const scrollHandler = useAnimatedScrollHandler(
      {
        onScroll: (event) => {
          "worklet";
          scrollX.value = event.contentOffset.x;
          scrollY.value = event.contentOffset.y;
          if (needsJsScroll && shouldReportW(lastReportSV, reportIntervalMs)) {
            runOnJS(reportScroll)(event.contentOffset.x, event.contentOffset.y);
          }
        },
      },
      [needsJsScroll, reportIntervalMs, lastReportSV, reportScroll],
    );

    /* ---------------- Pan engine ---------------- */

    // Mirror the Pan offset to JS for reach/stick/onScroll consumers. The thumb never
    // waits on this — it reads the shared values directly.
    useAnimatedReaction(
      () => ({ x: scrollX.value, y: scrollY.value }),
      (curr, prev) => {
        "worklet";
        if (!usePan || !needsJsScroll) return;
        if (prev && curr.x === prev.x && curr.y === prev.y) return;
        if (!shouldReportW(lastReportSV, reportIntervalMs)) return;
        runOnJS(reportScroll)(curr.x, curr.y);
      },
    );

    // Mirror the live offset into caller-owned shared values on the UI thread, so
    // a reanimated consumer (a parallax / collapsing header) can read the scroll
    // offset with ZERO JS-thread round-trip — unlike `onScrollPositionChange`,
    // which hops to JS via `runOnJS` and stutters when JS is busy. Watches the
    // internal offset shared values, so it covers BOTH the native (Autosize) and
    // Pan engines with one reaction. No-op unless the caller passes the props.
    // When neither prop is supplied the prepare worklet reads NO shared value, so
    // reanimated registers no dependency and the reaction never runs — instead of
    // allocating + comparing an `{x, y}` object on the UI thread every frame for
    // nothing (the common case: nobody passes these).
    const mirrorsOffset = Boolean(scrollValueX || scrollValueY);
    useAnimatedReaction(
      () => (mirrorsOffset ? { x: scrollX.value, y: scrollY.value } : null),
      (curr) => {
        "worklet";
        if (!curr) return;
        if (scrollValueX) scrollValueX.value = curr.x;
        if (scrollValueY) scrollValueY.value = curr.y;
      },
    );

    const panGesture = React.useMemo(() => {
      let g = Gesture.Pan()
        .onBegin(() => {
          "worklet";
          cancelAnimation(scrollX);
          cancelAnimation(scrollY);
          panStartX.value = scrollX.value;
          panStartY.value = scrollY.value;
        })
        .onUpdate((e) => {
          "worklet";
          scrollX.value = clampW(panStartX.value - e.translationX, 0, maxXSV.value);
          scrollY.value = clampW(panStartY.value - e.translationY, 0, maxYSV.value);
        })
        .onEnd((e) => {
          "worklet";
          // No momentum under reduced motion — settle where the finger lifted.
          if (reducedMotion) return;
          if (maxXSV.value > 0) {
            scrollX.value = withDecay({
              velocity: -e.velocityX,
              clamp: [0, maxXSV.value],
              rubberBandEffect: false,
            });
          }
          if (maxYSV.value > 0) {
            scrollY.value = withDecay({
              velocity: -e.velocityY,
              clamp: [0, maxYSV.value],
              rubberBandEffect: false,
            });
          }
        });
      // Only claim the axes we actually scroll, so a cross-axis drag (and a tap)
      // passes through to ancestors / pressable children.
      if (axes.x) g = g.activeOffsetX([-PAN_ACTIVATE_THRESHOLD, PAN_ACTIVATE_THRESHOLD]);
      if (axes.y) g = g.activeOffsetY([-PAN_ACTIVATE_THRESHOLD, PAN_ACTIVATE_THRESHOLD]);
      return g;
    }, [axes.x, axes.y, reducedMotion, scrollX, scrollY, panStartX, panStartY, maxXSV, maxYSV]);

    /* ---------------- geometry (layout decisions, JS) ---------------- */

    const xScrollable = axes.x && size.contentW > size.viewportW + 1;
    const yScrollable = axes.y && size.contentH > size.viewportH + 1;
    const hasCorner = xScrollable && yScrollable;
    const yTrack = size.viewportH - (hasCorner ? scrollbarSize : 0);
    const xTrack = size.viewportW - (hasCorner ? scrollbarSize : 0);

    // JS twin for thumb LENGTH only (drives the drag math + rail visibility). Length
    // is independent of the scroll offset, so a `0` offset is correct here; the
    // rendered thumb position comes from the worklet, and live-offset hit testing
    // reads `scrollX/Y.value` inside event handlers (never during render).
    const yBar = getThumbGeometry({
      contentSize: size.contentH,
      viewportSize: size.viewportH,
      trackSize: yTrack,
      scrollOffset: 0,
    });
    const xBar = getThumbGeometry({
      contentSize: size.contentW,
      viewportSize: size.viewportW,
      trackSize: xTrack,
      scrollOffset: 0,
    });

    /* ---------------- imperative scrolling primitive ---------------- */

    // Move the viewport to an absolute offset, routing to whichever engine is live.
    const scrollToOffset = React.useCallback(
      (x: number | undefined, y: number | undefined, animated?: boolean) => {
        if (usePan) {
          const animate = animated && !reducedMotion;
          if (x !== undefined) {
            cancelAnimation(scrollX);
            const tx = clampW(x, 0, maxXSV.value);
            scrollX.value = animate ? withTiming(tx) : tx;
          }
          if (y !== undefined) {
            cancelAnimation(scrollY);
            const ty = clampW(y, 0, maxYSV.value);
            scrollY.value = animate ? withTiming(ty) : ty;
          }
          return;
        }
        scrollViewRef.current?.scrollTo({
          x: x ?? scrollX.value,
          y: y ?? scrollY.value,
          animated: Boolean(animated),
        });
      },
      [usePan, reducedMotion, scrollX, scrollY, maxXSV, maxYSV],
    );

    /* ---------------- track click + thumb drag ---------------- */

    const applyTrackClick = (axis: "x" | "y", position: number): boolean => {
      if (trackClickBehavior !== "page") return false;
      const isY = axis === "y";
      const track = isY ? yTrack : xTrack;
      const viewportSize = isY ? size.viewportH : size.viewportW;
      const contentSize = isY ? size.contentH : size.contentW;
      // Reading `.value` inside this event handler (NOT during render) is the live,
      // correct offset on either engine.
      const currentScroll = isY ? scrollY.value : scrollX.value;
      const clickPos = position * track;
      const bar = getThumbGeometry({
        contentSize,
        viewportSize,
        trackSize: track,
        scrollOffset: currentScroll,
      });
      if (isClickOnThumb(clickPos, bar.offset, bar.size)) return false;
      const target = pageScrollTarget({
        clickPos,
        thumbOffset: bar.offset,
        thumbSize: bar.size,
        viewportSize,
        currentScroll,
        maxScroll: contentSize - viewportSize,
      });
      if (isY) scrollToOffset(undefined, target, false);
      else scrollToOffset(target, undefined, false);
      return true;
    };

    const onScrubStart = () => {
      setDragging(true);
      scrubRef.current = { pending: true, paging: false };
    };
    const onScrubEnd = () => {
      setDragging(false);
      scrubRef.current = { pending: false, paging: false };
    };

    const yMove = useMove(
      ({ y }) => {
        if (scrubRef.current.pending) {
          scrubRef.current.pending = false;
          if (applyTrackClick("y", y)) {
            scrubRef.current.paging = true;
            return;
          }
        }
        if (scrubRef.current.paging) return;
        scrollToOffset(
          undefined,
          scrollFromThumbPosition({
            position: y,
            trackSize: yTrack,
            thumbSize: yBar.size,
            contentSize: size.contentH,
            viewportSize: size.viewportH,
          }),
          false,
        );
      },
      { onScrubStart, onScrubEnd },
    );
    const xMove = useMove(
      ({ x }) => {
        if (scrubRef.current.pending) {
          scrubRef.current.pending = false;
          if (applyTrackClick("x", x)) {
            scrubRef.current.paging = true;
            return;
          }
        }
        if (scrubRef.current.paging) return;
        scrollToOffset(
          scrollFromThumbPosition({
            position: x,
            trackSize: xTrack,
            thumbSize: xBar.size,
            contentSize: size.contentW,
            viewportSize: size.viewportW,
          }),
          undefined,
          false,
        );
      },
      { onScrubStart, onScrubEnd },
    );

    const showY =
      axes.y &&
      (isScrollbarVisible({ type, scrollable: yScrollable, hovered: false, scrolling }) ||
        dragging);
    const showX =
      axes.x &&
      (isScrollbarVisible({ type, scrollable: xScrollable, hovered: false, scrolling }) ||
        dragging);

    // Hover-grow is drag-driven on native (no pointer hover). The inset animates on
    // the UI thread so the grow stays smooth even while the content is flinging.
    const activeInset = 2;
    const idleInset = Math.max(activeInset, (scrollbarSize - idleScrollbarSize) / 2);
    React.useEffect(() => {
      const target = dragging ? activeInset : idleInset;
      insetSV.value = reducedMotion ? target : withTiming(target, { duration: 150 });
    }, [dragging, idleInset, reducedMotion, insetSV]);

    const fade = useReducedTransition("fast");

    /* ---------------- animated thumb styles (UI thread) ---------------- */

    // The per-frame style carries a TRANSFORM ONLY. This split is the whole point: a
    // `useAnimatedStyle` re-runs (and re-applies its result) whenever any shared value
    // it reads changes, and a transform is a compositor-only mutation while `left`/
    // `right`/`height` are LAYOUT props — pushing those through the animated style on
    // every scroll frame dirtied Yoga and forced a layout pass per frame per thumb.
    // The thumb's LENGTH is scroll-independent (`yBar.size`, plain style below) and the
    // hover-grow inset lives in its own style, which only re-runs while `insetSV` is
    // actually animating (~150ms on drag start/end).
    const yThumbStyle = useAnimatedStyle(() => {
      "worklet";
      const { offset } = thumbGeometryW(size.contentH, size.viewportH, yTrack, scrollY.value);
      return { transform: [{ translateY: offset }] };
    }, [size.contentH, size.viewportH, yTrack]);

    const yThumbInsetStyle = useAnimatedStyle(() => {
      "worklet";
      return { left: insetSV.value, right: insetSV.value };
    });

    const xThumbStyle = useAnimatedStyle(() => {
      "worklet";
      const { offset } = thumbGeometryW(size.contentW, size.viewportW, xTrack, scrollX.value);
      return { transform: [{ translateX: offset }] };
    }, [size.contentW, size.viewportW, xTrack]);

    const xThumbInsetStyle = useAnimatedStyle(() => {
      "worklet";
      return { top: insetSV.value, bottom: insetSV.value };
    });

    /* ---------------- content translate (Pan engine) ---------------- */

    const contentTranslateStyle = useAnimatedStyle(() => {
      "worklet";
      return { transform: [{ translateX: -scrollX.value }, { translateY: -scrollY.value }] };
    });

    /* ---------------- imperative handle ---------------- */

    const buildHandle = React.useCallback((): ScrollAreaHandle => {
      return {
        scrollTo: ({ x, y, animated }: ScrollToOptions) => scrollToOffset(x, y, animated),
        scrollToTop: (animated) => scrollToOffset(undefined, 0, animated),
        scrollToBottom: (animated) => {
          if (usePan) scrollToOffset(undefined, maxYSV.value, animated);
          else scrollViewRef.current?.scrollToEnd({ animated: Boolean(animated) });
        },
        scrollToEnd: (animated) => {
          if (usePan || !axes.x) scrollToOffset(maxXSV.value, undefined, animated);
          else scrollViewRef.current?.scrollToEnd({ animated: Boolean(animated) });
        },
        scrollIntoView: (_target: Element | string, _options?: ScrollIntoViewOptions) => {
          // Selector-string form is a no-op on native; measure-based revealing is
          // left to the caller via `getViewport()` + `measureLayout`.
        },
        getViewport: () => scrollViewRef.current as unknown as TamaguiElement | null,
        getScrollPosition: () => ({ x: scrollX.value, y: scrollY.value }),
      };
    }, [scrollToOffset, usePan, axes.x, maxXSV, maxYSV, scrollX, scrollY]);

    React.useImperativeHandle(ref, buildHandle, [buildHandle]);
    React.useImperativeHandle(handleRef, buildHandle, [buildHandle]);

    /* ---------------- viewport / content ---------------- */

    const padRight = shouldOffsetAxis(offsetScrollbars, "y") ? scrollbarSize : 0;
    const padBottom = shouldOffsetAxis(offsetScrollbars, "x") ? scrollbarSize : 0;

    // Shared native-ScrollView props (single-axis + Autosize). `viewportRef` lands on
    // the scroller. `nestedScrollEnabled` is what makes a vertical area scroll when it
    // sits inside another vertical ScrollView on Android (inner consumes first, then
    // the parent at the edge) — without it the ancestor steals every drag.
    //
    // TODO(viewport-token-flatten): `mergedViewportProps` is a `Partial<BoxProps>`
    // that may carry Tamagui token style props (e.g. `padding="$md"`). Spreading it
    // raw onto an RN `ScrollView` silently DROPS those token props. A faithful fix
    // routes it through `usePropsAndStyle` and splits style → `style`, padding →
    // `contentContainerStyle`, behaviour props through. Deferred (out of scope).
    const commonScrollProps = {
      showsVerticalScrollIndicator: false,
      showsHorizontalScrollIndicator: false,
      scrollEventThrottle: 16,
      nestedScrollEnabled: true,
      keyboardShouldPersistTaps,
      ...(mergedViewportProps as object),
    };

    const assignScroller = (node: ScrollView | null) => {
      scrollViewRef.current = node;
      assignRef(viewportRef, node as unknown as TamaguiElement);
    };

    let content: React.ReactNode;
    if (usePan) {
      // 2D content: absolutely positioned so it sizes to its content (for measurement)
      // and is translated on both axes by the Pan engine.
      content = (
        <GestureDetector gesture={panGesture}>
          <Animated.View
            collapsable={false}
            style={{
              flex: 1,
              overflow: "hidden",
              paddingRight: padRight,
              paddingBottom: padBottom,
            }}
          >
            <Animated.View
              onLayout={handleContentLayout}
              style={[{ position: "absolute", top: 0, left: 0 }, contentTranslateStyle]}
            >
              {children}
            </Animated.View>
          </Animated.View>
        </GestureDetector>
      );
    } else if (scrollable) {
      // Single axis: native ScrollView. `flex: 1` bounds it to the frame so it scrolls;
      // Autosize omits it so the frame grows with content up to its max height.
      content = (
        <Animated.ScrollView
          ref={assignScroller}
          style={autosize ? undefined : { flex: 1 }}
          horizontal={axes.x}
          onScroll={scrollHandler}
          onContentSizeChange={handleContentSizeChange}
          contentContainerStyle={{ paddingRight: padRight, paddingBottom: padBottom }}
          {...commonScrollProps}
        >
          {children}
        </Animated.ScrollView>
      );
    } else {
      // `scrollbars={false}`: no scrolling, just render the content.
      content = (
        <Box width="100%" height="100%">
          {children}
        </Box>
      );
    }

    /* ---------------- edge shadows ---------------- */

    // Plain (non-animated) overlays whose visibility is driven by the `edges` booleans
    // derived in `reportScroll` — opt-in, so this React-state path only costs when
    // `shadows` is set, and then only on an actual edge crossing.
    const edgeOverflow: EdgeState = edges;
    const resolvedScrim = (shadowColor ?? "$color8") as BoxProps["backgroundColor"];

    const renderEdgeShadow = (edge: Edge) => {
      if (!shadowEligible[edge]) return null;
      const visible = edgeOverflow[edge];
      const custom = renderShadow?.(edge, shadowSize);
      return (
        <ScrollAreaShadow
          key={edge}
          opacity={visible ? (custom ? 1 : 0.12) : 0}
          backgroundColor={custom ? undefined : resolvedScrim}
          {...fade}
          {...animateOnlyProps(ANIMATE_OPACITY)}
          {...shadowBoxProps(edge, shadowSize)}
        >
          {custom}
        </ScrollAreaShadow>
      );
    };

    return (
      <ScrollAreaFrame onLayout={handleFrameLayout} {...rest}>
        {content}

        {anyShadow && (
          <>
            {renderEdgeShadow("top")}
            {renderEdgeShadow("bottom")}
            {renderEdgeShadow("left")}
            {renderEdgeShadow("right")}
          </>
        )}

        {axes.y && (
          <ScrollAreaScrollbar
            ref={yMove.ref}
            {...yMove.rootProps}
            top={0}
            right={0}
            bottom={hasCorner ? scrollbarSize : 0}
            width={scrollbarSize}
            opacity={showY ? 1 : 0}
            pointerEvents={showY ? "auto" : "none"}
            {...fade}
            {...animateOnlyProps(ANIMATE_OPACITY)}
            {...mergedScrollbarProps}
          >
            {/* Plain Animated.View carries the per-frame geometry (height/offset/
                inset); the inner Tamagui Thumb fills it and supplies colour/radius/
                `thumbProps`. Keeps reanimated off the styled component. */}
            <Animated.View
              style={[
                { position: "absolute", top: 0, height: yBar.size },
                yThumbInsetStyle,
                yThumbStyle,
              ]}
            >
              <ScrollAreaThumb top={0} left={0} right={0} bottom={0} {...mergedThumbProps} />
            </Animated.View>
          </ScrollAreaScrollbar>
        )}

        {axes.x && (
          <ScrollAreaScrollbar
            ref={xMove.ref}
            {...xMove.rootProps}
            left={0}
            right={hasCorner ? scrollbarSize : 0}
            bottom={0}
            height={scrollbarSize}
            opacity={showX ? 1 : 0}
            pointerEvents={showX ? "auto" : "none"}
            {...fade}
            {...animateOnlyProps(ANIMATE_OPACITY)}
            {...mergedScrollbarProps}
          >
            <Animated.View
              style={[
                { position: "absolute", left: 0, width: xBar.size },
                xThumbInsetStyle,
                xThumbStyle,
              ]}
            >
              <ScrollAreaThumb top={0} left={0} right={0} bottom={0} {...mergedThumbProps} />
            </Animated.View>
          </ScrollAreaScrollbar>
        )}

        {hasCorner && (
          <ScrollAreaCorner
            width={scrollbarSize}
            height={scrollbarSize}
            opacity={showX && showY ? 1 : 0}
            {...fade}
            {...animateOnlyProps(ANIMATE_OPACITY)}
            {...mergedCornerProps}
          />
        )}
      </ScrollAreaFrame>
    );
  },
);

/** Assign a value to a possibly-undefined object/callback ref. */
function assignRef<T>(ref: React.Ref<T> | undefined, value: T | null): void {
  if (typeof ref === "function") ref(value);
  else if (ref) (ref as React.RefObject<T | null>).current = value;
}

export interface ScrollAreaAutosizeProps extends ScrollAreaProps {}

/**
 * `ScrollArea.Autosize` — grows with its content up to `mah`/`maxHeight`
 * (or `maw`/`maxWidth`), then scrolls. Constrain it with `mah={...}`. Uses the native
 * `ScrollView` engine (content-driven sizing) rather than the Pan engine.
 */
const ScrollAreaAutosize = React.forwardRef<ScrollAreaHandle, ScrollAreaAutosizeProps>(
  function ScrollAreaAutosize(props, ref) {
    return <ScrollAreaComponent ref={ref} {...({ ...props, autosize: true } as ScrollAreaProps)} />;
  },
);

export const ScrollArea = withStaticProperties(ScrollAreaComponent, {
  Autosize: ScrollAreaAutosize,
  Viewport: ScrollAreaViewport,
  Scrollbar: ScrollAreaScrollbar,
  Thumb: ScrollAreaThumb,
  Corner: ScrollAreaCorner,
});
