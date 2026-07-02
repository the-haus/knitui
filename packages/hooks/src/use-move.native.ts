import * as React from "react";
import type { GestureResponderEvent } from "react-native";

import type { TamaguiElement } from "@knitui/core";

import {
  clampMovePosition,
  type MovePosition,
  type MoveRootProps,
  type UseMoveHandlers,
  type UseMoveReturn,
} from "./use-move.shared";

/** The subset of the RN host node we need — present on the View the ref lands on. */
interface MeasurableNode {
  measureInWindow?: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
}

/**
 * Track touch dragging over an element and report the normalized `[0, 1]`
 * position. Native implementation — mirrors Mantine's `useMove` and the web
 * counterpart in `use-move.ts`.
 *
 * Uses the React Native gesture-responder system: spread the returned
 * `rootProps` onto the move area so it captures the touch, and the responder is
 * held for the whole drag so moves outside still track.
 *
 * Position is derived from the touch's window-absolute `pageX`/`pageY` against
 * the move area's measured window origin — exactly like the web side reads
 * `clientX - getBoundingClientRect().left`. We deliberately do NOT use
 * `locationX`/`locationY`: RN reports those relative to whatever child the touch
 * is currently over, so as the finger passes over the thumb/marks the value
 * snaps toward that child's origin — the "flickers and jumps left" bug.
 *
 * `react-native` is imported for types only — the handlers are plain props, so
 * nothing here pulls a runtime dependency into a bundle.
 */
export function useMove(
  onChange: (position: MovePosition) => void,
  handlers?: UseMoveHandlers,
): UseMoveReturn {
  const ref = React.useRef<TamaguiElement | null>(null);
  // Window-absolute origin + size of the move area, refreshed by measuring the
  // responder node. Position is `(pageX - x) / width`, mirroring the web rect.
  const rectRef = React.useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Mutable mirror so the (stable) handlers never read stale callbacks.
  const stateRef = React.useRef({ onChange, handlers });
  stateRef.current = { onChange, handlers };

  const rootProps = React.useMemo<MoveRootProps>(() => {
    // Refresh the cached window rect, then run `next` once it's current. Falls
    // back to the last known rect when the node can't be measured.
    const measureThen = (next: () => void): void => {
      const node = ref.current as (MeasurableNode & TamaguiElement) | null;
      if (typeof node?.measureInWindow === "function") {
        node.measureInWindow((x, y, width, height) => {
          rectRef.current = { x, y, width, height };
          next();
        });
      } else {
        next();
      }
    };

    const positionFromPage = (pageX: number, pageY: number): MovePosition => {
      const { x, y, width, height } = rectRef.current;
      return clampMovePosition({
        x: width ? (pageX - x) / width : 0,
        y: height ? (pageY - y) / height : 0,
      });
    };

    const emit = (event: GestureResponderEvent): void => {
      const { pageX, pageY } = event.nativeEvent;
      stateRef.current.onChange(positionFromPage(pageX, pageY));
    };

    return {
      onLayout: () => {
        // Pre-resolve the window origin/size so the first touch maps correctly.
        measureThen(() => {});
      },
      // Claim the gesture in the CAPTURE phase (touch-down, top-down) so the
      // slider owns it before an ancestor ScrollView's delayed content-touch /
      // pan logic can begin scrolling. Paired with the termination refusal
      // below, this lets the thumb drag freely inside a ScrollView.
      onStartShouldSetResponderCapture: () => true,
      onStartShouldSetResponder: () => true,
      onMoveShouldSetResponder: () => true,
      // Keep the responder for the whole drag so moves outside still track and
      // a parent ScrollView can never steal it mid-slide.
      onResponderTerminationRequest: () => false,
      onResponderGrant: (event) => {
        // Capture coords before the async measure (the event may be recycled).
        const { pageX, pageY } = event.nativeEvent;
        stateRef.current.handlers?.onScrubStart?.();
        // Re-measure on grant: the area may have moved (scroll, layout shift)
        // since `onLayout`, and a tap-to-set must land on the right value.
        measureThen(() => stateRef.current.onChange(positionFromPage(pageX, pageY)));
      },
      onResponderMove: emit,
      onResponderRelease: (event) => {
        emit(event);
        stateRef.current.handlers?.onScrubEnd?.();
      },
      onResponderTerminate: () => {
        stateRef.current.handlers?.onScrubEnd?.();
      },
    };
  }, []);

  return { ref, rootProps };
}
