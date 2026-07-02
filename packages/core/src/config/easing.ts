/**
 * The single source of truth for the kit's easing curves. CSS
 * `transition-timing-function` keywords map to their exact cubic-bezier control
 * points here, so the native reanimated driver (`animations.native.ts`) and the
 * native `CollapseBox` clip both build their `Easing.bezier(...)` from the SAME
 * numbers — tweak a curve once and both move together, instead of re-deriving the
 * control points in each place and risking drift. Pure data + a parser, with no
 * platform imports, so it is safe to ship on web and native alike.
 */

/** CSS keyword timing-functions → their cubic-bezier control points. */
export const CSS_EASING_BEZIER = {
  ease: [0.25, 0.1, 0.25, 1],
  "ease-in": [0.42, 0, 1, 1],
  "ease-out": [0, 0, 0.58, 1],
  "ease-in-out": [0.42, 0, 0.58, 1],
} as const satisfies Record<string, readonly [number, number, number, number]>;

/** Cubic-bezier control points `[x1, y1, x2, y2]`. */
export type EasingPoints = readonly [number, number, number, number];

const CUBIC_BEZIER =
  /cubic-bezier\(\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*,\s*([-\d.]+)\s*\)/;

/**
 * Resolve a CSS `transition-timing-function` to cubic-bezier control points — or
 * the sentinel `"linear"` for the straight line, which has no bezier form. An
 * arbitrary `cubic-bezier(...)` is parsed exactly; a keyword maps via
 * {@link CSS_EASING_BEZIER}; an unknown value falls back to `ease`, the
 * library-wide default.
 */
export const resolveCssEasingPoints = (timingFunction = "ease"): EasingPoints | "linear" => {
  const fn = timingFunction.trim();
  const bezier = CUBIC_BEZIER.exec(fn);
  if (bezier) {
    return [Number(bezier[1]), Number(bezier[2]), Number(bezier[3]), Number(bezier[4])];
  }
  if (fn === "linear") return "linear";
  return CSS_EASING_BEZIER[fn as keyof typeof CSS_EASING_BEZIER] ?? CSS_EASING_BEZIER.ease;
};
