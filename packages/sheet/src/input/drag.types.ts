import type { SettleResult } from "../engine";
import type { SheetSpringConfig } from "../motion/spring-config";
import type { SheetValue } from "../motion/value.types";

/**
 * The sheet's drag, as `useSheetDrag` hands it to `view/DragArea`. Opaque on
 * purpose: on native it is an RNGH `PanGesture` (`useSheetDrag.native.ts`), on
 * the web a pointer-events binding (`useSheetDrag.ts`). Only the matching
 * `DragArea` twin knows what is inside.
 */
export type SheetDrag = object;

/**
 * The scroller gesture a nested `Sheet.ScrollView` shares with the drag (native:
 * an RNGH `Gesture.Native()`); always `undefined` on the web, where the browser
 * owns nested scrolling.
 */
export type SheetScrollGesture = object;

export interface SheetDragParams {
  /** Panel translateY (px) — the drag tracks the finger into this. */
  offset: SheetValue<number>;
  /** Snap offsets, ascending. */
  offsets: number[];
  /** Fully-closed offset (the dismiss target). */
  closed: number;
  /** Whether a release past the lowest snap may dismiss. */
  dismissible: boolean;
  /** Disable all drag handling. */
  enabled: boolean;
  /** Spring config for the settle animation. */
  spring?: SheetSpringConfig;
  /** Allow a child ScrollView to take over (handoff) — native only. */
  scrollGesture?: SheetScrollGesture;
  /**
   * Live vertical scroll offset (px, ≥0) of a nested `Sheet.ScrollView`. When
   * present the drag becomes scroll-aware (the handoff): while the sheet is
   * fully expanded the list owns the drag, and the panel only starts moving once
   * the list is at the top and the finger pulls down. Native only.
   */
  scrollOffsetY?: SheetValue<number>;
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
 * Vertical travel (px) the finger must cover before the drag claims the touch.
 * Below this the touch is left to the children — a tap on the scrim still
 * dismisses, a press on a control still fires, a horizontal swipe inside the
 * content is never stolen.
 */
export const ACTIVATION_THRESHOLD = 8;
