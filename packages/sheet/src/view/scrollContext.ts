import * as React from "react";

import type { SheetScrollGesture } from "../input/drag.types";
import type { SheetValue } from "../motion/value.types";

/**
 * Coordination channel between the `Sheet` and a `Sheet.ScrollView` nested inside
 * it (native only). The sheet owns the pan gesture and the panel `offset`; the
 * scroll view owns the list. The two must cooperate so a vertical drag either
 * moves the sheet or scrolls the list — never both, and never fighting — which is
 * the scroll↔drag handoff (`docs/sheet-package-plan.md` milestone 7).
 *
 * The sheet publishes its Pan-simultaneous {@link scrollGesture}, the live panel
 * {@link sheetOffset}, and the {@link expandedOffset} (most-open snap); the scroll
 * view publishes its content {@link scrollOffsetY} back. Both the pan worklet and
 * the scroll worklet read these shared values to decide who owns the drag.
 */
export interface SheetScrollContextValue {
  /** The RNGH `Native` gesture the sheet's Pan runs simultaneously with. The
   *  `Sheet.ScrollView` attaches it to its scroller so the two recognise together. */
  scrollGesture: SheetScrollGesture | undefined;
  /** Inner content vertical scroll offset (px, ≥0), written by the scroll view. */
  scrollOffsetY: SheetValue<number>;
  /** The panel translateY SharedValue (0 = fully open). */
  sheetOffset: SheetValue<number>;
  /** Offset of the most-open snap; the sheet is "expanded" at/above this. */
  expandedOffset: number;
  /** Whether the handoff is active (drag enabled + measured + open). When off the
   *  list scrolls freely and the sheet never steals the drag. */
  handoffEnabled: boolean;
}

/** Null when a `Sheet.ScrollView` is rendered outside a `Sheet` (it then just scrolls). */
export const SheetScrollContext = React.createContext<SheetScrollContextValue | null>(null);

/** Read the sheet's scroll-coordination channel, or `null` outside a `Sheet`. */
export function useSheetScrollContext(): SheetScrollContextValue | null {
  return React.useContext(SheetScrollContext);
}
