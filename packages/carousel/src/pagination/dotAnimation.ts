import * as React from "react";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";

import { Box } from "@knitui/components";
import { isWeb, type ViewStyle } from "@knitui/core";

import { useSharedValueListener } from "../hooks/useSharedValueListener";
import { transformToCss } from "../view/transformToCss";

/** Maps the carousel's fractional progress to a dot's transform/opacity. */
export type DotStyleFn = (progress: number) => ViewStyle;

export interface DotHost {
  /** Host element for the animated layer: `Animated.View` (native) / `Box` (web). */
  Host: React.ComponentType<Record<string, unknown>>;
  /** Web-only callback ref capturing the node the listener paints; no-op on native. */
  setRef: (el: unknown) => void;
  /** Style to put on the host: the live animated style (native) / first-paint style (web). */
  hostStyle: ViewStyle;
}

function applyStyle(el: HTMLElement, style: ViewStyle): void {
  const s = style as Record<string, unknown>;
  el.style.transform = transformToCss(s.transform);
  el.style.opacity = s.opacity != null ? String(s.opacity) : "";
}

/**
 * Dot animation host — one cross-platform file (no `.web` split).
 *
 * The continuous fill transform stays on the most appropriate driver per
 * platform: native keeps a Reanimated `useAnimatedStyle` (UI-thread worklet);
 * web paints the same `compute` output imperatively onto the dot's DOM node,
 * because Reanimated's style mapper does not re-run on shared-value changes
 * under this repo's web tooling (see `view/painter.web`).
 *
 * Selection (a11y + active styling) is NOT read here: the row derives it once
 * with `useSelectedIndex` and passes the boolean in, so a row of dots costs one
 * subscription to `progress` rather than one per dot. `compute` must be a worklet
 * so the native UI-thread path can run it.
 */
export function useDotHost(
  progress: SharedValue<number>,
  compute: DotStyleFn,
  deps: unknown[],
): DotHost {
  const elRef = React.useRef<HTMLElement | null>(null);

  // Native drives the transform on the UI thread. On web this still runs but its
  // result is unused (we paint via the ref instead) — calling it unconditionally
  // keeps the hook order stable across platforms, so this stays one file.
  const animatedStyle = useAnimatedStyle(() => {
    "worklet";
    return compute(progress.value);
  }, deps);

  // Web: paint the transform imperatively — the UI-thread `useAnimatedStyle`
  // above doesn't re-run on value changes under this repo's web tooling.
  useSharedValueListener(
    progress,
    (p) => {
      if (elRef.current) applyStyle(elRef.current, compute(p));
    },
    isWeb,
  );

  const setRef = React.useCallback((el: unknown) => {
    elRef.current = (el as HTMLElement | null) ?? null;
  }, []);

  return {
    Host: (isWeb ? Box : Animated.View) as React.ComponentType<Record<string, unknown>>,
    setRef,
    // Web needs a first-frame style before the listener fires; native applies the
    // live animated style.
    hostStyle: isWeb ? compute(progress.value) : (animatedStyle as ViewStyle),
  };
}
