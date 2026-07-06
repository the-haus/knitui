import * as React from "react";
import { GestureDetector } from "react-native-gesture-handler";
import Animated, {
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
} from "react-native-reanimated";

import type { ScrollAreaHandle } from "@knitui/components";

import { shouldPinToTop } from "../engine";
import { useSheetScrollContext } from "./scrollContext";
import type { SheetScrollViewProps } from "./ScrollView.shared";

export type { SheetScrollViewProps } from "./ScrollView.shared";

/**
 * Scrollable content region for use inside a `Sheet.Frame` (React Native).
 *
 * This is where the scroll↔drag handoff lives. The scroller is wrapped in a
 * `GestureDetector` bound to the sheet's `Gesture.Native` (from context) so the
 * list and the sheet's Pan recognise **simultaneously** — the finger drives one
 * continuous gesture and the two hand off cleanly:
 *
 *  - The scroll worklet publishes the live content offset into the shared
 *    `scrollOffsetY` (read by the Pan to know when the list is at the top), and
 *  - while the sheet is **not** fully expanded it pins the list to the top
 *    (`scrollTo(…, 0)`), so a drag from a partially-open sheet moves the panel
 *    instead of the list, and collapsing the sheet resets the list to the top.
 *
 * Once fully expanded the list scrolls normally; the Pan only re-takes the drag
 * when the list is at the top and the finger pulls down (see `useSheetDrag`).
 *
 * Outside a `Sheet` (no context) it degrades to a plain scroller.
 */
export const SheetScrollView = React.forwardRef<ScrollAreaHandle, SheetScrollViewProps>(
  function SheetScrollView(props, ref) {
    // Only the props a bare native ScrollView understands are wired; `ScrollArea`-
    // specific props (scrollbars, thumbProps, …) are accepted for API parity but
    // not rendered here, so they must not spread onto the RN ScrollView.
    const { children, style, keyboardShouldPersistTaps } = props;

    const ctx = useSheetScrollContext();
    const aref = useAnimatedRef<Animated.ScrollView>();

    const scrollOffsetY = ctx?.scrollOffsetY;
    const sheetOffset = ctx?.sheetOffset;
    const expandedOffset = ctx?.expandedOffset ?? 0;
    const handoffEnabled = ctx?.handoffEnabled ?? false;

    const onScroll = useAnimatedScrollHandler(
      {
        onScroll: (e) => {
          "worklet";
          const y = e.contentOffset.y;
          if (scrollOffsetY) scrollOffsetY.value = y;
          // While the sheet isn't fully expanded, keep the list pinned to the top
          // so the drag drives the panel (and a mid-collapse list can't scroll).
          if (sheetOffset && shouldPinToTop(handoffEnabled, sheetOffset.value, expandedOffset, y)) {
            scrollTo(aref, 0, 0, false);
            if (scrollOffsetY) scrollOffsetY.value = 0;
          }
        },
      },
      [handoffEnabled, expandedOffset, scrollOffsetY, sheetOffset],
    );

    // Expose a minimal `ScrollAreaHandle` so the ref contract matches the web
    // build. The custom-scrollbar affordances have no native analogue here.
    React.useImperativeHandle(
      ref,
      (): ScrollAreaHandle => ({
        scrollTo: ({ x, y, animated }) =>
          aref.current?.scrollTo({ x, y, animated: Boolean(animated) }),
        scrollToTop: (animated) => aref.current?.scrollTo({ y: 0, animated: Boolean(animated) }),
        scrollToBottom: (animated) => aref.current?.scrollToEnd({ animated: Boolean(animated) }),
        scrollToEnd: (animated) => aref.current?.scrollToEnd({ animated: Boolean(animated) }),
        scrollIntoView: () => {
          // Selector-based revealing is a no-op on native (see ScrollArea.native).
        },
        getViewport: () => aref.current as never,
        getScrollPosition: () => ({ x: 0, y: scrollOffsetY?.value ?? 0 }),
      }),
      [aref, scrollOffsetY],
    );

    const scroller = (
      <Animated.ScrollView
        ref={aref}
        style={[{ flex: 1 }, style as never]}
        onScroll={onScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      >
        {children}
      </Animated.ScrollView>
    );

    // No context (rendered outside a Sheet) → just scroll.
    if (!ctx) return scroller;

    // Bind the scroller to the sheet's Native gesture so it recognises together
    // with the sheet Pan (declared simultaneous on the Pan side).
    return <GestureDetector gesture={ctx.scrollGesture}>{scroller}</GestureDetector>;
  },
);
