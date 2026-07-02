import * as React from "react";
import Animated, { useAnimatedStyle } from "react-native-reanimated";

import type { DragDismissHostProps } from "./types";

/**
 * Native drag host. The panel's dismiss translation is derived on the UI thread
 * via `useAnimatedStyle` straight off the `offset` SharedValue (the screen
 * translation is `sign * offset` along the axis). Layout-neutral — it wraps the
 * content frame tightly and inherits the positioning layer's alignment, so the
 * panel keeps its centring (Modal) / edge-stretch (Drawer). The web twin
 * (`.web.tsx`) paints imperatively because `useAnimatedStyle` doesn't re-run
 * under the repo's web tooling.
 */
export const DragDismissHost = React.forwardRef<Animated.View, DragDismissHostProps>(
  function DragDismissHost({ offset, axis, sign, style, pointerEvents, children }, ref) {
    const animatedStyle = useAnimatedStyle(() => {
      "worklet";
      const t = sign * offset.value;
      return { transform: axis === "x" ? [{ translateX: t }] : [{ translateY: t }] };
    }, [axis, sign]);

    return (
      <Animated.View ref={ref} style={[style, animatedStyle]} pointerEvents={pointerEvents}>
        {children}
      </Animated.View>
    );
  },
);
