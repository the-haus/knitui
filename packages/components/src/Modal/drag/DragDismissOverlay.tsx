import * as React from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import type { ViewStyle } from "@knitui/core";

import { Overlay } from "../../Overlay";
import { dragOverlayOpacity } from "./engine";
import type { DragDismissOverlayProps } from "./types";

/**
 * Native scrim whose opacity fades as the panel is dragged away (mirrors
 * `@knitui/sheet`'s `AnimatedOverlay`). `box-none` so the wrapper passes taps to the
 * `Overlay` (which owns tap-to-dismiss). Derived on the UI thread via
 * `useAnimatedStyle`; the web twin paints imperatively.
 */
const FILL: ViewStyle = { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 };

export function DragDismissOverlay({
  offset,
  extent,
  maxOpacity = 1,
  onPress,
  overlayProps,
}: DragDismissOverlayProps) {
  const style = useAnimatedStyle(() => {
    "worklet";
    return { opacity: dragOverlayOpacity(offset.value, extent, maxOpacity) };
  }, [extent, maxOpacity]);

  return (
    <Animated.View style={[FILL, { zIndex: 0 }, style]} pointerEvents="box-none">
      <Overlay onPress={onPress} zIndex={0} {...overlayProps} />
    </Animated.View>
  );
}
