import { createCSSVariable, getConfig, getTokens, isToken, variableToString } from "@knitui/core";

/**
 * WEB-ONLY, theme-free colour-name resolution.
 *
 * `resolveThemeColor(theme, color)` needs a theme object because on NATIVE a theme
 * key has to be read out of the active theme to get a concrete colour string. On
 * WEB it does not: every theme value is a CSS custom property whose name is a pure
 * function of the key (`createCSSVariable("color5") === "var(--color5)"`), and a
 * colour TOKEN (`white`) carries its own `var(--c-…)`. So the lookup collapses to
 * a string transform with no theme access at all.
 *
 * That matters because `useTheme()` is not free (a `useThemeWithState` + theme
 * subscription per call). Call sites that only need the name → `var()` mapping
 * (the gradient painter, the control-icon provider) would pay that on every
 * render of every control.
 *
 * v3 has no `$` sigil, so a name is recognised by ASKING THE CONFIG (`isToken`):
 *  - a colour token (`white`, `black`) → that token's own CSS variable;
 *  - a theme key (`color5`, `blue9`, `borderColor`, `focusRingColor`, …) →
 *    `var(--<key>)` (the kit's themes define no key that shadows a colour token);
 *  - anything else (`"#ff0000"`, `"rgb(…)"`, `"currentColor"`, `"red"`) passes
 *    through untouched (v2's `"$color5"` spelling is no longer a name).
 */
const cache = new Map<string, string>();

const hasConfig = (): boolean => {
  try {
    return !!getConfig();
  } catch {
    return false;
  }
};

/** Config names are identifiers; a CSS colour (`#fff`, `rgb(…)`) never matches. */
const NAME = /^[A-Za-z][\w-]*$/;

const resolve = (color: string): string => {
  if (!NAME.test(color)) return color;
  // A colour token first: `isToken(…, "color")` without a theme knows only tokens.
  if (isToken(color, "color")) {
    const token = (getTokens().color as Record<string, unknown>)[color];
    if (token !== undefined) return variableToString(token);
  }
  // Otherwise a theme key (`isToken` without a category also matches every theme key).
  return isToken(color) ? createCSSVariable(color) : color;
};

export const themeColorToCssVar = (color: string): string => {
  const hit = cache.get(color);
  if (hit !== undefined) return hit;
  const resolved = resolve(color);
  // The config is fixed after the first `createTamagui`; cache per name — but only
  // once one exists, or a pre-config call would pin a name as a literal forever.
  if (hasConfig()) {
    if (cache.size > 512) cache.clear();
    cache.set(color, resolved);
  }
  return resolved;
};
