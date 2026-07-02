/**
 * @knitui/sheet motion engine — platform-free, reanimated-free, DOM-free.
 *
 * Every function is pure over the panel's signed `offset` and is directly
 * unit-tested in `./__tests__`. The reanimated/worklet driver and the React
 * views consume these from `src/motion`, `src/input`, and `src/view`.
 */

export * from "./overlay";
export * from "./settle";
export * from "./snap";
export type { SettleInput, SettleResult } from "./types";
