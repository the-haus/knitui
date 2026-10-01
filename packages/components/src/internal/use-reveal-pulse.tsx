import * as React from "react";

import { useReducedMotion } from "@knitui/hooks";

import { injectKeyframes } from "./keyframes-web";
import { resolveRevealPulse, type RevealPulseMotion } from "./use-reveal-pulse.shared";

export type { RevealPulseMotion } from "./use-reveal-pulse.shared";

/**
 * Inline `animation*` longhands for the reveal-then-pulse timeline (web). Spread
 * through the host `style` prop for the same reason as `useLoopingAnimation`'s:
 * the `animation*` keys are not modeled Tamagui style props, and Tamagui forwards
 * an inline `style` object straight to the DOM node.
 */
export interface RevealPulseStyle {
  style: {
    animationName: string;
    animationDuration: string;
    animationTimingFunction: string;
    animationDelay: string;
    animationIterationCount: string;
    animationDirection: string;
    animationFillMode: string;
  };
}

/** The element a reveal pulse mounts on — identity on web (CSS needs no host). */
export const asRevealHost = <C extends React.ComponentType<any>>(Component: C): C => Component;

const FADE = "knitui-reveal-in";

/**
 * Reveal-then-pulse (web): ONE element runs two CSS animations — a one-shot fade
 * (`fill-mode: both`, so it holds at 0 through its delay and at 1 after) and the
 * infinite pulse, listed LAST so it wins the `opacity` cascade once it starts
 * (no fill on the pulse, so it doesn't apply until its own delay elapses). All
 * on the compositor: no timers, no re-render. See `use-reveal-pulse.shared.ts`.
 */
export function useRevealPulse(motion?: RevealPulseMotion): RevealPulseStyle {
  const reduced = useReducedMotion();
  const { delayMs, fadeMs, durationMs, minOpacity, pulse } = resolveRevealPulse(motion);
  const pulsing = pulse && !reduced && durationMs > 0 && minOpacity < 1;
  const pulseName = `knitui-reveal-pulse-${String(minOpacity).replace(".", "_")}`;

  // Inject during render (idempotent) so the rules exist before first paint.
  injectKeyframes(FADE, "from{opacity:0}to{opacity:1}");
  if (pulsing) injectKeyframes(pulseName, `from{opacity:1}to{opacity:${minOpacity}}`);

  return React.useMemo<RevealPulseStyle>(() => {
    // Reduced motion: keep the hold, snap in (a 1ms fade, not 0 — a zero-length
    // animation with a delay is dropped by some engines before it applies).
    const fade = reduced ? 1 : Math.max(1, fadeMs);
    if (!pulsing) {
      return {
        style: {
          animationName: FADE,
          animationDuration: `${fade}ms`,
          animationTimingFunction: "ease-out",
          animationDelay: `${delayMs}ms`,
          animationIterationCount: "1",
          animationDirection: "normal",
          animationFillMode: "both",
        },
      };
    }
    return {
      style: {
        animationName: `${FADE}, ${pulseName}`,
        animationDuration: `${fade}ms, ${durationMs}ms`,
        animationTimingFunction: "ease-out, ease-in-out",
        animationDelay: `${delayMs}ms, ${delayMs + fade}ms`,
        animationIterationCount: "1, infinite",
        animationDirection: "normal, alternate",
        animationFillMode: "both, none",
      },
    };
  }, [reduced, pulsing, pulseName, delayMs, fadeMs, durationMs]);
}
