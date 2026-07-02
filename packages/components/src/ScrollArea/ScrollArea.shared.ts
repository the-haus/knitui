import type * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import type { BoxProps } from "../Box";
import { clamp } from "../internal/number-utils";
import type { SlotStyles } from "../internal/styles";

/* -------------------------------------------------------------------------- */
/* Public types                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Uniform per-slot style passthrough for `ScrollArea` (Pillar B). Each key
 * spreads onto the matching overlay part — equivalent to the discrete
 * `viewportProps` / `scrollbarProps` / `thumbProps` / `cornerProps` props, layered
 * after them. Slots: `viewport` / `scrollbar` / `thumb` / `corner`.
 */
export interface ScrollAreaStyles {
  /** Props spread onto the scrollable viewport (`.Viewport`). */
  viewport?: Partial<BoxProps>;
  /** Props spread onto each scrollbar rail (`.Scrollbar`). */
  scrollbar?: Partial<BoxProps>;
  /** Props spread onto each scrollbar thumb (`.Thumb`). */
  thumb?: Partial<BoxProps>;
  /** Props spread onto the corner where the scrollbars meet (`.Corner`). */
  corner?: Partial<BoxProps>;
}

/** Slot names of {@link ScrollAreaStyles}, for `slotStyles`. */
export const SCROLL_AREA_SLOTS = [
  "viewport",
  "scrollbar",
  "thumb",
  "corner",
] as const satisfies readonly (keyof ScrollAreaStyles)[];

/** Axes on which scrolling is allowed. */
export type ScrollAreaScrollbars = "x" | "y" | "xy" | false;

/**
 * Scrollbar visibility behaviour:
 * - `hover`  — visible while the pointer is over the area or it is scrolling, then fades.
 * - `scroll` — visible only while scrolling, then fades after `scrollHideDelay`.
 * - `auto`   — visible whenever the content overflows (always shown if scrollable).
 * - `always` — always visible (even when content fits).
 * - `never`  — scrollbars never render; the content still scrolls.
 */
export type ScrollAreaType = "hover" | "auto" | "always" | "scroll" | "never";

/** Single scroll axis. */
export type ScrollAxis = "x" | "y";

/** Scroll position reported by `onScrollPositionChange`. */
export interface ScrollPosition {
  x: number;
  y: number;
}

/** Which axes are scrollable, derived from the `scrollbars` prop. */
export interface AxisEnabled {
  x: boolean;
  y: boolean;
}

/** Per-edge boolean mask (used for shadows and reach detection). */
export interface EdgeState {
  top: boolean;
  bottom: boolean;
  left: boolean;
  right: boolean;
}

/** A single physical edge key. */
export type Edge = keyof EdgeState;

/** Options for the imperative {@link ScrollAreaHandle.scrollTo}. */
export interface ScrollToOptions {
  x?: number;
  y?: number;
  /** Smooth-scroll to the target (web `behavior: "smooth"` / native `animated`). @default false */
  animated?: boolean;
}

/** Options for {@link ScrollAreaHandle.scrollIntoView}. */
export interface ScrollIntoViewOptions {
  animated?: boolean;
  /** Where to align the target within the viewport. @default "start" */
  block?: "start" | "center" | "end";
}

/**
 * Imperative handle exposed on the `ScrollArea` ref (and the optional
 * `handleRef`). Lets callers drive the viewport programmatically — scroll to a
 * position/edge, reveal an element, or read the live scroll offset — on both
 * web and native.
 */
export interface ScrollAreaHandle {
  /** Scroll to an absolute `{ x, y }` offset. */
  scrollTo(options: ScrollToOptions): void;
  /** Scroll to the very top. */
  scrollToTop(animated?: boolean): void;
  /** Scroll to the very bottom. */
  scrollToBottom(animated?: boolean): void;
  /** Scroll to the far right (horizontal end). */
  scrollToEnd(animated?: boolean): void;
  /**
   * Reveal a descendant. On web `target` may be an `Element` or a CSS selector
   * resolved within the viewport; on native pass a measurable element ref (a
   * selector string is a no-op).
   */
  scrollIntoView(target: Element | string, options?: ScrollIntoViewOptions): void;
  /** The raw scrollable node (web `HTMLElement` / native `ScrollView`). */
  getViewport(): TamaguiElement | null;
  /** The current `{ x, y }` scroll offset. */
  getScrollPosition(): ScrollPosition;
}

