import type * as React from "react";
import type { WithSpringConfig } from "react-native-reanimated";

import type { ViewStyle } from "@knitui/core";

import type { OverlayProps } from "../../Overlay";
import type { DragAxis } from "./spring";

/**
 * The drag travel the gesture writes and the host / scrim paint from. Native
 * hands a Reanimated `SharedValue<number>` (which satisfies this); web hands the
 * kit's own `DragValue` (`./drag-value`), so the web build never reaches
 * reanimated. Structural on purpose: the shared code only reads `.value` and
 * subscribes.
 */
export interface DragOffset {
  value: number;
  addListener(listenerId: number, listener: (value: number) => void): void;
  removeListener(listenerId: number): void;
}

/** Pointer-events modes the host accepts (RN/RNW shared subset). */
export type PointerEventsMode = "auto" | "none" | "box-none" | "box-only";

/** Props for the animated drag host (carries the panel's dismiss translation). */
export interface DragDismissHostProps {
  /** Travel toward the dismiss edge (px). */
  offset: DragOffset;
  /** Drag axis. */
  axis: DragAxis;
  /** Screen direction that dismisses (+1 = right/down, -1 = left/up). */
  sign: 1 | -1;
  /**
   * Container styles. The host stands in for the positioning layer's flex when it
   * wraps a panel that relies on it (e.g. Modal's centred, `maxHeight:100%`
   * panel), so the panel keeps sizing/centring correctly inside the host.
   */
  style?: ViewStyle;
  /**
   * `box-none` lets the host's empty area (the margin around a centred panel) pass
   * clicks through to the scrim behind it while children still receive events.
   */
  pointerEvents?: PointerEventsMode;
  children: React.ReactNode;
}

/** Props for the offset-driven scrim (fades as the panel is dragged away). */
export interface DragDismissOverlayProps {
  /** Travel toward the dismiss edge (px). */
  offset: DragOffset;
  /** Panel size along the drag axis (px); the scrim fades to 0 across it. */
  extent: number;
  /** Scrim opacity at rest (multiplies the computed fade). @default 1 */
  maxOpacity?: number;
  /** Tap-to-dismiss handler. */
  onPress?: () => void;
  /** Props forwarded to the underlying `Overlay`. */
  overlayProps?: OverlayProps;
}

/** Inputs of `useDragDismiss`, the same on both platforms. */
export interface DragDismissParams {
  /** Travel toward the dismiss edge (px); the gesture writes the finger into it. */
  offset: DragOffset;
  /** Drag axis. */
  axis: DragAxis;
  /** Screen direction that dismisses (+1 = right/down, -1 = left/up). */
  sign: 1 | -1;
  /** Panel size along the axis (px); the threshold is a fraction of this. */
  extent: number;
  /**
   * Distance the panel springs on a committed dismiss to slide fully off-screen
   * (px). Defaults to `extent`, which is correct for an edge-pinned surface (a
   * Drawer travels its own size to clear the edge). A centred / top-anchored
   * panel (Modal) sits away from the edge and must travel further — pass the
   * viewport size along the axis so it leaves the screen instead of springing
   * back to `extent` and hanging on-screen until the close fires.
   */
  dismissTravel?: number;
  /** Enable the gesture (off until measured / when `dragToDismiss` is false). */
  enabled: boolean;
  /** Dismiss threshold as a fraction of `extent`. @default 0.3 */
  threshold?: number;
  /** Spring override for the settle. */
  spring?: WithSpringConfig;
  /** Fired (JS) when the panel has animated off-screen and should close. */
  onDismiss: () => void;
}
