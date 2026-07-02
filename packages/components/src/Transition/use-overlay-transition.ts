import { DURATIONS } from "@knitui/core";

import { type MotionPresetName, useMotionConfig } from "../internal/motion";
import { type TransitionValue } from "../internal/style-props";
import { getTransitionStyles, type MantineTransition, type TransitionStyle } from "./transitions";
import { useTransition } from "./use-transition";

/**
 * Map a kit {@link MotionPresetName} onto the overlay engine's preset vocabulary,
 * so the floating overlays accept the SAME `animation` names as Modal/Dialog/Drawer
 * while keeping their own timer-driven engine. Most names are shared verbatim; the
 * few preset-only names fall back to the closest overlay preset.
 */
export const toOverlayTransition = (name: MotionPresetName): MantineTransition => {
  if (name === "pop-up" || name === "pop-down") return "pop";
  if (name === "zoom") return "scale";
  // Every remaining MotionPresetName exists verbatim in the overlay preset set.
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
   * Modal/Dialog/Drawer. Mapped onto the overlay preset set via
   * {@link toOverlayTransition}. An explicit `transitionProps.transition` wins if
   * both are given.
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
   * Tamagui animation-driver props for the frame. Empty on web (the CSS
   * transition lives in {@link OverlayTransitionResult.style}); on native it
   * carries `{ transition, animateOnly }` so the RN driver animates the returned
   * opacity/transform. See the `.native` sibling.
   */
  animation: { transition?: TransitionValue; animateOnly?: string[] };
}

const DEFAULT_TRANSITION: MantineTransition = "fade";
const DEFAULT_DURATION = DURATIONS.fast;
const DEFAULT_TIMING = "ease-in-out";

/**
 * Drive a portal-anchored floating frame's enter/exit animation off the shared
 * {@link Transition} engine, returning props to spread onto the frame instead of
 * a render-prop child. The {@link Transition} component can't wrap these overlays
 * directly — their animated frame sits *inside* a `Portal`/`Theme` subtree (and on
 * native the render-prop clone would target the `Portal`, not the frame). This hook
 * exposes the same lifecycle + presets + easing so positioning, measurement, and
 * the lazy mount/unmount stay owned by the overlay while the animation is shared.
 *
 * Web build: applies the CSS transition via {@link OverlayTransitionResult.style};
 * `animation` is empty. Reduced motion collapses the duration to `0` (handled by
 * {@link useTransition}), yielding an instant, style-free show/hide.
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
  // Advanced `transitionProps.transition` wins; otherwise the `animation` preset
  // name (mapped to the overlay vocabulary); otherwise the default.
  const preset: MantineTransition =
    transition ?? (animation ? toOverlayTransition(animation) : DEFAULT_TRANSITION);
  // Global motion config: `disabled` collapses to instant, `durationScale` retimes.
  const scale = config.disabled ? 0 : config.durationScale;
  const { transitionDuration, transitionStatus, transitionTimingFunction } = useTransition({
    mounted,
    duration: Math.round(duration * scale),
    exitDuration: Math.round((exitDuration ?? duration) * scale),
    timingFunction,
  });

  // Reduced motion / no animation: show instantly when open, otherwise either keep
  // a hidden placeholder (keepMounted) or drop out of the tree entirely.
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

  return {
    rendered: true,
    hidden: false,
    style: getTransitionStyles({
      transition: preset,
      state: transitionStatus,
      duration: transitionDuration,
      timingFunction: transitionTimingFunction,
    }),
    animation: {},
  };
}
