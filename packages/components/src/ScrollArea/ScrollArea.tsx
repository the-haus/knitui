import * as React from "react";

import {
  type GetProps,
  styled,
  type TamaguiElement,
  useTheme,
  withStaticProperties,
} from "@knitui/core";
import { useDebouncedCallback, useMergedRef, useMove, useReducedMotion } from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import { useReducedTransition } from "../internal/motion";
import { animateOnlyProps, hoverProps } from "../internal/style-props";
import { slotStyles } from "../internal/styles";
import {
  DEFAULT_HIDE_DELAY,
  DEFAULT_IDLE_SCROLLBAR_SIZE,
  DEFAULT_KEY_STEP,
  DEFAULT_SCROLLBAR_SIZE,
  DEFAULT_SHADOW_SIZE,
  DEFAULT_STICK_THRESHOLD,
  type Edge,
  edgeGradientCss,
  type EdgeState,
  getEdgeState,
  getReachedEdges,
  getThumbGeometry,
  isClickOnThumb,
  isNearBottom,
  isScrollbarVisible,
  keyToScrollDelta,
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

/* -------------------------------------------------------------------------- */
/* Hide-native-scrollbar stylesheet (web only)                                */
/* -------------------------------------------------------------------------- */

/**
 * Class that hides the browser-native scrollbar on the viewport so our custom
 * overlay thumbs are the only scrollbars visible. `scrollbar-width` covers
 * Firefox/standards; the `::-webkit-scrollbar` rule (which Tamagui can't express
 * as a pseudo-element style prop) is injected once into the document head.
 */
const HIDE_NATIVE_CLASS = "knitui-scrollarea-hide-native";

let nativeScrollbarStyleInjected = false;
const injectHideNativeScrollbarStyle = (): void => {
  if (nativeScrollbarStyleInjected || typeof document === "undefined") return;
  nativeScrollbarStyleInjected = true;
  const style = document.createElement("style");
  style.setAttribute("data-knitui-scrollarea", "");
  style.textContent =
    `.${HIDE_NATIVE_CLASS}{scrollbar-width:none;-ms-overflow-style:none;}` +
    `.${HIDE_NATIVE_CLASS}::-webkit-scrollbar{display:none;width:0;height:0;}`;
  document.head.appendChild(style);
};

/* Hoisted `animateOnly` property lists — scoping the CSS transition keeps the
   along-axis thumb position (top/left) instant while only the perpendicular
   inset + opacity animate. Module-level so they are not reallocated per render. */
const ANIMATE_OPACITY = ["opacity"];
const ANIMATE_Y_THUMB = ["left", "right", "opacity"];
const ANIMATE_X_THUMB = ["top", "bottom", "opacity"];

/* -------------------------------------------------------------------------- */
/* Styled frames                                                              */
/* -------------------------------------------------------------------------- */

/**
 * `ScrollArea` — a scrollable viewport with **custom overlay scrollbars** that
 * render and behave identically on web and React Native (see
 * `ScrollArea.native.tsx`).
 *
 * The browser-native scrollbar is hidden and replaced by draggable thumbs we
 * draw ourselves, so the scrollbars are fully themeable. Mirrors Mantine's
 * `ScrollArea` public API and extends it with a rich feature set: an imperative
 * handle (`scrollTo`/`scrollToTop`/`scrollToBottom`/`scrollToEnd`/
 * `scrollIntoView`), edge fade shadows (`shadows`), reach-edge callbacks
 * (`onReachTop`/`onReachBottom`/`onReachStart`/`onReachEnd`/`onScrollEnd`),
 * `stickToBottom` follow mode, track click paging (`trackClickBehavior`),
 * keyboard scrolling, and a hover-grow thumb (`idleScrollbarSize`).
 */
const ScrollAreaFrame = styled(Box, {
  name: "ScrollArea",
  position: "relative",
  overflow: "hidden",
});

/** The scrollable element. Native scrollbars are hidden via {@link HIDE_NATIVE_CLASS}. */
const ScrollAreaViewport = styled(Box, {
  name: "ScrollAreaViewport",
  width: "100%",
  height: "100%",
});

/** A scrollbar rail. Positioned along an edge; holds the thumb. */
const ScrollAreaScrollbar = styled(Box, {
  name: "ScrollAreaScrollbar",
  position: "absolute",
  backgroundColor: "$colorTransparent",
  padding: 2,
  zIndex: 2,
});

/** The draggable thumb. */
const ScrollAreaThumb = styled(Box, {
  name: "ScrollAreaThumb",
  position: "absolute",
  backgroundColor: "$color8",
  borderRadius: 9999,
  opacity: 0.7,
  hoverStyle: { opacity: 1 },
  pressStyle: { opacity: 1 },
});

/** The square where the two scrollbars meet. */
const ScrollAreaCorner = styled(Box, {
  name: "ScrollAreaCorner",
  position: "absolute",
  right: 0,
  bottom: 0,
  backgroundColor: "$colorTransparent",
  zIndex: 2,
});

/** A single edge fade overlay (web paints a CSS gradient into it). */
const ScrollAreaShadow = styled(Box, {
  name: "ScrollAreaShadow",
  position: "absolute",
  zIndex: 1,
  pointerEvents: "none",
});

// `shadowColor` is also a Box (RN) shadow style prop on the frame; the edge-fade
// `shadowColor` from `ScrollAreaOwnProps` (a plain string) takes precedence, so it
// is omitted from the frame props to avoid a clashing-member error.
type ScrollAreaFrameProps = Omit<GetProps<typeof ScrollAreaFrame>, "type" | "shadowColor">;

export interface ScrollAreaProps extends ScrollAreaFrameProps, ScrollAreaOwnProps {}

/* Local style narrowing for the web-only CSS props on the viewport element. */
type ViewportStyle = NonNullable<BoxProps["style"]> & {
  overflowX?: "auto" | "hidden" | "scroll" | "visible";
  overflowY?: "auto" | "hidden" | "scroll" | "visible";
  scrollbarWidth?: "auto" | "thin" | "none";
};

/** Viewport + content dimensions. Read only on mount/resize — never per scroll
 *  frame, since `scrollWidth`/`scrollHeight`/`clientWidth`/`clientHeight` force a
 *  synchronous layout reflow. */
interface Size {
  viewportW: number;
  viewportH: number;
  contentW: number;
  contentH: number;
}

const ZERO_SIZE: Size = { viewportW: 0, viewportH: 0, contentW: 0, contentH: 0 };

const readNodeSize = (node: HTMLElement): Size => ({
  viewportW: node.clientWidth,
  viewportH: node.clientHeight,
  contentW: node.scrollWidth,
  contentH: node.scrollHeight,
});

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
      viewportRef,
      viewportProps,
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
      keyboardScrolling = true,
      keyStep = DEFAULT_KEY_STEP,
      // Native-only (RN `ScrollView` tap handling); accepted and ignored here so
      // it isn't spread onto the DOM viewport via `...rest`.
      keyboardShouldPersistTaps: _keyboardShouldPersistTaps,
      children,
      ...rest
    } = props;

    const axes = resolveAxes(scrollbars);
    // Uniform per-slot styling is low-precedence sugar: it layers UNDER the
    // discrete `*Props`, so explicit per-part props win (Pillar B).
    const slots = slotStyles(styles, SCROLL_AREA_SLOTS, "ScrollArea");
    const mergedViewportProps = slots.merge("viewport", viewportProps);
    const mergedScrollbarProps = slots.merge("scrollbar", scrollbarProps);
    const mergedThumbProps = slots.merge("thumb", thumbProps);
    const mergedCornerProps = slots.merge("corner", cornerProps);
    const theme = useTheme();
    const reducedMotion = useReducedMotion();

    const viewportNodeRef = React.useRef<TamaguiElement | null>(null);
    // Size changes rarely (mount/resize). Scroll changes every frame but is kept OUT
    // of React state entirely: the thumb position + edge fades are written directly
    // to the DOM in a rAF-coalesced paint (`paintScrollbars`), so a scroll never
    // re-renders React or restyles the Tamagui thumb (the old per-frame `setState`).
    const [size, setSize] = React.useState<Size>(ZERO_SIZE);
    const [hovered, setHovered] = React.useState(false);

    // Live scroll offset + the DOM nodes we paint imperatively each frame.
    const scrollRef = React.useRef<ScrollPosition>({ x: 0, y: 0 });
    const yThumbRef = React.useRef<HTMLElement | null>(null);
    const xThumbRef = React.useRef<HTMLElement | null>(null);
    // Track sizes (viewport length minus any corner), refreshed every render.
    const geomRef = React.useRef({ yTrack: 0, xTrack: 0 });
    const rafRef = React.useRef<number | null>(null);
    const [scrolling, setScrolling] = React.useState(false);
    const [dragging, setDragging] = React.useState(false);
    const hideTimeout = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    // Latest size, read synchronously by the scroll handler without re-reading the DOM.
    const sizeRef = React.useRef<Size>(ZERO_SIZE);
    // Per-scrub state for "page" track clicks: distinguishes a thumb grab from a
    // rail click and suppresses drag-follow when the click pages instead.
    const scrubRef = React.useRef<{ pending: boolean; paging: boolean }>({
      pending: false,
      paging: false,
    });
    // Guards stick-to-bottom auto-scroll from re-arming reach/scroll logic.
    const programmaticRef = React.useRef(false);
    // Rising-edge tracking so reach callbacks fire once per crossing.
    const reachedRef = React.useRef<EdgeState>({
      top: false,
      bottom: false,
      left: false,
      right: false,
    });
    const stuckRef = React.useRef(stickToBottom);
    const prevContentHRef = React.useRef(0);

    React.useEffect(() => injectHideNativeScrollbarStyle(), []);
    React.useEffect(() => () => clearTimeout(hideTimeout.current), []);

    const readSize = React.useCallback(() => {
      const node = viewportNodeRef.current as HTMLElement | null;
      if (!node) return;
      const next = readNodeSize(node);
      const prev = sizeRef.current;
      if (
        next.viewportW === prev.viewportW &&
        next.viewportH === prev.viewportH &&
        next.contentW === prev.contentW &&
        next.contentH === prev.contentH
      ) {
        return;
      }
      sizeRef.current = next;
      setSize(next);
    }, []);

    const flashScrollbars = React.useCallback(() => {
      if (type !== "hover" && type !== "scroll") return;
      setScrolling(true);
      clearTimeout(hideTimeout.current);
      hideTimeout.current = setTimeout(() => setScrolling(false), scrollHideDelay);
    }, [type, scrollHideDelay]);

    const debouncedScrollEnd = useDebouncedCallback((pos: ScrollPosition) => {
      onScrollEnd?.(pos);
    }, SCROLL_END_DELAY);

    // Fire reach callbacks on the rising edge only.
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

    // Edge fades are opt-in (`shadows`); resolve eligibility so the scroll handler
    // can keep the (rare) shadow state in sync only when fades are actually shown.
    const shadowEligible = resolveShadowEdges(shadows, axes);
    const anyShadow =
      shadowEligible.top || shadowEligible.bottom || shadowEligible.left || shadowEligible.right;
    // Scroll offset mirror, used ONLY to drive the opt-in edge fades — updated per
    // frame solely when `shadows` is set, so the common case never re-renders.
    const [shadowScroll, setShadowScroll] = React.useState<ScrollPosition>({ x: 0, y: 0 });

    // Paint the thumb offsets straight to the DOM (rAF-coalesced) — never through
    // React state — so a scroll never re-renders or restyles the Tamagui thumb. The
    // thumb's SIZE comes from the (rare) size render; only its along-axis offset is
    // written here.
    const paintScrollbars = React.useCallback(() => {
      rafRef.current = null;
      const sz = sizeRef.current;
      const { yTrack: yt, xTrack: xt } = geomRef.current;
      const { x, y } = scrollRef.current;
      const yEl = yThumbRef.current;
      if (yEl) {
        const g = getThumbGeometry({
          contentSize: sz.contentH,
          viewportSize: sz.viewportH,
          trackSize: yt,
          scrollOffset: y,
        });
        yEl.style.transform = `translateY(${g.offset}px)`;
      }
      const xEl = xThumbRef.current;
      if (xEl) {
        const g = getThumbGeometry({
          contentSize: sz.contentW,
          viewportSize: sz.viewportW,
          trackSize: xt,
          scrollOffset: x,
        });
        xEl.style.transform = `translateX(${g.offset}px)`;
      }
    }, []);

    const schedulePaint = React.useCallback(() => {
      if (rafRef.current != null) return;
      if (typeof requestAnimationFrame === "undefined") {
        paintScrollbars();
        return;
      }
      rafRef.current = requestAnimationFrame(paintScrollbars);
    }, [paintScrollbars]);

    const handleScroll = React.useCallback(
      (event: React.UIEvent<HTMLElement>) => {
        // Read only the cheap scroll offsets here — no layout-forcing size reads.
        const node = event.currentTarget;
        const x = node.scrollLeft;
        const y = node.scrollTop;
        scrollRef.current = { x, y };
        schedulePaint();
        if (anyShadow) {
          setShadowScroll((prev) => (prev.x === x && prev.y === y ? prev : { x, y }));
        }
        onScrollPositionChange?.({ x, y });
        flashScrollbars();

        if (programmaticRef.current) {
          programmaticRef.current = false;
        } else if (stickToBottom) {
          const sz = sizeRef.current;
          stuckRef.current = isNearBottom(y, sz.contentH, sz.viewportH, stickToBottomThreshold);
        }
        fireReachCallbacks(x, y);
        if (onScrollEnd) debouncedScrollEnd({ x, y });
      },
      [
        schedulePaint,
        anyShadow,
        onScrollPositionChange,
        flashScrollbars,
        fireReachCallbacks,
        debouncedScrollEnd,
        onScrollEnd,
        stickToBottom,
        stickToBottomThreshold,
      ],
    );

    // Re-apply the imperative thumb transforms after every commit (a render restyles
    // the Tamagui thumb and would otherwise clobber the inline transform), and cancel
    // any pending frame on unmount.
    React.useLayoutEffect(() => {
      paintScrollbars();
    });
    React.useEffect(
      () => () => {
        if (rafRef.current != null && typeof cancelAnimationFrame !== "undefined") {
          cancelAnimationFrame(rafRef.current);
        }
      },
      [],
    );

    // Re-read size whenever the viewport or its content resizes, and (when armed)
    // follow the bottom as content grows. ResizeObserver is absent in jsdom —
    // guard so the suite doesn't throw. Depend on the child count so we re-observe
    // when content is added/removed without rebuilding on every render.
    const childCount = React.Children.count(children);
    React.useEffect(() => {
      readSize();
      const node = viewportNodeRef.current as HTMLElement | null;
      if (!node || typeof ResizeObserver === "undefined") return;
      const observer = new ResizeObserver(() => {
        readSize();
        if (stickToBottom && stuckRef.current && node.scrollHeight > prevContentHRef.current) {
          programmaticRef.current = true;
          node.scrollTop = node.scrollHeight;
        }
        prevContentHRef.current = node.scrollHeight;
      });
      observer.observe(node);
      for (const child of Array.from(node.children)) observer.observe(child);
      return () => observer.disconnect();
    }, [readSize, childCount, stickToBottom]);

    // Whether each axis can scroll at all (content overflows). Independent of
    // visibility, so it can decide whether the corner is needed.
    const xScrollable = axes.x && size.contentW > size.viewportW + 1;
    const yScrollable = axes.y && size.contentH > size.viewportH + 1;
    const hasCorner = xScrollable && yScrollable;

    // The track runs the viewport length minus the corner the other bar occupies.
    const yTrack = size.viewportH - (hasCorner ? scrollbarSize : 0);
    const xTrack = size.viewportW - (hasCorner ? scrollbarSize : 0);
    // Hand the live tracks to the imperative painter (reads them off the UI thread).
    geomRef.current = { yTrack, xTrack };

    // Thumb LENGTH only — the offset is `0` here and painted to the DOM imperatively
    // (`paintScrollbars`) so a scroll never re-renders. Track-click hit-testing uses
    // `.offset`, which it recomputes against the live scroll, so the `0` here is fine.
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

    // Apply a "page" track click: step a viewport toward the click when it lands
    // outside the thumb. Returns true when it paged (drag-follow is suppressed).
    const applyTrackClick = (axis: "x" | "y", position: number): boolean => {
      if (trackClickBehavior !== "page") return false;
      const node = viewportNodeRef.current as HTMLElement | null;
      if (!node) return false;
      const isY = axis === "y";
      const track = isY ? yTrack : xTrack;
      const clickPos = position * track;
      const viewportSize = isY ? node.clientHeight : node.clientWidth;
      const contentSize = isY ? node.scrollHeight : node.scrollWidth;
      const currentScroll = isY ? node.scrollTop : node.scrollLeft;
      // Recompute the thumb against the live scroll (the rendered `yBar`/`xBar` carry
      // length only — offset is `0` since it is painted imperatively).
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
      if (isY) node.scrollTop = target;
      else node.scrollLeft = target;
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

    // Drag handlers — `useMove` reports a normalized [0,1] position over the rail
    // it is attached to; the first event of a scrub decides paging-vs-drag.
    const yMove = useMove(
      ({ y }) => {
        const node = viewportNodeRef.current as HTMLElement | null;
        if (!node) return;
        if (scrubRef.current.pending) {
          scrubRef.current.pending = false;
          if (applyTrackClick("y", y)) {
            scrubRef.current.paging = true;
            return;
          }
        }
        if (scrubRef.current.paging) return;
        node.scrollTop = scrollFromThumbPosition({
          position: y,
          trackSize: yTrack,
          thumbSize: yBar.size,
          contentSize: node.scrollHeight,
          viewportSize: node.clientHeight,
        });
      },
      { onScrubStart, onScrubEnd },
    );
    const xMove = useMove(
      ({ x }) => {
        const node = viewportNodeRef.current as HTMLElement | null;
        if (!node) return;
        if (scrubRef.current.pending) {
          scrubRef.current.pending = false;
          if (applyTrackClick("x", x)) {
            scrubRef.current.paging = true;
            return;
          }
        }
        if (scrubRef.current.paging) return;
        node.scrollLeft = scrollFromThumbPosition({
          position: x,
          trackSize: xTrack,
          thumbSize: xBar.size,
          contentSize: node.scrollWidth,
          viewportSize: node.clientWidth,
        });
      },
      { onScrubStart, onScrubEnd },
    );

    const showY =
      axes.y &&
      (isScrollbarVisible({ type, scrollable: yBar.scrollable, hovered, scrolling }) || dragging);
    const showX =
      axes.x &&
      (isScrollbarVisible({ type, scrollable: xBar.scrollable, hovered, scrolling }) || dragging);

    // Hover-grow: the thumb rests at `idleScrollbarSize` and thickens to
    // (scrollbarSize − 2·activeInset) on hover/drag. The inset is animated.
    const active = hovered || dragging;
    const activeInset = 2;
    const idleInset = Math.max(activeInset, (scrollbarSize - idleScrollbarSize) / 2);
    const thumbInset = active ? activeInset : idleInset;
    // One shared transition value (all overlays fade at the same speed).
    const fade = useReducedTransition("fast");

    /* ---------------- imperative handle ---------------- */

    // Stable handle — every method reads the live node ref, so the identity never
    // needs to change (no per-render reallocation, no churn for consumers).
    const buildHandle = React.useCallback((): ScrollAreaHandle => {
      const node = () => viewportNodeRef.current as HTMLElement | null;
      const behavior = (animated?: boolean): ScrollBehavior => (animated ? "smooth" : "auto");
      const doScroll = (n: HTMLElement, left: number, top: number, animated?: boolean) => {
        if (typeof n.scrollTo === "function")
          n.scrollTo({ left, top, behavior: behavior(animated) });
        else {
          n.scrollLeft = left;
          n.scrollTop = top;
        }
      };
      return {
        scrollTo: ({ x, y, animated }: ScrollToOptions) => {
          const n = node();
          if (!n) return;
          doScroll(n, x ?? n.scrollLeft, y ?? n.scrollTop, animated);
        },
        scrollToTop: (animated) => {
          const n = node();
          if (n) doScroll(n, n.scrollLeft, 0, animated);
        },
        scrollToBottom: (animated) => {
          const n = node();
          if (n) doScroll(n, n.scrollLeft, n.scrollHeight, animated);
        },
        scrollToEnd: (animated) => {
          const n = node();
          if (n) doScroll(n, n.scrollWidth - n.clientWidth, n.scrollTop, animated);
        },
        scrollIntoView: (target: Element | string, options?: ScrollIntoViewOptions) => {
          const n = node();
          if (!n) return;
          const el = typeof target === "string" ? n.querySelector(target) : target;
          if (!el || typeof el.getBoundingClientRect !== "function") return;
          const elRect = el.getBoundingClientRect();
          const vpRect = n.getBoundingClientRect();
          const block = options?.block ?? "start";
          let deltaY = elRect.top - vpRect.top;
          if (block === "center") deltaY -= (n.clientHeight - elRect.height) / 2;
          else if (block === "end") deltaY = elRect.bottom - vpRect.bottom;
          doScroll(n, n.scrollLeft, n.scrollTop + deltaY, options?.animated);
        },
        getViewport: () => viewportNodeRef.current,
        getScrollPosition: () => {
          const n = node();
          return { x: n?.scrollLeft ?? 0, y: n?.scrollTop ?? 0 };
        },
      };
    }, []);

    React.useImperativeHandle(ref, buildHandle, [buildHandle]);
    React.useImperativeHandle(handleRef, buildHandle, [buildHandle]);

    /* ---------------- keyboard ---------------- */

    const handleKeyDown = React.useCallback(
      (event: React.KeyboardEvent<HTMLElement>) => {
        const node = viewportNodeRef.current as HTMLElement | null;
        if (!node) return;
        const delta = keyToScrollDelta(
          event.key,
          keyStep,
          node.clientWidth,
          node.clientHeight,
          event.shiftKey,
        );
        if (!delta) return;
        // Only intercept the axes we actually scroll.
        if ((delta.dx !== 0 && !axes.x) || (delta.dy !== 0 && !axes.y)) return;
        event.preventDefault();
        if (typeof node.scrollBy === "function") node.scrollBy({ left: delta.dx, top: delta.dy });
        else {
          node.scrollLeft += delta.dx;
          node.scrollTop += delta.dy;
        }
      },
      [keyStep, axes.x, axes.y],
    );

    /* ---------------- refs / viewport host props ---------------- */

    const composedViewportRef = useMergedRef(viewportRef, viewportNodeRef);

    const {
      style: viewportStyleProp,
      className: viewportClassName,
      ...viewportRest
    } = mergedViewportProps as Partial<BoxProps> & { className?: string };

    const viewportStyle: ViewportStyle = {
      ...(viewportStyleProp as object),
      overflowX: axes.x ? "scroll" : "hidden",
      overflowY: axes.y ? "scroll" : "hidden",
      scrollbarWidth: "none",
      paddingRight: shouldOffsetAxis(offsetScrollbars, "y") ? scrollbarSize : undefined,
      paddingBottom: shouldOffsetAxis(offsetScrollbars, "x") ? scrollbarSize : undefined,
    };

    // `onScroll`/`onKeyDown`/`tabIndex`/`role` are host-element props outside
    // Tamagui's View style types; pass them through a precise local object.
    const viewportHostProps: {
      onScroll: (e: React.UIEvent<HTMLElement>) => void;
      onKeyDown?: (e: React.KeyboardEvent<HTMLElement>) => void;
      tabIndex?: number;
      role?: "group";
      className: string;
    } = {
      onScroll: handleScroll,
      className: [viewportClassName, HIDE_NATIVE_CLASS].filter(Boolean).join(" "),
    };
    if (keyboardScrolling) {
      viewportHostProps.onKeyDown = handleKeyDown;
      viewportHostProps.tabIndex = 0;
      viewportHostProps.role = "group";
    }

    /* ---------------- edge shadows ---------------- */

    // `shadowEligible` / `anyShadow` are resolved above (near `handleScroll`). Only
    // compute overflow state when shadows are requested, off the gated `shadowScroll`
    // mirror so the fades stay correct without the thumb's imperative offset.
    const edgeOverflow = anyShadow
      ? getEdgeState({
          viewportW: size.viewportW,
          viewportH: size.viewportH,
          contentW: size.contentW,
          contentH: size.contentH,
          scrollX: shadowScroll.x,
          scrollY: shadowScroll.y,
        })
      : null;
    const resolvedShadowColor =
      shadowColor ?? (theme.background?.val as string | undefined) ?? "rgba(0,0,0,0.15)";

    const renderEdgeShadow = (edge: Edge) => {
      if (!shadowEligible[edge] || !edgeOverflow) return null;
      const custom = renderShadow?.(edge, shadowSize);
      return (
        <ScrollAreaShadow
          key={edge}
          opacity={edgeOverflow[edge] ? 1 : 0}
          {...fade}
          {...animateOnlyProps(ANIMATE_OPACITY)}
          {...shadowBoxProps(edge, shadowSize)}
          style={
            custom ? undefined : { backgroundImage: edgeGradientCss(edge, resolvedShadowColor) }
          }
        >
          {custom}
        </ScrollAreaShadow>
      );
    };

    /* ---------------- render ---------------- */

    return (
      <ScrollAreaFrame
        {...rest}
        {...hoverProps({
          onHoverIn: () => setHovered(true),
          onHoverOut: () => setHovered(false),
        })}
      >
        <ScrollAreaViewport
          ref={composedViewportRef}
          {...viewportRest}
          style={viewportStyle}
          {...viewportHostProps}
        >
          {children}
        </ScrollAreaViewport>

        {anyShadow && (
          <>
            {renderEdgeShadow("top")}
            {renderEdgeShadow("bottom")}
            {renderEdgeShadow("left")}
            {renderEdgeShadow("right")}
          </>
        )}

        {/* Rails stay mounted (useMove attaches its pointer listener once); we
            toggle visibility/hit-testing via opacity + pointerEvents. */}
        {axes.y && (
          <ScrollAreaScrollbar
            ref={yMove.ref}
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
            <ScrollAreaThumb
              ref={(el: TamaguiElement | null) => {
                yThumbRef.current = el as unknown as HTMLElement | null;
              }}
              left={thumbInset}
              right={thumbInset}
              top={0}
              height={yBar.size}
              {...fade}
              {...animateOnlyProps(ANIMATE_Y_THUMB)}
              {...mergedThumbProps}
            />
          </ScrollAreaScrollbar>
        )}

        {axes.x && (
          <ScrollAreaScrollbar
            ref={xMove.ref}
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
            <ScrollAreaThumb
              ref={(el: TamaguiElement | null) => {
                xThumbRef.current = el as unknown as HTMLElement | null;
              }}
              top={thumbInset}
              bottom={thumbInset}
              left={0}
              width={xBar.size}
              {...fade}
              {...animateOnlyProps(ANIMATE_X_THUMB)}
              {...mergedThumbProps}
            />
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

export interface ScrollAreaAutosizeProps extends ScrollAreaProps {}

/**
 * `ScrollArea.Autosize` — grows with its content up to `mah`/`maxHeight`
 * (or `maw`/`maxWidth`), then scrolls. Constrain it with `mah={...}`.
 */
const ScrollAreaAutosize = React.forwardRef<ScrollAreaHandle, ScrollAreaAutosizeProps>(
  function ScrollAreaAutosize(props, ref) {
    return <ScrollAreaComponent ref={ref} {...props} />;
  },
);

export const ScrollArea = withStaticProperties(ScrollAreaComponent, {
  Autosize: ScrollAreaAutosize,
  Viewport: ScrollAreaViewport,
  Scrollbar: ScrollAreaScrollbar,
  Thumb: ScrollAreaThumb,
  Corner: ScrollAreaCorner,
});
