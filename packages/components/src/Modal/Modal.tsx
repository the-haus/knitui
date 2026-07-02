import * as React from "react";
import { GestureDetector } from "react-native-gesture-handler";
import { useSharedValue, type WithSpringConfig } from "react-native-reanimated";

import {
  type GetProps,
  isWeb,
  styled,
  type TamaguiElement,
  withStaticProperties,
} from "@knitui/core";
import { useElementSize, useId, useViewportSize } from "@knitui/hooks";

import { Box, type BoxProps } from "../Box";
import { CloseButton, type CloseButtonProps } from "../CloseButton";
import {
  DISTANCES,
  type MotionPreset,
  type MotionPresetName,
  useMotionPreset,
} from "../internal/motion";
import { renderTextChild } from "../internal/render-text-child";
import {
  modalSizeVariant,
  radiusVariant,
  shadowVariant,
  type SizeKey,
} from "../internal/style-props";
import { ScrollArea } from "../ScrollArea";
import { Text } from "../Text";
import { DragDismissHost, DragDismissOverlay, useDragDismiss } from "./drag";
import {
  ModalBase,
  type ModalBaseSharedProps,
  type ModalChromeStyles,
  resolveModalChromeSlots,
} from "./modal-base";

export type ModalSize = SizeKey;

/**
 * Default enter/exit motion for the content panel — a subtle 8px drop-in fade,
 * matching Mantine. Override per instance via the `animation` prop (a preset name,
 * an inline {@link MotionPreset}, or `false` to disable). Reduced motion collapses
 * it to instant automatically (handled inside {@link useMotionPreset}).
 */
const DEFAULT_MODAL_MOTION: MotionPreset = {
  transition: "fast",
  enterStyle: { opacity: 0, y: -DISTANCES.nudge },
  exitStyle: { opacity: 0, y: -DISTANCES.nudge },
  animateOnly: ["transform", "opacity"],
};

/* -------------------------------------------------------------------------- */
/* Styled parts                                                               */
/* -------------------------------------------------------------------------- */

const ModalContentFrame = styled(Box, {
  name: "ModalContent",
  position: "relative",
  zIndex: 1,
  width: "100%",
  backgroundColor: "$background",
  overflow: "hidden",
  // Cap the panel at the viewport (minus the layer's offsets) and stack the
  // header + body as a flex column so the header stays pinned while the body
  // takes the remaining space and scrolls (see `ModalScrollBody`). `maxHeight`
  // resolves because the positioning layer (`ModalBaseInner`) is inset-0 — a
  // definite-height parent on every platform.
  maxHeight: "100%",
  flexDirection: "column",

  variants: {
    radius: radiusVariant,
    shadow: shadowVariant,
    size: {
      ...modalSizeVariant,
    },
    fullScreen: {
      // Fill the viewport via flexbox rather than percentage `width`/`height`:
      // `flex: 1` fills the main axis and `alignSelf: "stretch"` the cross axis.
      // RN/Yoga only resolves percentage `height` against a parent with a
      // definite height, so `height: "100%"` is unreliable on native — flex is
      // not. The parent also switches to `align: "stretch"` (see below), and the
      // `size` variant's `maxWidth` cap is overridden at the instance level
      // (variant merge order otherwise lets `size` win over this variant).
      true: {
        flex: 1,
        alignSelf: "stretch",
        borderRadius: 0,
      },
    },
  } as const,

  defaultVariants: { radius: "md", shadow: "xl", size: "md" },
});

const ModalHeader = styled(Box, {
  name: "ModalHeader",
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: "$md",
  paddingVertical: "$sm",
  backgroundColor: "$background",
  // Pinned: never compress when the body's content overflows and scrolls.
  flexShrink: 0,

  variants: {
    // Optional hairline under the header — visually separates the pinned header
    // from the scrolling body. Driven by the `withHeaderDivider` prop.
    withBorder: {
      true: { borderBottomWidth: 1, borderColor: "$borderColor" },
    },
  } as const,
});