/**
 * Which edges show a fade/shadow overlay:
 * - `true`   — every scrollable edge (gated by the enabled axes).
 * - `"x"`    — left/right only.
 * - `"y"`    — top/bottom only.
 * - object   — opt individual edges in/out.
 */
export type ShadowEdges = boolean | "x" | "y" | Partial<EdgeState>;

/**
 * Props shared by the web and native implementations. Mirrors Mantine's
 * `ScrollArea` public API and extends it with the customization hooks
 * (`scrollbarProps` / `thumbProps` / `cornerProps`) that make the custom
 * overlay scrollbars fully stylable on both platforms.
 */
export interface ScrollAreaOwnProps {
  /** Axes on which scrolling is allowed. @default "xy" */
  scrollbars?: ScrollAreaScrollbars;

  /** Scrollbar visibility behaviour. @default "hover" */
  type?: ScrollAreaType;

  /** Scrollbar thickness in px. @default 12 */
  scrollbarSize?: number;

  /** Reserve space for the scrollbar so content does not sit under it. @default false */
  offsetScrollbars?: boolean | "x" | "y" | "present";

  /** Delay before hiding scrollbars in `hover` / `scroll` modes, ms. @default 1000 */
  scrollHideDelay?: number;

  /** Called with the `{ x, y }` scroll offset whenever the viewport scrolls. */
  onScrollPositionChange?: (position: ScrollPosition) => void;

  /** Ref assigned to the scrollable viewport element. */
  viewportRef?: React.Ref<TamaguiElement>;

  /** Props spread onto the scrollable viewport. */
  viewportProps?: Partial<BoxProps>;

  /**
   * How taps are delivered while the on-screen keyboard is up (native only —
   * maps to the React Native `ScrollView` prop of the same name; ignored on web).
   * The RN default (`"never"`) swallows the FIRST tap to dismiss the keyboard, so
   * a tap on a pressable child (e.g. a dropdown option in a focus-driven combobox)
   * is eaten — and dismissing the keyboard blurs the field, closing the dropdown
   * before the option's press can land. `"handled"` keeps the keyboard up when a
   * child handles the tap, so the option is selected normally while a tap on empty
   * space still dismisses. @default RN default (`"never"`)
   */
  keyboardShouldPersistTaps?: boolean | "always" | "never" | "handled";

  /** Props spread onto each scrollbar track (style the rail). */
  scrollbarProps?: Partial<BoxProps>;

  /** Props spread onto each scrollbar thumb (style the draggable handle). */
  thumbProps?: Partial<BoxProps>;

  /** Props spread onto the corner shown where the two scrollbars meet. */
  cornerProps?: Partial<BoxProps>;

  /**
   * Uniform per-slot style passthrough. Sugar over the discrete `*Props` above;
   * each slot layers after its matching `*Props`. See {@link ScrollAreaStyles}.
   */
  styles?: SlotStyles<ScrollAreaStyles>;

  /* ---------------------------------------------------------------------- */
  /* Imperative control                                                     */
  /* ---------------------------------------------------------------------- */

  /**
   * Imperative handle for programmatic scrolling. An alternative to the
   * forwarded `ref` (which is also the {@link ScrollAreaHandle}); useful when
   * the `ref` is needed elsewhere.
   */
  handleRef?: React.Ref<ScrollAreaHandle>;

  /* ---------------------------------------------------------------------- */
  /* Edge fades / scroll shadows                                            */
  /* ---------------------------------------------------------------------- */

  /** Show fade overlays on scrollable edges to hint at hidden content. @default false */
  shadows?: ShadowEdges;
  /** Fade depth in px. @default 32 */
  shadowSize?: number;
  /**
   * Fade colour. Web fades from this colour to transparent; native paints a
   * translucent scrim of it. Defaults to the theme background.
   */
  shadowColor?: string;
  /**
   * Custom edge-overlay renderer — an escape hatch for true native gradients
   * (e.g. `expo-linear-gradient`). Called per visible edge; return `null` to
   * fall back to the default fade.
   */
  renderShadow?: (edge: Edge, size: number) => React.ReactNode;

  /* ---------------------------------------------------------------------- */
  /* Reach-edge callbacks (infinite scroll / lazy load)                     */
  /* ---------------------------------------------------------------------- */

  /** Fired once when the viewport reaches the top. */
  onReachTop?: () => void;
  /** Fired once when the viewport reaches the bottom. */
  onReachBottom?: () => void;
  /** Fired once when the viewport reaches the far left (horizontal start). */
  onReachStart?: () => void;
  /** Fired once when the viewport reaches the far right (horizontal end). */
  onReachEnd?: () => void;
  /** Fired after scrolling settles, with the resting `{ x, y }` offset. */
  onScrollEnd?: (position: ScrollPosition) => void;
  /** Distance from an edge (px) at which the reach callbacks fire. @default 0 */
  reachThreshold?: number;

