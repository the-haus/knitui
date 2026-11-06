import * as React from "react";

import { Overlay } from "@knitui/components";

import { SheetFill } from "../chrome";
import { footerTranslate, keyboardLift, overlayOpacity, panelFrame } from "../engine";
import { useSharedValueListener } from "../hooks/useSharedValueListener";
import type { AnimatedOverlayProps, FooterHostProps, FrameHostProps } from "./animated.types";

/**
 * Web animated hosts. Reanimated's `useAnimatedStyle` does not re-run on
 * shared-value changes under this repo's Vite tooling, so the panel transform
 * and the scrim opacity are written imperatively to the DOM node whenever the
 * `offset` changes (subscribed via `useSharedValueListener`).
 *
 * The initial value is written in a layout effect (before browser paint), not
 * read from `offset.value` during render — a render-phase `.value` read both
 * triggers reanimated's "inline style" warning and would flash the panel at the
 * wrong position for one frame.
 */

/** Hoisted so the footer host never allocates its static position. */
const FOOTER_HOST = { position: "absolute", top: 0, left: 0, right: 0 } as const;

/** The panel host: an absolute layer whose `translateY` the painter writes. */
export function AnimatedFrameHost({
  offset,
  keyboard,
  viewportHeight,
  bottomGap,
  topGap,
  maxWidth,
  children,
}: FrameHostProps) {
  const ref = React.useRef<unknown>(null);

  const paint = React.useCallback(
    (v: number) => {
      const el = ref.current as HTMLElement | null;
      if (!el) return;
      const { translateY } = panelFrame({
        offset: v,
        viewportHeight,
        keyboardHeight: keyboardLift(keyboard.value, bottomGap),
        topGap,
      });
      el.style.transform = `translateY(${translateY}px)`;
    },
    [keyboard, viewportHeight, bottomGap, topGap],
  );
  React.useLayoutEffect(() => paint(offset.value), [paint, offset]);
  useSharedValueListener(offset, paint);
  useSharedValueListener(keyboard, () => paint(offset.value));

  return (
    <SheetFill
      ref={ref as never}
      stack="panel"
      {...(maxWidth === undefined ? null : { maxWidth, marginHorizontal: "auto" })}
    >
      {children}
    </SheetFill>
  );
}

/** Keeps the footer on the panel's visible bottom edge at every offset. */
export function AnimatedFooterHost({
  offset,
  keyboard,
  viewportHeight,
  bottomGap,
  topGap,
  footerHeight,
  keyboardSlide,
  children,
}: FooterHostProps) {
  const ref = React.useRef<HTMLDivElement | null>(null);

  const paint = React.useCallback(
    (v: number) => {
      const el = ref.current;
      if (!el) return;
      const lift = keyboardLift(keyboard.value, bottomGap);
      const { visibleHeight } = panelFrame({
        offset: v,
        viewportHeight,
        keyboardHeight: lift,
        topGap,
      });
      const y = footerTranslate(visibleHeight, footerHeight, Math.min(lift, keyboardSlide));
      el.style.transform = `translateY(${y}px)`;
    },
    [keyboard, viewportHeight, bottomGap, topGap, footerHeight, keyboardSlide],
  );
  React.useLayoutEffect(() => paint(offset.value), [paint, offset]);
  useSharedValueListener(offset, paint);
  useSharedValueListener(keyboard, () => paint(offset.value));

  return (
    <div ref={ref} style={FOOTER_HOST}>
      {children}
    </div>
  );
}

/** The scrim: the painter writes its `opacity`; `Overlay` takes the taps. */
export function AnimatedOverlay({
  offset,
  fadeStart,
  closed,
  maxOpacity,
  onPress,
  overlayProps,
}: AnimatedOverlayProps) {
  const ref = React.useRef<unknown>(null);

  const paint = React.useCallback(
    (v: number) => {
      const el = ref.current as HTMLElement | null;
      if (el) el.style.opacity = String(overlayOpacity(v, fadeStart, closed, maxOpacity));
    },
    [fadeStart, closed, maxOpacity],
  );
  React.useLayoutEffect(() => paint(offset.value), [paint, offset]);
  useSharedValueListener(offset, paint);

  return (
    <SheetFill ref={ref as never} stack="scrim" pointerEvents="box-none">
      <Overlay onPress={onPress} zIndex={0} {...overlayProps} />
    </SheetFill>
  );
}
