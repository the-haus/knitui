import * as React from "react";
import Animated, { type SharedValue, useAnimatedStyle } from "react-native-reanimated";

import { Box } from "@knitui/components";
import { isWeb, type ViewStyle } from "@knitui/core";

import { useSharedValueListener } from "../hooks/useSharedValueListener";
import { transformToCss } from "../view/transformToCss";
import { type DotActiveFn, useSelectedDot } from "./selectedDot";

/** Maps the carousel's fractional progress to a dot's transform/opacity. */
export type DotStyleFn = (progress: number) => ViewStyle;
/** Re-exported from `./selectedDot`, the single source of truth for dot selection. */
export type { DotActiveFn };

export interface DotHost {
  /** Whether this dot is the selected one (drives a11y + active styling). */
  selected: boolean;
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
 * The `selected` boolean (a11y + active styling) is delegated to
 * `useSelectedDot`, which owns the platform split for reading the SharedValue
 * (native UI-thread `useAnimatedReaction` / web JS-thread listener) and is the
 * single source of truth for dot selection. `compute` / `isActive` must be
 * worklets so the native UI-thread paths can run them.
 */
export function useDotHost(
  progress: SharedValue<number>,
  compute: DotStyleFn,
  isActive: DotActiveFn,
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

  // `useSelectedDot` copies `deps` internally, so sharing the array with
  // `useAnimatedStyle` above is safe (no in-place mutation collision).
  const selected = useSelectedDot(progress, isActive, deps);

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
    selected,
    Host: (isWeb ? Box : Animated.View) as React.ComponentType<Record<string, unknown>>,
    setRef,
    // Web needs a first-frame style before the listener fires; native applies the
    // live animated style.
    hostStyle: isWeb ? compute(progress.value) : (animatedStyle as ViewStyle),
  };
}
