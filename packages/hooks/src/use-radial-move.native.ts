import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import {
  angleFromPoint,
  type RadialMoveRootProps,
  type UseRadialMoveOptions,
  type UseRadialMoveReturn,
} from "./use-radial-move.shared";

/** The subset of the RN host node we need — present on the View the ref lands on. */
interface MeasurableNode {
  measureInWindow?: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
}

/**
 * Track touch dragging over a circular control and report the angle (0–359)
 * under the finger. Native implementation — mirrors Mantine's `useRadialMove`.
 *
 * Uses the React Native gesture-responder system: spread the returned
 * `rootProps` onto the ring so it captures the touch, and the responder is held
 * for the whole drag so moves outside the ring still track.
 *
 * The touch point is taken from window-absolute `pageX`/`pageY` against the
 * ring's measured window origin, NOT `locationX`/`locationY`: RN reports those
 * relative to whatever child the touch is over, so as the finger crosses the
 * handle the angle jumps to that child's frame — the flicker bug.
 *
 * `react-native` is imported for types only — the handlers are plain props, so
 * nothing here pulls a runtime dependency into a bundle.
 *
 * `onChange` returns the value actually applied (after the consumer snaps /
 * restricts it), which is forwarded to `onChangeEnd` when the gesture ends.
 */
export function useRadialMove(
  onChange: (angle: number) => number,
  options?: UseRadialMoveOptions,
): UseRadialMoveReturn {
  const ref = React.useRef<TamaguiElement | null>(null);
  // Window-absolute origin + size of the ring, refreshed by measuring the node.
  const rectRef = React.useRef({ x: 0, y: 0, width: 0, height: 0 });

  // Mutable mirror so the (stable) handlers never read stale props.
  const stateRef = React.useRef({ onChange, options });
  stateRef.current = { onChange, options };

  const rootProps = React.useMemo<RadialMoveRootProps>(() => {
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

    const angleFromPage = (pageX: number, pageY: number): number => {
      const { x, y, width, height } = rectRef.current;
      return angleFromPoint(pageX - x, pageY - y, width, height);
    };

    return {
      onLayout: () => {
        // Pre-resolve the window origin/size so the first touch maps correctly.
        measureThen(() => {});
      },
      // Claim the gesture in the CAPTURE phase (touch-down) so the ring owns it
      // before an ancestor ScrollView can begin scrolling; the termination
      // refusal below then holds it for the whole drag.
      onStartShouldSetResponderCapture: () => !stateRef.current.options?.disabled,
      onStartShouldSetResponder: () => !stateRef.current.options?.disabled,
      onMoveShouldSetResponder: () => !stateRef.current.options?.disabled,
      // Keep the responder for the whole drag so moves outside the ring still track.
      onResponderTerminationRequest: () => false,
      onResponderGrant: (event) => {
        if (stateRef.current.options?.disabled) return;
        // Capture coords before the async measure (the event may be recycled).
        const { pageX, pageY } = event.nativeEvent;
        stateRef.current.options?.onScrubStart?.();
        // Re-measure on grant: the ring may have moved (scroll, layout shift)
        // since `onLayout`, and a tap must land on the right angle.
        measureThen(() => stateRef.current.onChange(angleFromPage(pageX, pageY)));
      },
      onResponderMove: (event) => {
        if (stateRef.current.options?.disabled) return;
        const { pageX, pageY } = event.nativeEvent;
        stateRef.current.onChange(angleFromPage(pageX, pageY));
      },
      onResponderRelease: (event) => {
        const { pageX, pageY } = event.nativeEvent;
        const final = stateRef.current.onChange(angleFromPage(pageX, pageY));
        stateRef.current.options?.onScrubEnd?.();
        stateRef.current.options?.onChangeEnd?.(final);
      },
      onResponderTerminate: () => {
        stateRef.current.options?.onScrubEnd?.();
      },
    };
  }, []);

  return { ref, rootProps };
}
