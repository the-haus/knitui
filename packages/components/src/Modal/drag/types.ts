import type * as React from "react";
import type { SharedValue } from "react-native-reanimated";

import type { OverlayProps } from "../../Overlay";
import type { DragAxis } from "./useDragDismiss";

/** Pointer-events modes the host accepts (RN/RNW shared subset). */
export type PointerEventsMode = "auto" | "none" | "box-none" | "box-only";

/**
 * The flex layout a drag host re-creates (see {@link DragDismissHostProps.style}).
 * Deliberately narrow: plain literals assignable to BOTH a React Native style (the
 * native `Animated.View` host) and Tamagui style props (the web `Box` host spreads
 * them as props), so neither host needs a cast.
 */
export interface DragHostLayout {
  flex?: number;
  alignSelf?: "auto" | "stretch" | "center" | "flex-start" | "flex-end";
  flexDirection?: "row" | "column";
  alignItems?: "stretch" | "center" | "flex-start" | "flex-end";
  justifyContent?: "center" | "flex-start" | "flex-end" | "space-between";
}

/** Props for the animated drag host (carries the panel's dismiss translation). */
export interface DragDismissHostProps {
  /** Travel toward the dismiss edge (px). */
  offset: SharedValue<number>;
  /** Drag axis. */
  axis: DragAxis;
  /** Screen direction that dismisses (+1 = right/down, -1 = left/up). */
  sign: 1 | -1;
  /**
   * Container styles. The host stands in for the positioning layer's flex when it
   * wraps a panel that relies on it (e.g. Modal's centred, `maxHeight:100%`
   * panel), so the panel keeps sizing/centring correctly inside the host.
   */
  style?: DragHostLayout;
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
  offset: SharedValue<number>;
  /** Panel size along the drag axis (px); the scrim fades to 0 across it. */
  extent: number;
  /** Scrim opacity at rest (multiplies the computed fade). @default 1 */
  maxOpacity?: number;
  /** Tap-to-dismiss handler. */
  onPress?: () => void;
  /** Props forwarded to the underlying `Overlay`. */
  overlayProps?: OverlayProps;
}
