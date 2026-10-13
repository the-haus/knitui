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

/** The style keys every native transition animates; the hidden frame names them all. */
const ALL_ANIMATED_KEYS = ["transform", "opacity"];

/**
 * Hand `child` the Tamagui `transition` prop (and what it animates).
 *
 * EVERY element this component returns goes through here, the hidden
 * `keepMounted` frame and the reduced-motion frames included, with `null` when
 * there is nothing to animate. Tamagui decides whether a view is animated by the
 * PRESENCE of the `transition` key, and runs extra hooks (`usePresence`, the
 * driver's) for an animated one. A child that mounted without the key and got it
 * a render later — `keepMounted` with `mounted={false}`, then `mounted` — changed
 * its hook order: React threw "Rendered more hooks than during the previous
 * render" on native. With the key always there the hooks never change.
 */
const withTransition = (
  child: React.ReactElement,
  value: unknown,
  keys: string[] = ALL_ANIMATED_KEYS,
): React.ReactElement => {
  if (!React.isValidElement(child) || child.type === React.Fragment) return child;
  const childProps = child.props as {
    transition?: unknown;
    animateOnly?: string[];
  };
  return React.cloneElement(child, {
    transition: "transition" in childProps ? childProps.transition : value,
    animateOnly: childProps.animateOnly ?? keys,
  } as Partial<typeof childProps>);
};

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
    if (mounted) return withTransition(children({}), null);
    return keepMounted ? withTransition(children({ display: "none" }), null) : null;
  }

  const timed = [resolveTransition(transitionTimingFunction), { duration: transitionDuration }];
  const isExited = transitionStatus === "exited";

  if (isExited && !mounted) {
    return keepMounted ? withTransition(children({ display: "none" }), timed) : null;
  }

  const styles = getTransitionStyles({
    transition,
    duration: transitionDuration,
    state: transitionStatus,
    timingFunction: transitionTimingFunction,
  });
  const keys = animatedKeys(styles);

  return withTransition(children(styles), timed, keys.length > 0 ? keys : ALL_ANIMATED_KEYS);
}
