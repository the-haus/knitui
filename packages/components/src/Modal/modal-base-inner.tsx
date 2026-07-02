import * as React from "react";

import { type GetProps, styled, type TamaguiElement, View } from "@knitui/core";

/**
 * Web build of the modal/drawer positioning layer.
 *
 * A plain full-cover container (the same inset-0 frame as the native build) with
 * no keyboard handling — on web the soft keyboard doesn't reflow the viewport, so
 * this stays a bare `styled(View)` `Box`. The native build swaps this file for
 * `modal-base-inner.native.tsx`, which backs the same frame with React Native's
 * built-in `KeyboardAvoidingView` and bakes in the keyboard default
 * (`behavior="padding"`). Keeping that native-only prop out of this build means
 * `ModalBase` can stay platform-agnostic while the web layer never sees props it
 * doesn't understand.
 */
const Frame = styled(View, {
  name: "ModalBaseInner",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
});

export type ModalBaseInnerProps = GetProps<typeof Frame>;

export const ModalBaseInner = React.forwardRef<TamaguiElement, ModalBaseInnerProps>(
  function ModalBaseInner(props, ref) {
    return <Frame ref={ref} {...props} />;
  },
);
