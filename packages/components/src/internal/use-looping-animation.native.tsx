import * as React from "react";
import Animated, {
  Easing,
  type EasingFunction,
  type EasingFunctionFactory,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "@knitui/hooks";

import { type LoopMotion, resolveMotion } from "./use-looping-animation.shared";

export type {
  LoopMotion,
  PulseMotion,
  ShimmerMotion,
  SpinMotion,
} from "./use-looping-animation.shared";

type Easer = EasingFunction | EasingFunctionFactory;

/**
 * The element a looping animation mounts on. On native it's a reanimated
 * `Animated.View` so the {@link useLoopingAnimation} `style` (a `useAnimatedStyle`
 * worklet output) drives on the UI thread. Mirrors `LoopView` on web (a `Box`); the
 * spread API (`<LoopView {...loop} />`) is identical across platforms.
 */
export const LoopView = Animated.View;

/**
 * Promote a frame component into a reanimated host so a {@link useLoopingAnimation}
 * `style` (a `useAnimatedStyle` worklet output) can ride on it directly (native). That
 * style is a reanimated animated style and ONLY an `Animated.*` host may receive it —
 * spread onto a plain RN view (e.g. a Tamagui `styled(Box)` frame) it throws
 * `[Reanimated] Invalid value passed to shareableViewDescriptors`.
 * `createAnimatedComponent` makes the frame such a host while preserving its props,
 * token resolution, and ref forwarding. Web sibling is the identity (CSS handles it).
 */
export const asLoopHost = <C extends React.ComponentType<any>>(Component: C): C =>
  Animated.createAnimatedComponent(Component as React.ComponentClass<unknown>) as unknown as C;

/** The reanimated animated style returned by {@link useLoopingAnimation}. */
export interface LoopStyle {
  style: ReturnType<typeof useAnimatedStyle>;
}

/** Match the web timing curves so motion reads the same on both platforms. */
const LINEAR: Easer = Easing.linear;
const EASE_IN_OUT: Easer = Easing.bezier(0.42, 0, 0.58, 1);

/**
 * Shared looping-animation primitive (native). Returns a {@link LoopStyle} to
 * spread onto {@link LoopView} (an `Animated.View`). A single reanimated
 * `useSharedValue` is driven by `withRepeat(withTiming(...), -1)` on the UI thread
 * — zero JS re-renders, no `setInterval`. The shared value runs `0→1` and the
 * worklet maps it onto the motion's transform/opacity. Honors
 * {@link useReducedMotion}: when reduced, the value pins at the static first frame
 * and no animation is scheduled.
 *
 * Mirrors the web sibling's {@link LoopMotion} vocabulary: `spin` (continuous
 * rotate), `pulse` (alternating opacity), `shimmer` (repeating translate offset).
 */
export function useLoopingAnimation(motion: LoopMotion): LoopStyle {
  const reduced = useReducedMotion();
  const resolved = resolveMotion(motion);

  // `progress` runs 0→1 forever; the worklet interpolates per motion kind. For
  // `pulse` we set `reverse=true` so each cycle ping-pongs (a seamless throb).
  const progress = useSharedValue(0);

  // Destructure motion fields so the effect deps are primitives (stable per shape).
  const kind = resolved.kind;
  const durationMs = resolved.durationMs;
  const minOpacity = resolved.kind === "pulse" ? resolved.minOpacity : 1;
  const distance = resolved.kind === "shimmer" ? resolved.distance : 0;
  const axis = resolved.kind === "shimmer" ? resolved.axis : "x";

  React.useEffect(() => {
    if (reduced) {
      progress.value = 0;
      return undefined;
    }
    const easing = kind === "pulse" ? EASE_IN_OUT : LINEAR;
    const reverse = kind === "pulse";
    progress.value = 0;
    progress.value = withRepeat(withTiming(1, { duration: durationMs, easing }), -1, reverse);
    return () => {
      // Settle the value so a re-mount/dep-change starts clean.
      progress.value = 0;
    };
  }, [reduced, kind, durationMs, progress]);

  const style = useAnimatedStyle(() => {
    "worklet";
    if (reduced) {
      // Static first frame: full opacity, no transform.
      return kind === "pulse" ? { opacity: 1 } : {};
    }
    if (kind === "spin") {
      return { transform: [{ rotate: `${progress.value * 360}deg` }] };
    }
    if (kind === "pulse") {
      return { opacity: 1 - progress.value * (1 - minOpacity) };
    }
    // shimmer
    const offset = progress.value * distance;
    return { transform: axis === "y" ? [{ translateY: offset }] : [{ translateX: offset }] };
  }, [reduced, kind, minOpacity, distance, axis]);

  return { style };
}
