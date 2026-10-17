import type * as React from "react";
import { GestureDetector, type PanGesture } from "react-native-gesture-handler";

/**
 * Attaches the drag-to-dismiss pan (`useDragDismiss`) to its one child: RNGH's
 * `GestureDetector`. Web twin: `DragDismissDetector.tsx` (pointer events).
 */
export function DragDismissDetector({
  gesture,
  children,
}: {
  gesture: PanGesture;
  children: React.ReactElement;
}) {
  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}
