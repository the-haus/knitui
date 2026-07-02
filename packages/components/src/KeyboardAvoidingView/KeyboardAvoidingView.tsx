import * as React from "react";

import { type TamaguiElement } from "@knitui/core";

import { Box, type BoxProps } from "../Box";

/**
 * Web build of the `KeyboardAvoidingView` form primitive.
 *
 * On the web there is no keyboard to avoid — browsers reflow the layout around
 * their own on-screen keyboard — so this is a plain pass-through `Box`. The
 * native-only props (`behavior`, `keyboardVerticalOffset`, `automaticOffset`,
 * `enabled`, `contentContainerStyle`) are accepted for a single cross-platform
 * API but stripped here so they never leak onto the DOM node. See the
 * `.native.tsx` build for the real keyboard-avoidance behaviour.
 */
export type KeyboardAvoidingViewProps = BoxProps & {
  behavior?: "height" | "padding" | "position" | "translate-with-padding";
  keyboardVerticalOffset?: number;
  automaticOffset?: boolean;
  enabled?: boolean;
  contentContainerStyle?: unknown;
};

export const KeyboardAvoidingView = React.forwardRef<TamaguiElement, KeyboardAvoidingViewProps>(
  function KeyboardAvoidingView(props, ref) {
    const {
      behavior: _behavior,
      keyboardVerticalOffset: _keyboardVerticalOffset,
      automaticOffset: _automaticOffset,
      enabled: _enabled,
      contentContainerStyle: _contentContainerStyle,
      ...boxProps
    } = props;

    return <Box ref={ref} flex={1} {...boxProps} />;
  },
);
