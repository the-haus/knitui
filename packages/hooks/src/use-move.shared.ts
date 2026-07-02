import type { RefObject } from "react";
import type { GestureResponderEvent, LayoutChangeEvent } from "react-native";

import type { TamaguiElement } from "@knitui/core";

export interface MovePosition {
  x: number;
  y: number;
}

export interface UseMoveHandlers {
  /** Called when a scrub gesture starts (pointer / touch down). */
  onScrubStart?: () => void;
  /** Called when a scrub gesture ends (pointer / touch up). */
  onScrubEnd?: () => void;
}

/**
 * Props the consumer spreads onto the move area to enable native dragging.
 * Empty on web — there the returned `ref` drives the drag via pointer events.
 */
export interface MoveRootProps {
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

export interface UseMoveReturn {
  ref: RefObject<TamaguiElement | null>;
  rootProps: MoveRootProps;
}

/** Clamp a normalized position into the `[0, 1]` square. */
export const clampMovePosition = (position: MovePosition): MovePosition => ({
  x: Math.max(0, Math.min(1, position.x)),
  y: Math.max(0, Math.min(1, position.y)),
});
