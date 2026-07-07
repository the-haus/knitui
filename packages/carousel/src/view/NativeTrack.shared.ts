import type { ReactElement } from "react";
import type { SharedValue } from "react-native-reanimated";

import type { StyleProp, ViewStyle } from "@knitui/core";

import { mod } from "../engine";
import type { SeekFn } from "../motion/useCarouselCore";
import type { RenderItem } from "../types";

/**
 * Contract shared by the native (`NativeTrack.tsx`) and web (`NativeTrack.web.tsx`)
 * scroll-container tracks. Both render every slide in normal flow inside a real
 * platform scroll surface; they differ only in HOW they scroll (an
 * `Animated.ScrollView` + `useAnimatedScrollHandler` on native, an overflow
 * surface + a JS `onScroll` on web) and how each slide derives its `progress`.
 */
export interface NativeTrackProps<T> {
  getItem: (index: number) => T | undefined;
  ensure: (indices: number[]) => void;
  renderItem: RenderItem<T>;
  renderPlaceholder?: (index: number) => ReactElement | null;
  keyExtractor?: (item: T, index: number) => string;
  /** Real item count (`rawCount`). Native loop clones this ring `LOOP_COPIES` times. */
  count: number;
  /**
   * Loop the ring. Native scroll has no virtual ring, so it clones the data
   * `LOOP_COPIES` times and silently recentres the scroll position into the
   * middle copy — a whole-ring jump is invisible (identical pixels) and
   * mod-invariant to the engine's progress/index math.
   */
  loop: boolean;
  vertical: boolean;
  /** Resolved page size px — the main-axis extent + snap interval. */
  pageSize: number;
  defaultIndex: number;
  /** The engine offset (px, forward = negative). Kept in sync with the scroll position. */
  offset: SharedValue<number>;
  /** Resolved page size px as a shared value (for the scroll worklet). */
  size: SharedValue<number>;
  enabled: boolean;
  /** Snap to page boundaries when a scroll settles. */
  snapEnabled: boolean;
  /** One page per swipe (vs. free multi-page flinging). */
  pagingEnabled: boolean;
  /** Rubber-band / bounce past the ends. */
  overscrollEnabled: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  /** Fires when the user starts dragging (pauses autoplay, fires `onScrollStart`). */
  onInteractionStart: () => void;
  /** Fires when a user scroll settles (resumes autoplay, fires `onScrollEnd`). */
  onInteractionEnd: () => void;
  /**
   * Registers (or clears with `null`) the imperative seek so the controller and
   * a controlled `index` can drive this scroll container.
   */
  registerSeek: (fn: SeekFn | null) => void;
  /** testID for the scroll surface (also lets consumers target it). */
  testID?: string;
}

/**
 * Main-axis dimension for a flow slide; the cross axis fills the viewport.
 * `flexShrink: 0` keeps slides from being squeezed by the flex container so the
 * content overflows and scrolls.
 */
export function flowSlideStyle(vertical: boolean, pageSize: number): ViewStyle {
  return vertical
    ? { width: "100%", height: pageSize, flexShrink: 0 }
    : { height: "100%", width: pageSize, flexShrink: 0 };
}

/** Debounce (ms) used to infer "the scroll has settled" from the last event. */
export const SCROLL_END_DELAY = 120;

/* ── Native loop: cloned-ring recentre ──────────────────────────────────────
 *
 * A real scroll container has finite content, so it can't fake the transform
 * engine's virtual ring. Instead the track renders the data `LOOP_COPIES` times
 * back-to-back and keeps the scroll position resting in the MIDDLE copy. When a
 * scroll settles, the position is snapped back into that middle band by whole
 * ring-lengths (`count * pageSize`). Because the copies are pixel-identical and
 * the jump is exactly one ring, the recentre is invisible; and because the
 * engine derives progress/index as `mod(rawIndex, count)` under `loop`, a
 * whole-ring jump never changes the reported item. The helpers below are pure
 * (offset ↔ scroll-position px) and shared by the web and native tracks.
 */

/** Number of ring copies rendered in loop mode (a full buffer on each side). */
export const LOOP_COPIES = 3;
/** Index of the copy the scroll position rests in (0-based). */
export const LOOP_MIDDLE = 1;

/** Slides actually mounted: `count` cloned `LOOP_COPIES` times when looping. */
export function renderedCount(count: number, loop: boolean): number {
  return loop ? count * LOOP_COPIES : count;
}

/** One ring's pixel length along the scroll axis. */
export function ringLength(count: number, pageSize: number): number {
  return count * pageSize;
}

/** Scroll position (px) that places real item `index` at the middle copy's slot. */
export function middleRingPos(index: number, count: number, pageSize: number): number {
  return (LOOP_MIDDLE * count + index) * pageSize;
}

/**
 * Recentre a resting scroll position into the middle ring band `[ring, 2*ring)`
 * by whole ring-lengths. Returns the adjusted position, or `null` when the move
 * is sub-pixel (already centred — no jump needed).
 */
export function recentredPos(pos: number, ring: number): number | null {
  if (!(ring > 0)) return null;
  const band = LOOP_MIDDLE * ring;
  const next = band + mod(pos - band, ring);
  return Math.abs(next - pos) > 0.5 ? next : null;
}

/**
 * Map a destination engine offset to a scroll position on the ring. With a
 * `from` position it picks the nearest copy (shortest visual travel); without
 * one it lands in the middle copy. The result is nudged by whole rings to stay
 * inside a safe band (`[0.5·ring, (LOOP_COPIES−0.5)·ring]`) so repeated
 * programmatic steps can't walk off the cloned content.
 */
export function loopSeekPos(target: number, ring: number, fromPos?: number): number {
  const desired = -target;
  let pos: number;
  if (fromPos !== undefined) {
    pos = desired + Math.round((fromPos - desired) / ring) * ring;
  } else {
    pos = LOOP_MIDDLE * ring + mod(desired, ring);
  }
  while (pos < 0.5 * ring) pos += ring;
  while (pos > (LOOP_COPIES - 0.5) * ring) pos -= ring;
  return pos;
}
