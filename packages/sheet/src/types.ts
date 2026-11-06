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
   * least-visible, or `"fit"` for one snap that hugs the panel's content. A fit
   * panel measures the handle, header, content and footer, follows content that
   * changes height while open, and stops at {@link SheetProps.maxHeight}, where a
   * `Sheet.ScrollView` starts to scroll. @default [80, 10]
   */
  snapPoints?: number[] | "fit";
  /**
   * The tallest a `snapPoints="fit"` panel may grow: px, or a `"NN%"` share of the
   * screen. Defaults to the screen below the top safe area.
   */
  maxHeight?: number | `${number}%`;
  /** Cap the panel's width and centre it, for tablets and wide windows. */
  maxWidth?: number;

  /** Tapping the scrim closes the sheet. @default true */
  dismissOnOverlayPress?: boolean;
  /** Dragging past the lowest snap closes the sheet. @default false */
  dismissOnSnapToBottom?: boolean;
  /** Escape closes the sheet (web), topmost modal sheet first. @default true */
  closeOnEscape?: boolean;
  /** Android hardware back closes a modal sheet, topmost first. @default true */
  closeOnBackPress?: boolean;

  /** Disable all drag handling. @default false */
  disableDrag?: boolean;
  /**
   * A modal sheet is teleported to the app root and exposed as a dialog
   * (`role="dialog"` + `aria-modal="true"` on web, `accessibilityViewIsModal` on
   * native). A non-modal sheet renders inline as a persistent panel: not a
   * dialog, but a `role="region"` landmark when it has an accessible name
   * (`aria-label` / `aria-labelledby`), and no role without one.
   * @default true
   */
  modal?: boolean;
  /** Render the scrim behind the panel. @default true */
  withOverlay?: boolean;
  /** Show the default drag handle when no `Sheet.Handle` is provided. @default true */
  withHandle?: boolean;

  /** Per-instance spring override (passed to reanimated `withSpring`). */
  animationConfig?: WithSpringConfig;
  /**
   * Ride the whole panel, footer included, above the soft keyboard, tracking it while
   * the scrollable content shrinks to fit. Native tracks it frame by frame; mobile web
   * follows the browser's visual viewport.
   * @default the value of `modal`
   */
  moveOnKeyboardChange?: boolean;
  /** Opt out of locking body scroll while a modal sheet is open (web). @default false */
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
  /** Per-slot style overrides. See {@link SheetStyles}. */
  styles?: SlotStyles<SheetStyles>;

  /** Title shown in the header. Also names the panel for assistive tech. */
  title?: React.ReactNode;
  /** Show a close button in the header. @default `true` when `title` is set */
  withCloseButton?: boolean;
  /** Close button props. Set `aria-label` to name it. @default { "aria-label": "Close" } */
  closeButtonProps?: { "aria-label"?: string };
  /** Pad the content region with the kit's standard gutter. @default false */
  padded?: boolean;
  /**
   * Space kept clear under the content or footer. Defaults to the bottom safe area
   * on native (from `react-native-safe-area-context`) and to
   * `env(safe-area-inset-bottom)` on web. Pass `0` to opt out.
   */
  bottomInset?: number;

  /**
   * Accessible name of the panel. On web it is set on the element that carries
   * the role (the dialog, or the region of a non-modal sheet); on native it
   * becomes the panel's `accessibilityLabel`. Takes precedence over `title`.
   */
  "aria-label"?: string;
  /**
   * Id of the element that names the panel (typically its visible title), set on
   * the element that carries the role. Web only; takes precedence over
   * `aria-label` for assistive tech.
   */
  "aria-labelledby"?: string;

  /** Inline style on the panel surface. */
  style?: StyleProp<ViewStyle>;
  testID?: string;

  /**
   * `Sheet.Overlay` / `Sheet.Handle` / `Sheet.Header` / `Sheet.Footer` /
   * `Sheet.Frame` markers, or plain content (which folds into the panel).
   */
  children?: React.ReactNode;
}
