/**
 * Primitive motion tokens — the single source of truth for animation DURATIONS
 * and EASINGS, the motion twin of `tokens.ts` (sizing/color) and `easing.ts`
 * (curve control points). The driver configs (`animations.ts` on web,
 * `animations.native.ts` on native) build their keys from these numbers, and the
 * `@knitui/components` preset layer (`internal/motion.ts`) reads them too, so a
 * duration or easing is declared in exactly ONE place instead of being re-typed
 * as a magic number at every call site.
 *
 * Pure data, no platform imports — safe to ship on web and native alike.
 */

/**
 * Semantic animation durations, in milliseconds. Reference these by intent
 * (`base`, `fast`, …) rather than the raw number so the whole kit can be retuned
 * from here.
 */
export const DURATIONS = {
  /** No animation — the reduced-motion / disabled value. */
  instant: 0,
  /** Micro-interactions: the briefest state flips. */
  quick: 100,
  /** Transient feedback — press eases, fast-opening overlays. */
  fast: 150,
  /** The library-wide baseline — collapse, accordion, most enters. */
  base: 200,
  /** Larger surfaces / more deliberate moves. */
  slow: 300,
  /** Emphasis moves that should read as intentional. */
  deliberate: 450,
  /** Ambient half-cycle loops — pulse / breathe. */
  ambient: 600,
  /** Full continuous loops — spin. */
  loop: 1000,
} as const;

export type DurationToken = keyof typeof DURATIONS;

/**
 * Named easing curves by INTENT, expressed as CSS `transition-timing-function`
 * keywords. The keyword is the cross-platform contract: the web driver uses it
 * verbatim and the native driver resolves it to the matching cubic-bezier via
 * `CSS_EASING_BEZIER` (see `easing.ts`), so a curve looks identical on both.
 */
export const EASINGS = {
  /** Symmetric ease — the kit default. */
  standard: "ease-in-out",
  /** Decelerate into rest — elements ENTERING. */
  decelerate: "ease-out",
  /** Accelerate away — elements LEAVING. */
  accelerate: "ease-in",
  /** Gentle, natural. */
  gentle: "ease",
  /** Constant rate — spinners, stripes. */
  linear: "linear",
} as const;

export type EasingToken = keyof typeof EASINGS;

/**
 * The `bouncy` spring, in physics terms. v3 presets are the SAME motion on every
 * driver (the web compiles a spring to a `linear()` easing that traces the real
 * curve), so this one definition now drives web and native alike. These are the
 * numbers the native driver was already tuned with; on web they replace the old
 * `cubic-bezier` overshoot, so web and native finally match (an intentional
 * timing shift of the v3 migration).
 */
export const BOUNCY_SPRING = { damping: 10, mass: 0.9, stiffness: 100 } as const;

/**
 * @deprecated v2's web-only approximation of `bouncy`. v3 runs the real spring
 * ({@link BOUNCY_SPRING}) on every driver; kept for callers that build their own
 * CSS transition strings.
 */
export const BOUNCY_BEZIER = "cubic-bezier(0.68, -0.55, 0.265, 1.55)";

const timing = (duration: number, easing: string) =>
  ({ type: "timing", duration, easing }) as const;

/**
 * The kit's named `transition` presets, in Tamagui v3's unified preset format
 * (`{ type: "timing", duration, easing }` or a spring), shared VERBATIM by the
 * web CSS driver (`animations.ts`) and the native reanimated driver
 * (`animations.native.ts`). One table, one motion per name, on every platform.
 *
 * - Duration presets (`fast` / `medium` / `slow`) and named effects (`bouncy` /
 *   `pulse` / `spin` / `stripe`) are what components reference
 *   (`transition="fast"`).
 * - Easing-curve keys (`linear` / `ease` / `ease-in` / `ease-out` /
 *   `ease-in-out`) carry the base duration; callers retime them with the object
 *   form (`transition={{ preset: "ease-out", duration: 250 }}`), which keeps the
 *   curve.
 *
 * v2's `"100ms"` key is gone: in v3 a duration is plain CSS, so
 * `transition="100ms"` works on every driver with nothing configured.
 */
export const MOTION_PRESETS = {
  fast: timing(DURATIONS.fast, EASINGS.standard),
  medium: timing(DURATIONS.base, EASINGS.standard),
  slow: timing(DURATIONS.slow, EASINGS.standard),
  bouncy: BOUNCY_SPRING,
  pulse: timing(DURATIONS.ambient, EASINGS.standard),
  spin: timing(700, EASINGS.linear),
  stripe: timing(180, EASINGS.linear),
  linear: timing(DURATIONS.base, EASINGS.linear),
  ease: timing(DURATIONS.base, EASINGS.gentle),
  "ease-in": timing(DURATIONS.base, EASINGS.accelerate),
  "ease-out": timing(DURATIONS.base, EASINGS.decelerate),
  "ease-in-out": timing(DURATIONS.base, EASINGS.standard),
} as const;

export type MotionPresetName = keyof typeof MOTION_PRESETS;
