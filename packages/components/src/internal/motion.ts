/**
 * The animation ERGONOMICS layer — the easy, configurable, preset-driven surface
 * that sits on top of the primitive motion tokens in `@knitui/core` (`DURATIONS`,
 * `EASINGS`) and the Tamagui animation driver (the `transition` style prop).
 *
 * Three things live here:
 *
 * 1. {@link SCALES} / {@link DISTANCES} — the shared transform magnitudes (press
 *    dip, enter offsets) so no component hardcodes `0.97` / `8` / `30` again.
 * 2. {@link motionPresets} + {@link useMotionPreset} — NAMED enter/exit recipes
 *    (`"pop"`, `"fade-up"`, …) that resolve to plain props you spread onto any
 *    animated frame: `{ transition, enterStyle, exitStyle, animateOnly }`. A
 *    component exposes one `animation?` prop and forwards the result — that's the
 *    whole integration. Reduced motion is honoured here, ONCE, for every consumer.
 * 3. {@link usePressScale} / {@link useReducedTransition} — the reduced-motion-aware
 *    press-dip and in-place-transition helpers.
 * 4. {@link MotionConfig} / {@link useMotionConfig} — an app- (or subtree-) wide
 *    config the three hooks read: a global `durationScale` speed knob and a global
 *    `disabled` off-switch, so the whole system is tunable from one provider.
 *
 * Everything uses Tamagui's cross-platform shorthand transforms (`scale`, `x`,
 * `y`, `rotate`) rather than CSS strings / RN arrays, so a preset renders the
 * SAME on web and native — closing the web/native divergence the string-based
 * `Transition/transitions.ts` presets still carry.
 */
import * as React from "react";

import { DURATIONS } from "@knitui/core";
import { useReducedMotion } from "@knitui/hooks";

import { type TransitionName, type TransitionValue } from "./style-props";

/* -------------------------------------------------------------------------- */
/* Shared transform magnitudes                                                */
/* -------------------------------------------------------------------------- */

/** Dimensionless scale targets shared across animated components. */
export const SCALES = {
  /** Tactile "shrink on press" — the 3% dip shared by interactive controls. */
  press: 0.97,
  /** Pop entry scale — eases UP into place from slightly smaller. */
  pop: 0.9,
  /** Zoom entry scale — eases DOWN into place from slightly larger. */
  zoom: 1.05,
} as const;

/** Rotation/skew angles (deg) shared by the rotate/skew presets. */
export const ANGLES = {
  /** Subtle tilt for rotate-in presets. */
  tilt: "5deg",
  /** Skew shear for skew presets. */
  skew: "-8deg",
} as const;

/** Enter/exit travel distances in px. */
export const DISTANCES = {
  /** Subtle nudge — dialogs, menus, popovers. */
  nudge: 8,
  /** Standard panel enter offset. */
  enter: 16,
  /** Fade-slide travel. */
  fade: 30,
  /** Pronounced slide — drawer-style edge motion (best-effort; supply your own
   *  `enterStyle`/`exitStyle` for a full-bleed off-screen slide). */
  slide: 100,
} as const;

/* -------------------------------------------------------------------------- */
/* Presets                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A cross-platform animated style snapshot — Tamagui shorthand transform props
 * plus opacity. Used for the `enterStyle` (the "from" state animated to rest) and
 * `exitStyle` (the "to" state on unmount, with `AnimatePresence`).
 */
export interface MotionStyle {
  opacity?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  x?: number;
  y?: number;
  rotate?: string;
  skewX?: string;
  skewY?: string;
}

/** A named or inline animation recipe. */
export interface MotionPreset {
  /** Driver key picking easing + duration. @default "fast" */
  transition?: TransitionName;
  /** The "from" state on enter — animates to the frame's resting style. */
  enterStyle?: MotionStyle;
  /** The "to" state on exit — only animates when wrapped in `AnimatePresence`. */
  exitStyle?: MotionStyle;
  /** Scope the driver to the changing props (perf + keeps `top`/`left` instant). */
  animateOnly?: string[];
}

export type MotionPresetName =
  | "fade"
  | "fade-up"
  | "fade-down"
  | "fade-left"
  | "fade-right"
  | "pop"
  | "pop-up"
  | "pop-down"
  | "scale"
  | "scale-y"
  | "scale-x"
  | "zoom"
  | "slide-up"
  | "slide-down"
  | "slide-left"
  | "slide-right"
  | "rotate-left"
  | "rotate-right"
  | "skew-up"
  | "skew-down";

const OPACITY_ONLY = ["opacity"];
const TRANSFORM_AND_OPACITY = ["transform", "opacity"];

