import * as React from "react";
import { GestureDetector } from "react-native-gesture-handler";
import { useSharedValue, type WithSpringConfig } from "react-native-reanimated";

import { type GetProps, styled, type TamaguiElement, withStaticProperties } from "@knitui/core";
import { useElementSize, useId } from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import { CloseButton } from "../CloseButton";
import {
  DISTANCES,
  type MotionPreset,
  type MotionPresetName,
  useMotionPreset,
} from "../internal/motion";
import { renderTextChild } from "../internal/render-text-child";
import {
  panelWidthVariant,
  radiusVariant,
  shadowVariant,
  type SizeKey,
} from "../internal/style-props";
import { type DragAxis, DragDismissHost, DragDismissOverlay, useDragDismiss } from "../Modal/drag";
import {
  ModalBase,
  type ModalBaseSharedProps,
  type ModalChromeStyles,
  resolveModalChromeSlots,
} from "../Modal/modal-base";
import { Text } from "../Text";

export type DrawerPosition = "left" | "right" | "top" | "bottom";
export type DrawerSize = SizeKey;

type DrawerExtent = BoxProps["width"] | BoxProps["height"];

/** Named size keys of the shared `panelWidthVariant` scale. */
type PanelWidthKey = "xxs" | "xs" | "sm" | "md" | "lg" | "xl" | "xxl";

/**
 * Resolve `size` to a panel extent (applied to width OR height depending on the
 * anchored edge). The magnitude comes from the shared `panelWidthVariant` scale
 * so a drawer `md` matches a dialog `md`; a number/CSS string passes through.
 * The same numeric scale is reused for the height axis (top/bottom drawers).
 */
function resolveExtent(size: DrawerSize | number | string): DrawerExtent {
  if (typeof size === "number") return size;
  if (size in panelWidthVariant) {
    return panelWidthVariant[size as PanelWidthKey].width;
  }
  return size as DrawerExtent;
}

/** Subtle slide-in offset (px) per edge for the entrance transition. */
const ENTER_OFFSET: Record<DrawerPosition, { x?: number; y?: number }> = {
  left: { x: -DISTANCES.enter },
  right: { x: DISTANCES.enter },
  top: { y: -DISTANCES.enter },
  bottom: { y: DISTANCES.enter },
};

/**
 * Drag-to-dismiss axis + the screen sign that travels OFF-SCREEN (toward the
 * anchored edge) per edge: drag left dismisses a left drawer, drag up a top
 * drawer, etc. Consumed by the shared `useDragDismiss` primitive.
 */
const DRAG: Record<DrawerPosition, { axis: DragAxis; sign: 1 | -1 }> = {
  left: { axis: "x", sign: -1 },
  right: { axis: "x", sign: 1 },
  top: { axis: "y", sign: -1 },
  bottom: { axis: "y", sign: 1 },
};

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

const DrawerContentFrame = styled(Box, {
  name: "DrawerContent",
  position: "relative",
  zIndex: 1,
  backgroundColor: "$background",
  overflow: "hidden",
  flexDirection: "column",
  // Fill the cross axis (full height for left/right, full width for top/bottom)
  // via flex stretch rather than a percentage dimension — RN/Yoga resolves
  // percentage sizes unreliably here, but `alignSelf: "stretch"` against the
  // `align: "stretch"` layer always fills. Only the main axis is pinned to the
  // panel `extent` at render.
  alignSelf: "stretch",

  variants: {
    radius: radiusVariant,
    shadow: shadowVariant,
  } as const,

  defaultVariants: { shadow: "xl" },
});

const DrawerHeader = styled(Box, {
  name: "DrawerHeader",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: "$md",
  paddingVertical: "$sm",
  backgroundColor: "$background",
});

const DrawerTitle = styled(Text, {
  name: "DrawerTitle",
  fontSize: "$lg",
  fontWeight: "600",
  color: "$color",
});

const DrawerBody = styled(Box, {
  name: "DrawerBody",
  padding: "$md",
  flex: 1,
});

/* -------------------------------------------------------------------------- */
/* Public component                                                           */
/* -------------------------------------------------------------------------- */

