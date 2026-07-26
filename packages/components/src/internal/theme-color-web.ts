import { createCSSVariable } from "@knitui/core";

/**
 * WEB-ONLY, theme-free colour-token resolution.
 *
 * `resolveThemeColor(theme, color)` needs a theme object because on NATIVE a
 * `$token` has to be read out of the active theme to get a concrete colour
 * string. On WEB it does not: Tamagui's `variableToString` returns
 * `variable.variable` — the token's CSS custom property — for every theme
 * variable, and that property name is a pure function of the token key
 * (`createCSSVariable("color5") === "var(--color5)"`). So the whole lookup
 * collapses to a string transform with no theme access at all.
 *
 * That matters because `useTheme()` is not free: it runs `useThemeWithState`
 * (useId + useRef + useReducer + a DEP-LESS `useEffect` that fires after every
 * render) and registers the component as a theme change subscriber. Call sites
 * that only ever needed the token→`var()` mapping (the gradient painter, the
 * control-icon provider) were paying that on every render of every control,
 * including when the feature was switched off.
 *
 * Divergence from the theme-based path, deliberate: a `$name` that is NOT a key
 * of the active theme used to pass through verbatim (`"$nope"`), and now becomes
 * `var(--nope)`. Both are broken CSS — an undefined custom property and a
 * literal `$nope` are equally unpaintable — so no real value changes. Every
 * `$token` the kit itself passes (`$color1`…`$color12`, `$white`, `$blueN`,
 * `$redN`, `$accentN`, `$borderColor`, …) IS a theme key and resolves identically.
 *
 * Non-token values (`"#ff0000"`, `"rgb(…)"`, `"currentColor"`) pass through.
 */
const cache = new Map<string, string>();

export const themeColorToCssVar = (color: string): string => {
  // 36 === "$". A bare "$" has no token name, so it is not a token either.
  if (color.charCodeAt(0) !== 36 || color.length < 2) return color;
  const hit = cache.get(color);
  if (hit !== undefined) return hit;
  const resolved = createCSSVariable(color.slice(1));
  cache.set(color, resolved);
  return resolved;
};