/**
 * The built-in enter/exit recipes. Each pairs a driver `transition` key with a
 * symmetric `enterStyle`/`exitStyle` and an `animateOnly` scope. Values come from
 * {@link SCALES}/{@link DISTANCES}, so retuning the feel is a one-line change.
 */
export const motionPresets: Record<MotionPresetName, MotionPreset> = {
  fade: {
    transition: "fast",
    enterStyle: { opacity: 0 },
    exitStyle: { opacity: 0 },
    animateOnly: OPACITY_ONLY,
  },
  "fade-up": {
    transition: "fast",
    enterStyle: { opacity: 0, y: DISTANCES.fade },
    exitStyle: { opacity: 0, y: DISTANCES.fade },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  "fade-down": {
    transition: "fast",
    enterStyle: { opacity: 0, y: -DISTANCES.fade },
    exitStyle: { opacity: 0, y: -DISTANCES.fade },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  "fade-left": {
    transition: "fast",
    enterStyle: { opacity: 0, x: DISTANCES.fade },
    exitStyle: { opacity: 0, x: DISTANCES.fade },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  "fade-right": {
    transition: "fast",
    enterStyle: { opacity: 0, x: -DISTANCES.fade },
    exitStyle: { opacity: 0, x: -DISTANCES.fade },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  pop: {
    transition: "bouncy",
    enterStyle: { opacity: 0, scale: SCALES.pop },
    exitStyle: { opacity: 0, scale: SCALES.pop },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  scale: {
    transition: "fast",
    enterStyle: { opacity: 0, scale: 0 },
    exitStyle: { opacity: 0, scale: 0 },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  "scale-y": {
    transition: "fast",
    enterStyle: { opacity: 0, scaleY: 0 },
    exitStyle: { opacity: 0, scaleY: 0 },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  "scale-x": {
    transition: "fast",
    enterStyle: { opacity: 0, scaleX: 0 },
    exitStyle: { opacity: 0, scaleX: 0 },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  "slide-up": {
    transition: "medium",
    enterStyle: { y: DISTANCES.slide },
    exitStyle: { y: DISTANCES.slide },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  "slide-down": {
    transition: "medium",
    enterStyle: { y: -DISTANCES.slide },
    exitStyle: { y: -DISTANCES.slide },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  "slide-left": {
    transition: "medium",
    enterStyle: { x: DISTANCES.slide },
    exitStyle: { x: DISTANCES.slide },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  "slide-right": {
    transition: "medium",
    enterStyle: { x: -DISTANCES.slide },
    exitStyle: { x: -DISTANCES.slide },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  // Pop with a directional rise/drop — the bouncy spring + a nudge translate.
  "pop-up": {
    transition: "bouncy",
    enterStyle: { opacity: 0, scale: SCALES.pop, y: DISTANCES.nudge },
    exitStyle: { opacity: 0, scale: SCALES.pop, y: DISTANCES.nudge },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  "pop-down": {
    transition: "bouncy",
    enterStyle: { opacity: 0, scale: SCALES.pop, y: -DISTANCES.nudge },
    exitStyle: { opacity: 0, scale: SCALES.pop, y: -DISTANCES.nudge },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  // Eases DOWN into place from slightly larger (a "zoom in" settle).
  zoom: {
    transition: "medium",
    enterStyle: { opacity: 0, scale: SCALES.zoom },
    exitStyle: { opacity: 0, scale: SCALES.zoom },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  // Tilt + rise. `rotate` is a Tamagui shorthand transform, so it animates on web
  // and native alike (unlike the string-based `Transition` skew presets).
  "rotate-left": {
    transition: "medium",
    enterStyle: { opacity: 0, y: DISTANCES.nudge, rotate: `-${ANGLES.tilt}` },
    exitStyle: { opacity: 0, y: DISTANCES.nudge, rotate: `-${ANGLES.tilt}` },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  "rotate-right": {
    transition: "medium",
    enterStyle: { opacity: 0, y: DISTANCES.nudge, rotate: ANGLES.tilt },
    exitStyle: { opacity: 0, y: DISTANCES.nudge, rotate: ANGLES.tilt },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  // Shear + slide. `skewX` is a shorthand transform prop, so it animates on native
  // too (the legacy `Transition` skew presets are dropped by RN's string parser).
  "skew-up": {
    transition: "medium",
    enterStyle: { opacity: 0, y: -DISTANCES.fade, skewX: ANGLES.skew },
    exitStyle: { opacity: 0, y: -DISTANCES.fade, skewX: ANGLES.skew },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
  "skew-down": {
    transition: "medium",
    enterStyle: { opacity: 0, y: DISTANCES.fade, skewX: ANGLES.skew },
    exitStyle: { opacity: 0, y: DISTANCES.fade, skewX: ANGLES.skew },
    animateOnly: TRANSFORM_AND_OPACITY,
  },
};

/* -------------------------------------------------------------------------- */
/* Global motion config (provider)                                            */
/* -------------------------------------------------------------------------- */

/**
 * Base duration (ms) per driver key — mirrors the `createAnimations` config in
 * `@knitui/core` so `durationScale` can retime a bare key. Spring keys (`bouncy`)
 * are intentionally absent: they have no scalable duration. Keep in sync with
 * `core/src/config/animations.ts` / `animations.native.ts`.
 */
const DRIVER_KEY_MS: Partial<Record<TransitionName, number>> = {
  "100ms": DURATIONS.quick,
  fast: DURATIONS.fast,
  medium: DURATIONS.base,
  slow: DURATIONS.slow,
  pulse: DURATIONS.ambient,
  spin: 700,
  stripe: 180,
  linear: DURATIONS.base,
  ease: DURATIONS.base,
  "ease-in": DURATIONS.base,
  "ease-out": DURATIONS.base,
  "ease-in-out": DURATIONS.base,
};

/** Resolved global motion config — what {@link useMotionConfig} returns. */
export interface MotionConfigValue {
  /** Force-disable ALL motion in scope (like reduced motion). @default false */
  disabled: boolean;
  /** Multiply every resolved duration. 1 = normal, 0.5 = twice as fast, 2 = half speed. @default 1 */
  durationScale: number;
}

const DEFAULT_MOTION_CONFIG: MotionConfigValue = { disabled: false, durationScale: 1 };

const MotionConfigContext = React.createContext<MotionConfigValue>(DEFAULT_MOTION_CONFIG);

export interface MotionConfigProps {
  /** Force-disable all motion in this subtree. */
  disabled?: boolean;
  /** Multiply every resolved duration in this subtree (composes with ancestors). */
  durationScale?: number;
  children: React.ReactNode;
}

/**
 * App- (or subtree-) wide motion configuration. The three motion hooks
 * ({@link useMotionPreset}, {@link usePressScale}, {@link useReducedTransition})
 * read this, so ONE provider retunes every animated component beneath it: a global
 * speed knob (`durationScale`) and a global off-switch (`disabled`). Nested
 * providers compose — `durationScale` multiplies, `disabled` inherits unless
 * overridden.
 *
 * ```tsx
 * <MotionConfig durationScale={0.5}>…</MotionConfig>   // everything 2× faster
 * <MotionConfig disabled>…</MotionConfig>              // motion off in this subtree
 * ```
 */
export function MotionConfig({ disabled, durationScale, children }: MotionConfigProps) {
  const parent = React.useContext(MotionConfigContext);
  const value = React.useMemo<MotionConfigValue>(
    () => ({
      disabled: disabled ?? parent.disabled,
      durationScale: (durationScale ?? 1) * parent.durationScale,
    }),
    [disabled, durationScale, parent.disabled, parent.durationScale],
  );
  return React.createElement(MotionConfigContext.Provider, { value }, children);
}

/** Read the resolved global motion config (defaults when no provider is mounted). */
export function useMotionConfig(): MotionConfigValue {
  return React.useContext(MotionConfigContext);
}

/**
 * Apply the global motion config to a resolved transition: `null` when disabled;
 * otherwise scale the duration by `durationScale`, resolving a bare driver key to
 * its base ms via {@link DRIVER_KEY_MS}. A `null` value, a unit scale, or a spring
 * key (`bouncy` — no scalable duration) pass through unchanged.
 */
function applyMotionConfig(value: TransitionValue, config: MotionConfigValue): TransitionValue {
  if (config.disabled) return null;
  if (value == null || config.durationScale === 1) return value;
  const [key, opts] = Array.isArray(value) ? value : [value, undefined];
  const baseMs = opts?.duration ?? DRIVER_KEY_MS[key];
  if (baseMs == null) return value; // spring / unknown key — nothing to scale
  return [key, { duration: Math.max(0, Math.round(baseMs * config.durationScale)) }];
}

/* -------------------------------------------------------------------------- */
/* Resolver hook                                                              */
/* -------------------------------------------------------------------------- */

/** The spreadable props {@link useMotionPreset} returns. */
export interface ResolvedMotion {
  /** Driver key (or `null` to disable). Spread onto the frame's `transition`. */
  transition: TransitionValue;
  /** "From" state — spread onto the frame's `enterStyle`. */
  enterStyle?: MotionStyle;
  /** "To" state on exit — spread onto the frame's `exitStyle` (needs AnimatePresence). */
  exitStyle?: MotionStyle;
  /** Driver scope — spread onto the frame's `animateOnly`. */
  animateOnly?: string[];
}

export interface UseMotionPresetOptions {
  /** Override the preset's driver key (easing + base duration). */
  transition?: TransitionName;
  /** Override the duration in ms while keeping the preset's easing curve. */
  duration?: number;
  /** Hard off-switch — returns the inert result without animating. */
  enabled?: boolean;
}

/** The inert (no-animation) result — reused so reduced-motion renders are stable. */
const INERT: ResolvedMotion = { transition: null };

/**
 * Resolve a preset (by name, an inline {@link MotionPreset}, or `false`/`null` to
 * disable) into plain props to spread onto an animated frame. Honours the user's
 * reduced-motion preference centrally: under reduced motion (or when disabled) it
 * returns {@link INERT} — `transition: null` and no enter/exit styles — so the
 * frame appears instantly with no per-component guard.
 *
 * ```tsx
 * function Dialog({ animation = "fade-up", ...props }) {
 *   const motion = useMotionPreset(animation);
 *   return <Frame {...motion} {...props} />;   // configurable + reduced-motion safe
 * }
 * ```
 */
export function useMotionPreset(
  preset: MotionPresetName | MotionPreset | false | null | undefined,
  options: UseMotionPresetOptions = {},
): ResolvedMotion {
  const reduced = useReducedMotion();
  const config = useMotionConfig();

  if (!preset || reduced || config.disabled || options.enabled === false) {
    return INERT;
  }

  const recipe = typeof preset === "string" ? motionPresets[preset] : preset;
  const key = options.transition ?? recipe.transition ?? "fast";
  const base: TransitionValue =
    options.duration != null ? [key, { duration: options.duration }] : key;

  return {
    transition: applyMotionConfig(base, config),
    enterStyle: recipe.enterStyle,
    exitStyle: recipe.exitStyle,
    animateOnly: recipe.animateOnly,
  };
}

/* -------------------------------------------------------------------------- */
/* Press feedback                                                            */
/* -------------------------------------------------------------------------- */

/** The spreadable props {@link usePressScale} returns. */
export interface PressScaleResult {
  /** Easing key for the dip (`null` under reduced motion). */
  transition: TransitionValue;
  /** Neutralises the base `pressStyle` dip under reduced motion; absent otherwise. */
  pressStyle?: { scale: number };
}

/**
 * Reduced-motion-aware press feedback for interactive controls (Button,
 * ActionIcon, Chip, …). Pair with the static `pressScaleStyle` spread into the
 * component's `styled()` base config: that supplies the `pressStyle: { scale }`
 * dip, and THIS supplies the easing at render — collapsing to an instant,
 * dip-free press when the user prefers reduced motion.
 *
 * Replaces the old `{...transitionProps("fast")}` at the press call site:
 *
 * ```tsx
 * <Frame {...pressScaleStyle-in-base-config} {...usePressScale()} />
 * ```
 *
 * Normal: `{ transition: "fast" }` — identical to before. Reduced: `{ transition:
 * null, pressStyle: { scale: 1 } }` — the `scale: 1` overrides only the dip key,
 * leaving any variant `pressStyle` colour intact.
 */
export function usePressScale(options: { transition?: TransitionName } = {}): PressScaleResult {
  const reduced = useReducedMotion();
  const config = useMotionConfig();
  if (reduced || config.disabled) {
    return { transition: null, pressStyle: { scale: 1 } };
  }
  return { transition: applyMotionConfig(options.transition ?? "fast", config) };
}

/* -------------------------------------------------------------------------- */
/* In-place state transitions                                                */
/* -------------------------------------------------------------------------- */

/**
 * Reduced-motion-aware transition for IN-PLACE state changes — chevron rotation,
 * thumb/indicator slide, scrollbar fade, color toggles — the generic sibling of
 * {@link usePressScale} (press) and {@link useMotionPreset} (enter/exit). Pass the
 * driver key you'd normally hand to the `transition` prop, or a `[key, { duration }]`
 * pair (e.g. from `timedTransition`), or `null` to opt a branch out. Under reduced
 * motion it returns `{ transition: null }` so the change snaps instantly — so the
 * call site no longer needs its own `useReducedMotion` guard.
 *
 * Replaces the hand-written `transitionProps(reduced ? null : value)` idiom:
 *
 * ```tsx
 * const fade = useReducedTransition("fast");
 * <Thumb {...fade} x={offset} />   // eases normally, snaps under reduced motion
 * ```
 */
export function useReducedTransition(value: TransitionValue): { transition: TransitionValue } {
  const reduced = useReducedMotion();
  const config = useMotionConfig();
  if (reduced) return { transition: null };
  return { transition: applyMotionConfig(value, config) };
}