const ModalTitle = styled(Text, {
  name: "ModalTitle",
  fontSize: "$lg",
  fontWeight: "600",
  color: "$color",
});

const ModalBody = styled(Box, {
  name: "ModalBody",
  padding: "$md",
});

/* -------------------------------------------------------------------------- */
/* Public component                                                           */
/* -------------------------------------------------------------------------- */

type ModalContentFrameProps = Omit<
  GetProps<typeof ModalContentFrame>,
  | "aria-describedby"
  | "aria-label"
  | "aria-labelledby"
  | "aria-modal"
  | "children"
  | "fullScreen"
  | "maxWidth"
  | "role"
  | "size"
  | "zIndex"
>;

/**
 * Per-slot `styles` map for `Modal` (Pillar B). Uniform sugar over the
 * composable parts: each key spreads onto the matching part. Slots:
 * `overlay` / `content` / `header` / `title` / `body` / `closeButton`.
 */
export type ModalStyles = ModalChromeStyles<
  GetProps<typeof ModalContentFrame>,
  GetProps<typeof ModalHeader>,
  GetProps<typeof ModalTitle>,
  GetProps<typeof ModalBody>
>;

export interface ModalProps extends ModalBaseSharedProps, ModalContentFrameProps {
  /** Uniform per-slot style passthrough. See {@link ModalStyles}. */
  styles?: ModalStyles;
  /** Accessible label used when no visible title is provided. @default "Modal" */
  "aria-label"?: string;
  /** Explicit label id used when composing a custom title. */
  "aria-labelledby"?: string;
  /** Additional content description id(s). */
  "aria-describedby"?: string;
  /** Modal title rendered in the header. */
  title?: React.ReactNode;
  /** Modal body content. */
  children?: React.ReactNode;
  /** Show the close button in the header. @default true */
  withCloseButton?: boolean;
  /**
   * Props forwarded to the header `CloseButton` — customise its `aria-label`,
   * `icon`, `iconSize`, `size`, `variant`, `radius`, etc. A custom `onPress`
   * overrides the default `onClose` wiring.
   */
  closeButtonProps?: CloseButtonProps;
  /**
   * Inner spacing applied to the header (horizontal) and the body (all sides).
   * A `$space` token, number, or CSS string. @default "$md"
   */
  padding?: BoxProps["padding"];
  /** Render a hairline divider under the header. @default false */
  withHeaderDivider?: boolean;
  /** Content width — key (xxs–xxl), px number, or CSS string. @default "md" */
  size?: ModalSize | number | string;
  /** Center the content vertically (otherwise it sits near the top). @default false */
  centered?: boolean;
  /** Take the entire screen (no radius, no offset). @default false */
  fullScreen?: boolean;
  /** Content corner radius. @default "md" */
  radius?: ModalContentProps["radius"];
  /**
   * Drop-shadow elevation of the content panel — a key (xxs–xxl), or any custom
   * `boxShadow`/raw value the frame accepts. @default "xl"
   */
  shadow?: ModalContentProps["shadow"];
  /**
   * Vertical gap between the content and the viewport edges. @default "$xl"
   * (a cross-platform theme token; Mantine defaults to the web-only `5dvh`).
   */
  yOffset?: BoxProps["paddingVertical"];
  /** Horizontal gap between the content and the viewport edges. @default "$xl" */
  xOffset?: BoxProps["paddingHorizontal"];
  /**
   * Enter/exit animation — a motion preset name, an inline {@link MotionPreset},
   * or `false` to disable. @default a subtle drop-in fade. Reduced motion is
   * always honoured. Exit animates (the panel and scrim fade out before
   * unmounting) unless `keepMounted` is set.
   */
  animation?: MotionPresetName | MotionPreset | false;
  /**
   * Animation speed in ms — overrides the preset's duration while keeping its
   * easing. Ignored when `animation` is `false` or reduced motion is on.
   */
  duration?: number;
  /**
   * Allow dragging the panel down to dismiss (reanimated + gesture, the same
   * mechanic as `@knitui/sheet`). The CSS enter/exit motion is unchanged; this only
   * adds the interactive drag-to-close. @default false
   */
  dragToDismiss?: boolean;
  /**
   * Distance dragged, as a fraction of the panel height, past which releasing
   * dismisses (a downward fling always dismisses). @default 0.3
   */
  dragThreshold?: number;
  /** Spring config for the drag settle (reanimated `withSpring`). */
  animationConfig?: WithSpringConfig;
}

