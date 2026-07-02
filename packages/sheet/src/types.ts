import type * as React from "react";
import type { WithSpringConfig } from "react-native-reanimated";

import type { OverlayProps } from "@knitui/components";
import type { SlotStyles, StyleProp, ViewStyle } from "@knitui/core";

import type { SheetStyles } from "./chrome";

/** Top-corner rounding scale for the panel. */
export type SheetSize = "sm" | "md" | "lg" | "xl";

/** Imperative handle exposed via `ref`. */
export interface SheetRef {
  /** Open the sheet (uncontrolled) / request open (controlled). */
  open: () => void;
  /** Close the sheet. */
  close: () => void;
  /** Animate to a snap-point index and commit it. */
  snapTo: (index: number) => void;
}

export interface SheetProps {
  /** Controlled open state. */
  opened?: boolean;
  /** Uncontrolled initial open state on mount. @default false */
  defaultOpened?: boolean;
  /**
   * Called whenever the sheet requests to close — overlay press, drag-to-dismiss,
   * Escape, snap-to-bottom, or the imperative `close()`. Fires after the close
   * animation in uncontrolled mode; immediately in controlled mode.
   */
  onClose?: () => void;

  /** Controlled snap-point index (into `snapPoints`). */
  position?: number;
  /** Uncontrolled initial snap-point index. @default 0 (most open) */
  defaultPosition?: number;
  /** Called when the resting snap-point index changes. */
  onPositionChange?: (position: number) => void;

  /**
   * Snap points as % of the screen the sheet occupies, ordered most-visible →
   * least-visible. @default [80, 10]
   */
  snapPoints?: number[];

  /** Tapping the scrim closes the sheet. @default true */
  dismissOnOverlayPress?: boolean;
  /** Dragging past the lowest snap closes the sheet. @default false */
  dismissOnSnapToBottom?: boolean;
  /** Escape closes the sheet (web). @default true */
  closeOnEscape?: boolean;

  /** Disable all drag handling. @default false */
  disableDrag?: boolean;
  /** Render into the app root (teleported) vs. inline. @default true */
  modal?: boolean;
  /** Render the scrim behind the panel. @default true */
  withOverlay?: boolean;
  /** Show the default drag handle when no `Sheet.Handle` is provided. @default true */
  withHandle?: boolean;

  /** Per-instance spring override (passed to reanimated `withSpring`). */
  animationConfig?: WithSpringConfig;
  /** Lift the panel above the soft keyboard (native). @default false */
  moveOnKeyboardChange?: boolean;
  /** Opt out of locking body scroll while open (web). @default false */
  disableRemoveScroll?: boolean;
  /** Trap keyboard focus within the panel while open (web). @default true */
  trapFocus?: boolean;
  /** Return focus to the previously-focused element on close (web). @default true */
  returnFocus?: boolean;

  /** Root stack order. @default 200 */
  zIndex?: number;
  /** Top-corner rounding scale. @default "lg" */
  size?: SheetSize;

  /** Props forwarded to the underlying `Overlay` scrim. */
  overlayProps?: OverlayProps;
  /** Per-slot style overrides (`root` / `overlay` / `handle`). */
  styles?: SlotStyles<SheetStyles>;

  /** Inline style on the panel surface. */
  style?: StyleProp<ViewStyle>;
  testID?: string;

  /**
   * `Sheet.Overlay` / `Sheet.Handle` / `Sheet.Frame` markers, or plain content
   * (which folds into the panel).
   */
  children?: React.ReactNode;
}
