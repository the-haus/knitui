import type { RefObject } from "react";
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native";

import type { TamaguiElement } from "@knitui/core";

export interface UseRadialMoveOptions {
  /** Called once the gesture finishes (pointer / touch up), with the final value. */
  onChangeEnd?: (value: number) => void;
  /** Called when a scrub gesture starts (pointer / touch down). */
  onScrubStart?: () => void;
  /** Called when a scrub gesture ends (pointer / touch up). */
  onScrubEnd?: () => void;
  /** Skip wiring while disabled. */
  disabled?: boolean;
}

/**
 * Props the consumer spreads onto the ring root to enable native dragging.
 * Empty on web — there the returned `ref` drives the drag via pointer events.
 */
export interface RadialMoveRootProps {
  onLayout?: (event: LayoutChangeEvent) => void;
  onStartShouldSetResponderCapture?: () => boolean;
  onStartShouldSetResponder?: () => boolean;
  onMoveShouldSetResponder?: () => boolean;
  onResponderTerminationRequest?: () => boolean;
  onResponderGrant?: (event: GestureResponderEvent) => void;
  onResponderMove?: (event: GestureResponderEvent) => void;
  onResponderRelease?: (event: GestureResponderEvent) => void;
  onResponderTerminate?: (event: GestureResponderEvent) => void;
}

export interface UseRadialMoveReturn {
  ref: RefObject<TamaguiElement | null>;
  rootProps: RadialMoveRootProps;
}

/** Wrap any degree value into the `[0, 360)` range. */
export const normalizeAngle = (deg: number): number => {
  const v = deg % 360;
  return v < 0 ? v + 360 : v;
};

/** Angle (0–359) of a point relative to the centre of a `width × height` box. */
export const angleFromPoint = (x: number, y: number, width: number, height: number): number => {
  const deg = Math.atan2(y - height / 2, x - width / 2) * (180 / Math.PI) + 90;
  return normalizeAngle(deg);
};
