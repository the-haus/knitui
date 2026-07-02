import type * as React from "react";

import { getTransitionStyles, type MantineTransition, type TransitionStyle } from "./transitions";
import { useTransition } from "./use-transition";

export type {
  MantineTransition,
  TransitionName,
  TransitionStyle,
  TransitionStyles,
} from "./transitions";

/* -------------------------------------------------------------------------- */
/* Transition                                                                 */
/* -------------------------------------------------------------------------- */

export interface TransitionProps {
  /** Keep the child mounted while hidden (renders with `display:"none"`). */
  keepMounted?: boolean;
  /** Transition preset name or a custom `{ in; out; common?; transitionProperty }`. @default "fade" */
  transition?: MantineTransition;
  /** Enter transition duration in ms. @default 250 */
  duration?: number;
  /** Exit transition duration in ms. @default duration */
  exitDuration?: number;
  /** CSS transition timing function. @default "ease" */
  timingFunction?: string;
  /** Whether the element should be mounted. */
  mounted: boolean;
  /** Render function that receives the computed transition styles. */
  children: (styles: TransitionStyle) => React.ReactElement;
  /** Called when the exit transition ends. */
  onExited?: () => void;
  /** Called when the exit transition starts. */
  onExit?: () => void;
  /** Called when the enter transition starts. */
  onEnter?: () => void;
  /** Called when the enter transition ends. */
  onEntered?: () => void;
  /** Delay in ms before the enter transition starts. */
  enterDelay?: number;
  /** Delay in ms before the exit transition starts. */
  exitDelay?: number;
}

/**
 * Single-child mount/unmount animation — mirrors Mantine's `Transition`. A
 * render-prop hands the computed transition `style` to the child, which the
 * consumer spreads onto a `Box` (or any element) `style`. Web uses CSS
 * transitions; the `.native` sibling injects Tamagui transition props and
 * native-safe transform arrays. Respects reduced motion.
 */
export function Transition({
  keepMounted,
  transition = "fade",
  duration = 250,
  exitDuration = duration,
  mounted,
  children,
  timingFunction = "ease",
  onExit,
  onEntered,
  onEnter,
  onExited,
  enterDelay,
  exitDelay,
}: TransitionProps): React.ReactElement | null {
  const { transitionDuration, transitionStatus, transitionTimingFunction } = useTransition({
    mounted,
    exitDuration,
    duration,
    timingFunction,
    onExit,
    onEntered,
    onEnter,
    onExited,
    enterDelay,
    exitDelay,
  });

  if (transitionDuration === 0) {
    if (mounted) return children({});
    return keepMounted ? children({ display: "none" }) : null;
  }

  const isExited = transitionStatus === "exited";

  if (isExited && !mounted) {
    return keepMounted ? children({ display: "none" }) : null;
  }

  return children(
    getTransitionStyles({
      transition,
      duration: transitionDuration,
      state: transitionStatus,
      timingFunction: transitionTimingFunction,
    }),
  );
}
