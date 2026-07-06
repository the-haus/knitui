/**
 * Scroll↔drag handoff decision logic — the pure core of milestone 7.
 *
 * When a `Sheet.ScrollView` is nested in the panel, a single vertical drag must
 * either move the sheet or scroll the list, never both. These pure functions
 * decide, per frame, who owns the drag and where the panel offset should be —
 * with zero reanimated/RNGH deps, so the whole handoff is directly unit-tested.
 * The gesture worklet (`input/useSheetDrag`) and the scroll worklet
 * (`view/ScrollView.native`) just read the shared values, call these, and apply
 * the result. Every function is `"worklet"`-tagged so it runs on the UI thread.
 */

import { clampOffset } from "./snap";

/** px of slack around the most-open snap within which the sheet counts as "expanded". */
export const EXPAND_EPSILON = 1;

/** Handoff ownership state carried across a single drag on the UI thread. */
export interface HandoffState {
  /** Whether the panel (vs. the list) currently owns the drag. */
  sheetOwns: boolean;
  /** Finger translation (px) at the moment the panel took over — its motion anchor. */
  handoff: number;
}

/**
 * Decide who owns a drag at activation. With a coordinated list, the panel owns
 * the drag only if the sheet starts *not* fully expanded; if it starts expanded
 * the list owns it first (the panel takes over later, in {@link handoffUpdate}).
 * Without coordination the panel always owns the drag.
 */
export function handoffStart(
  coordinated: boolean,
  offset: number,
  minOffset: number,
): HandoffState {
  "worklet";
  const expanded = coordinated && offset <= minOffset + EXPAND_EPSILON;
  return { sheetOwns: !expanded, handoff: 0 };
}

/** Inputs to one {@link handoffUpdate} frame. */
export interface HandoffUpdateInput extends HandoffState {
  /** Whether a nested list is coordinating (else the panel always owns the drag). */
  coordinated: boolean;
  /** Finger vertical translation (px) since gesture start. */
  translationY: number;
  /** Live list scroll offset (px, ≥0; may be <0 on overscroll). */
  scrollOffsetY: number;
  /** Panel offset captured at gesture start (the anchor). */
  panStart: number;
  /** Most-open snap offset. */
  minOffset: number;
  /** Furthest travel offset (lowest snap, or closed when dismissible). */
  maxOffset: number;
}

/** Result of one {@link handoffUpdate} frame: the next state + the offset to apply. */
export interface HandoffUpdateResult extends HandoffState {
  /** The value to write to the panel `offset` this frame. */
  offset: number;
}

/**
 * Advance the handoff one drag frame. Returns the next ownership state and the
 * panel offset to apply:
 *
 *  - List owns & (finger pulls **down** && list at the top) → panel takes over,
 *    anchoring its motion to this finger position (no jump).
 *  - List owns otherwise → panel stays pinned fully open (list scrolls).
 *  - Panel owns → tracks the finger from the handoff anchor, hard-clamped to the
 *    travel range; if dragged back up to fully expanded while still pulling up,
 *    ownership returns to the list so the same finger keeps scrolling.
 */
export function handoffUpdate(input: HandoffUpdateInput): HandoffUpdateResult {
  "worklet";
  const { coordinated, translationY, scrollOffsetY, panStart, minOffset, maxOffset } = input;
  let sheetOwns = input.sheetOwns;
  let handoff = input.handoff;

  if (coordinated && !sheetOwns) {
    if (translationY > 0 && scrollOffsetY <= 0) {
      // List handed off to the panel: zero the panel's motion to this finger.
      sheetOwns = true;
      handoff = translationY;
    } else {
      // List scrolls; keep the panel pinned fully open.
      return { sheetOwns, handoff, offset: minOffset };
    }
  }

  const t = translationY - handoff;
  const next = clampOffset(panStart + t, minOffset, maxOffset, false);

  // Back up to fully expanded and still pulling up → hand the drag back to the list.
  if (coordinated && next <= minOffset + EXPAND_EPSILON && t < 0) {
    return { sheetOwns: false, handoff: translationY, offset: minOffset };
  }

  return { sheetOwns, handoff, offset: next };
}

/**
 * On release, whether the panel should run its velocity settle. A list-owned
 * drag must NOT settle (a downward fling on the list can't collapse the sheet) —
 * native scroll momentum runs instead.
 */
export function shouldSettleOnEnd(coordinated: boolean, sheetOwns: boolean): boolean {
  "worklet";
  return !coordinated || sheetOwns;
}

/**
 * Whether a nested list should pin itself to the top this scroll frame. True
 * while the handoff is active and the sheet is not fully expanded, so a drag from
 * a partially-open sheet moves the panel (and a mid-collapse list can't scroll).
 */
export function shouldPinToTop(
  handoffEnabled: boolean,
  sheetOffset: number,
  expandedOffset: number,
  scrollOffsetY: number,
): boolean {
  "worklet";
  return handoffEnabled && sheetOffset > expandedOffset + EXPAND_EPSILON && scrollOffsetY !== 0;
}
