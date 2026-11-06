import * as React from "react";
import type { PanGesture } from "react-native-gesture-handler";
import type { SharedValue, WithSpringConfig } from "react-native-reanimated";

import type { SettleResult } from "../engine";

/**
 * Coordination channel between the `Sheet` and the scrollers nested inside it. The
 * sheet owns the Pan and the panel `offset`; a scroller owns its list. They cooperate
 * so a vertical drag moves the sheet or scrolls the list, never both.
 *
 * A panel may hold several scrollers. Each brings its own native gesture, since RNGH
 * allows one detector per gesture, and declares it simultaneous with {@link panGesture}.
 * The one under the finger publishes its offset into {@link scrollOffsetY}.
 */
export interface SheetScrollContextValue {
  /** The sheet's Pan, which every scroller's native gesture runs alongside. */
  panGesture: PanGesture;
  /** Mounted scrollers. The Pan runs the handoff only while this is above 0. */
  scrollers: SharedValue<number>;
  /** Content offset (px) of the scroller under the finger. */
  scrollOffsetY: SharedValue<number>;
  /** The panel translateY SharedValue (0 = fully open). */
  sheetOffset: SharedValue<number>;
  /** True while the Pan is active. */
  panActive: SharedValue<boolean>;
  /** Snap offsets, ascending. */
  offsets: number[];
  /** Offset of the most-open snap; the sheet is "expanded" at/above this. */
  expandedOffset: number;
  /** Fully-closed offset. */
  closed: number;
  /** Whether a release past the lowest snap may dismiss. */
  dismissible: boolean;
  /** Spring for the settle animation. */
  spring?: WithSpringConfig;
  /** Whether the handoff is active. When off the list scrolls freely. */
  handoffEnabled: boolean;
  /** Commits a settle driven from the list rather than the Pan. */
  onSettle: (result: SettleResult) => void;
  /** Whether the panel hugs its content, so a scroller must too. */
  fit: boolean;
}

/** Null when a `Sheet.ScrollView` is rendered outside a `Sheet` (it then just scrolls). */
export const SheetScrollContext = React.createContext<SheetScrollContextValue | null>(null);

/** Read the sheet's scroll-coordination channel, or `null` outside a `Sheet`. */
export function useSheetScrollContext(): SheetScrollContextValue | null {
  return React.useContext(SheetScrollContext);
}
