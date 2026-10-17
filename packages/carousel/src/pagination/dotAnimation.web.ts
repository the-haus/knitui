import * as React from "react";
import type { SharedValue } from "react-native-reanimated";

import { Box } from "@knitui/components";
import type { ViewStyle } from "@knitui/core";

import { useSharedValueListener } from "../hooks/useSharedValueListener";
import { transformToCss } from "../view/transformToCss";
import type { DotHost, DotStyleFn } from "./dotAnimation";

export type { DotHost, DotStyleFn } from "./dotAnimation";

function applyStyle(el: HTMLElement, style: ViewStyle): void {
  const s = style as Record<string, unknown>;
  el.style.transform = transformToCss(s.transform);
  el.style.opacity = s.opacity != null ? String(s.opacity) : "";
}

/**
 * Web twin of `./dotAnimation`: the dot's fill transform painted imperatively
 * onto its DOM node from a `progress` listener (what the shared file's web
 * branch always did), without Reanimated's `useAnimatedStyle` / `Animated.View`
 * — so no web bundle reaches `react-native-reanimated`.
 */
export function useDotHost(
  progress: SharedValue<number>,
  compute: DotStyleFn,
  _deps: unknown[],
): DotHost {
  const elRef = React.useRef<HTMLElement | null>(null);

  useSharedValueListener(progress, (p) => {
    if (elRef.current) applyStyle(elRef.current, compute(p));
  });

  const setRef = React.useCallback((el: unknown) => {
    elRef.current = (el as HTMLElement | null) ?? null;
  }, []);

  return {
    Host: Box as unknown as React.ComponentType<Record<string, unknown>>,
    setRef,
    // A first-frame style before the listener fires.
    hostStyle: compute(progress.value),
  };
}