  /* ---------------------------------------------------------------------- */
  /* Stick-to-bottom (chat / logs)                                          */
  /* ---------------------------------------------------------------------- */

  /**
   * Auto-scroll to the bottom as content grows, but only while the user is
   * already near the bottom — released the moment they scroll up. @default false
   */
  stickToBottom?: boolean;
  /** Slack (px) within which "at the bottom" counts for sticking. @default 24 */
  stickToBottomThreshold?: number;

  /* ---------------------------------------------------------------------- */
  /* Track click behaviour                                                  */
  /* ---------------------------------------------------------------------- */

  /**
   * What a click on the rail (outside the thumb) does: `jump` centres the thumb
   * on the click; `page` steps one viewport toward it. @default "jump"
   */
  trackClickBehavior?: "jump" | "page";

  /* ---------------------------------------------------------------------- */
  /* Keyboard (web only)                                                    */
  /* ---------------------------------------------------------------------- */

  /**
   * Make the viewport focusable and scroll it with Arrow / Page / Home / End /
   * Space keys. Web only — a no-op on native. @default true
   */
  keyboardScrolling?: boolean;
  /** Pixels scrolled per arrow-key press. @default 40 */
  keyStep?: number;

  /* ---------------------------------------------------------------------- */
  /* Hover-grow thumb                                                       */
  /* ---------------------------------------------------------------------- */

  /**
   * Idle scrollbar thickness (px). The rail rests this thin and animates up to
   * `scrollbarSize` on hover/drag (macOS-style overlay). Set equal to
   * `scrollbarSize` to disable the grow. @default 6
   */
  idleScrollbarSize?: number;
}

/* -------------------------------------------------------------------------- */
/* Constants                                                                  */
/* -------------------------------------------------------------------------- */

/** Default scrollbar thickness (px). */
export const DEFAULT_SCROLLBAR_SIZE = 12;
/** Default idle (thin) scrollbar thickness before hover-grow (px). */
export const DEFAULT_IDLE_SCROLLBAR_SIZE = 6;
/** Default delay before scrollbars hide in `hover` / `scroll` modes (ms). */
export const DEFAULT_HIDE_DELAY = 1000;
/** Smallest a thumb may shrink to so it stays grabbable on long content (px). */
export const MIN_THUMB_SIZE = 24;
/** Default edge-fade depth (px). */
export const DEFAULT_SHADOW_SIZE = 32;
/** Default slack within which "at the bottom" counts for stick-to-bottom (px). */
export const DEFAULT_STICK_THRESHOLD = 24;
/** Default pixels scrolled per arrow-key press. */
export const DEFAULT_KEY_STEP = 40;
/** Delay after the last scroll event before `onScrollEnd` fires (ms). */
export const SCROLL_END_DELAY = 120;
/** Fraction of the viewport a PageUp/PageDown/Space press scrolls. */
export const PAGE_SCROLL_FRACTION = 0.9;

/* -------------------------------------------------------------------------- */
/* Pure helpers (shared by both platforms)                                    */
/* -------------------------------------------------------------------------- */

/** Resolve the `scrollbars` prop to a per-axis enabled flag. */
export const resolveAxes = (scrollbars: ScrollAreaScrollbars): AxisEnabled => {
  if (scrollbars === false) return { x: false, y: false };
  if (scrollbars === "x") return { x: true, y: false };
  if (scrollbars === "y") return { x: false, y: true };
  return { x: true, y: true };
};

/** Whether the gutter for a given axis should be reserved. */
export const shouldOffsetAxis = (
  offsetScrollbars: ScrollAreaOwnProps["offsetScrollbars"],
  axis: ScrollAxis,
): boolean => {
  if (!offsetScrollbars) return false;
  if (offsetScrollbars === true || offsetScrollbars === "present") return true;
  return offsetScrollbars === axis;
};

/** Geometry of a single thumb along one axis. */
export interface ThumbGeometry {
  /** True when the content overflows the viewport on this axis. */
  scrollable: boolean;
  /** Length of the thumb along the axis (px). */
  size: number;
  /** Offset of the thumb from the track start (px). */
  offset: number;
}

