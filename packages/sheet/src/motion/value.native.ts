import { cancelAnimation, type SharedValue, useSharedValue } from "react-native-reanimated";

import type { SheetValue } from "./value.types";

export type { SheetValue } from "./value.types";

/**
 * A reanimated `SharedValue` (NATIVE build): the sheet's values live on the UI
 * thread, where the pan worklet and `useAnimatedStyle` read and write them.
 */
export function useMotionValue<T>(initial: T): SheetValue<T> {
  return useSharedValue(initial);
}

/** Stop whatever animation is driving `value`, leaving it where it is. */
export function cancelMotion(value: SheetValue<number>): void {
  cancelAnimation(value as SharedValue<number>);
}