const ModalBaseComponent = ModalContentFrame.styleable<ModalProps>(function Modal(props, ref) {
  const {
    "aria-describedby": describedBy,
    "aria-label": ariaLabel,
    "aria-labelledby": labelledBy,
    title,
    children,
    withCloseButton = true,
    closeButtonProps,
    padding,
    withHeaderDivider = false,
    size = "md",
    centered = false,
    fullScreen = false,
    radius,
    yOffset,
    xOffset,
    animation = DEFAULT_MODAL_MOTION,
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

  const slots = resolveModalChromeSlots(styles, "Modal");
  const rootId = useId();
  const motion = useMotionPreset(animation, { duration });
  const titleId = title ? `${rootId}-title` : undefined;
  const labelId = titleId ?? labelledBy;
  const bodyId = children ? `${rootId}-body` : undefined;
  const descriptionId = [describedBy, bodyId].filter(Boolean).join(" ") || undefined;
  const hasHeader = !!title || withCloseButton;

  // `padding` overrides the default insets — horizontal on the header (its
  // vertical rhythm stays `$sm`) and all sides on the body. Spread BEFORE the
  // per-slot `styles`, so an explicit slot override still wins.
  const headerPadding = padding !== undefined ? { paddingHorizontal: padding } : undefined;
  const bodyPadding = padding !== undefined ? { padding } : undefined;

  // Drag-to-dismiss (opt-in): drag the panel DOWN (axis "y", sign +1). The panel's
  // own height is the dismiss extent, measured cross-platform via `useElementSize`
  // (ResizeObserver on web / onLayout on native — Tamagui's onLayout is unreliable
  // on web). The gesture is disabled until measured / when off, and resets to rest
  // whenever the modal (re)opens so a prior drag-dismiss doesn't park it off-screen.
  const dragOffset = useSharedValue(0);
  const { ref: sizeRef, rootProps: sizeRootProps, height: dragExtent } = useElementSize();
  // The panel isn't pinned to the bottom edge (it sits centred or near the top),
  // so a committed drag-dismiss must travel the full viewport height to slide it
  // off-screen — not just its own height (`dragExtent`), which would leave it
  // parked mid-screen. The threshold/scrim fade still measure against the panel.
  const viewport = useViewportSize();

  // ── Native body height (see the ScrollArea body below) ────────────────────
  // On native the panel hugs its content (`maxHeight:"100%"`, no definite
  // `height`), so a `flexGrow` scroll body has no free space to grow into and
  // RN/Yoga collapses it to 0 — only the header renders. Web is unaffected (the
  // ScrollArea viewport is an overflow div whose intrinsic size IS its content).
  // The native fix mirrors `Collapse`: measure and feed the scroller a CONCRETE
  // px cap. We measure the layer's available height (an inset-0 probe inside the
  // positioning layer's padded content box) and the header height, and render the
  // body as `ScrollArea.Autosize` (content-driven — hugs short content, scrolls
  // past `maxHeight`). `fullScreen` already has a definite height (`flex:1`), so
  // it keeps the plain `flexGrow` path.
  const useNativeAutosize = !isWeb && !fullScreen;
  const { rootProps: availProbeProps, height: availableHeight } = useElementSize();
  const { rootProps: headerSizeProps, height: headerHeight } = useElementSize();
  // Fall back to the viewport height (available immediately via Dimensions) until
  // the probe lands, so the body is bounded — never collapsed — on the first paint.
  const bodyMaxHeight = Math.max(
    0,
    (availableHeight > 0 ? availableHeight : viewport.height) - headerHeight,
  );

  // Reset the drag travel to rest whenever the modal (re)opens, so a prior
  // drag-dismiss (which parks the offset off-screen) doesn't leave it parked on
  // the next open. In an effect (not during render) — writing a shared value
  // mid-render trips reanimated's "write during render" guard.
  React.useEffect(() => {
    if (opened) dragOffset.value = 0;
  }, [opened, dragOffset]);
  // Merge the measurement ref with the forwarded styleable ref (one node).
  const setContentRef = React.useCallback(
    (node: TamaguiElement | null) => {
      if (typeof ref === "function") ref(node);
      else if (ref) (ref as React.MutableRefObject<TamaguiElement | null>).current = node;
      if (typeof sizeRef === "function") sizeRef(node);
    },
    [ref, sizeRef],
  );
  const dragGesture = useDragDismiss({
    offset: dragOffset,
    axis: "y",
    // Drag UP to dismiss: the panel sits near the top (or centred), so it slides
    // off the top edge. `sign: -1` maps an upward finger translation to positive
    // dismiss travel and translates the host upward.
    sign: -1,
    extent: dragExtent,
    dismissTravel: viewport.height,
    // Off while closed/closing too, so a stray touch can't grab a panel that is
    // animating out (the exit is owned by ModalBase's AnimatePresence).
    enabled: dragToDismiss && dragExtent > 0 && opened,
    threshold: dragThreshold,
    spring: animationConfig,
    onDismiss: onClose,
  });
  // When dragging, the host stands in for the positioning layer so the panel keeps
  // its centring and `maxHeight:100%` resolution (it fills the layer and re-applies
  // the same flex alignment ModalBase would).
  const dragHostStyle = {
    flex: 1,
    alignSelf: "stretch",
    flexDirection: "column",
    alignItems: fullScreen ? "stretch" : "center",
    justifyContent: centered ? "center" : "flex-start",
  } as const;

  const modalContent = (
    <ModalContentFrame
      ref={setContentRef}
      {...sizeRootProps}
      {...contentProps}
      fullScreen={fullScreen}
      size={size}
      // Instance-level override beats the `size` variant's `maxWidth`, letting
      // the full-screen panel span the full width on every platform.
      maxWidth={fullScreen ? "100%" : undefined}
      // Concrete px safety cap on native (the styled `maxHeight:"100%"` is a no-op
      // there — Yoga can't resolve the percentage). Web keeps the `"100%"` default.
      maxHeight={useNativeAutosize && availableHeight > 0 ? availableHeight : undefined}
      radius={fullScreen ? 0 : radius}
      shadow={shadow}
      role="dialog"
      aria-label={labelId ? undefined : (ariaLabel ?? "Modal")}
      aria-labelledby={labelId}
      aria-describedby={descriptionId}
      aria-modal
      {...motion}
      {...slots.content}
    >
      {hasHeader ? (
        <ModalHeader
          withBorder={withHeaderDivider}
          // Measured so the native body's `maxHeight` can reserve the pinned
          // header's space (no-op on web). Spread before slots so an explicit
          // per-slot `onLayout` would still win.
          {...headerSizeProps}
          {...headerPadding}
          {...slots.header}
        >
          {title ? (
            <ModalTitle id={titleId} {...slots.title}>
              {title}
            </ModalTitle>
          ) : (
            <Box />
          )}
          {withCloseButton ? (
            <CloseButton
              size="sm"
              onPress={onClose}
              aria-label="Close modal"
              {...slots.closeButton}
              {...closeButtonProps}
            />
          ) : null}
        </ModalHeader>
      ) : null}
      {/*
        Body scroll. The header is pinned (flexShrink:0) and the body takes the
        remaining space, scrolling vertically once it would exceed the panel cap.
        `scrollbars="y"` keeps rows full-width on native (a default `"xy"`
        ScrollArea nests a horizontal ScrollView that shrinks rows to text width).

        Web (and native `fullScreen`, which has a definite `flex:1` height) uses
        the flex path: `flexGrow:1` + `minHeight:0` fills the remaining space and
        the overflow viewport scrolls. On native the hugging panel has NO definite
        height, so `flexGrow` collapses the body to 0 (RN/Yoga) — there it uses
        `ScrollArea.Autosize` with a CONCRETE `maxHeight` (measured layer height
        minus the header), which sizes to content and scrolls past the cap.
      */}
      {useNativeAutosize ? (
        <ScrollArea.Autosize scrollbars="y" maxHeight={bodyMaxHeight}>
          <ModalBody id={bodyId} {...bodyPadding} {...slots.body}>
            {renderTextChild(children, Text)}
          </ModalBody>
        </ScrollArea.Autosize>
      ) : (
        <ScrollArea scrollbars="y" flexGrow={1} flexShrink={1} flexBasis="auto" minHeight={0}>
          <ModalBody id={bodyId} {...bodyPadding} {...slots.body}>
            {renderTextChild(children, Text)}
          </ModalBody>
        </ScrollArea>
      )}
    </ModalContentFrame>
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
      direction="column"
      // Stretch the cross axis when full-screen so the content can fill the
      // width via flex (no percentage sizing); otherwise centre the panel.
      align={fullScreen ? "stretch" : "center"}
      justify={centered ? "center" : "flex-start"}
      paddingVertical={fullScreen ? 0 : (yOffset ?? "$xl")}
      paddingHorizontal={fullScreen ? 0 : (xOffset ?? "$xl")}
    >
      {/*
        Native height probe: an inert, inset-0 box that fills the positioning
        layer's padded content box, so `onLayout` reports the exact vertical space
        the panel may occupy (viewport minus the `yOffset`s). Feeds the body's
        concrete `maxHeight` above. Rendered only where it's needed (native, non-
        fullScreen); a no-op everywhere else.
      */}
      {useNativeAutosize ? (
        <Box
          {...availProbeProps}
          pointerEvents="none"
          position="absolute"
          top={0}
          left={0}
          right={0}
          bottom={0}
        />
      ) : null}
      {dragToDismiss ? (
        <GestureDetector gesture={dragGesture}>
          {/*
            One gesture spans the scrim AND the panel so the modal can be dragged
            from the backdrop, not just the panel. This full-cover catcher stands
            in for the positioning layer (whose only child is now this absolute
            box): it re-applies the viewport offset as padding and a centring
            column so the panel keeps its placement, while the scrim — absolute, so
            the padding doesn't inset it — still covers the whole screen. A
            stationary tap never crosses the pan threshold, so the scrim's own
            tap-to-dismiss keeps working. `box-none` lets the empty margin around
            the panel fall through to the scrim for taps.
          */}
          <Box
            pointerEvents="box-none"
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            flexDirection="column"
            alignItems={fullScreen ? "stretch" : "center"}
            justifyContent={centered ? "center" : "flex-start"}
            paddingVertical={fullScreen ? 0 : (yOffset ?? "$xl")}
            paddingHorizontal={fullScreen ? 0 : (xOffset ?? "$xl")}
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
              axis="y"
              sign={-1}
              style={dragHostStyle}
              pointerEvents="box-none"
            >
              {modalContent}
            </DragDismissHost>
          </Box>
        </GestureDetector>
      ) : (
        modalContent
      )}
    </ModalBase>
  );
});

export const Modal = withStaticProperties(ModalBaseComponent, {
  Content: ModalContentFrame,
  Header: ModalHeader,
  Title: ModalTitle,
  Body: ModalBody,
  /** The header close control — re-exported for the compound API. */
  CloseButton,
});

export type ModalContentProps = GetProps<typeof ModalContentFrame>;
export type ModalHeaderProps = GetProps<typeof ModalHeader>;
export type ModalTitleProps = GetProps<typeof ModalTitle>;
export type ModalBodyProps = GetProps<typeof ModalBody>;
