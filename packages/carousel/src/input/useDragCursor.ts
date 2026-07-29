import type * as React from "react";

export interface DragCursorParams {
  /** Ref to the carousel host element (the DOM node on web). */
  hostRef: React.RefObject<unknown>;
  /** Whether dragging is available — no affordance when the drag is disabled. */
  enabled: boolean;
}

/** Native no-op: there is no mouse cursor to change on a touch device. */

export function useDragCursor(_params: DragCursorParams): void {}
