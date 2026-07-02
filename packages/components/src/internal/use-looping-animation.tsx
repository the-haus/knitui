import * as React from "react";

import { useReducedMotion } from "@knitui/hooks";

import { Box } from "../Box";
import { injectKeyframes } from "./keyframes-web";
import { type LoopMotion, resolveMotion } from "./use-looping-animation.shared";

export type {
  LoopMotion,
  PulseMotion,
  ShimmerMotion,
  SpinMotion,
} from "./use-looping-animation.shared";

/**
 * Web inline `animation*` style block applied to the Tamagui element. We DELIBERATELY
 * spread these via the host `style` prop (not Tamagui style props): under the kit's
 * `allowedStyleValues: "somewhat-strict-web"` config the `animation*` keys are not
 * modeled style props, and the web target is Tamagui-DOM (no `animationKeyframes`).
 * Tamagui forwards an inline `style` object straight to the DOM node, so the loop
 * runs on the compositor with zero re-renders. Verified by the render test.
 */
export interface LoopStyle {
  style: {
    animationName: string;
    animationDuration: string;
    animationTimingFunction: string;
    animationIterationCount: "infinite";
    animationDirection?: "alternate";
    /** Static fallback frame (reduced motion) for shimmer/pulse — no animation. */
    transform?: string;
    opacity?: number;
  };
}

/** The element a looping animation mounts on. On web it's a plain {@link Box}. */
export const LoopView = Box;

/**
 * Promote a frame component so a {@link useLoopingAnimation} `style` can ride on it
 * directly (web). The web loop is a plain inline `animation*` CSS object, which any
 * element accepts, so this is the identity — the `.native` sibling wraps the frame in
 * `Animated.createAnimatedComponent` so the reanimated animated style has a valid host.
 * Mirrors {@link LoopView}: same call shape, platform-specific body.
 */
export const asLoopHost = <C extends React.ComponentType<any>>(Component: C): C => Component;

/** Stable keyframes name per motion shape — distinct bodies get distinct names. */
function keyframesFor(motion: ReturnType<typeof resolveMotion>): {
  name: string;
  body: string;
  timing: string;
  alternate: boolean;
} {
  switch (motion.kind) {
    case "spin":
      return {
        name: "knitui-loop-spin",
        body: "from{transform:rotate(0deg)}to{transform:rotate(360deg)}",
        timing: "linear",
        alternate: false,
      };
    case "pulse": {
      // One half-cycle keyframe + `alternate` direction = a seamless throb.
      const min = motion.minOpacity;
      return {
        name: `knitui-loop-pulse-${String(min).replace(".", "_")}`,
        body: `from{opacity:1}to{opacity:${min}}`,
        timing: "ease-in-out",
        alternate: true,
      };
    }
    case "shimmer": {
      const d = motion.distance;
      const axis = motion.axis === "y" ? "Y" : "X";
      return {
        name: `knitui-loop-shimmer-${axis}-${String(d).replace(/[.-]/g, "_")}`,
        body: `from{transform:translate${axis}(0px)}to{transform:translate${axis}(${d}px)}`,
        timing: "linear",
        alternate: false,
      };
    }
  }
}

/** The static frame rendered under reduced motion (no animation, no timer). */
function staticStyle(motion: ReturnType<typeof resolveMotion>): LoopStyle["style"] {
  const base = {
    animationName: "none",
    animationDuration: "0s",
    animationTimingFunction: "linear",
    animationIterationCount: "infinite",
  } as const;
  if (motion.kind === "pulse") return { ...base, opacity: 1 };
  return base;
}

/**
 * Shared looping-animation primitive (web). Returns a {@link LoopStyle} to spread
 * onto a Tamagui element (e.g. {@link LoopView}); the loop runs purely on the CSS
 * compositor via an injected `@keyframes` rule + inline `animation*` style — no
 * `setInterval`, no per-frame re-render. Honors {@link useReducedMotion}: when the
 * user prefers reduced motion it returns a static first frame with no animation.
 *
 * The `.native` sibling implements the identical {@link LoopMotion} vocabulary on
 * reanimated's UI thread.
 */
export function useLoopingAnimation(motion: LoopMotion): LoopStyle {
  const reduced = useReducedMotion();
  const resolved = resolveMotion(motion);

  // Inject during render (idempotent) so the rule exists before first paint.
  const { name, body, timing, alternate } = keyframesFor(resolved);
  if (!reduced) injectKeyframes(name, body);

  return React.useMemo<LoopStyle>(() => {
    if (reduced) return { style: staticStyle(resolved) };
    return {
      style: {
        animationName: name,
        animationDuration: `${resolved.durationMs}ms`,
        animationTimingFunction: timing,
        animationIterationCount: "infinite",
        ...(alternate ? { animationDirection: "alternate" } : null),
      },
    };
    // `resolved` is recomputed each render but value-stable per motion shape; the
    // primitive deps are what actually change the returned style.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, name, timing, alternate, resolved.durationMs]);
}
