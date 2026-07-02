import type { SharedValue } from "react-native-reanimated";

import type { AnimationStyle } from "../types";

/** A registered slide element + its per-item progress value. */
export interface PainterEntry {
  el: unknown;
  progress: SharedValue<number>;
}

/** Register (or, with `null`, unregister) a slide element for imperative painting. */
export type RegisterFn = (index: number, entry: PainterEntry | null) => void;

export interface WebPainterParams {
  offset: SharedValue<number>;
  size: SharedValue<number>;
  count: number;
  loop: boolean;
  animationStyle: AnimationStyle;
  /**
   * Called (web only) with the new rounded scroll center whenever it changes.
   * On web, `useAnimatedReaction` does not re-run on shared-value changes (the
   * same tooling limitation the painter exists for), so the painter's offset
   * listener drives the virtualization-window advance — and thus async
   * `ensure()` fetching — instead.
   */
  onCenter?: (center: number) => void;
}

/**
 * Native no-op. On native, items animate via Reanimated's `useAnimatedStyle`
 * (see Item.tsx); there is no imperative painter.
 */
export function useWebPainter(_params: WebPainterParams): RegisterFn {
  return () => {};
}
