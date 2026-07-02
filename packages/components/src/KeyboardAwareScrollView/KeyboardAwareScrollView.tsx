import * as React from "react";

import { type TamaguiElement } from "@knitui/core";

import { Box, type BoxProps } from "../Box";

/**
 * Web build of the `KeyboardAwareScrollView` form primitive.
 *
 * On the web there is no keyboard to scroll around — browsers reflow the layout
 * and keep the focused field visible around their own on-screen keyboard — so
 * this is a plain scrollable `Box`. The native-only props (`bottomOffset`,
 * `extraKeyboardSpace`, `mode`, `enabled`, `disableScrollOnKeyboardHide`,
 * `ScrollViewComponent`, …) and the React Native `ScrollView` props that have
 * no DOM equivalent are accepted for a single cross-platform API but stripped
 * here so they never leak onto the DOM node. `contentContainerStyle` is applied
 * to an inner wrapper, matching the native `ScrollView` content container.
 * See the `.native.tsx` build for the real keyboard-following behaviour.
 */
export type KeyboardAwareScrollViewProps = BoxProps & {
  bottomOffset?: number;
  extraKeyboardSpace?: number;
  disableScrollOnKeyboardHide?: boolean;
  enabled?: boolean;
  mode?: string;
  ScrollViewComponent?: unknown;
  horizontal?: boolean;
  keyboardShouldPersistTaps?: "always" | "never" | "handled" | boolean;
  showsVerticalScrollIndicator?: boolean;
  showsHorizontalScrollIndicator?: boolean;
  contentContainerStyle?: BoxProps["style"];
  children?: React.ReactNode;
};

export const KeyboardAwareScrollView = React.forwardRef<
  TamaguiElement,
  KeyboardAwareScrollViewProps
>(function KeyboardAwareScrollView(props, ref) {
  const {
    bottomOffset: _bottomOffset,
    extraKeyboardSpace: _extraKeyboardSpace,
    disableScrollOnKeyboardHide: _disableScrollOnKeyboardHide,
    enabled: _enabled,
    mode: _mode,
    ScrollViewComponent: _ScrollViewComponent,
    keyboardShouldPersistTaps: _keyboardShouldPersistTaps,
    showsVerticalScrollIndicator: _showsVerticalScrollIndicator,
    showsHorizontalScrollIndicator: _showsHorizontalScrollIndicator,
    horizontal,
    contentContainerStyle,
    children,
    style,
    ...boxProps
  } = props;

  // `overflowX`/`overflowY` are web-only and not Tamagui prop-level style keys,
  // so they go through `style` (same approach as `ScrollArea`'s viewport).
  const scrollStyle = {
    overflowX: horizontal ? "scroll" : "hidden",
    overflowY: horizontal ? "hidden" : "scroll",
  } as NonNullable<BoxProps["style"]>;

  return (
    <Box ref={ref} flex={1} style={[scrollStyle, style]} {...boxProps}>
      <Box style={contentContainerStyle}>{children}</Box>
    </Box>
  );
});
