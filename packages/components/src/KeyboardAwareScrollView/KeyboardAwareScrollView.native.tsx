import * as React from "react";
import { Platform, ScrollView } from "react-native";

import { type GetProps, styled } from "@knitui/core";
import { useKeyboardHeight } from "@knitui/hooks";

/**
 * Native build of the `KeyboardAwareScrollView` form primitive.
 *
 * A `styled()` wrapper over React Native's built-in `ScrollView` that keeps its
 * content scrollable clear of the soft keyboard:
 *
 * - on **iOS**, `automaticallyAdjustKeyboardInsets` insets the scroll content for
 *   the keyboard and scrolls the focused field into view automatically;
 * - on **Android** (which has no such inset), the keyboard height is added as
 *   bottom content padding (via the shared `useKeyboardHeight` tracker) so the
 *   content can scroll above the keyboard.
 *
 * `keyboardShouldPersistTaps="handled"` lets a tap reach a control inside the
 * scroll view without first being swallowed to dismiss the keyboard. `styled()`
 * keeps the kit's token-aware style props working; `flex: 1` is the common
 * default for a full-height form region and is overridable.
 *
 * Note: unlike `react-native-keyboard-controller`, this does not auto-scroll the
 * focused input into view on Android — the keyboard-height padding lets the user
 * scroll to it. The web build is a plain scrollable `Box`.
 */
const Frame = styled(ScrollView, {
  name: "KeyboardAwareScrollView",
  flex: 1,
});

export type KeyboardAwareScrollViewProps = GetProps<typeof Frame> & {
  /**
   * RNKC tuning props — accepted for cross-platform API parity but not honored by
   * this implementation (see the note above). `extraKeyboardSpace` is the one
   * exception: it's added to the Android bottom padding.
   */
  bottomOffset?: number;
  extraKeyboardSpace?: number;
  disableScrollOnKeyboardHide?: boolean;
  enabled?: boolean;
  mode?: string;
  ScrollViewComponent?: unknown;
};

export const KeyboardAwareScrollView = React.forwardRef<ScrollView, KeyboardAwareScrollViewProps>(
  function KeyboardAwareScrollView(props, ref) {
    const {
      bottomOffset: _bottomOffset,
      extraKeyboardSpace,
      disableScrollOnKeyboardHide: _disableScrollOnKeyboardHide,
      enabled: _enabled,
      mode: _mode,
      ScrollViewComponent: _ScrollViewComponent,
      keyboardShouldPersistTaps = "handled",
      contentContainerStyle,
      ...rest
    } = props;

    const keyboardHeight = useKeyboardHeight();
    // iOS handles the inset itself via `automaticallyAdjustKeyboardInsets`, so only
    // pad on Android to avoid double-spacing.
    const paddingBottom =
      Platform.OS === "android" && keyboardHeight > 0
        ? keyboardHeight + (extraKeyboardSpace ?? 0)
        : undefined;

    return (
      <Frame
        ref={ref}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
        automaticallyAdjustKeyboardInsets
        contentContainerStyle={[contentContainerStyle, paddingBottom != null && { paddingBottom }]}
        {...rest}
      />
    );
  },
);
