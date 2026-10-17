import type { SheetScrollGesture } from "./drag.types";

/**
 * No scroller gesture on the web: the browser owns nested scrolling, and the
 * drag (`useSheetDrag.ts`) leaves it alone.
 */
export function useScrollGesture(): SheetScrollGesture | undefined {
  return undefined;
}
