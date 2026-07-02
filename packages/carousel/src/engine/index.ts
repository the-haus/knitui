/**
 * @knitui/carousel motion engine — platform-free, reanimated-free, DOM-free.
 *
 * Everything here is a pure function over the signed scroll offset and is
 * directly unit-tested in `./__tests__`. The reanimated/worklet driver and the
 * React views consume these from `src/motion` and `src/view`.
 */

export * from "./itemProgress";
export * from "./offset";
export * from "./settle";
export type { CarouselMode, SettleInput, SettleResult } from "./types";
export * from "./window";
