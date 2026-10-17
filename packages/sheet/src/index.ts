/**
 * @knitui/sheet — a cross-platform (React Native + Web) bottom sheet.
 *
 * Native-first: the snap math lives in a platform-free, reanimated-free engine
 * (`./engine`, re-exported below for advanced use). Native drags with an RNGH
 * `Gesture.Pan` and animates on the UI thread with reanimated; the web build
 * reaches neither — a pointer-events drag, a `requestAnimationFrame` spring and
 * an imperative painter over the same engine (the `.native` twins split them). See
 * `docs/sheet-package-plan.md` for the full design.
 */

export {
  SHEET_SLOT_KEYS,
  SheetFooter,
  SheetFrame,
  SheetHandleBar,
  SheetHandleRow,
  SheetHeader,
  type SheetStyles,
} from "./chrome";
export * as engine from "./engine";
export { DEFAULT_SPRING, type SheetSpringConfig } from "./motion/spring-config";
export { Sheet } from "./Sheet";
export type { SheetProps, SheetRef, SheetSize } from "./types";
export { SheetScrollView, type SheetScrollViewProps } from "./view/ScrollView";
