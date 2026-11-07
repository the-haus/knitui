import * as React from "react";
import { useSharedValue } from "react-native-reanimated";

import { CloseButton, OverlayPortal, UnstyledButton, useOverlayHost } from "@knitui/components";
import { type GetProps, isWeb, type LayoutChangeEvent, Theme, useThemeName } from "@knitui/core";
import { useFocusTrap, useId } from "@knitui/hooks";

import {
  SheetBody,
  SheetFooter,
  type SheetFrame,
  SheetHandleBar,
  SheetHandleRow,
  SheetHeader,
  type SheetRest,
  SheetSlots,
  SheetStylesProvider,
  SheetTitle,
  SheetTitleRow,
  useSheetSlots,
} from "./chrome";
import {
  clampSnapIndex,
  fitOffset,
  keyboardLift,
  nearestSnapIndex,
  resolveMaxPanelHeight,
  type SettleResult,
} from "./engine";
import { hasOpenSheet, isTopSheet, lockBodyScroll, pushSheet } from "./engine/stack";
import { useSharedValueListener } from "./hooks/useSharedValueListener";
import { useStableRecord } from "./hooks/useStableRecord";
import { useBackPress } from "./input/useBackPress";
import { useSheetDrag } from "./input/useSheetDrag";
import { useSheetMotion } from "./motion/useSheetMotion";
import type { SheetProps } from "./types";
import { KeyboardBridge } from "./view/KeyboardBridge";
import { SheetScrollContext, type SheetScrollContextValue } from "./view/scrollContext";
import { Surface } from "./view/Surface";
import { useLayerBottomGap } from "./view/useLayerBottomGap";
import { useSafeInsets } from "./view/useSafeInsets";

const DEFAULT_SNAP_POINTS = [80, 10];

/** Least gap kept above a panel squeezed by the keyboard, or capped in fit mode. */
const MIN_TOP_GAP = 16;

/** Spare frame below the panel, so a spring overshoot never shows the page under it. */
const OVERSHOOT_SKIRT = 96;

/** The handle's accessible name, per platform (hoisted: one object). */
const HANDLE_A11Y = isWeb
  ? { "aria-label": "Sheet drag handle" }
  : { accessibilityLabel: "Sheet drag handle" };

export interface SheetPanelHandle {
  snapTo: (index: number) => void;
}

export interface SheetPanelProps extends SheetProps {
  isOpen: boolean;
  position: number;
  positionControlled: boolean;
  commitPosition: (index: number) => void;
  requestClose: () => void;
  /** The close animation finished, so the panel can leave the tree. */
  onClosed: () => void;
}

/**
 * The sheet while it is on screen. Holds everything that costs: the gesture, the
 * shared values, the listeners. `Sheet` mounts it on open and drops it once the close
 * animation lands.
 */