/**
 * Compute a thumb's length and position from the measured viewport / content /
 * track sizes and the current scroll offset. The thumb length is proportional
 * to how much of the content is visible (clamped to {@link MIN_THUMB_SIZE}), and
 * its offset maps the scroll progress onto the remaining track space.
 */
export const getThumbGeometry = ({
  contentSize,
  viewportSize,
  trackSize,
  scrollOffset,
  minThumbSize = MIN_THUMB_SIZE,
}: {
  contentSize: number;
  viewportSize: number;
  trackSize: number;
  scrollOffset: number;
  minThumbSize?: number;
}): ThumbGeometry => {
  const scrollable = contentSize > viewportSize + 1 && viewportSize > 0;
  if (!scrollable) return { scrollable: false, size: 0, offset: 0 };

  const ratio = viewportSize / contentSize;
  const size = clamp(Math.round(ratio * trackSize), Math.min(minThumbSize, trackSize), trackSize);

  const maxScroll = contentSize - viewportSize;
  const maxThumbOffset = trackSize - size;
  const progress = maxScroll > 0 ? clamp(scrollOffset / maxScroll, 0, 1) : 0;

  return { scrollable: true, size, offset: Math.round(progress * maxThumbOffset) };
};

/**
 * Map a normalized `[0, 1]` pointer position over the track (as reported by
 * `useMove`) to a target scroll offset. The thumb centre follows the pointer:
 * the desired thumb offset is `position * trackSize − thumbSize / 2`, clamped to
 * the track, then rescaled onto the scrollable range.
 */
export const scrollFromThumbPosition = ({
  position,
  trackSize,
  thumbSize,
  contentSize,
  viewportSize,
}: {
  position: number;
  trackSize: number;
  thumbSize: number;
  contentSize: number;
  viewportSize: number;
}): number => {
  const maxThumbOffset = trackSize - thumbSize;
  const maxScroll = contentSize - viewportSize;
  if (maxThumbOffset <= 0 || maxScroll <= 0) return 0;

  const desiredOffset = clamp(position * trackSize - thumbSize / 2, 0, maxThumbOffset);
  return (desiredOffset / maxThumbOffset) * maxScroll;
};

/**
 * Resolve whether scrollbars should currently be displayed, given the `type`
 * behaviour and the live interaction state. `scrollable` already accounts for
 * whether the content overflows on the axis.
 */
export const isScrollbarVisible = ({
  type,
  scrollable,
  hovered,
  scrolling,
}: {
  type: ScrollAreaType;
  scrollable: boolean;
  hovered: boolean;
  scrolling: boolean;
}): boolean => {
  if (!scrollable || type === "never") return false;
  switch (type) {
    case "always":
    case "auto":
      return true;
    case "scroll":
      return scrolling;
    case "hover":
    default:
      return hovered || scrolling;
  }
};

/* -------------------------------------------------------------------------- */
/* Pure helpers for the richer feature set                                    */
/* -------------------------------------------------------------------------- */

/** Live viewport + content + scroll measurements, shared by the helpers below. */
export interface ScrollMetrics {
  viewportW: number;
  viewportH: number;
  contentW: number;
  contentH: number;
  scrollX: number;
  scrollY: number;
}

/** Small tolerance (px) so sub-pixel rounding doesn't flip overflow flags. */
const EDGE_EPSILON = 1;

/**
 * Which physical edges currently have hidden content beyond them, given the
 * measurements and an optional `threshold` (an edge counts as "clear" while
 * within `threshold` px of it). Used to fade the edge shadows in/out.
 */
export const getEdgeState = ({
  viewportW,
  viewportH,
  contentW,
  contentH,
  scrollX,
  scrollY,
  threshold = 0,
}: ScrollMetrics & { threshold?: number }): EdgeState => {
  const maxX = contentW - viewportW;
  const maxY = contentH - viewportH;
  return {
    top: maxY > EDGE_EPSILON && scrollY > threshold + EDGE_EPSILON,
    bottom: maxY > EDGE_EPSILON && scrollY < maxY - threshold - EDGE_EPSILON,
    left: maxX > EDGE_EPSILON && scrollX > threshold + EDGE_EPSILON,
    right: maxX > EDGE_EPSILON && scrollX < maxX - threshold - EDGE_EPSILON,
  };
};

/**
 * Resolve the `shadows` prop and the enabled axes into a per-edge eligibility
 * mask. An edge is eligible only when both requested by `shadows` and allowed by
 * its axis. Combine with {@link getEdgeState} to decide what is actually shown.
 */
