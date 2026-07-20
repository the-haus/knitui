import * as React from "react";

import { useDidUpdate, useReducedMotion } from "@knitui/hooks";

/* -------------------------------------------------------------------------- */
/* Lifecycle state machine                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Transition lifecycle state. Structurally identical to the per-platform
 * `TransitionStatus` exported from `transitions(.native)` (same string-literal
 * union), so the hook stays free of any platform-specific style imports.
 */
export type TransitionStatus =
  "entering" | "entered" | "exiting" | "exited" | "pre-exiting" | "pre-entering";

export interface UseTransitionOptions {
  duration: number;
  exitDuration: number;
  timingFunction: string;
  mounted: boolean;
  onEnter?: () => void;
  onExit?: () => void;
  onEntered?: () => void;
  onExited?: () => void;
  enterDelay?: number;
  exitDelay?: number;
}

export interface UseTransitionResult {
  transitionDuration: number;
  transitionStatus: TransitionStatus;
  transitionTimingFunction: string;
}

/**
 * Timer-driven port of Mantine's `useTransition` (no `react-dom`/`flushSync`, so
 * it stays cross-platform). Drives the `pre-entering → entering → entered` and
 * `pre-exiting → exiting → exited` lifecycle off the `mounted` prop and honours
 * the user's reduced-motion preference (duration collapses to `0`).
 *
 * Shared verbatim by both `Transition.tsx` (web) and `Transition.native.tsx`;
 * only the per-platform style application around it differs.
 */
export function useTransition({
  duration,
  exitDuration,
  timingFunction,
  mounted,
  onEnter,
  onExit,
  onEntered,
  onExited,
  enterDelay,
  exitDelay,
}: UseTransitionOptions): UseTransitionResult {
  const reduceMotion = useReducedMotion();
  const [transitionDuration, setTransitionDuration] = React.useState(reduceMotion ? 0 : duration);
  const [transitionStatus, setStatus] = React.useState<TransitionStatus>(
    mounted ? "entered" : "exited",
  );

  const settleTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const frameTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAll = React.useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    if (delayTimer.current) clearTimeout(delayTimer.current);
    if (frameTimer.current) clearTimeout(frameTimer.current);
  }, []);

  const handleStateChange = React.useCallback(
    (shouldMount: boolean) => {
      clearAll();
      const preHandler = shouldMount ? onEnter : onExit;
      const handler = shouldMount ? onEntered : onExited;
      const next = reduceMotion ? 0 : shouldMount ? duration : exitDuration;
      setTransitionDuration(next);

      if (next === 0) {
        preHandler?.();
        handler?.();
        setStatus(shouldMount ? "entered" : "exited");
        return;
      }

      // Paint the "out" snapshot first, then flip to the target on the next
      // tick so the CSS transition has a starting frame to animate from.
      setStatus(shouldMount ? "pre-entering" : "pre-exiting");
      frameTimer.current = setTimeout(() => {
        preHandler?.();
        setStatus(shouldMount ? "entering" : "exiting");
        settleTimer.current = setTimeout(() => {
          handler?.();
          setStatus(shouldMount ? "entered" : "exited");
        }, next);
      }, 10);
    },
    [clearAll, duration, exitDuration, onEnter, onEntered, onExit, onExited, reduceMotion],
  );

  useDidUpdate(() => {
    clearAll();
    const delay = mounted ? enterDelay : exitDelay;
    if (typeof delay !== "number") {
      handleStateChange(mounted);
      return;
    }
    delayTimer.current = setTimeout(() => handleStateChange(mounted), delay);
    // handleStateChange/clearAll are stable for the inputs we care about here.
  }, [mounted]);

  React.useEffect(() => () => clearAll(), [clearAll]);

  return {
    transitionDuration,
    transitionStatus,
    transitionTimingFunction: timingFunction || "ease",
  };
}
