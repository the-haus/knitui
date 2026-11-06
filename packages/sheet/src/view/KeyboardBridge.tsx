import * as React from "react";
import type { SharedValue } from "react-native-reanimated";

import { visualKeyboardHeight } from "../engine";

export interface KeyboardBridgeProps {
  /** Live keyboard height (px), every frame. */
  keyboard: SharedValue<number>;
  /** The height the content should fit: on landing, or 0 as the keyboard starts to leave. */
  onSettled: (height: number) => void;
}

/**
 * Mobile browsers report the soft keyboard only through the visual viewport, which
 * shrinks while the layout viewport stays put. Desktop browsers never fire this.
 */
export function KeyboardBridge({ keyboard, onSettled }: KeyboardBridgeProps) {
  React.useEffect(() => {
    const viewport = typeof window === "undefined" ? undefined : window.visualViewport;
    if (!viewport) return undefined;
    const update = () => {
      const height = visualKeyboardHeight({
        layoutHeight: window.innerHeight,
        viewportHeight: viewport.height,
        offsetTop: viewport.offsetTop,
        scale: viewport.scale,
      });
      keyboard.value = height;
      onSettled(height);
    };
    update();
    viewport.addEventListener("resize", update);
    viewport.addEventListener("scroll", update);
    return () => {
      viewport.removeEventListener("resize", update);
      viewport.removeEventListener("scroll", update);
      keyboard.value = 0;
    };
  }, [keyboard, onSettled]);
  return null;
}
