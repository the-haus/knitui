import * as React from "react";

import { DragValue } from "./drag-value";

/**
 * The drag travel `useDragDismiss` writes and the host / scrim paint from, at
 * rest (0). Web: the kit's `DragValue` (no reanimated). Native twin:
 * `useDragOffset.native.ts` (a Reanimated shared value).
 */
export function useDragOffset(): DragValue {
  const ref = React.useRef<DragValue | null>(null);
  if (!ref.current) ref.current = new DragValue(0);
  const value = ref.current;
  // A spring still running when the panel unmounts must not keep painting.
  React.useEffect(() => () => value.cancel(), [value]);
  return value;
}
