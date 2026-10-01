import * as React from "react";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "@knitui/hooks";

import { resolveRevealPulse, type RevealPulseMotion } from "./use-reveal-pulse.shared";

export type { RevealPulseMotion } from "./use-reveal-pulse.shared";

/** The reanimated animated style returned by {@link useRevealPulse}. */
export interface RevealPulseStyle {
  style: ReturnType<typeof useAnimatedStyle>;
}

/**
 * Promote a frame so a {@link useRevealPulse} style can ride on it (native): an
 * animated style may only land on an `Animated.*` host — same move as
 * `asLoopHost`. Web sibling is the identity.
 */
export const asRevealHost = <C extends React.ComponentType<any>>(Component: C): C =>
  Animated.createAnimatedComponent(Component as React.ComponentClass<unknown>) as unknown as C;

const PULSE_EASING = Easing.bezier(0.42, 0, 0.58, 1);
const FADE_EASING = Easing.out(Easing.quad);

/**
 * Reveal-then-pulse (native): ONE shared value on the UI thread runs the whole
 * timeline — `withDelay(hold, withSequence(fade, withRepeat(pulse)))` — so a
 * silhouette of any number of blocks costs one animated node and no JS frames.
 * See `use-reveal-pulse.shared.ts` for the timeline.
 */
export function useRevealPulse(motion?: RevealPulseMotion): RevealPulseStyle {
  const reduced = useReducedMotion();
  const { delayMs, fadeMs, durationMs, minOpacity, pulse } = resolveRevealPulse(motion);
  const pulsing = pulse && !reduced && durationMs > 0 && minOpacity < 1;
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    const fadeIn = withTiming(1, { duration: reduced ? 0 : fadeMs, easing: FADE_EASING });
    const timeline = pulsing
      ? withSequence(
          fadeIn,
          withRepeat(
            withTiming(minOpacity, { duration: durationMs, easing: PULSE_EASING }),
            -1,
            true,
          ),
        )
      : fadeIn;
    opacity.value = 0;
    opacity.value = delayMs > 0 ? withDelay(delayMs, timeline) : timeline;
    return () => {
      // Assigning cancels the running animation; a re-run starts clean.
      opacity.value = 0;
    };
  }, [opacity, reduced, pulsing, delayMs, fadeMs, durationMs, minOpacity]);

  const style = useAnimatedStyle(() => {
    "worklet";
    return { opacity: opacity.value };
  });

  return { style };
}
