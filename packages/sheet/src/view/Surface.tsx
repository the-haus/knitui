import * as React from "react";

import { Box } from "@knitui/components";
import { type GetProps, isWeb, type LayoutChangeEvent, type TamaguiElement } from "@knitui/core";

import { SheetFrame } from "../chrome";
import type { SheetDrag } from "../input/drag.types";
import type { SheetValue } from "../motion/value.types";
import { AnimatedFrameHost, AnimatedOverlay } from "./animated";
import type { AnimatedOverlayProps } from "./animated.types";
import { DragArea } from "./DragArea";

export interface SurfaceProps {
  /** Panel translateY (px). */
  offset: SheetValue<number>;
  /** Scrim fade geometry. */
  fadeStart: number;
  closed: number;
  overlayMaxOpacity: number;
  /** The composed drag (`useSheetDrag`). */
  gesture: SheetDrag;
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
 * The full-cover positioning layer: scrim behind, the drag-wrapped animated
 * panel in front. Platform-agnostic — the animation binding lives in the
 * `animated{,.web}.tsx` hosts and the drag binding in the `DragArea{,.native}`
 * twins it composes. The `ref` is the focus-trap target
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
    <Box
      ref={ref}
      testID={testID}
      onLayout={onLayout}
      pointerEvents="box-none"
      zIndex={zIndex}
      style={{ position: isWeb ? "fixed" : "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
    >
      {/*
       * One gesture spans the WHOLE layer — scrim and panel — so the sheet can be
       * dragged from the backdrop, not just the panel. The capture container is
       * `box-none`: when the scrim is present it fills the layer (pointer-events
       * auto) and the whole area is draggable; without a scrim only the panel is
       * solid, so empty regions fall through to the page behind. A stationary tap
       * never crosses the drag's activation threshold, so the scrim's own
       * `onPress` (tap-to-dismiss) still fires.
       */}
      <DragArea drag={gesture}>
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
      </DragArea>
    </Box>
  );
});
