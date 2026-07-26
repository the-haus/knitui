import type * as React from "react";
import type { ScrollView as RNScrollView } from "react-native";

export interface DragScrollParams {
  /** Ref to the native-scroll track's `Animated.ScrollView`. */
  scrollRef: React.RefObject<RNScrollView | null>;
  enabled: boolean;
  vertical: boolean;
}

/** Native no-op: click-and-drag-to-scroll is a web-only affordance (a touch
 * device already drags its own scroll container, and RN has no mouse). */
export function useDragScroll(_params: DragScrollParams): void {}
