import * as React from "react";
import { Gesture } from "react-native-gesture-handler";
import { useSharedValue } from "react-native-reanimated";

import { KeyboardAvoidingView, Portal, UnstyledButton } from "@knitui/components";
import {
  type GetProps,
  isWeb,
  type LayoutChangeEvent,
  Theme,
  useThemeName,
  withStaticProperties,
} from "@knitui/core";
import { useFocusTrap, useUncontrolled } from "@knitui/hooks";

import {
  SheetFooter,
  type SheetFrame,
  SheetHandleBar,
  SheetHandleRow,
  SheetHeader,
  SheetSlots,
  SheetStylesProvider,
  useSheetSlots,
} from "./chrome";
import type { SettleResult } from "./engine";
import { useSharedValueListener } from "./hooks/useSharedValueListener";
import { useSheetDrag } from "./input/useSheetDrag";
import { useSheetMotion } from "./motion/useSheetMotion";
import type { SheetProps, SheetRef } from "./types";
import { SheetScrollContext, type SheetScrollContextValue } from "./view/scrollContext";
import { SheetScrollView } from "./view/ScrollView";
import { Surface } from "./view/Surface";

const DEFAULT_SNAP_POINTS = [80, 10];

function SheetInner(props: SheetProps, ref: React.Ref<SheetRef>) {
  const {
    opened,
    defaultOpened,
    onClose,
    position: positionProp,
    defaultPosition,
    onPositionChange,
    snapPoints = DEFAULT_SNAP_POINTS,
    dismissOnOverlayPress = true,
    dismissOnSnapToBottom = false,
    closeOnEscape = true,
    disableDrag = false,
    modal = true,
    withOverlay = true,
    withHandle = true,
    animationConfig,
    moveOnKeyboardChange = false,
    disableRemoveScroll = false,
    trapFocus = true,
    returnFocus = true,
    zIndex = 200,
    size,
    overlayProps,
    styles,
    style,
    testID,
    children,
  } = props;

  /* ── Controlled / uncontrolled state ──────────────────────────────────── */

  const [isOpen, setOpen] = useUncontrolled<boolean>({
    value: opened,
    defaultValue: defaultOpened,
    finalValue: false,
    onChange: (o) => {
      if (!o) onClose?.();
    },
  });
  const [position, setPosition, positionControlled] = useUncontrolled<number>({
    value: positionProp,
    defaultValue: defaultPosition,
    finalValue: 0,
    onChange: onPositionChange,
  });

  // The state setters get a fresh identity each render; read them through refs so
  // the motion controller, gesture, and effects stay stable.
  const setOpenRef = React.useRef(setOpen);
  setOpenRef.current = setOpen;
  const setPositionRef = React.useRef(setPosition);
  setPositionRef.current = setPosition;
  const positionRef = React.useRef(position);
  positionRef.current = position;
  // The snap index a fresh open should land on, and whether `position` is
  // controlled (then the parent owns it — we never reset it ourselves).
  const defaultIndexRef = React.useRef(defaultPosition ?? 0);
  defaultIndexRef.current = defaultPosition ?? 0;
  const positionControlledRef = React.useRef(positionControlled);
  positionControlledRef.current = positionControlled;

  const requestClose = React.useCallback(() => setOpenRef.current(false), []);
  const commitPosition = React.useCallback((i: number) => setPositionRef.current(i), []);

  /* ── Mount / close lifecycle state ────────────────────────────────────── */

  // Mount on open; the close animation plays out before the unmount.
  const [mounted, setMounted] = React.useState(isOpen);
  const didOpenRef = React.useRef(false);
  const wasOpenRef = React.useRef(isOpen);
  // True between a close request and the panel reaching the closed position.
  // Gates `finishClose` so a stray offset write (re-open, a drag, an interrupted
  // spring) can never tear down a sheet that is meant to stay up.
  const closingRef = React.useRef(false);
  const isOpenRef = React.useRef(isOpen);
  isOpenRef.current = isOpen;

  // Tear the panel down once it has finished closing. Idempotent and guarded by
  // `closingRef`, so it can be driven from BOTH the close spring's settle
  // callback and the offset listener below — whichever fires first wins, and a
  // dropped spring callback (interrupted animation) can no longer strand the
  // panel on screen.
  const finishClose = React.useCallback(() => {
    if (!closingRef.current) return;
    closingRef.current = false;
    setMounted(false);
  }, []);

  // Stabilise the snap-points array by content so geometry isn't recomputed on
  // every render when the prop is an inline literal.
  const snapKey = snapPoints.join(",");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableSnapPoints = React.useMemo(() => snapPoints, [snapKey]);

  /* ── Measurement ──────────────────────────────────────────────────────── */

  const [maxHeight, setMaxHeight] = React.useState(0);
  const onLayout = React.useCallback((e: LayoutChangeEvent) => {
    const h = Math.round(e.nativeEvent.layout.height);
    if (h > 0) setMaxHeight((prev) => (prev === h ? prev : h));
  }, []);

  // Web measurement fallback: Tamagui's `onLayout` on a `position:fixed` portal
  // layer reports 0 on web (it fires before the fixed box resolves and doesn't
  // re-fire), so the full-cover layer's height is the viewport height. Native
  // `onLayout` above is reliable and stays the source of truth there.
  React.useEffect(() => {
    if (!isWeb || typeof window === "undefined") return undefined;
    const update = () => {
      const h = Math.round(window.innerHeight);
      if (h > 0) setMaxHeight((prev) => (prev === h ? prev : h));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* ── Motion + gesture ─────────────────────────────────────────────────── */

  const motion = useSheetMotion({
    snapPoints: stableSnapPoints,
    maxHeight,
    animationConfig,
    dismissOnSnapToBottom,
    setPosition: commitPosition,
    requestClose,
  });
  const motionRef = React.useRef(motion);
  motionRef.current = motion;

  // Scroll↔drag handoff plumbing (native): a nested `Sheet.ScrollView` attaches
  // this `Native` gesture to its scroller (so it recognises simultaneously with
  // the Pan) and reports its live content offset back through `scrollOffsetY`.
  // Both are stable; on web the browser handles nested scroll, so the Pan is left
  // unaware of them (no coordination, current behaviour preserved).
  const scrollOffsetY = useSharedValue(0);

  const scrollGesture = React.useMemo(() => Gesture.Native(), []);
  const dragEnabled = !disableDrag && maxHeight > 0 && isOpen;

  const draggingRef = React.useRef(false);
  const onDragStart = React.useCallback(() => {
    draggingRef.current = true;
  }, []);
  // A scroll-owned drag released without settling the panel — just clear the pause.
  const onScrollRelease = React.useCallback(() => {
    draggingRef.current = false;
  }, []);
  const onDragSettle = React.useCallback(
    (result: SettleResult) => {
      draggingRef.current = false;
      // Closed out from under the drag (closed externally mid-drag, or the OS
      // cancelled the gesture so `onFinalize` re-settled to a visible snap):
      // never re-park on screen — drive the panel home to the closed position.
      if (!isOpenRef.current) {
        closingRef.current = true;
        motionRef.current.animateClose(finishClose);
        return;
      }
      motionRef.current.handleSettle(result);
    },
    [finishClose],
  );

  const gesture = useSheetDrag({
    offset: motion.offset,
    offsets: motion.offsets,
    closed: motion.closed,
    dismissible: motion.dismissible,
    // Drop the gesture the moment the sheet is no longer open, so a stray touch
    // during the close animation can't `cancelAnimation` the close spring and
    // re-park the panel at a visible snap (the panel would then never unmount).
    enabled: dragEnabled,
    spring: animationConfig,
    // Coordinate with a nested `Sheet.ScrollView` on native only; on web the
    // browser owns nested scrolling, so leave the Pan unaware (unchanged path).
    scrollGesture: isWeb ? undefined : scrollGesture,
    scrollOffsetY: isWeb ? undefined : scrollOffsetY,
    onStart: onDragStart,
    onSettle: onDragSettle,
    onScrollRelease,
  });

  // The channel a nested `Sheet.ScrollView` reads to cooperate with the Pan.
  const scrollContext = React.useMemo<SheetScrollContextValue>(
    () => ({
      scrollGesture,
      scrollOffsetY,
      sheetOffset: motion.offset,
      expandedOffset: motion.offsets.length > 0 ? motion.offsets[0] : 0,
      handoffEnabled: dragEnabled,
    }),
    [scrollGesture, scrollOffsetY, motion.offset, motion.offsets, dragEnabled],
  );

  /* ── Open / close lifecycle ───────────────────────────────────────────── */

  // Mount on open; play the slide-out then unmount on close.
  React.useEffect(() => {
    const was = wasOpenRef.current;
    if (was === isOpen) return;
    wasOpenRef.current = isOpen;
    if (isOpen) {
      closingRef.current = false;
      setMounted(true);
    } else {
      closingRef.current = true;
      didOpenRef.current = false;
      motionRef.current.animateClose(finishClose);
      // Uncontrolled: forget the snap the user dragged/cycled to so the NEXT open
      // starts at the initial snap, not wherever it was left (e.g. the lowest).
      // Done on the close *request* (not on animation completion) so it is
      // deterministic. Controlled position is the parent's to manage.
      if (!positionControlledRef.current && positionRef.current !== defaultIndexRef.current) {
        setPositionRef.current(defaultIndexRef.current);
      }
    }
  }, [isOpen, finishClose]);

  // Robust unmount: the close spring's `finished` callback is silently dropped
  // when the animation is interrupted, which would otherwise strand the panel
  // on-screen. So also tear down the instant the panel reaches the closed
  // (off-screen) position — gated by `closingRef`, since opening seeds the
  // offset at `closed` too.
  useSharedValueListener(motion.offset, (v) => {
    if (closingRef.current && v >= motion.closed - 1) finishClose();
  });

  // Run the open animation once mounted AND measured; re-settle to the current
  // snap when the geometry changes (rotation / resize) while already open.
  React.useEffect(() => {
    if (!mounted || !isOpen || maxHeight <= 0) return;
    if (!didOpenRef.current) {
      didOpenRef.current = true;
      motionRef.current.openFromClosed(positionRef.current);
    } else if (!draggingRef.current) {
      motionRef.current.glideTo(positionRef.current);
    }
  }, [mounted, isOpen, maxHeight]);

  // External `position` change while open → glide to it (no state write-back).
  React.useEffect(() => {
    if (didOpenRef.current && !draggingRef.current) {
      motionRef.current.glideTo(position);
    }
  }, [position]);

  /* ── Web side effects: Escape + body scroll-lock ──────────────────────── */

  React.useEffect(() => {
    if (!mounted || typeof document === "undefined") return undefined;
    const onKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === "Escape" && !e.defaultPrevented) setOpenRef.current(false);
    };
    document.addEventListener("keydown", onKeyDown);
    const prevOverflow = document.body.style.overflow;
    if (!disableRemoveScroll) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (!disableRemoveScroll) document.body.style.overflow = prevOverflow;
    };
  }, [mounted, closeOnEscape, disableRemoveScroll]);

  /* ── Web return-focus ─────────────────────────────────────────────────── */

  // Capture the focused element on the opening edge DURING render — the focus
  // trap (an effect) moves focus into the panel before our effects run.
  const wasOpenForFocusRef = React.useRef(false);
  const prevFocusRef = React.useRef<HTMLElement | null>(null);
  if (isOpen && !wasOpenForFocusRef.current && typeof document !== "undefined") {
    prevFocusRef.current = returnFocus ? (document.activeElement as HTMLElement | null) : null;
  }
  wasOpenForFocusRef.current = isOpen;
  React.useEffect(() => {
    if (!isOpen) return undefined;
    return () => {
      if (returnFocus) prevFocusRef.current?.focus?.();
    };
  }, [isOpen, returnFocus]);

  const trapRef = useFocusTrap(mounted && trapFocus);
  const themeName = useThemeName();

  /* ── Imperative handle ────────────────────────────────────────────────── */

  React.useImperativeHandle(
    ref,
    () => ({
      open: () => setOpenRef.current(true),
      close: () => setOpenRef.current(false),
      snapTo: (i: number) => motionRef.current.snapTo(i),
    }),
    [],
  );

  /* ── Slots + chrome ───────────────────────────────────────────────────── */

  const s = useSheetSlots(styles);
  const slots = SheetSlots.collect(children, { displayName: "Sheet" });

  const frameContent = slots.Frame ? slots.Frame.children : slots.default;
  const keyboardAware = moveOnKeyboardChange ? (
    <KeyboardAvoidingView>{frameContent}</KeyboardAvoidingView>
  ) : (
    frameContent
  );
  // Publish the scroll-coordination channel so a nested `Sheet.ScrollView` can
  // hand its drag off to (and back from) the sheet Pan.
  const content = (
    <SheetScrollContext.Provider value={scrollContext}>{keyboardAware}</SheetScrollContext.Provider>
  );

  // Web a11y rides on `role`/`aria-modal`; native on `accessibilityViewIsModal`.
  // Neither is in `SheetFrame`'s style-prop types, so cast the a11y bag once.
  const a11y = (
    isWeb ? { role: "dialog", "aria-modal": modal } : { accessibilityViewIsModal: modal }
  ) as GetProps<typeof SheetFrame>;
  const rootProps: GetProps<typeof SheetFrame> = {
    size,
    // `shadow` is Box's inherited elevation variant (cross-platform boxShadow,
    // theme-aware — repo memory `box-shadow-polyfill`); lifts the panel off the
    // page. A default here so `styles.root` / inline can still override it.
    shadow: "lg",
    ...a11y,
    ...s.get("root"),
    ...slots.Frame?.props,
    style,
  };

  const showHandle = slots.Handle !== undefined || withHandle;
  const handleNode = showHandle ? (
    <UnstyledButton
      onPress={() => motionRef.current.cycle(positionRef.current)}
      {...(isWeb
        ? { "aria-label": "Sheet drag handle" }
        : { accessibilityLabel: "Sheet drag handle" })}
    >
      <SheetHandleRow>
        <SheetHandleBar {...s.get("handle")} {...slots.Handle?.props} />
      </SheetHandleRow>
    </UnstyledButton>
  ) : null;

  // A fixed header, rendered inside the panel below the handle and above the
  // (scrollable) content — a `Sheet.ScrollView` with `flex: 1` fills the space
  // beneath it. Rendered only when a `Sheet.Header` marker is present.
  const headerNode =
    slots.Header !== undefined ? (
      <SheetHeader {...s.get("header")} {...slots.Header.props}>
        {slots.Header.children}
      </SheetHeader>
    ) : null;

  // A fixed footer, pinned below the (scrollable) content — a good home for an
  // action bar. Rendered only when a `Sheet.Footer` marker is present.
  const footerNode =
    slots.Footer !== undefined ? (
      <SheetFooter {...s.get("footer")} {...slots.Footer.props}>
        {slots.Footer.children}
      </SheetFooter>
    ) : null;

  const onOverlayPress = dismissOnOverlayPress ? () => setOpenRef.current(false) : undefined;
  const resolvedOverlayProps = { ...s.get("overlay"), ...overlayProps };

  /* ── Render ───────────────────────────────────────────────────────────── */

  if (!mounted) return null;

  const layer = (
    <Theme name={themeName}>
      <SheetStylesProvider value={styles}>
        <Surface
          ref={trapRef}
          testID={testID}
          offset={motion.offset}
          fadeStart={motion.fadeStart}
          closed={motion.closed}
          overlayMaxOpacity={1}
          gesture={gesture}
          zIndex={zIndex}
          withOverlay={withOverlay}
          overlayProps={resolvedOverlayProps}
          onOverlayPress={onOverlayPress}
          rootProps={rootProps}
          handle={handleNode}
          header={headerNode}
          footer={footerNode}
          onLayout={onLayout}
        >
          {content}
        </Surface>
      </SheetStylesProvider>
    </Theme>
  );

  return modal ? <Portal hostName="root">{layer}</Portal> : layer;
}

const SheetComponent = React.forwardRef(SheetInner);
SheetComponent.displayName = "Sheet";

/**
 * Cross-platform bottom sheet. Marker slots (`Sheet.Overlay` / `.Handle` /
 * `.Header` / `.Footer` / `.Frame`) are the composition API; `Sheet.ScrollView`
 * is the scrollable content region. `Sheet.Header` / `Sheet.Footer` are fixed
 * regions pinned above / below the content, so a `Sheet.ScrollView` scrolls
 * between them. The styled parts are the targets of the `styles` map.
 */
export const Sheet = withStaticProperties(SheetComponent, {
  ...SheetSlots.markers, // Overlay, Handle, Header, Footer, Frame (marker slots)
  ScrollView: SheetScrollView,
});
