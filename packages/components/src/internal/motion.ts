/**
 * The animation ERGONOMICS layer — the easy, configurable, preset-driven surface
 * that sits on top of the primitive motion tokens in `@knitui/core` (`DURATIONS`,
 * `MOTION_PRESETS`) and the Tamagui v3 `transition` prop.
 *
 * 1. {@link SCALES} / {@link DISTANCES} / {@link ANGLES} — the shared transform
 *    magnitudes (press dip, enter offsets).
 * 2. {@link motionPresets} + {@link useMotionPreset} — NAMED enter/exit recipes
 *    (`"pop"`, `"fade-up"`, …) that resolve to v3 props you spread onto any
 *    animated frame: `{ transition, opacity: "enter:0 exit:0", y: "enter:30px
 *    exit:30px" }`. Reduced motion is honoured here, ONCE, for every consumer.
 * 3. {@link usePressScale} / {@link useReducedTransition} — the reduced-motion-aware
 *    press-dip and in-place-transition helpers.
 * 4. {@link MotionConfig} / {@link useMotionConfig} — an app- (or subtree-) wide
 *    `durationScale` speed knob and `disabled` off-switch the hooks read.
 *
 * Everything uses Tamagui's cross-platform shorthand transforms (`scale`, `x`,
 * `y`, `rotate`) as v3 `enter:` / `exit:` clauses, so a preset renders the SAME
 * on web and native. Exit clauses only play under `AnimatePresence`.
 */
import * as React from "react";

import { useReducedMotion } from "@knitui/hooks";

import {
  presetDurationMs,
  PRESS_SCALE,
  toTransitionProperties,
  type TransitionName,
  type TransitionSpec,
  type TransitionValue,
} from "./style-props";

/* -------------------------------------------------------------------------- */
/* Shared transform magnitudes                                                */
/* -------------------------------------------------------------------------- */

/** Dimensionless scale targets shared across animated components. */
export const SCALES = {
  /** Tactile "shrink on press" — the 3% dip shared by interactive controls. */
  press: PRESS_SCALE,
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
  /** Pronounced slide — drawer-style edge motion. */
  slide: 100,
} as const;

/* -------------------------------------------------------------------------- */
/* Presets                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * A cross-platform animated style snapshot — Tamagui shorthand transform props
 * plus opacity, as plain numbers / angle strings. A recipe's `enter` is the
 * "from" state animated to rest; `exit` the "to" state on unmount (with
 * `AnimatePresence`). Lengths (`x`, `y`) are px.
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

/** The animated properties a {@link MotionStyle} can name. */
export type MotionProp = keyof MotionStyle;

