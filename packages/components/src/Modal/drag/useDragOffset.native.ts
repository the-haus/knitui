import { type SharedValue, useSharedValue } from "react-native-reanimated";

/**
 * The drag travel `useDragDismiss` writes and the host / scrim paint from, at
 * rest (0): a Reanimated shared value, so the gesture and the paint stay on the
 * UI thread. Web twin: `useDragOffset.ts`.
 */
export function useDragOffset(): SharedValue<number> {
  return useSharedValue(0);
}
