import * as React from "react";
import { KeyboardAvoidingView } from "react-native";

import { type GetProps, styled } from "@knitui/core";

/**
 * Native build of the modal/drawer positioning layer.
 *
 * The same full-cover container as the web build, but backed by React Native's
 * built-in `KeyboardAvoidingView` so the content frame lifts above the soft
 * keyboard. `behavior="padding"` animates the layer's bottom padding to the
 * keyboard height — shrinking the flex area so a centered panel re-centers in the
 * visible region and a top-aligned panel stays put — while the absolutely-positioned
 * `Overlay` scrim (inset 0) is unaffected and keeps covering the screen.
 *
 * The keyboard default is baked in here (not passed by the shared `ModalBase`),
 * so the web build stays a plain `Box` that never sees the native-only prop.
 * `styled()` over the keyboard-avoiding view keeps the kit's token-aware style
 * props (`paddingVertical="$xl"`, `alignItems`, …) working.
 */
const Frame = styled(KeyboardAvoidingView, {
  name: "ModalBaseInner",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
});

export type ModalBaseInnerProps = GetProps<typeof Frame>;

export const ModalBaseInner = React.forwardRef<KeyboardAvoidingView, ModalBaseInnerProps>(
  function ModalBaseInner(props, ref) {
    // Spread last so a caller could still override, though `ModalBase` doesn't.
    return <Frame ref={ref} behavior="padding" {...props} />;
  },
);