export const resolveShadowEdges = (shadows: ShadowEdges, axes: AxisEnabled): EdgeState => {
  if (!shadows) return { top: false, bottom: false, left: false, right: false };
  if (shadows === "x") return { top: false, bottom: false, left: axes.x, right: axes.x };
  if (shadows === "y") return { top: axes.y, bottom: axes.y, left: false, right: false };
  if (shadows === true) {
    return { top: axes.y, bottom: axes.y, left: axes.x, right: axes.x };
  }
  return {
    top: Boolean(shadows.top) && axes.y,
    bottom: Boolean(shadows.bottom) && axes.y,
    left: Boolean(shadows.left) && axes.x,
    right: Boolean(shadows.right) && axes.x,
  };
};

/** Direction a fade points, away from its edge toward the content. */
const GRADIENT_DIRECTION: Record<Edge, string> = {
  top: "to bottom",
  bottom: "to top",
  left: "to right",
  right: "to left",
};

/**
 * Build the CSS `linear-gradient(...)` for one edge's fade overlay (web). Fades
 * from `color` at the edge to fully transparent toward the content.
 */
export const edgeGradientCss = (edge: Edge, color: string): string =>
  `linear-gradient(${GRADIENT_DIRECTION[edge]}, ${color}, transparent)`;

/**
 * Which edges are within `threshold` px of being reached right now. Edges on an
 * axis that does not overflow are never "reached" (there is nothing to scroll).
 */
export const getReachedEdges = ({
  viewportW,
  viewportH,
  contentW,
  contentH,
  scrollX,
  scrollY,
  threshold = 0,
}: ScrollMetrics & { threshold?: number }): EdgeState => {
  const maxX = contentW - viewportW;
  const maxY = contentH - viewportH;
  return {
    top: maxY > EDGE_EPSILON && scrollY <= threshold,
    bottom: maxY > EDGE_EPSILON && scrollY >= maxY - threshold,
    left: maxX > EDGE_EPSILON && scrollX <= threshold,
    right: maxX > EDGE_EPSILON && scrollX >= maxX - threshold,
  };
};

/** True when the vertical scroll is within `slack` px of the bottom. */
export const isNearBottom = (
  scrollY: number,
  contentH: number,
  viewportH: number,
  slack: number,
): boolean => contentH - viewportH - scrollY <= slack;

/**
 * Target scroll offset for a "page" track click — steps one viewport toward the
 * click, away from the thumb. `clickPos` is the pixel position of the click
 * along the track.
 */
export const pageScrollTarget = ({
  clickPos,
  thumbOffset,
  thumbSize,
  viewportSize,
  currentScroll,
  maxScroll,
}: {
  clickPos: number;
  thumbOffset: number;
  thumbSize: number;
  viewportSize: number;
  currentScroll: number;
  maxScroll: number;
}): number => {
  const beforeThumb = clickPos < thumbOffset + thumbSize / 2;
  const step = viewportSize * PAGE_SCROLL_FRACTION;
  const next = beforeThumb ? currentScroll - step : currentScroll + step;
  return clamp(next, 0, Math.max(0, maxScroll));
};

/** True when `clickPos` (px along the track) falls within the thumb's bounds. */
export const isClickOnThumb = (clickPos: number, thumbOffset: number, thumbSize: number): boolean =>
  clickPos >= thumbOffset && clickPos <= thumbOffset + thumbSize;

/**
 * Map a keyboard key to a `{ dx, dy }` scroll delta. Returns `null` for keys
 * that should not scroll. Home/End/Arrow page-keys use large finite deltas the
 * caller clamps against the content bounds. `shiftSpace` selects PageUp for the
 * Space key.
 */
export const keyToScrollDelta = (
  key: string,
  step: number,
  viewportW: number,
  viewportH: number,
  shiftSpace = false,
): { dx: number; dy: number } | null => {
  const page = viewportH * PAGE_SCROLL_FRACTION;
  const FAR = 1e7;
  switch (key) {
    case "ArrowDown":
      return { dx: 0, dy: step };
    case "ArrowUp":
      return { dx: 0, dy: -step };
    case "ArrowRight":
      return { dx: step, dy: 0 };
    case "ArrowLeft":
      return { dx: -step, dy: 0 };
    case "PageDown":
      return { dx: 0, dy: page };
    case "PageUp":
      return { dx: 0, dy: -page };
    case "Home":
      return { dx: 0, dy: -FAR };
    case "End":
      return { dx: 0, dy: FAR };
    case " ":
    case "Spacebar":
      return { dx: 0, dy: shiftSpace ? -page : page };
    default:
      return null;
  }
};