/** A named or inline animation recipe. */
export interface MotionPreset {
  /** Driver preset picking easing + duration. @default "fast" */
  transition?: TransitionName;
  /** The "from" state on enter — animates to the frame's resting style. */
  enter?: MotionStyle;
  /** The "to" state on exit — only animates when wrapped in `AnimatePresence`. */
  exit?: MotionStyle;
  /**
   * Scope the transition to the changing properties (perf + keeps `top`/`left`
   * instant): `["transform", "opacity"]` or `"transform, opacity"`.
   */
  properties?: readonly string[] | string;
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

const OPACITY_ONLY = "opacity";
const TRANSFORM_AND_OPACITY = "transform, opacity";

/** A symmetric recipe: the same snapshot on enter and exit. */
const symmetric = (
  transition: TransitionName,
  snapshot: MotionStyle,
  properties: string = TRANSFORM_AND_OPACITY,
): MotionPreset => ({ transition, enter: snapshot, exit: snapshot, properties });

/**
 * The built-in enter/exit recipes. Each pairs a driver `transition` preset with a
 * symmetric `enter`/`exit` snapshot and a `properties` scope. Values come from
 * {@link SCALES}/{@link DISTANCES}, so retuning the feel is a one-line change.
 */
export const motionPresets: Record<MotionPresetName, MotionPreset> = {
  fade: symmetric("fast", { opacity: 0 }, OPACITY_ONLY),
  "fade-up": symmetric("fast", { opacity: 0, y: DISTANCES.fade }),
  "fade-down": symmetric("fast", { opacity: 0, y: -DISTANCES.fade }),
  "fade-left": symmetric("fast", { opacity: 0, x: DISTANCES.fade }),
  "fade-right": symmetric("fast", { opacity: 0, x: -DISTANCES.fade }),
  pop: symmetric("bouncy", { opacity: 0, scale: SCALES.pop }),
  scale: symmetric("fast", { opacity: 0, scale: 0 }),
  "scale-y": symmetric("fast", { opacity: 0, scaleY: 0 }),
  "scale-x": symmetric("fast", { opacity: 0, scaleX: 0 }),
  "slide-up": symmetric("medium", { y: DISTANCES.slide }),
  "slide-down": symmetric("medium", { y: -DISTANCES.slide }),
  "slide-left": symmetric("medium", { x: DISTANCES.slide }),
  "slide-right": symmetric("medium", { x: -DISTANCES.slide }),
  // Pop with a directional rise/drop — the bouncy spring + a nudge translate.
  "pop-up": symmetric("bouncy", { opacity: 0, scale: SCALES.pop, y: DISTANCES.nudge }),
  "pop-down": symmetric("bouncy", { opacity: 0, scale: SCALES.pop, y: -DISTANCES.nudge }),
  // Eases DOWN into place from slightly larger (a "zoom in" settle).
  zoom: symmetric("medium", { opacity: 0, scale: SCALES.zoom }),
  // Tilt + rise. `rotate` is a Tamagui shorthand transform: animates on web and native.
  "rotate-left": symmetric("medium", {
    opacity: 0,
    y: DISTANCES.nudge,
    rotate: `-${ANGLES.tilt}`,
  }),
  "rotate-right": symmetric("medium", { opacity: 0, y: DISTANCES.nudge, rotate: ANGLES.tilt }),
  // Shear + slide. `skewX` is a shorthand transform prop, so it animates on native too.
  "skew-up": symmetric("medium", { opacity: 0, y: -DISTANCES.fade, skewX: ANGLES.skew }),
  "skew-down": symmetric("medium", { opacity: 0, y: DISTANCES.fade, skewX: ANGLES.skew }),
};

/* -------------------------------------------------------------------------- */
/* Recipe → v3 clause props                                                   */
/* -------------------------------------------------------------------------- */

/** A v3 flat clause program (`"enter:0 exit:0"`). */
export type ClauseString = `${string}:${string}`;

/** The mount/unmount clauses a recipe compiles to — one flat value per property. */
export type MotionClauseProps = { [K in MotionProp]?: ClauseString };

const LENGTH_PROPS = new Set<MotionProp>(["x", "y"]);

/** One clause payload: lengths carry `px` (a bare number in a clause is unitless). */
const payload = (prop: MotionProp, value: number | string): string =>
  typeof value === "number" && LENGTH_PROPS.has(prop) ? `${value}px` : `${value}`;

const compiledCache = new WeakMap<MotionPreset, MotionClauseProps>();

/**
 * Compile a recipe's `enter` / `exit` snapshots to v3 clause props:
 * `{ enter: { opacity: 0, y: 30 }, exit: { opacity: 0 } }` →
 * `{ opacity: "enter:0 exit:0", y: "enter:30px" }`. Cached per recipe object, so
 * the built-in (and any module-level) recipes compile once.
 */
export function compileMotion(recipe: MotionPreset): MotionClauseProps {
  const hit = compiledCache.get(recipe);
  if (hit) return hit;
  const out: MotionClauseProps = {};
  const add = (phase: "enter" | "exit", snapshot: MotionStyle | undefined) => {
    if (!snapshot) return;
    for (const prop of Object.keys(snapshot) as MotionProp[]) {
      const value = snapshot[prop];
      if (value === undefined) continue;
      const clause = `${phase}:${payload(prop, value)}` as ClauseString;
      const prev = out[prop];
      out[prop] = prev ? (`${prev} ${clause}` as ClauseString) : clause;
    }
  };
  add("enter", recipe.enter);
  add("exit", recipe.exit);
  compiledCache.set(recipe, out);
  return out;
}

/* -------------------------------------------------------------------------- */
/* Global motion config (provider)                                            */
/* -------------------------------------------------------------------------- */

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
 * otherwise scale the duration by `durationScale` — a preset name becomes
 * `{ preset, duration }` with its base ms read from core's `MOTION_PRESETS` (the
 * one motion table). A `null` value, a unit scale, or a spring preset (`bouncy` —
 * no scalable duration) pass through unchanged.
 */