type DrawerContentFrameProps = Omit<
  GetProps<typeof DrawerContentFrame>,
  | "aria-describedby"
  | "aria-label"
  | "aria-labelledby"
  | "aria-modal"
  | "children"
  | "height"
  | "position"
  | "role"
  | "size"
  | "width"
  | "zIndex"
>;

/**
 * Per-slot `styles` map for `Drawer` (Pillar B). Uniform sugar over the
 * composable parts: each key spreads onto the matching part. Slots:
 * `overlay` / `content` / `header` / `title` / `body` / `closeButton`.
 */
export type DrawerStyles = ModalChromeStyles<
  GetProps<typeof DrawerContentFrame>,
  GetProps<typeof DrawerHeader>,
  GetProps<typeof DrawerTitle>,
  GetProps<typeof DrawerBody>
>;

export interface DrawerProps extends ModalBaseSharedProps, DrawerContentFrameProps {
  /** Uniform per-slot style passthrough. See {@link DrawerStyles}. */
  styles?: DrawerStyles;
  /** Accessible label used when no visible title is provided. @default "Drawer" */
  "aria-label"?: string;
  /** Additional content description id(s). */
  "aria-describedby"?: string;
  /** Drawer title rendered in the header. */
  title?: React.ReactNode;
  /** Drawer body content. */
  children?: React.ReactNode;
  /** Show the close button in the header. @default true */
  withCloseButton?: boolean;
  /** Typed, cross-platform-safe subset of close-button props. */
  closeButtonProps?: { "aria-label"?: string };
  /** Edge the drawer is anchored to. @default "left" */
  position?: DrawerPosition;
  /** Panel extent (width for left/right, height for top/bottom). @default "md" */
  size?: DrawerSize | number | string;
  /** Panel corner radius. */
  radius?: DrawerContentProps["radius"];
  /** Gap between the panel and the viewport edge. Prefer `$space` tokens. @default "$0" */
  offset?: BoxProps["padding"];
  /**
   * Enter/exit animation — a motion preset name, an inline {@link MotionPreset},
   * or `false` to disable. @default a subtle edge slide-in keyed to `position`.
   * Reduced motion is always honoured. Exit animates (the panel slides and scrim
   * fades out before unmounting) unless `keepMounted` is set.
   */
  animation?: MotionPresetName | MotionPreset | false;
  /**
   * Animation speed in ms — overrides the preset's duration while keeping its
   * easing. Ignored when `animation` is `false` or reduced motion is on.
   */
  duration?: number;
  /**
   * Allow dragging the panel toward its anchored edge to dismiss (reanimated +
   * gesture, the same mechanic as `@knitui/sheet`). The CSS enter/exit slide is
   * unchanged; this only adds the interactive drag-to-close. @default false
   */
  dragToDismiss?: boolean;
  /**
   * Distance dragged toward the edge, as a fraction of the panel extent, past
   * which releasing dismisses (a fling toward the edge always dismisses). @default 0.3
   */
  dragThreshold?: number;
  /** Spring config for the drag settle (reanimated `withSpring`). */
  animationConfig?: WithSpringConfig;
}

const ModalBaseInnerLayout: Record<
  DrawerPosition,
  // Literal unions (not the wider `BoxProps` style types) so the same values feed
  // both `ModalBase` and the drag host's `ViewStyle` without a cast.
  { direction: "row" | "column"; justify: "flex-start" | "flex-end" }
> = {
  left: { direction: "row", justify: "flex-start" },
  right: { direction: "row", justify: "flex-end" },
  top: { direction: "column", justify: "flex-start" },
  bottom: { direction: "column", justify: "flex-end" },
};

