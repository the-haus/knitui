/**
 * @knitui/sheet — a cross-platform (React Native + Web) bottom sheet.
 *
 * Native-first: the snap math lives in a platform-free, reanimated-free engine
 * (`./engine`, re-exported below for advanced use); the gesture is one RNGH
 * `Gesture.Pan` shared by both platforms; the panel animates declaratively on
 * native (`useAnimatedStyle`) and via an imperative painter on web. See
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
export { DEFAULT_SPRING } from "./motion/animate";
export { Sheet } from "./Sheet";
export type { SheetProps, SheetRef, SheetSize } from "./types";
export { SheetScrollView, type SheetScrollViewProps } from "./view/ScrollView";