export function applyMotionConfig(
  value: TransitionValue,
  config: MotionConfigValue,
): TransitionValue {
  if (config.disabled) return null;
  if (value == null || config.durationScale === 1) return value;
  const spec: TransitionSpec = typeof value === "string" ? { preset: value } : value;
  const baseMs = spec.duration ?? (spec.preset ? presetDurationMs(spec.preset) : undefined);
  if (baseMs == null) return value; // spring / unknown — nothing to scale
  return { ...spec, duration: Math.max(0, Math.round(baseMs * config.durationScale)) };
}

/** A stable primitive key for a transition value (memo deps). */
const transitionKey = (value: TransitionValue): string | null => {
  if (value == null || typeof value === "string") return value;
  return JSON.stringify(value);
};

/* -------------------------------------------------------------------------- */
/* Resolver hook                                                              */
/* -------------------------------------------------------------------------- */

/**
 * The spreadable props {@link useMotionPreset} returns: the `transition` plus the
 * recipe's mount/unmount clauses (`opacity: "enter:0 exit:0"`, …). Spread it LAST
 * among the animated properties it names — a later `opacity`/`y` prop replaces the
 * clause program (v3 has one value per property).
 */
export type ResolvedMotion = MotionClauseProps & {
  /** Preset / object (or `null` to disable). */
  transition: TransitionValue;
};

export interface UseMotionPresetOptions {
  /** Override the preset's driver key (easing + base duration). */
  transition?: TransitionName;
  /** Override the duration in ms while keeping the preset's easing curve. */
  duration?: number;
  /** Hard off-switch — returns the inert result without animating. */
  enabled?: boolean;
}

/** The inert (no-animation) result — reused so reduced-motion renders are stable. */
const INERT: ResolvedMotion = Object.freeze({ transition: null });

/**
 * Resolve a preset (by name, an inline {@link MotionPreset}, or `false`/`null` to
 * disable) into v3 props to spread onto an animated frame. Honours the user's
 * reduced-motion preference centrally: under reduced motion (or when disabled) it
 * returns {@link INERT} — `transition: null` and no enter/exit clauses — so the
 * frame appears instantly with no per-component guard. Memoised: the same inputs
 * return the same object.
 *
 * ```tsx
 * function Dialog({ animation = "fade-up", ...props }) {
 *   const motion = useMotionPreset(animation);
 *   return <Frame {...props} {...motion} />;   // configurable + reduced-motion safe
 * }
 * ```
 */
