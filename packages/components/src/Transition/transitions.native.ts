import type { ViewStyle } from "react-native";

/** Native-safe transition styles. Keep transforms as RN arrays so Tamagui's
 *  native animation driver can interpolate them; string transforms are skipped. */
export interface TransitionStyle {
  opacity?: number;
  transform?: ViewStyle["transform"];
  transformOrigin?: string;
  display?: "none";
}

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
  in: { opacity: 1, transform: [{ scale: 1 }, { translateY: 0 }] },
  out: {
    opacity: 0,
    transform: [{ scale: 0.9 }, { translateY: from === "bottom" ? 10 : -10 }],
  },
  transitionProperty: "transform, opacity",
});

export const transitions: Record<TransitionName, TransitionStyles> = {
  fade: {
    in: { opacity: 1 },
    out: { opacity: 0 },
    transitionProperty: "opacity",
  },
  "fade-up": {
    in: { opacity: 1, transform: [{ translateY: 0 }] },
    out: { opacity: 0, transform: [{ translateY: 30 }] },
    transitionProperty: "opacity, transform",
  },
  "fade-down": {
    in: { opacity: 1, transform: [{ translateY: 0 }] },
    out: { opacity: 0, transform: [{ translateY: -30 }] },
    transitionProperty: "opacity, transform",
  },
  "fade-left": {
    in: { opacity: 1, transform: [{ translateX: 0 }] },
    out: { opacity: 0, transform: [{ translateX: 30 }] },
    transitionProperty: "opacity, transform",
  },
  "fade-right": {
    in: { opacity: 1, transform: [{ translateX: 0 }] },
    out: { opacity: 0, transform: [{ translateX: -30 }] },
    transitionProperty: "opacity, transform",
  },
  scale: {
    in: { opacity: 1, transform: [{ scale: 1 }] },
    out: { opacity: 0, transform: [{ scale: 0 }] },
    common: { transformOrigin: "top" },
    transitionProperty: "transform, opacity",
  },
  "scale-y": {
    in: { opacity: 1, transform: [{ scaleY: 1 }] },
    out: { opacity: 0, transform: [{ scaleY: 0 }] },
    common: { transformOrigin: "top" },
    transitionProperty: "transform, opacity",
  },
  "scale-x": {
    in: { opacity: 1, transform: [{ scaleX: 1 }] },
    out: { opacity: 0, transform: [{ scaleX: 0 }] },
    common: { transformOrigin: "left" },
    transitionProperty: "transform, opacity",
  },
  "skew-up": {
    in: {
      opacity: 1,
      transform: [{ translateY: 0 }, { skewX: "0deg" }, { skewY: "0deg" }],
    },
    out: {
      opacity: 0,
      transform: [{ translateY: -20 }, { skewX: "-10deg" }, { skewY: "-5deg" }],
    },
    common: { transformOrigin: "top" },
    transitionProperty: "transform, opacity",
  },
  "skew-down": {
    in: {
      opacity: 1,
      transform: [{ translateY: 0 }, { skewX: "0deg" }, { skewY: "0deg" }],
    },
    out: {
      opacity: 0,
      transform: [{ translateY: 20 }, { skewX: "-10deg" }, { skewY: "-5deg" }],
    },
    common: { transformOrigin: "bottom" },
    transitionProperty: "transform, opacity",
  },
  "rotate-left": {
    in: { opacity: 1, transform: [{ translateY: 0 }, { rotate: "0deg" }] },
    out: { opacity: 0, transform: [{ translateY: 20 }, { rotate: "-5deg" }] },
    common: { transformOrigin: "bottom" },
    transitionProperty: "transform, opacity",
  },
  "rotate-right": {
    in: { opacity: 1, transform: [{ translateY: 0 }, { rotate: "0deg" }] },
    out: { opacity: 0, transform: [{ translateY: 20 }, { rotate: "5deg" }] },
    common: { transformOrigin: "top" },
    transitionProperty: "transform, opacity",
  },
  "slide-down": {
    in: { opacity: 1, transform: [{ translateY: 0 }] },
    out: { opacity: 0, transform: [{ translateY: -30 }] },
    common: { transformOrigin: "top" },
    transitionProperty: "transform, opacity",
  },
  "slide-up": {
    in: { opacity: 1, transform: [{ translateY: 0 }] },
    out: { opacity: 0, transform: [{ translateY: 30 }] },
    common: { transformOrigin: "bottom" },
    transitionProperty: "transform, opacity",
  },
  "slide-left": {
    in: { opacity: 1, transform: [{ translateX: 0 }] },
    out: { opacity: 0, transform: [{ translateX: 30 }] },
    common: { transformOrigin: "left" },
    transitionProperty: "transform, opacity",
  },
  "slide-right": {
    in: { opacity: 1, transform: [{ translateX: 0 }] },
    out: { opacity: 0, transform: [{ translateX: -30 }] },
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

const parseLength = (value: string): number | string => {
  if (value.endsWith("px")) return Number.parseFloat(value);
  return value;
};

const parseTransform = (value: unknown): ViewStyle["transform"] | undefined => {
  if (typeof value !== "string") {
    return value as ViewStyle["transform"];
  }

  const transforms: Record<string, unknown>[] = [];
  const matches = value.matchAll(/([a-zA-Z0-9]+)\(([^)]+)\)/g);

  for (const match of matches) {
    const key = match[1];
    const raw = match[2].trim();
    const first = raw.split(",")[0]?.trim() ?? raw;

    if (key === "translate") {
      const [x = "0px", y = "0px"] = raw.split(",").map((part) => part.trim());
      transforms.push({ translateX: parseLength(x) }, { translateY: parseLength(y) });
    } else if (key === "translateX") transforms.push({ translateX: parseLength(first) });
    else if (key === "translateY") transforms.push({ translateY: parseLength(first) });
    else if (key === "scale") transforms.push({ scale: Number.parseFloat(first) });
    else if (key === "scaleX") transforms.push({ scaleX: Number.parseFloat(first) });
    else if (key === "scaleY") transforms.push({ scaleY: Number.parseFloat(first) });
    else if (key === "rotate" || key === "rotateZ") transforms.push({ rotate: first });
    else if (key === "skewX") transforms.push({ skewX: first });
    else if (key === "skewY") transforms.push({ skewY: first });
    else if (key === "skew") {
      const [x = "0deg", y = "0deg"] = raw.split(",").map((part) => part.trim());
      transforms.push({ skewX: x }, { skewY: y });
    }
  }

  return transforms.length > 0 ? (transforms as unknown as ViewStyle["transform"]) : undefined;
};

const normalizeStyle = (style: TransitionStyle): TransitionStyle => {
  if (style.transform == null) return style;
  return { ...style, transform: parseTransform(style.transform) };
};

export function getTransitionStyles({
  transition,
  state,
}: {
  transition: MantineTransition;
  state: TransitionStatus;
  duration: number;
  timingFunction: string;
}): TransitionStyle {
  const preset = typeof transition === "string" ? transitions[transition] : transition;
  if (!preset) {
    return {};
  }

  return {
    ...normalizeStyle(preset.common ?? {}),
    ...normalizeStyle(preset[TRANSITION_STATE_MAP[state]]),
  };
}
