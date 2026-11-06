import type * as React from "react";
import type { SharedValue } from "react-native-reanimated";

import type { OverlayProps } from "@knitui/components";

/** Geometry shared by everything that follows the panel frame by frame. */
export interface PanelGeometry {
  /** Panel offset (px): the snap maths' number, free of the keyboard. */
  offset: SharedValue<number>;
  /** Live keyboard height (px). */
  keyboard: SharedValue<number>;
  /** Viewport height (px). */
  viewportHeight: number;
  /** How far the layer ends above the bottom of the window (px). */
  bottomGap: number;
  /** Gap kept between the panel and the top of the viewport (px). */
  topGap: number;
}

/** Props for the animated panel host (carries the panel's `translateY`). */
export interface FrameHostProps extends PanelGeometry {
  /** Cap the host's width and centre it. */
  maxWidth?: number;
  children: React.ReactNode;
}

/** Props for the footer host, which keeps the footer on the panel's visible bottom edge. */
export interface FooterHostProps extends PanelGeometry {
  /** Measured footer height (px). */
  footerHeight: number;
  /** How far the footer may slide down behind a keyboard (px). */
  keyboardSlide: number;
  children: React.ReactNode;
}

/** Props for the animated scrim (opacity tracks the panel offset). */
export interface AnimatedOverlayProps {
  /** Panel translateY (px). */
  offset: SharedValue<number>;
  /** Offset where the scrim starts to fade (least-open snap). */
  fadeStart: number;
  /** Fully-closed offset. */
  closed: number;
  /** Multiplier applied to the computed fade (0–1). */
  maxOpacity: number;
  /** Tap-to-dismiss handler. */
  onPress?: () => void;
  /** Props forwarded to the underlying `Overlay`. */
  overlayProps?: OverlayProps;
}