export function useMotionPreset(
  preset: MotionPresetName | MotionPreset | false | null | undefined,
  options: UseMotionPresetOptions = {},
): ResolvedMotion {
  const reduced = useReducedMotion();
  const config = useMotionConfig();
  const inert = !preset || reduced || config.disabled || options.enabled === false;
  const recipe = inert ? undefined : typeof preset === "string" ? motionPresets[preset] : preset;
  const key = recipe ? (options.transition ?? recipe.transition ?? "fast") : undefined;
  const properties = recipe?.properties;
  const propertiesKey = properties === undefined ? undefined : toTransitionProperties(properties);

  return React.useMemo<ResolvedMotion>(() => {
    if (!recipe || !key) return INERT;
    const spec: TransitionSpec = { preset: key };
    if (options.duration != null) spec.duration = options.duration;
    if (propertiesKey) spec.properties = propertiesKey;
    const base: TransitionValue = spec.duration == null && spec.properties == null ? key : spec;
    return { ...compileMotion(recipe), transition: applyMotionConfig(base, config) };
    // `config` is a memoised context value; the recipe object is compiled once per identity.
  }, [recipe, key, options.duration, propertiesKey, config]);
}

/* -------------------------------------------------------------------------- */
/* Press feedback                                                            */
/* -------------------------------------------------------------------------- */

/** The spreadable props {@link usePressScale} returns. */
export interface PressScaleResult {
  /** Easing for the dip (`null` under reduced motion). */
  transition: TransitionValue;
  /** Neutralises the base `scale: "press:0.97"` dip under reduced motion; absent otherwise. */
  scale?: "press:1";
}

const PRESS_REDUCED: PressScaleResult = Object.freeze({ transition: null, scale: "press:1" });

/**
 * Reduced-motion-aware press feedback for interactive controls (Button,
 * ActionIcon, Chip, …). Pair with the static `pressScaleStyle` in the component's
 * `styled()` base (the `scale: "press:0.97"` dip); THIS supplies the easing at
 * render — collapsing to an instant, dip-free press under reduced motion.
 *
 * Normal: `{ transition: "fast" }`. Reduced: `{ transition: null, scale:
 * "press:1" }` — a call-site `press:` clause outranks the base one for that slot
 * only, so the frame's resting `scale` and any variant press COLOUR stay intact.
 */
export function usePressScale(options: { transition?: TransitionName } = {}): PressScaleResult {
  const reduced = useReducedMotion();
  const config = useMotionConfig();
  const off = reduced || config.disabled;
  const name = options.transition ?? "fast";
  return React.useMemo(
    () => (off ? PRESS_REDUCED : { transition: applyMotionConfig(name, config) }),
    [off, name, config],
  );
}

/* -------------------------------------------------------------------------- */
/* In-place state transitions                                                */
/* -------------------------------------------------------------------------- */

/**
 * Reduced-motion-aware transition for IN-PLACE state changes — chevron rotation,
 * thumb/indicator slide, scrollbar fade, color toggles. Pass the value you'd hand
 * to the `transition` prop (a preset name, a `{ duration, easing }` object from
 * `timedTransition`, or `null`), plus optional `properties` to scope it. Under
 * reduced motion it returns `{ transition: null }`. Memoised on the VALUE (not
 * its identity), so an inline object argument still yields a stable result —
 * which also lets `scopeTransition(result, …)` hit its cache.
 *
 * ```tsx
 * const fade = useReducedTransition("fast");
 * <Thumb {...scopeTransition(fade, ["opacity"])} opacity={visible ? 1 : 0} />
 * ```
 */
export function useReducedTransition(
  value: TransitionValue,
  properties?: readonly string[] | string,
): { transition: TransitionValue } {
  const reduced = useReducedMotion();
  const config = useMotionConfig();
  const valueKey = transitionKey(value);
  const propertiesKey = properties === undefined ? undefined : toTransitionProperties(properties);
  return React.useMemo(
    () => {
      if (reduced) return { transition: null };
      const scoped: TransitionValue =
        propertiesKey === undefined || value == null
          ? value
          : typeof value === "string"
            ? { preset: value, properties: propertiesKey }
            : { ...value, properties: propertiesKey };
      return { transition: applyMotionConfig(scoped, config) };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on the value, not its identity
    [reduced, valueKey, propertiesKey, config],
  );
}
