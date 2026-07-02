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
 * The overshoot curve behind the `bouncy` driver key on web. Co-located with the
 * native spring it mirrors (`animations.native.ts`) is impossible across the
 * package split, so the two live next to their drivers; this constant is the one
 * shared definition of the web side. NOTE: web (cubic-bezier) and native (spring)
 * still differ in feel — reconciling them to a single perceived curve is tracked
 * as a follow-up in docs/animation-system-plan.md.
 */
export const BOUNCY_BEZIER = "cubic-bezier(0.68, -0.55, 0.265, 1.55)";
