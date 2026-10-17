import * as React from "react";
import { GestureDetector, type PanGesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";

import type { GetProps, LayoutChangeEvent, TamaguiElement } from "@knitui/core";

import { SheetFill, SheetFrame, SheetLayer } from "../chrome";
import { AnimatedFrameHost, AnimatedOverlay } from "./animated";
import type { AnimatedOverlayProps } from "./animated.types";

export interface SurfaceProps {
  /** Panel translateY (px). */
  offset: SharedValue<number>;
  /** Scrim fade geometry. */
  fadeStart: number;
  closed: number;
  overlayMaxOpacity: number;
  /** The composed drag gesture. */
  gesture: PanGesture;
  /** Root stack order. */
  zIndex: number;
  /** Render the scrim. */
  withOverlay: boolean;
  /** Props forwarded to the `Overlay`. */
  overlayProps?: AnimatedOverlayProps["overlayProps"];
  /** Tap-to-dismiss handler for the scrim. */
  onOverlayPress?: () => void;
  /** Props spread onto the panel surface (`SheetFrame`). */
  rootProps?: GetProps<typeof SheetFrame>;
  /** The drag handle node (or null). */
  handle?: React.ReactNode;
  /** The fixed header node, pinned below the handle and above the content (or null). */
  header?: React.ReactNode;
  /** The fixed footer node, pinned below the content (or null). */
  footer?: React.ReactNode;
  /** Panel content. */
  children?: React.ReactNode;
  /** Measures the full-cover layer. */
  onLayout: (e: LayoutChangeEvent) => void;
  testID?: string;
}

/**
 * The full-cover positioning layer: scrim behind, the gesture-wrapped animated
 * panel in front. Platform-agnostic — the animation binding lives in the
 * `animated{,.web}.tsx` hosts it composes. The `ref` is the focus-trap target
 * (the layer); `box-none` lets the scrim + panel take events while the layer's
 * own box never swallows clicks meant for the page behind a closed sheet.
 */
export const Surface = React.forwardRef<TamaguiElement, SurfaceProps>(function Surface(props, ref) {
  const {
    offset,
    fadeStart,
    closed,
    overlayMaxOpacity,
    gesture,
    zIndex,
    withOverlay,
    overlayProps,
    onOverlayPress,
    rootProps,
    handle,
    header,
    footer,
    children,
    onLayout,
    testID,
  } = props;

  return (
    <SheetLayer ref={ref} testID={testID} onLayout={onLayout} zIndex={zIndex}>
      {/*
       * One gesture spans the WHOLE layer — scrim and panel — so the sheet can be
       * dragged from the backdrop, not just the panel. The capture container is
       * `box-none`: when the scrim is present it fills the layer (pointer-events
       * auto) and the whole area is draggable; without a scrim only the panel is
       * solid, so empty regions fall through to the page behind. A stationary tap
       * never crosses the pan's activation threshold, so the scrim's own
       * `onPress` (tap-to-dismiss) still fires.
       */}
      <GestureDetector gesture={gesture}>
        <SheetFill pointerEvents="box-none">
          {withOverlay ? (
            <AnimatedOverlay
              offset={offset}
              fadeStart={fadeStart}
              closed={closed}
              maxOpacity={overlayMaxOpacity}
              onPress={onOverlayPress}
              overlayProps={overlayProps}
            />
          ) : null}

          <AnimatedFrameHost offset={offset}>
            <SheetFrame {...rootProps}>
              {handle}
              {header}
              {children}
              {footer}
            </SheetFrame>
          </AnimatedFrameHost>
        </SheetFill>
      </GestureDetector>
    </SheetLayer>
  );
});
