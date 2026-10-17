/**
 * Drag-to-dismiss primitive, ported from `@knitui/sheet`'s gesture/animation
 * approach and simplified to a single dismiss threshold.
 *
 * Lives in the `Modal` folder and is shared by `Modal` (axis `y`, sign `-1`) and
 * `Drawer` (per-edge axis/sign, imported via `../Modal/drag`). The pure math is in
 * `./engine` and the tuning in `./spring`. Everything that moves is
 * platform-split, so the WEB build reaches no react-native-* gesture or
 * animation package:
 *
 * - `useDragOffset` — a Reanimated shared value on native, the kit's
 *   `DragValue` (`./drag-value`) on web;
 * - `useDragDismiss` — RNGH `Gesture.Pan` + `withSpring` on native, pointer
 *   events + `DragValue.animateTo` on web;
 * - `DragDismissDetector` — RNGH's `GestureDetector` on native, a DOM listener
 *   on its child on web;
 * - the translate host and the offset-driven scrim (`*.tsx` native /
 *   `*.web.tsx`).
 */
export { DragDismissDetector } from "./DragDismissDetector";
export { DragDismissHost } from "./DragDismissHost";
export { DragDismissOverlay } from "./DragDismissOverlay";
export { type DismissDecisionInput, dragOverlayOpacity, shouldDismiss } from "./engine";
export type {
  DragDismissHostProps,
  DragDismissOverlayProps,
  DragOffset,
  PointerEventsMode,
} from "./types";
export {
  DEFAULT_DISMISS_SPRING,
  type DragAxis,
  type DragDismissParams,
  useDragDismiss,
} from "./useDragDismiss";
export { useDragOffset } from "./useDragOffset";