export const SheetPanel = React.forwardRef<SheetPanelHandle, SheetPanelProps>(
  function SheetPanel(props, ref) {
    const {
      isOpen,
      position,
      positionControlled,
      commitPosition,
      requestClose,
      onClosed,
      defaultPosition,
      snapPoints = DEFAULT_SNAP_POINTS,
      maxHeight: maxHeightProp,
      maxWidth,
      dismissOnOverlayPress = true,
      dismissOnSnapToBottom = false,
      closeOnEscape = true,
      closeOnBackPress = true,
      disableDrag = false,
      modal = true,
      withOverlay = true,
      withHandle = true,
      animationConfig,
      moveOnKeyboardChange = modal,
      disableRemoveScroll = false,
      trapFocus = true,
      zIndex = 200,
      size,
      overlayProps,
      styles,
      style,
      testID,
      children,
      title,
      withCloseButton = title !== undefined,
      closeButtonProps,
      padded = false,
      bottomInset: bottomInsetProp,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledBy,
    } = props;

    const fit = snapPoints === "fit";
    const snapCount = fit ? 1 : snapPoints.length;

    // Read through refs so the motion controller, gesture, and effects stay stable.
    const positionRef = React.useRef(position);
    positionRef.current = position;
    const defaultIndexRef = React.useRef(defaultPosition ?? 0);
    defaultIndexRef.current = defaultPosition ?? 0;
    const positionControlledRef = React.useRef(positionControlled);
    positionControlledRef.current = positionControlled;
    const isOpenRef = React.useRef(isOpen);
    isOpenRef.current = isOpen;

    /* ── Close lifecycle state ────────────────────────────────────────────── */

    const didOpenRef = React.useRef(false);
    // True between a close request and the panel reaching the closed position.
    // Gates `finishClose` so a stray offset write (re-open, a drag, an interrupted
    // spring) can never tear down a sheet that is meant to stay up.
    const closingRef = React.useRef(false);
    // UI-thread twin of `closingRef`: the offset watcher runs on the UI thread, where a
    // worklet can't read a JS ref, instead of waking the JS thread every frame.
    const closingSV = useSharedValue(false);
    const setClosing = React.useCallback(
      (value: boolean) => {
        closingRef.current = value;
        closingSV.value = value;
      },
      [closingSV],
    );

    // Idempotent and guarded by `closingRef`, so it can be driven from BOTH the close
    // spring's settle callback and the offset listener below: a dropped spring callback
    // (interrupted animation) can no longer strand the panel on screen.
    const finishClose = React.useCallback(() => {
      if (!closingRef.current) return;
      setClosing(false);
      onClosed();
    }, [setClosing, onClosed]);

    // Stabilise the snap points by content, so an inline literal doesn't recompute the
    // geometry on every render.
    const snapKey = fit ? "fit" : snapPoints.join(",");
    const stableSnapPoints = React.useMemo(
      () => (fit ? [] : (snapPoints as number[])),
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [snapKey],
    );

    // Same for the spring config: it is a dependency of the Pan's config, and a fresh
    // identity there re-pushes that config to the native handler on every render.
    const stableAnimationConfig = useStableRecord(animationConfig);

    /* ── Measurement ──────────────────────────────────────────────────────── */

    const [viewportHeight, setViewportHeight] = React.useState(0);
    const [measuredGap, measureBottomGap] = useLayerBottomGap();
    // A modal sheet is teleported to the root host, so its layer ends at the window's
    // bottom. `measureInWindow` walks the sheet's React position instead, which reads
    // the scroll offset of a list it was opened from as a gap: the panel stopped short
    // of the keyboard by that much and its composer sat behind it.
    const bottomGap = modal ? 0 : measuredGap;
    const onLayout = React.useCallback(
      (e: LayoutChangeEvent) => {
        const h = Math.round(e.nativeEvent.layout.height);
        if (h > 0) setViewportHeight((prev) => (prev === h ? prev : h));
        measureBottomGap(e);
      },
      [measureBottomGap],
    );

    // Web measurement fallback: Tamagui's `onLayout` on a `position:fixed` portal layer
    // reports 0 on web, so the full-cover layer's height is the viewport height.
    React.useEffect(() => {
      if (!isWeb || typeof window === "undefined") return undefined;
      const update = () => {
        const h = Math.round(window.innerHeight);
        if (h > 0) setViewportHeight((prev) => (prev === h ? prev : h));
      };
      update();
      window.addEventListener("resize", update);
      return () => window.removeEventListener("resize", update);
    }, []);

    const [contentHeight, setContentHeight] = React.useState(0);
    const onRestLayout = React.useCallback((e: LayoutChangeEvent) => {
      const h = Math.round(e.nativeEvent.layout.height);
      if (h > 0) setContentHeight((prev) => (prev === h ? prev : h));
    }, []);

    const [footerHeight, setFooterHeight] = React.useState(0);
    const onFooterLayout = React.useCallback((e: LayoutChangeEvent) => {
      const h = Math.round(e.nativeEvent.layout.height);
      setFooterHeight((prev) => (prev === h ? prev : h));
    }, []);

    const insets = useSafeInsets(bottomInsetProp);
    const bottomInset = insets.bottom;
    const topGap = Math.max(insets.top, MIN_TOP_GAP);
    const maxPanelHeight =
      maxHeightProp === undefined
        ? Math.max(0, viewportHeight - topGap)
        : resolveMaxPanelHeight(maxHeightProp, viewportHeight);
    const fixedOffsets = React.useMemo(() => {
      if (!fit) return undefined;
      if (contentHeight <= 0 || viewportHeight <= 0) return [];
      return [fitOffset(contentHeight, viewportHeight, maxPanelHeight)];
    }, [fit, contentHeight, viewportHeight, maxPanelHeight]);

    /* ── Motion + gesture ─────────────────────────────────────────────────── */

    const motion = useSheetMotion({
      snapPoints: stableSnapPoints,
      fixedOffsets,
      maxHeight: viewportHeight,
      animationConfig: stableAnimationConfig,
      dismissOnSnapToBottom,
      setPosition: commitPosition,
      requestClose,
    });
    const motionRef = React.useRef(motion);
    motionRef.current = motion;
    const { offset, offsets } = motion;

    const keyboard = useSharedValue(0);
    const [keyboardSettled, setKeyboardSettled] = React.useState(0);
    const scrollers = useSharedValue(0);
    const scrollOffsetY = useSharedValue(0);
    const panActive = useSharedValue(false);
    const dragEnabled = !disableDrag && viewportHeight > 0 && isOpen;

    /* ── Where the panel ends ─────────────────────────────────────────────── */

    // The rest box ends at the resting snap, and that height changes only between
    // moves. It grows before the panel rises, so a list is never short of the panel, and
    // shrinks only once the panel has landed, so no gap opens above the footer on the way.
    const restIndex = clampSnapIndex(position, offsets.length);
    const restTarget = offsets.length > 0 ? viewportHeight - offsets[restIndex] : 0;
    const tallest = offsets.length > 0 ? viewportHeight - offsets[0] : 0;
    const [restHeight, setRestHeight] = React.useState(0);
    const restTargetRef = React.useRef(restTarget);
    restTargetRef.current = restTarget;
    const viewportRef = React.useRef(viewportHeight);
    viewportRef.current = viewportHeight;
    const tallestRef = React.useRef(tallest);
    tallestRef.current = tallest;
    const arrivingAt = useSharedValue(-1);

    const landRest = React.useCallback(() => {
      arrivingAt.value = -1;
      setRestHeight(restTargetRef.current);
    }, [arrivingAt]);
    const settleRest = React.useCallback(() => {
      const target = restTargetRef.current;
      setRestHeight((current) => {
        if (target >= current) return target;
        const goal = viewportRef.current - target;
        if (Math.abs(offset.value - goal) < 1) return target;
        arrivingAt.value = goal;
        return current;
      });
    }, [arrivingAt, offset]);
    const hasArrived = React.useCallback(
      (v: number) => {
        "worklet";
        return arrivingAt.value >= 0 && Math.abs(v - arrivingAt.value) < 1;
      },
      [arrivingAt],
    );
    useSharedValueListener(offset, landRest, hasArrived);

    const draggingRef = React.useRef(false);
    React.useEffect(() => {
      if (!draggingRef.current) settleRest();
    }, [restTarget, settleRest]);

    // Handle-press guard. A mouse drag that starts on the handle ends with a `click` on
    // it, which would cycle the detent once more after the drag settled. Raised when a
    // drag activates, lowered one task after it ends: the trailing `click` of that same
    // pointer cycle is still swallowed, a later tap or keyboard activation is not.
    const suppressHandlePressRef = React.useRef(false);
    const releaseTimerRef = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    const releaseHandlePress = React.useCallback(() => {
      clearTimeout(releaseTimerRef.current);
      releaseTimerRef.current = setTimeout(() => {
        suppressHandlePressRef.current = false;
      }, 0);
    }, []);
    React.useEffect(() => () => clearTimeout(releaseTimerRef.current), []);
    const onDragStart = React.useCallback(() => {
      draggingRef.current = true;
      clearTimeout(releaseTimerRef.current);
      suppressHandlePressRef.current = true;
      // A drag can reveal the panel up to its tallest snap.
      arrivingAt.value = -1;
      setRestHeight((current) => Math.max(current, tallestRef.current));
    }, [arrivingAt]);
    // A drag the list ended up owning: no settle, because the list keeps its momentum.
    // The panel may still have travelled first, all the way up to where the list took
    // over, so the snap it reached has to be committed here.
    const onScrollRelease = React.useCallback(() => {
      draggingRef.current = false;
      releaseHandlePress();
      const current = motionRef.current;
      const index = nearestSnapIndex(offset.value, current.offsets);
      if (index !== positionRef.current) commitPosition(index);
      settleRest();
    }, [releaseHandlePress, settleRest, offset, commitPosition]);
    const onDragSettle = React.useCallback(
      (result: SettleResult) => {
        draggingRef.current = false;
        releaseHandlePress();
        // Closed out from under the drag (closed externally mid-drag, or the OS
        // cancelled the gesture so `onFinalize` re-settled to a visible snap):
        // never re-park on screen; drive the panel home to the closed position.
        if (!isOpenRef.current) {
          setClosing(true);
          motionRef.current.animateClose(finishClose);
          return;
        }
        motionRef.current.handleSettle(result);
        settleRest();
        // A controlled parent may refuse the snap: the panel follows `position`, not the
        // finger. Checked a task later, once a parent that accepted it has re-rendered.
        setTimeout(() => {
          const refused = positionControlledRef.current && positionRef.current !== result.index;
          if (refused && !result.dismiss && isOpenRef.current && !draggingRef.current) {
            motionRef.current.glideTo(positionRef.current);
          }
        }, 0);
      },
      [finishClose, setClosing, releaseHandlePress, settleRest],
    );

    const gesture = useSheetDrag({
      offset,
      offsets,
      closed: motion.closed,
      dismissible: motion.dismissible,
      // Drop the gesture the moment the sheet is no longer open, so a stray touch during
      // the close animation can't cancel the close spring and re-park the panel.
      enabled: dragEnabled,
      spring: stableAnimationConfig,
      // On web the browser owns nested scrolling, so the Pan stays unaware of it.
      scrollers: isWeb ? undefined : scrollers,
      scrollOffsetY: isWeb ? undefined : scrollOffsetY,
      panActive,
      onStart: onDragStart,
      onSettle: onDragSettle,
      onScrollRelease,
    });

    // The channel a nested scroller reads to cooperate with the Pan.
    const scrollContext = React.useMemo<SheetScrollContextValue>(
      () => ({
        panGesture: gesture,
        scrollers,
        scrollOffsetY,
        sheetOffset: offset,
        panActive,
        offsets,
        expandedOffset: offsets.length > 0 ? offsets[0] : 0,
        closed: motion.closed,
        dismissible: motion.dismissible,
        spring: stableAnimationConfig,
        handoffEnabled: dragEnabled,
        onSettle: onDragSettle,
        fit,
      }),
      [
        gesture,
        scrollers,
        scrollOffsetY,
        offset,
        panActive,
        offsets,
        motion.closed,
        motion.dismissible,
        stableAnimationConfig,
        dragEnabled,
        onDragSettle,
        fit,
      ],
    );

    /* ── Open / close lifecycle ───────────────────────────────────────────── */

    // Play the slide-out on close; a re-open mid-close glides back from where it is.
    const wasOpenRef = React.useRef(isOpen);
    React.useEffect(() => {
      const was = wasOpenRef.current;
      if (was === isOpen) return;
      wasOpenRef.current = isOpen;
      if (isOpen) {
        setClosing(false);
      } else {
        setClosing(true);
        motionRef.current.animateClose(finishClose);
        // Uncontrolled: forget the snap the user dragged to, so the NEXT open starts at
        // the initial snap. Controlled position is the parent's to manage.
        if (!positionControlledRef.current && positionRef.current !== defaultIndexRef.current) {
          commitPosition(defaultIndexRef.current);
        }
      }
    }, [isOpen, finishClose, setClosing, commitPosition]);

    // A panel closed before it ever measured has nothing to animate, so it leaves at once.
    React.useEffect(() => {
      if (!isOpen && !didOpenRef.current) finishClose();
    }, [isOpen, finishClose]);

    // Robust unmount: the close spring's `finished` callback is silently dropped when the
    // animation is interrupted, so also tear down the instant the panel reaches the closed
    // position, gated by `closingSV`, since opening seeds the offset at `closed` too. A
    // FILTER, evaluated where the offset lives, so only the interesting value crosses to JS.
    const closedTarget = motion.closed - 1;
    const isFullyClosed = React.useCallback(
      (v: number) => {
        "worklet";
        return closingSV.value && v >= closedTarget;
      },
      [closingSV, closedTarget],
    );
    useSharedValueListener(offset, finishClose, isFullyClosed);

    // Open once measured; after that, re-settle whenever the geometry changes, whether
    // from rotation, new snap points, or fit content changing height.
    React.useEffect(() => {
      if (!isOpen || viewportHeight <= 0 || offsets.length === 0) return;
      if (!didOpenRef.current) {
        didOpenRef.current = true;
        motionRef.current.openFromClosed(positionRef.current);
      } else if (!draggingRef.current) {
        motionRef.current.glideTo(positionRef.current);
      }
    }, [isOpen, viewportHeight, offsets]);

    // External `position` change while open → glide to it (no state write-back).
    React.useEffect(() => {
      if (didOpenRef.current && !draggingRef.current && isOpenRef.current) {
        motionRef.current.glideTo(position);
      }
    }, [position]);

    // Snap points removed from under the current position: land on the nearest one.
    React.useEffect(() => {
      if (positionControlledRef.current || offsets.length === 0) return;
      const clamped = clampSnapIndex(positionRef.current, offsets.length);
      if (clamped !== positionRef.current) commitPosition(clamped);
    }, [offsets, commitPosition]);

    /* ── Dismiss keys + body scroll-lock ──────────────────────────────────── */

    const [stackId] = React.useState(() => Symbol("sheet"));
    React.useEffect(() => {
      if (!isOpen || !modal) return undefined;
      return pushSheet(stackId);
    }, [isOpen, modal, stackId]);

    useBackPress(isOpen && modal && closeOnBackPress, () => {
      if (!isTopSheet(stackId)) return false;
      requestClose();
      return true;
    });

    React.useEffect(() => {
      if (typeof document === "undefined") return undefined;
      const onKeyDown = (e: KeyboardEvent) => {
        if (!closeOnEscape || e.key !== "Escape" || e.defaultPrevented) return;
        if (modal ? isTopSheet(stackId) : !hasOpenSheet()) requestClose();
      };
      document.addEventListener("keydown", onKeyDown);
      return () => document.removeEventListener("keydown", onKeyDown);
    }, [closeOnEscape, modal, requestClose, stackId]);

    // A persistent sheet sits beside the page, so the page keeps scrolling behind it.
    React.useEffect(() => {
      if (!isOpen || !modal || disableRemoveScroll) return undefined;
      return lockBodyScroll();
    }, [isOpen, modal, disableRemoveScroll]);

    const trapRef = useFocusTrap(isOpen && trapFocus);
    const themeName = useThemeName();
    // The nearest scoped `OverlayHost` (a native modal screen), else "root".
    const overlayHost = useOverlayHost();

    React.useImperativeHandle(ref, () => ({ snapTo: (i) => motionRef.current.snapTo(i) }), []);

    /* ── Slots + chrome ───────────────────────────────────────────────────── */

    const s = useSheetSlots(styles);
    const slots = SheetSlots.collect(children, { displayName: "Sheet" });
    const titleId = useId();
    const hasTitleRow = title !== undefined || withCloseButton;

    const frameContent = slots.Frame ? slots.Frame.children : slots.default;
    const content = (
      <SheetScrollContext.Provider value={scrollContext}>
        <SheetBody fit={fit} padded={padded} {...s.get("body")}>
          {frameContent}
        </SheetBody>
      </SheetScrollContext.Provider>
    );

    // A modal sheet is a dialog; a non-modal one is a persistent panel beside the page
    // (WAI-ARIA: a named `region` landmark, never a dialog), and an unnamed region is not
    // a landmark, so it then has no role. `aria-label` wins over the title it can replace.
    const labelledBy =
      ariaLabelledBy ?? (ariaLabel === undefined && title !== undefined ? titleId : undefined);
    const nativeLabel = ariaLabel ?? (typeof title === "string" ? title : undefined);
    const named = ariaLabel !== undefined || labelledBy !== undefined;
    const a11y = (
      isWeb
        ? {
            ...(modal ? { role: "dialog", "aria-modal": true } : named ? { role: "region" } : null),
            ...(ariaLabel !== undefined ? { "aria-label": ariaLabel } : null),
            ...(labelledBy !== undefined ? { "aria-labelledby": labelledBy } : null),
          }
        : {
            accessibilityViewIsModal: modal,
            ...(nativeLabel !== undefined ? { accessibilityLabel: nativeLabel } : null),
          }
    ) as GetProps<typeof SheetFrame>;
    const rootProps: GetProps<typeof SheetFrame> = {
      size,
      // `shadow` is Box's inherited elevation variant; lifts the panel off the page. A
      // default here so `styles.root` / inline can still override it.
      shadow: "lg",
      height: tallest > 0 ? tallest + OVERSHOOT_SKIRT : "100%",
      ...a11y,
      ...s.get("root"),
      ...slots.Frame?.props,
      style,
    };

    const onHandlePress = React.useCallback(() => {
      // The click that ends a drag begun on the handle is not a press.
      if (suppressHandlePressRef.current) return;
      motionRef.current.cycle(positionRef.current);
    }, []);
    const showHandle = slots.Handle !== undefined || withHandle;
    // With one snap there's nothing to cycle, so it's a drawn grabber, not a control.
    const handleBar = (
      <SheetHandleRow>
        <SheetHandleBar {...s.get("handle")} {...slots.Handle?.props} />
      </SheetHandleRow>
    );
    const handleNode = !showHandle ? null : snapCount > 1 ? (
      <UnstyledButton onPress={onHandlePress} {...HANDLE_A11Y}>
        {handleBar}
      </UnstyledButton>
    ) : (
      handleBar
    );

    const titleRow = hasTitleRow ? (
      <SheetTitleRow>
        {title !== undefined ? (
          <SheetTitle
            id={titleId}
            {...(isWeb ? null : { accessibilityRole: "header" })}
            {...s.get("title")}
          >
            {title}
          </SheetTitle>
        ) : null}
        {withCloseButton ? (
          <CloseButton
            aria-label="Close"
            marginLeft="auto"
            {...closeButtonProps}
            {...s.get("closeButton")}
            onPress={requestClose}
          />
        ) : null}
      </SheetTitleRow>
    ) : null;
    const headerNode =
      slots.Header !== undefined || hasTitleRow ? (
        <SheetHeader {...s.get("header")} {...slots.Header?.props}>
          {titleRow}
          {slots.Header?.children}
        </SheetHeader>
      ) : null;

    const hasFooter = slots.Footer !== undefined;
    const footerNode = hasFooter ? (
      <SheetFooter
        onLayout={onFooterLayout}
        paddingBottom={bottomInset as never}
        {...s.get("footer")}
        {...slots.Footer?.props}
      >
        {slots.Footer?.children}
      </SheetFooter>
    ) : null;

    const keyboardCap = Math.max(
      0,
      viewportHeight - keyboardLift(keyboardSettled, bottomGap) - topGap,
    );
    const restProps: GetProps<typeof SheetRest> = {
      paddingBottom: (hasFooter ? footerHeight : bottomInset) as never,
      ...(fit
        ? {
            onLayout: onRestLayout,
            ...(viewportHeight > 0
              ? {
                  maxHeight:
                    keyboardSettled > 0 ? Math.min(maxPanelHeight, keyboardCap) : maxPanelHeight,
                }
              : null),
          }
        : restHeight > 0
          ? { height: keyboardSettled > 0 ? Math.min(restHeight, keyboardCap) : restHeight }
          : null),
    };

    const onOverlayPress = dismissOnOverlayPress ? requestClose : undefined;
    const overlaySlot = s.get("overlay");
    const resolvedOverlayProps = React.useMemo(
      () => ({ ...overlaySlot, ...overlayProps }),
      [overlaySlot, overlayProps],
    );

    /* ── Render ───────────────────────────────────────────────────────────── */

    const layer = (
      <Theme name={themeName}>
        <SheetStylesProvider value={styles}>
          {moveOnKeyboardChange ? (
            <KeyboardBridge keyboard={keyboard} onSettled={setKeyboardSettled} />
          ) : null}
          <Surface
            ref={trapRef}
            testID={testID}
            offset={offset}
            keyboard={keyboard}
            viewportHeight={viewportHeight}
            bottomGap={bottomGap}
            topGap={topGap}
            maxWidth={maxWidth}
            fadeStart={motion.fadeStart}
            closed={motion.closed}
            overlayMaxOpacity={1}
            gesture={gesture}
            zIndex={zIndex}
            withOverlay={withOverlay}
            overlayProps={resolvedOverlayProps}
            onOverlayPress={onOverlayPress}
            rootProps={rootProps}
            restProps={restProps}
            handle={handleNode}
            header={headerNode}
            footer={footerNode}
            footerHeight={footerHeight}
            footerKeyboardSlide={typeof bottomInset === "number" ? bottomInset : 0}
            onLayout={onLayout}
          >
            {content}
          </Surface>
        </SheetStylesProvider>
      </Theme>
    );

    return modal ? <OverlayPortal hostName={overlayHost}>{layer}</OverlayPortal> : layer;
  },
);
SheetPanel.displayName = "SheetPanel";
