import * as React from "react";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { Overlay } from "@knitui/components";
import type { ViewStyle } from "@knitui/core";

import { overlayOpacity } from "../engine";
import type { AnimatedOverlayProps, FrameHostProps } from "./animated.types";

/**
 * Native animated hosts. The panel `translateY` and the scrim `opacity` are
 * derived on the UI thread via `useAnimatedStyle` straight off the `offset`
 * SharedValue — declarative, 60fps, no JS round-trip. The web twin
 * (`animated.web.tsx`) paints imperatively because `useAnimatedStyle` does not
 * re-run under this repo's web tooling.
 */

const FILL: ViewStyle = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 };

/** The sub-pixel step the transform alternates by to be sent again (see below). */
const RESEND_PX = 0.01;

/**
 * The panel host: a full-bleed absolute layer translated down by `offset`.
 *
 * THE TRANSFORM IS SENT AGAIN AFTER EVERY RENDER of the host. Reanimated writes
 * it straight to the native view and only when it CHANGES; a sheet at rest
 * writes nothing. When the native view then loses that write (a modal sheet
 * closing over a persistent one, a sign-in re-rendering the screen: both
 * measured on Android, about one time in three) nothing puts it back: `offset`
 * still says "peek" while the view sits wherever its React props left it, which
 * is the off-screen sentinel the animated style started from. A sheet that was
 * open and at rest vanished with its state intact.
 *
 * So each render flips `resend` between 0 and `RESEND_PX`: the style changes by
 * a hundredth of a pixel, which is a write, and the panel is where `offset`
 * says again. It is its own shared value because assigning to `offset` would
 * cancel a spring in flight.
 */
export function AnimatedFrameHost({ offset, children }: FrameHostProps) {
  const resend = useSharedValue(0);
  React.useEffect(() => {
    resend.value = resend.value === 0 ? RESEND_PX : 0;
  });
  const style = useAnimatedStyle(() => {
    "worklet";
    return { transform: [{ translateY: offset.value + resend.value }] };
  }, []);

  return <Animated.View style={[FILL, { zIndex: 1 }, style]}>{children}</Animated.View>;
}

/** The scrim: fades with the panel offset; passes taps through to `Overlay`. */
export function AnimatedOverlay({
  offset,
  fadeStart,
  closed,
  maxOpacity,
  onPress,
  overlayProps,
}: AnimatedOverlayProps) {
  const style = useAnimatedStyle(() => {
    "worklet";
    return { opacity: overlayOpacity(offset.value, fadeStart, closed, maxOpacity) };
  }, [fadeStart, closed, maxOpacity]);

  return (
    <Animated.View style={[FILL, { zIndex: 0 }, style]} pointerEvents="box-none">
      <Overlay onPress={onPress} zIndex={0} {...overlayProps} />
    </Animated.View>
  );
}
