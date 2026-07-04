import type { ReactElement } from "react";
import type { SharedValue } from "react-native-reanimated";

import type { StyleProp, ViewStyle } from "@knitui/core";

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
  /** Real item count (native mode never loops, so this is `rawCount`). */
  count: number;
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
