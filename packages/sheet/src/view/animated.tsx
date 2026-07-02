import * as React from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

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

/** The panel host: a full-bleed absolute layer translated down by `offset`. */
export function AnimatedFrameHost({ offset, children }: FrameHostProps) {
  const style = useAnimatedStyle(() => {
    "worklet";
    return { transform: [{ translateY: offset.value }] };
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
