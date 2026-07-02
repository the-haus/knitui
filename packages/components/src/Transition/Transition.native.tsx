import * as React from "react";

import { resolveTransition } from "../internal/style-props";
import {
  getTransitionStyles,
  type MantineTransition,
  type TransitionStyle,
} from "./transitions.native";
import { useTransition } from "./use-transition";

export type {
  MantineTransition,
  TransitionName,
  TransitionStyle,
  TransitionStyles,
} from "./transitions.native";

const animatedKeys = (styles: TransitionStyle): string[] => {
  const keys: string[] = [];
  if (styles.transform) keys.push("transform");
  if (styles.opacity !== undefined) keys.push("opacity");
  return keys;
};

export interface TransitionProps {
  keepMounted?: boolean;
  transition?: MantineTransition;
  duration?: number;
  exitDuration?: number;
  timingFunction?: string;
  mounted: boolean;
  children: (styles: TransitionStyle) => React.ReactElement;
  onExited?: () => void;
  onExit?: () => void;
  onEnter?: () => void;
  onEntered?: () => void;
  enterDelay?: number;
  exitDelay?: number;
}

/**
 * Native counterpart to the web Transition. It keeps the render-prop contract,
 * but injects Tamagui's `transition` prop into the child so RN animates the
 * returned opacity/transform style through the native animation driver.
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

  const styles = getTransitionStyles({
    transition,
    duration: transitionDuration,
    state: transitionStatus,
    timingFunction: transitionTimingFunction,
  });
  const child = children(styles);
  const keys = animatedKeys(styles);

  if (!React.isValidElement(child) || child.type === React.Fragment || keys.length === 0) {
    return child;
  }

  const childProps = child.props as {
    transition?: unknown;
    animateOnly?: string[];
  };

  return React.cloneElement(child, {
    transition: childProps.transition ?? [
      resolveTransition(transitionTimingFunction),
      { duration: transitionDuration },
    ],
    animateOnly: childProps.animateOnly ?? keys,
  } as Partial<typeof childProps>);
}
