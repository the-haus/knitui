/**
 * Transition presets — a faithful port of Mantine's `transitions.ts`. Each
 * preset is expressed as web-CSS `transform`/`opacity` strings handed to the
 * render-prop child via `style`; on web (where `Box` renders a real element)
 * the CSS transition applies directly, on native the `opacity` animates and the
 * string `transform` degrades to a no-op (documented platform divergence).
 */

/** A single computed transition style snapshot (subset of web CSS). */
export interface TransitionStyle {
  opacity?: number;
  transform?: string;
  transformOrigin?: string;
  transitionProperty?: string;
  transitionDuration?: string;
  transitionTimingFunction?: string;
  /** Set to `"none"` when `keepMounted` hides a fully-exited child. */
  display?: "none";
}

/** The `in`/`out`/`common` style set that defines a transition. */
export interface TransitionStyles {
  common?: TransitionStyle;
  in: TransitionStyle;
  out: TransitionStyle;
  transitionProperty: string;
}

export type TransitionName =
  | "fade"
  | "fade-down"
  | "fade-up"
  | "fade-left"
  | "fade-right"
  | "skew-up"
  | "skew-down"
  | "rotate-right"
  | "rotate-left"
  | "slide-down"
  | "slide-up"
  | "slide-right"
  | "slide-left"
  | "scale-y"
  | "scale-x"
  | "scale"
  | "pop"
  | "pop-top-left"
  | "pop-top-right"
  | "pop-bottom-left"
  | "pop-bottom-right";

const popIn = (from: "top" | "bottom"): Omit<TransitionStyles, "common"> => ({
  in: { opacity: 1, transform: "scale(1)" },
  out: { opacity: 0, transform: `scale(.9) translateY(${from === "bottom" ? 10 : -10}px)` },
  transitionProperty: "transform, opacity",
});

export const transitions: Record<TransitionName, TransitionStyles> = {
  fade: {
    in: { opacity: 1 },
    out: { opacity: 0 },
    transitionProperty: "opacity",
  },
  "fade-up": {
    in: { opacity: 1, transform: "translateY(0)" },
    out: { opacity: 0, transform: "translateY(30px)" },
    transitionProperty: "opacity, transform",
  },
  "fade-down": {
    in: { opacity: 1, transform: "translateY(0)" },
    out: { opacity: 0, transform: "translateY(-30px)" },
    transitionProperty: "opacity, transform",
  },
  "fade-left": {
    in: { opacity: 1, transform: "translateX(0)" },
    out: { opacity: 0, transform: "translateX(30px)" },
    transitionProperty: "opacity, transform",
  },
  "fade-right": {
    in: { opacity: 1, transform: "translateX(0)" },
    out: { opacity: 0, transform: "translateX(-30px)" },
    transitionProperty: "opacity, transform",
  },
  scale: {
    in: { opacity: 1, transform: "scale(1)" },
    out: { opacity: 0, transform: "scale(0)" },
    common: { transformOrigin: "top" },
    transitionProperty: "transform, opacity",
  },
  "scale-y": {
    in: { opacity: 1, transform: "scaleY(1)" },
    out: { opacity: 0, transform: "scaleY(0)" },
    common: { transformOrigin: "top" },
    transitionProperty: "transform, opacity",
  },
  "scale-x": {
    in: { opacity: 1, transform: "scaleX(1)" },
    out: { opacity: 0, transform: "scaleX(0)" },
    common: { transformOrigin: "left" },
    transitionProperty: "transform, opacity",
  },
  "skew-up": {
    in: { opacity: 1, transform: "translateY(0) skew(0deg, 0deg)" },
    out: { opacity: 0, transform: "translateY(-20px) skew(-10deg, -5deg)" },
    common: { transformOrigin: "top" },
    transitionProperty: "transform, opacity",
  },
  "skew-down": {
    in: { opacity: 1, transform: "translateY(0) skew(0deg, 0deg)" },
    out: { opacity: 0, transform: "translateY(20px) skew(-10deg, -5deg)" },
    common: { transformOrigin: "bottom" },
    transitionProperty: "transform, opacity",
  },
  "rotate-left": {
    in: { opacity: 1, transform: "translateY(0) rotate(0deg)" },
    out: { opacity: 0, transform: "translateY(20px) rotate(-5deg)" },
    common: { transformOrigin: "bottom" },
    transitionProperty: "transform, opacity",
  },
  "rotate-right": {
    in: { opacity: 1, transform: "translateY(0) rotate(0deg)" },
    out: { opacity: 0, transform: "translateY(20px) rotate(5deg)" },
    common: { transformOrigin: "top" },
    transitionProperty: "transform, opacity",
  },
  "slide-down": {
    in: { opacity: 1, transform: "translateY(0)" },
    out: { opacity: 0, transform: "translateY(-100%)" },
    common: { transformOrigin: "top" },
    transitionProperty: "transform, opacity",
  },
  "slide-up": {
    in: { opacity: 1, transform: "translateY(0)" },
    out: { opacity: 0, transform: "translateY(100%)" },
    common: { transformOrigin: "bottom" },
    transitionProperty: "transform, opacity",
  },
  "slide-left": {
    in: { opacity: 1, transform: "translateX(0)" },
    out: { opacity: 0, transform: "translateX(100%)" },
    common: { transformOrigin: "left" },
    transitionProperty: "transform, opacity",
  },
  "slide-right": {
    in: { opacity: 1, transform: "translateX(0)" },
    out: { opacity: 0, transform: "translateX(-100%)" },
    common: { transformOrigin: "right" },
    transitionProperty: "transform, opacity",
  },
  pop: {
    ...popIn("bottom"),
    common: { transformOrigin: "center center" },
  },
  "pop-bottom-left": {
    ...popIn("bottom"),
    common: { transformOrigin: "bottom left" },
  },
  "pop-bottom-right": {
    ...popIn("bottom"),
    common: { transformOrigin: "bottom right" },
  },
  "pop-top-left": {
    ...popIn("top"),
    common: { transformOrigin: "top left" },
  },
  "pop-top-right": {
    ...popIn("top"),
    common: { transformOrigin: "top right" },
  },
};

export type MantineTransition = TransitionName | TransitionStyles;

const TRANSITION_STATE_MAP = {
  entering: "in",
  entered: "in",
  exiting: "out",
  exited: "out",
  "pre-exiting": "out",
  "pre-entering": "out",
} as const;

export type TransitionStatus = keyof typeof TRANSITION_STATE_MAP;

/** Resolve the computed style for a transition at a given lifecycle state. */
export function getTransitionStyles({
  transition,
  state,
  duration,
  timingFunction,
}: {
  transition: MantineTransition;
  state: TransitionStatus;
  duration: number;
  timingFunction: string;
}): TransitionStyle {
  const shared: TransitionStyle = {
    transitionDuration: `${duration}ms`,
    transitionTimingFunction: timingFunction,
  };

  const preset = typeof transition === "string" ? transitions[transition] : transition;
  if (!preset) {
    return {};
  }

  return {
    transitionProperty: preset.transitionProperty,
    ...shared,
    ...preset.common,
    ...preset[TRANSITION_STATE_MAP[state]],
  };
}
