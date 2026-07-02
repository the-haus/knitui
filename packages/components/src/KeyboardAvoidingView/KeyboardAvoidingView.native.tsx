import * as React from "react";
import { KeyboardAvoidingView as RNKeyboardAvoidingView } from "react-native";

import { type GetProps, styled } from "@knitui/core";

/**
 * Native build of the `KeyboardAvoidingView` form primitive.
 *
 * A `styled()` wrapper over React Native's built-in `KeyboardAvoidingView`, so
 * the kit's token-aware style props (`padding="$md"`, `flex`, …) work while the
 * view lifts its content above the soft keyboard.
 *
 * Defaults are tuned for the common case — a full-height form region: `flex: 1`
 * and `behavior="padding"` (animate bottom padding to the keyboard height). Both
 * are overridable via props.
 *
 * The web build is a plain pass-through `Box` — browsers reflow for their own
 * on-screen keyboard, so the native-only props are accepted and ignored there.
 */
const Frame = styled(RNKeyboardAvoidingView, {
  name: "KeyboardAvoidingView",
  flex: 1,
});

export type KeyboardAvoidingViewProps = GetProps<typeof Frame> & {
  /**
   * Accepted for cross-platform API parity (it was a `react-native-keyboard-controller`
   * prop). RN's built-in `KeyboardAvoidingView` has no equivalent, so it's ignored.
   */
  automaticOffset?: boolean;
};

export const KeyboardAvoidingView = React.forwardRef<
  RNKeyboardAvoidingView,
  KeyboardAvoidingViewProps
>(function KeyboardAvoidingView({ automaticOffset: _automaticOffset, ...props }, ref) {
  // Spread last so callers can override any default.
  return <Frame ref={ref} behavior="padding" {...props} />;
});
