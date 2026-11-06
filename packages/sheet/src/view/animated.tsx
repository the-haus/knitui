import * as React from "react";
import Animated, { useAnimatedStyle, useSharedValue } from "react-native-reanimated";

import { Overlay } from "@knitui/components";
import { isWeb, type ViewStyle } from "@knitui/core";

import { footerTranslate, keyboardLift, overlayOpacity, panelFrame } from "../engine";
import type { AnimatedOverlayProps, FooterHostProps, FrameHostProps } from "./animated.types";

/**
 * Native animated hosts. The panel `translateY` and the scrim `opacity` are
 * derived on the UI thread via `useAnimatedStyle` straight off the `offset`
 * SharedValue — declarative, 60fps, no JS round-trip. The web twin
 * (`animated.web.tsx`) paints imperatively because `useAnimatedStyle` does not
 * re-run under this repo's web tooling.
 */

const FILL: ViewStyle = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 };
// Hoisted per layer so a render never allocates the static part of the style.
const PANEL_FILL: ViewStyle = { ...FILL, zIndex: 1 };
const PANEL_CENTRED: ViewStyle = {
  position: "absolute",
  top: 0,
  bottom: 0,
  zIndex: 1,
  width: "100%",
  alignSelf: "center",
};
const SCRIM_FILL: ViewStyle = { ...FILL, zIndex: 0 };
const FOOTER_HOST: ViewStyle = { position: "absolute", top: 0, left: 0, right: 0 };

/** The sub-pixel step the transform alternates by to be sent again (see below). */
const RESEND_PX = 0.01;

/** Flips by {@link RESEND_PX} after every render, to send a transform again. */
function useResend() {
  const resend = useSharedValue(0);
  React.useEffect(() => {
    resend.value = resend.value === 0 ? RESEND_PX : 0;
  });
  return resend;
}

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
export function AnimatedFrameHost({
  offset,
  keyboard,
  viewportHeight,
  bottomGap,
  topGap,
  maxWidth,
  children,
}: FrameHostProps) {
  const resend = useResend();
  const style = useAnimatedStyle(
    () => {
      "worklet";
      const { translateY } = panelFrame({
        offset: offset.value,
        viewportHeight,
        keyboardHeight: keyboardLift(keyboard.value, bottomGap),
        topGap,
      });
      return { transform: [{ translateY: translateY + resend.value }] };
    },
    // Web-only deps: Reanimated 4.7 ignores them on native and warns when given.
    isWeb ? [viewportHeight, bottomGap, topGap] : undefined,
  );
  // Yoga ignores auto margins on a box pinned by `left` and `right`, so a capped panel
  // drops both insets and centres with `alignSelf`.
  const fill = React.useMemo<ViewStyle>(
    () => (maxWidth === undefined ? PANEL_FILL : { ...PANEL_CENTRED, maxWidth }),
    [maxWidth],
  );

  return <Animated.View style={[fill, style]}>{children}</Animated.View>;
}

/**
 * Keeps the footer on the panel's visible bottom edge at every offset, by transform
 * alone: a drag re-lays out nothing, and the footer rides the keyboard with the panel.
 * Sent again after every render, for the same reason as the panel's transform: a lost
 * write would leave the footer at the panel's top, with nothing to put it back.
 */
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
  const resend = useResend();
  const style = useAnimatedStyle(
    () => {
      "worklet";
      const lift = keyboardLift(keyboard.value, bottomGap);
      const { visibleHeight } = panelFrame({
        offset: offset.value,
        viewportHeight,
        keyboardHeight: lift,
        topGap,
      });
      const y = footerTranslate(visibleHeight, footerHeight, Math.min(lift, keyboardSlide));
      return { transform: [{ translateY: y + resend.value }] };
    },
    isWeb ? [viewportHeight, bottomGap, topGap, footerHeight, keyboardSlide] : undefined,
  );

  return <Animated.View style={[FOOTER_HOST, style]}>{children}</Animated.View>;
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
  const style = useAnimatedStyle(
    () => {
      "worklet";
      return { opacity: overlayOpacity(offset.value, fadeStart, closed, maxOpacity) };
    },
    isWeb ? [fadeStart, closed, maxOpacity] : undefined,
  );

  return (
    <Animated.View style={[SCRIM_FILL, style]} pointerEvents="box-none">
      <Overlay onPress={onPress} zIndex={0} {...overlayProps} />
    </Animated.View>
  );
}
