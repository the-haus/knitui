/**
 * Drag-to-dismiss primitive (reanimated + RNGH), ported from `@knitui/sheet`'s
 * gesture/animation approach and simplified to a single dismiss threshold.
 *
 * Lives in the `Modal` folder and is shared by `Modal` (axis `y`, sign `+1`) and
 * `Drawer` (per-edge axis/sign, imported via `../Modal/drag`). The pure math is in
 * `./engine`; the gesture in `./useDragDismiss`; the animated translate host and
 * the offset-driven scrim are platform-split (`*.tsx` native / `*.web.tsx`).
 */
export { DragDismissHost } from "./DragDismissHost";
export { DragDismissOverlay } from "./DragDismissOverlay";
export { type DismissDecisionInput, dragOverlayOpacity, shouldDismiss } from "./engine";
export type { DragDismissHostProps, DragDismissOverlayProps, PointerEventsMode } from "./types";
export {
  DEFAULT_DISMISS_SPRING,
  type DragAxis,
  type DragDismissParams,
  useDragDismiss,
} from "./useDragDismiss";