const DrawerBase = DrawerContentFrame.styleable<DrawerProps>(function Drawer(props, ref) {
  const {
    "aria-describedby": describedBy,
    "aria-label": ariaLabel,
    title,
    children,
    withCloseButton = true,
    closeButtonProps,
    position = "left",
    size = "md",
    radius,
    offset = "$0",
    animation,
    duration,
    dragToDismiss = false,
    dragThreshold,
    animationConfig,
    // ModalBase shared props
    opened,
    onClose,
    closeOnEscape,
    closeOnClickOutside,
    lockScroll,
    returnFocus,
    trapFocus,
    withinPortal,
    keepMounted,
    withOverlay,
    overlayProps,
    zIndex,
    shadow,
    styles,
    ...contentProps
  } = props;

  const slots = resolveModalChromeSlots(styles, "Drawer");
  const rootId = useId();
  const titleId = title ? `${rootId}-title` : undefined;
  const bodyId = children ? `${rootId}-body` : undefined;
  const descriptionId = [describedBy, bodyId].filter(Boolean).join(" ") || undefined;
  const hasHeader = !!title || withCloseButton;

  // Default to a subtle edge slide-in keyed to the anchored side; `animation`
  // overrides it (a preset name, inline preset, or `false`). `?? defaultMotion`
  // keeps an explicit `false` (disable) intact since `??` only fills null/undefined.
  const defaultMotion: MotionPreset = {
    transition: "fast",
    enterStyle: { opacity: 0, ...ENTER_OFFSET[position] },
    exitStyle: { opacity: 0, ...ENTER_OFFSET[position] },
    animateOnly: ["transform", "opacity"],
  };
  const motion = useMotionPreset(animation ?? defaultMotion, { duration });

  const layout = ModalBaseInnerLayout[position];
  const extent = resolveExtent(size);
  const isHorizontal = position === "left" || position === "right";

  // Drag-to-dismiss (opt-in): drag toward the anchored edge (axis/sign per
  // `DRAG[position]`). The panel measures its main-axis extent (width for
  // left/right, height for top/bottom); the gesture is off until measured / when
  // disabled. Reset to rest on (re)open so a prior dismiss doesn't park it off-screen.
  const drag = DRAG[position];
  const dragOffset = useSharedValue(0);
  // Measure the panel's main-axis size cross-platform (ResizeObserver on web /
  // onLayout on native) as the dismiss extent — Tamagui's onLayout is unreliable
  // on web. Reset to rest on (re)open so a prior dismiss doesn't park it off-screen.
  const { ref: sizeRef, rootProps: sizeRootProps, width: dragW, height: dragH } = useElementSize();
  const dragExtent = isHorizontal ? dragW : dragH;
  // Reset the drag travel to rest whenever the drawer (re)opens, so a prior
  // drag-dismiss (which parks the offset off-screen) doesn't leave it parked on
  // the next open. In an effect (not during render) — writing a shared value
  // mid-render trips reanimated's "write during render" guard.
  React.useEffect(() => {
    if (opened) dragOffset.value = 0;
  }, [opened, dragOffset]);
  const setContentRef = React.useCallback(
    (node: TamaguiElement | null) => {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<TamaguiElement | null>).current = node;
      if (typeof sizeRef === "function") sizeRef(node);
    },
    [ref, sizeRef],
  );
  // When dragging, the host stands in for the positioning layer so the panel keeps
  // its edge anchoring AND cross-axis stretch. Without this the host is a bare
  // default-column box that hugs its child: the outer catcher stretches the host
  // to full size, but inside a column host the panel's `alignSelf:"stretch"` acts
  // on the host's CROSS axis (width) while its MAIN axis (height) collapses to
  // content — so a left/right drawer loses its full height. Mirroring the layer's
  // `direction`/`justify` + `flex:1`/`alignSelf:"stretch"` makes the panel size
  // exactly as it does directly in the layer (full height left/right, full width
  // top/bottom).
  const dragHostStyle = {
    flex: 1,
    alignSelf: "stretch",
    flexDirection: layout.direction,
    justifyContent: layout.justify,
    alignItems: "stretch",
  } as const;
  const dragGesture = useDragDismiss({
    offset: dragOffset,
    axis: drag.axis,
    sign: drag.sign,
    extent: dragExtent,
    // Off while closed/closing too, so a stray touch can't grab a panel that is
    // animating out (the exit is owned by ModalBase's AnimatePresence).
    enabled: dragToDismiss && dragExtent > 0 && opened,
    threshold: dragThreshold,
    spring: animationConfig,
    onDismiss: onClose,
  });

  const drawerContent = (
    <DrawerContentFrame
      ref={setContentRef}
      {...sizeRootProps}
      {...contentProps}
      radius={radius}
      shadow={shadow}
      width={isHorizontal ? extent : undefined}
      height={isHorizontal ? undefined : extent}
      role="dialog"
      aria-label={titleId ? undefined : (ariaLabel ?? "Drawer")}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      aria-modal
      {...motion}
      {...slots.content}
    >
      {hasHeader ? (
        <DrawerHeader {...slots.header}>
          {title ? (
            <DrawerTitle id={titleId} {...slots.title}>
              {title}
            </DrawerTitle>
          ) : (
            <Box />
          )}
          {withCloseButton ? (
            <CloseButton
              size="sm"
              onPress={onClose}
              aria-label="Close drawer"
              {...slots.closeButton}
              {...closeButtonProps}
            />
          ) : null}
        </DrawerHeader>
      ) : null}
      <DrawerBody id={bodyId} {...slots.body}>
        {renderTextChild(children, Text)}
      </DrawerBody>
    </DrawerContentFrame>
  );

  return (
    <ModalBase
      opened={opened}
      onClose={onClose}
      closeOnEscape={closeOnEscape}
      closeOnClickOutside={closeOnClickOutside}
      lockScroll={lockScroll}
      returnFocus={returnFocus}
      trapFocus={trapFocus}
      withinPortal={withinPortal}
      keepMounted={keepMounted}
      // When dragging, the drag layer renders its own offset-driven scrim, so
      // disable ModalBase's static one (avoid two overlays).
      withOverlay={dragToDismiss ? false : withOverlay}
      overlayProps={{ ...slots.overlay, ...overlayProps }}
      // Keep the scrim fade in lockstep with the content animation's off switch.
      overlayAnimation={animation === false ? false : "fade"}
      zIndex={zIndex}
      direction={layout.direction}
      justify={layout.justify}
      align="stretch"
      padding={offset}
    >
      {dragToDismiss ? (
        <GestureDetector gesture={dragGesture}>
          {/*
            One gesture spans the scrim AND the panel so the drawer can be dragged
            from the backdrop, not just the panel. This full-cover catcher stands
            in for the positioning layer (whose only child is now this absolute
            box): it re-applies the edge anchoring (direction/justify) and the
            viewport `offset` as padding so the panel keeps its placement, while
            the scrim — absolute, so the padding doesn't inset it — still covers
            the whole screen. A stationary tap never crosses the pan threshold, so
            the scrim's own tap-to-dismiss keeps working. `box-none` lets the empty
            area beside the panel fall through to the scrim for taps.
          */}
          <Box
            pointerEvents="box-none"
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            flexDirection={layout.direction}
            justifyContent={layout.justify}
            alignItems="stretch"
            padding={offset}
          >
            {withOverlay !== false ? (
              <DragDismissOverlay
                offset={dragOffset}
                extent={dragExtent}
                onPress={closeOnClickOutside === false ? undefined : onClose}
                overlayProps={{ ...slots.overlay, ...overlayProps }}
              />
            ) : null}
            <DragDismissHost
              offset={dragOffset}
              axis={drag.axis}
              sign={drag.sign}
              style={dragHostStyle}
              pointerEvents="box-none"
            >
              {drawerContent}
            </DragDismissHost>
          </Box>
        </GestureDetector>
      ) : (
        drawerContent
      )}
    </ModalBase>
  );
});

export const Drawer = withStaticProperties(DrawerBase, {
  Content: DrawerContentFrame,
  Header: DrawerHeader,
  Title: DrawerTitle,
  Body: DrawerBody,
});

export type DrawerContentProps = GetProps<typeof DrawerContentFrame>;
export type DrawerHeaderProps = GetProps<typeof DrawerHeader>;
export type DrawerTitleProps = GetProps<typeof DrawerTitle>;
export type DrawerBodyProps = GetProps<typeof DrawerBody>;
