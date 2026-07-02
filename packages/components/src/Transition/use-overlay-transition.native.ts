import { DURATIONS } from "@knitui/core";

import { type MotionPresetName, useMotionConfig } from "../internal/motion";
import { resolveTransition, type TransitionValue } from "../internal/style-props";
import {
  getTransitionStyles,
  type MantineTransition,
  type TransitionStyle,
} from "./transitions.native";
import { useTransition } from "./use-transition";

/**
 * Map a kit {@link MotionPresetName} onto the overlay engine's preset vocabulary
 * (native). Mirror of the web sibling so the `animation` prop behaves identically
 * across platforms.
 */
const toOverlayTransition = (name: MotionPresetName): MantineTransition => {
  if (name === "pop-up" || name === "pop-down") return "pop";
  if (name === "zoom") return "scale";
  return name as MantineTransition;
};

/**
 * The Mantine-style `transitionProps` object accepted by the floating overlays
 * (`Popover`, `Tooltip`, `HoverCard`). Mirrors the playground props of the
 * {@link Transition} component, minus the lifecycle plumbing the overlay owns.
 */
export interface OverlayTransitionConfig {
  /** Transition preset name or a custom `{ in; out; transitionProperty }`. @default 'fade' */
  transition?: MantineTransition;
  /** Enter transition duration in ms. @default 150 */
  duration?: number;
  /** Exit transition duration in ms. @default duration */
  exitDuration?: number;
  /** CSS transition timing function. @default 'ease-in-out' */
  timingFunction?: string;
}

export interface UseOverlayTransitionOptions extends OverlayTransitionConfig {
  /** Whether the overlay should be open/visible. */
  mounted: boolean;
  /** Keep the frame in the tree (hidden via `display:none`) once fully exited. */
  keepMounted?: boolean;
  /**
   * Kit motion-preset name — the unified `animation` vocabulary shared with
   * Modal/Dialog/Drawer. Mapped onto the overlay preset set; an explicit
   * `transitionProps.transition` wins if both are given.
   */
  animation?: MotionPresetName;
}

export interface OverlayTransitionResult {
  /** Render the frame at all — `false` once it has fully exited and is not kept mounted. */
  rendered: boolean;
  /** Hide via `display:none` — a kept-mounted frame that has fully exited. */
  hidden: boolean;
  /** Animated style to spread onto the frame's `style`. */
  style: TransitionStyle;
  /**
   * Tamagui animation-driver props for the frame: `transition` picks the easing
   * curve + exact duration and `animateOnly` scopes the driver to the opacity/
   * transform that actually change, so the floating-ui `top`/`left` stay instant.
   */
  animation: { transition?: TransitionValue; animateOnly?: string[] };
}

const DEFAULT_TRANSITION: MantineTransition = "fade";
const DEFAULT_DURATION = DURATIONS.fast;
const DEFAULT_TIMING = "ease-in-out";

const animatedKeys = (style: TransitionStyle): string[] => {
  const keys: string[] = [];
  if (style.transform) keys.push("transform");
  if (style.opacity !== undefined) keys.push("opacity");
  return keys;
};

/**
 * Native counterpart to {@link useOverlayTransition} (web). Same lifecycle +
 * presets + easing, but applies the animation through Tamagui's native driver:
 * the returned `style` carries the opacity/transform target and `animation`
 * carries `{ transition, animateOnly }` to spread onto the same frame. Reduced
 * motion collapses the duration to `0` (handled by {@link useTransition}),
 * yielding an instant, animation-free show/hide.
 */
export function useOverlayTransition({
  mounted,
  keepMounted = false,
  transition,
  animation,
  duration = DEFAULT_DURATION,
  exitDuration,
  timingFunction = DEFAULT_TIMING,
}: UseOverlayTransitionOptions): OverlayTransitionResult {
  const config = useMotionConfig();
  const preset: MantineTransition =
    transition ?? (animation ? toOverlayTransition(animation) : DEFAULT_TRANSITION);
  const scale = config.disabled ? 0 : config.durationScale;
  const { transitionDuration, transitionStatus, transitionTimingFunction } = useTransition({
    mounted,
    duration: Math.round(duration * scale),
    exitDuration: Math.round((exitDuration ?? duration) * scale),
    timingFunction,
  });

  if (transitionDuration === 0) {
    return {
      rendered: mounted || keepMounted,
      hidden: !mounted,
      style: {},
      animation: {},
    };
  }

  if (transitionStatus === "exited" && !mounted) {
    return { rendered: keepMounted, hidden: keepMounted, style: {}, animation: {} };
  }

  const style = getTransitionStyles({
    transition: preset,
    state: transitionStatus,
    duration: transitionDuration,
    timingFunction: transitionTimingFunction,
  });
  const keys = animatedKeys(style);

  return {
    rendered: true,
    hidden: false,
    style,
    animation: keys.length
      ? {
          transition: [
            resolveTransition(transitionTimingFunction),
            { duration: transitionDuration },
          ],
          animateOnly: keys,
        }
      : {},
  };
}
