import type * as React from "react";
import type { SharedValue } from "react-native-reanimated";

import type { OverlayProps } from "@knitui/components";

/** Props for the animated panel host (carries the panel's `translateY`). */
export interface FrameHostProps {
  /** Panel translateY (px). */
  offset: SharedValue<number>;
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
