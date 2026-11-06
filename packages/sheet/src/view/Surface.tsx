import * as React from "react";
import { GestureDetector, type PanGesture } from "react-native-gesture-handler";
import type { SharedValue } from "react-native-reanimated";

import type { GetProps, LayoutChangeEvent, TamaguiElement } from "@knitui/core";

import { SheetFill, SheetFrame, SheetLayer, SheetRest } from "../chrome";
import { AnimatedFooterHost, AnimatedFrameHost, AnimatedOverlay } from "./animated";
import type { AnimatedOverlayProps } from "./animated.types";

export interface SurfaceProps {
  /** Panel translateY (px). */
  offset: SharedValue<number>;
  /** Live keyboard height (px). */
  keyboard: SharedValue<number>;
  /** Viewport height (px). */
  viewportHeight: number;
  /** How far the layer ends above the bottom of the window (px). */
  bottomGap: number;
  /** Gap kept between the panel and the top of the viewport (px). */
  topGap: number;
  /** Cap the panel's width and centre it. */
  maxWidth?: number;
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
  /** Measured footer height (px). */
  footerHeight: number;
  /** How far the footer may slide down behind a keyboard (px). */
  footerKeyboardSlide: number;
  /** Props on the box that ends at the resting snap. */
  restProps?: GetProps<typeof SheetRest>;
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
    keyboard,
    viewportHeight,
    bottomGap,
    topGap,
    maxWidth,
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
    footerHeight,
    footerKeyboardSlide,
    restProps,
    children,
    onLayout,
    testID,
  } = props;

  const geometry = { offset, keyboard, viewportHeight, bottomGap, topGap };
  const panel = (
    <AnimatedFrameHost {...geometry} maxWidth={maxWidth}>
      <SheetFrame {...rootProps}>
        <SheetRest {...restProps}>
          {handle}
          {header}
          {children}
        </SheetRest>
        {footer ? (
          <AnimatedFooterHost
            {...geometry}
            footerHeight={footerHeight}
            keyboardSlide={footerKeyboardSlide}
          >
            {footer}
          </AnimatedFooterHost>
        ) : null}
      </SheetFrame>
    </AnimatedFrameHost>
  );

  return (
    <SheetLayer ref={ref} testID={testID} onLayout={onLayout} zIndex={zIndex}>
      {/*
       * With a scrim the gesture spans the WHOLE layer, so the sheet can be
       * dragged from the backdrop as well. A stationary tap never crosses the
       * pan's activation threshold, so the scrim's `onPress` (tap-to-dismiss)
       * still fires.
       *
       * Without one the gesture goes on the PANEL alone. `box-none` on the
       * capture container does NOT keep the empty regions free on Android: RNGH
       * records a detector's handlers even when no child took the touch, bounded
       * by its single child, so a detector around the full-cover fill took every
       * touch on the page behind, and a persistent sheet ate the pans and
       * pinches of a map under it. Around the translated panel those bounds
       * follow the panel.
       */}
      {withOverlay ? (
        <GestureDetector gesture={gesture}>
          <SheetFill pointerEvents="box-none">
            <AnimatedOverlay
              offset={offset}
              fadeStart={fadeStart}
              closed={closed}
              maxOpacity={overlayMaxOpacity}
              onPress={onOverlayPress}
              overlayProps={overlayProps}
            />
            {panel}
          </SheetFill>
        </GestureDetector>
      ) : (
        <SheetFill pointerEvents="box-none">
          <GestureDetector gesture={gesture}>{panel}</GestureDetector>
        </SheetFill>
      )}
    </SheetLayer>
  );
});
