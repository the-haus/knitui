import * as React from "react";

import { Box, Overlay } from "@knitui/components";

import { overlayOpacity } from "../engine";
import { useSharedValueListener } from "../hooks/useSharedValueListener";
import type { AnimatedOverlayProps, FrameHostProps } from "./animated.types";

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

/** The panel host: an absolute layer whose `translateY` the painter writes. */
export function AnimatedFrameHost({ offset, children }: FrameHostProps) {
  const ref = React.useRef<unknown>(null);

  const paint = React.useCallback((v: number) => {
    const el = ref.current as HTMLElement | null;
    if (el) el.style.transform = `translateY(${v}px)`;
  }, []);
  React.useLayoutEffect(() => paint(offset.value), [paint, offset]);
  useSharedValueListener(offset, paint);

  return (
    <Box
      ref={ref as never}
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 1 }}
    >
      {children}
    </Box>
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
    <Box
      ref={ref as never}
      pointerEvents="box-none"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 0 }}
    >
      <Overlay onPress={onPress} zIndex={0} {...overlayProps} />
    </Box>
  );
}
