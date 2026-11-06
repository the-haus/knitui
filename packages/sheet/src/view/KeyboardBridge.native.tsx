import * as React from "react";
import { Dimensions, Keyboard } from "react-native";
import { KeyboardState, useAnimatedKeyboard, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import type { KeyboardBridgeProps } from "./KeyboardBridge";

/**
 * Copies the keyboard's live height into `keyboard`, every frame, on the UI thread.
 *
 * A component rather than a hook so that a sheet that doesn't move with the keyboard
 * never subscribes: `useAnimatedKeyboard` adjusts how the window handles insets on
 * Android, which a persistent sheet over a map must not do. RN's `Keyboard` events
 * can't replace it, because Android only reports the height once the keyboard landed.
 *
 * The content's height follows once per move. It waits for the landing when the
 * keyboard arrives, so no gap opens above the footer on the way up, and goes first when
 * it leaves, so the list is never short of the panel. The state, not the height, says
 * which: the animated height and RN's reported one can differ by a pixel.
 */
export function KeyboardBridge({ keyboard, onSettled }: KeyboardBridgeProps) {
  const live = useAnimatedKeyboard();

  // A sheet opened over a keyboard that is already up gets no event for it, and the
  // live height reads 0 until the next one. RN knows the resting frame, so start there.
  React.useEffect(() => {
    const metrics = Keyboard.isVisible() ? Keyboard.metrics() : undefined;
    // Android's `height` leaves out the navigation bar, which the live value includes.
    // Where the keyboard's top edge sits is the same on both platforms.
    const height = metrics ? Math.round(Dimensions.get("window").height - metrics.screenY) : 0;
    if (height > 0) {
      keyboard.value = height;
      onSettled(height);
    }
    return () => {
      keyboard.value = 0;
      onSettled(0);
    };
  }, [keyboard, onSettled]);

  useAnimatedReaction(
    () => ({ state: live.state.value, height: live.height.value }),
    (now, before) => {
      "worklet";
      if (now.state === KeyboardState.UNKNOWN) return;
      keyboard.value = now.height;
      if (now.state === KeyboardState.OPEN) {
        if (before?.state !== now.state || before.height !== now.height) {
          scheduleOnRN(onSettled, now.height);
        }
      } else if (now.state === KeyboardState.CLOSING && before?.state !== now.state) {
        scheduleOnRN(onSettled, 0);
      }
    },
  );
  return null;
}
