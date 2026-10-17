/**
 * The kit's keyboard-focus ring, as configuration rather than per-component
 * style tables (v3 `createTamagui({ variables })` + one theme key).
 *
 * - `focusRingColor` is a THEME KEY, written into every theme as that theme's
 *   own `color8`, so an accent sub-theme (`theme="blue"`) recolours the ring with
 *   no per-component logic (the v2 behaviour of `outlineColor: "$color8"`). It is
 *   a theme key and not a config variable because v3 resolves config variables
 *   once, on the BASE themes only: a `focusRingColor: "color8"` variable would
 *   freeze to the neutral ramp and stop following accents.
 * - `focusRingWidth` / `focusRingOffset` are config VARIABLES (scheme- and
 *   accent-independent numbers; px on web, numbers on native).
 *
 * All three resolve as bare names in style values and can be re-themed for a
 * subtree with `<ThemeUpdate focusRingColor="red9">` (web: CSS variables, no
 * re-render). TYPING CAVEAT (Tamagui 3.0.18): only colour props accept theme /
 * variable names in their types, so `outlineColor="focus-visible:focusRingColor"`
 * type-checks but `outlineWidth="focusRingWidth"` does not. Author the width and
 * offset as the numbers exported here (`FOCUS_RING_VARIABLES.focusRingWidth`)
 * until the types catch up; the variables still exist for `<ThemeUpdate>`.
 */
export const FOCUS_RING_VARIABLES = {
  focusRingWidth: 2,
  focusRingOffset: 0,
} as const;

/** The theme key every theme carries for the ring colour. */
export const FOCUS_RING_COLOR_KEY = "focusRingColor";

/** The ramp step the ring colour is taken from in each theme. */
const FOCUS_RING_SOURCE_KEY = "color8";

/**
 * Add `focusRingColor` (= the theme's own `color8`) to every theme that has a
 * `color8`. Pure; returns new theme objects and keeps key order stable (the new
 * key is appended).
 */
export const withFocusRingColor = <T extends Record<string, Record<string, string | number>>>(
  themes: T,
): { [Name in keyof T]: T[Name] & { focusRingColor: T[Name]["color8"] } } => {
  const out: Record<string, Record<string, string | number>> = {};
  for (const name of Object.keys(themes)) {
    const theme = themes[name];
    const source = theme[FOCUS_RING_SOURCE_KEY];
    out[name] = source === undefined ? { ...theme } : { ...theme, [FOCUS_RING_COLOR_KEY]: source };
  }
  return out as never;
};
