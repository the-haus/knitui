import { RESERVED_THEME_NAMES, THEME_OPTION_KEYS, type ThemeOptions } from "./options";
import { isColorName, isHex, type PaletteInput, TAMAGUI_COLOR_NAMES } from "./palette";
import {
  RADIUS_PRESET_NAMES,
  SCALE_KEYS,
  SIZE_PRESET_NAMES,
  SPACE_PRESET_NAMES,
} from "./scale-presets";

const PREFIX = "createTheme:";

const fail = (message: string): never => {
  throw new Error(`${PREFIX} ${message}`);
};

/* ------------------------------------------------------------------ */
/* "did you mean …?"                                                   */
/* ------------------------------------------------------------------ */

const levenshtein = (a: string, b: string): number => {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array<number>(n + 1);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
};

/** Closest candidate within a small edit distance, or `undefined`. */
const didYouMean = (input: string, candidates: readonly string[]): string | undefined => {
  let best: string | undefined;
  let bestDist = Infinity;
  for (const c of candidates) {
    const d = levenshtein(input.toLowerCase(), c.toLowerCase());
    if (d < bestDist) {
      bestDist = d;
      best = c;
    }
  }
  // Only suggest when the guess is plausibly a typo (scaled to word length).
  const threshold = Math.max(2, Math.floor(Math.min(input.length, best?.length ?? 0) / 2));
  return best && bestDist <= threshold ? best : undefined;
};

const suggest = (input: string, candidates: readonly string[]): string => {
  const hint = didYouMean(input, candidates);
  return hint ? ` Did you mean "${hint}"?` : ` Valid options: ${candidates.join(", ")}.`;
};

/* ------------------------------------------------------------------ */
/* Primitive validators                                                */
/* ------------------------------------------------------------------ */

const isPlainObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v);

const validateSeed = (value: unknown, where: string): void => {
  if (typeof value !== "string") fail(`${where} must be a color name or hex string.`);
  const s = value as string;
  if (s.startsWith("#")) {
    if (!isHex(s)) fail(`${where} is not a valid hex color: "${s}".`);
    return;
  }
  if (!isColorName(s)) fail(`${where} — unknown color "${s}".${suggest(s, TAMAGUI_COLOR_NAMES)}`);
};

const validateRamp = (value: unknown, where: string): void => {
  if (!Array.isArray(value)) fail(`${where} ramp must be an array.`);
  const arr = value as unknown[];
  if (arr.length !== 12) fail(`${where} ramp must have exactly 12 steps (got ${arr.length}).`);
  arr.forEach((step, i) => {
    if (typeof step !== "string") fail(`${where} ramp step ${i + 1} must be a color string.`);
  });
};

const validatePaletteInput = (input: unknown, where: string): void => {
  if (typeof input === "string") {
    validateSeed(input, where);
    return;
  }
  if (isPlainObject(input)) {
    if (!("light" in input) || !("dark" in input)) {
      fail(`${where} object must have both "light" and "dark" keys.`);
    }
    const light = input.light;
    const dark = input.dark;
    if (Array.isArray(light) || Array.isArray(dark)) {
      validateRamp(light, `${where}.light`);
      validateRamp(dark, `${where}.dark`);
    } else {
      validateSeed(light, `${where}.light`);
      validateSeed(dark, `${where}.dark`);
    }
    return;
  }
  fail(`${where} must be a color name, hex, { light, dark } seeds, or { light, dark } ramps.`);
};

const validateScaleOverride = (value: unknown, where: string): void => {
  if (!isPlainObject(value)) return fail(`${where} overrides must be an object of step → number.`);
  for (const [key, v] of Object.entries(value)) {
    if (!(SCALE_KEYS as readonly string[]).includes(key)) {
      fail(`${where} — unknown scale step "${key}".${suggest(key, SCALE_KEYS)}`);
    }
    if (typeof v !== "number") fail(`${where}.${key} must be a number.`);
  }
};

const validateScale = (value: unknown, presetNames: readonly string[], where: string): void => {
  if (typeof value === "string") {
    if (!presetNames.includes(value)) {
      fail(`${where} — unknown preset "${value}".${suggest(value, presetNames)}`);
    }
    return;
  }
  validateScaleOverride(value, where);
};

const validateThemeName = (name: string, where: string): void => {
  if (name.length === 0) fail(`${where} must be a non-empty string.`);
  if (RESERVED_THEME_NAMES.has(name)) {
    fail(`${where} "${name}" is reserved. Reserved: ${[...RESERVED_THEME_NAMES].join(", ")}.`);
  }
};

const FONT_OVERRIDE_KEYS = ["family", "size", "lineHeight", "weight", "letterSpacing", "face"];

const validateFontInput = (value: unknown, where: string): void => {
  if (typeof value === "string") return;
  if (!isPlainObject(value)) return fail(`${where} must be a family string or override object.`);
  for (const key of Object.keys(value)) {
    if (!FONT_OVERRIDE_KEYS.includes(key)) {
      fail(`${where} — unknown font field "${key}".${suggest(key, FONT_OVERRIDE_KEYS)}`);
    }
  }
};

/* ------------------------------------------------------------------ */
/* Entry point                                                         */
/* ------------------------------------------------------------------ */

/**
 * Strictly validate {@link ThemeOptions}. Throws an actionable error on unknown
 * options, typo'd scale steps/presets, malformed hex, unknown color names,
 * wrong-length ramps, reserved accent names, or an undefined `defaultFont`.
 * Returns the (unchanged) options so it can be used inline.
 */
export const validateThemeOptions = (options: ThemeOptions): ThemeOptions => {
  if (!isPlainObject(options)) fail("options must be an object.");

  // Unknown top-level keys.
  for (const key of Object.keys(options)) {
    if (!(THEME_OPTION_KEYS as readonly string[]).includes(key)) {
      fail(`unknown option "${key}".${suggest(key, THEME_OPTION_KEYS as readonly string[])}`);
    }
  }

  // Palettes.
  if (options.brand !== undefined) validatePaletteInput(options.brand, "brand");
  if (options.neutral !== undefined) validatePaletteInput(options.neutral, "neutral");

  // Accent / brand theme names.
  const accentNames = options.accents ? Object.keys(options.accents) : [];
  if (options.accents !== undefined) {
    if (!isPlainObject(options.accents)) fail("accents must be an object of name → palette.");
    for (const [name, input] of Object.entries(options.accents)) {
      validateThemeName(name, `accents key`);
      validatePaletteInput(input as PaletteInput, `accents.${name}`);
    }
  }
  if (options.brandThemeName !== undefined) {
    validateThemeName(options.brandThemeName, "brandThemeName");
    if (accentNames.includes(options.brandThemeName)) {
      fail(`brandThemeName "${options.brandThemeName}" collides with an accents key.`);
    }
  }

  // Tamagui color inclusion.
  if (options.includeTamaguiColors !== undefined) {
    const inc = options.includeTamaguiColors;
    if (typeof inc !== "boolean") {
      if (!Array.isArray(inc)) fail("includeTamaguiColors must be a boolean or an array of names.");
      for (const name of inc) {
        if (!isColorName(name)) {
          fail(
            `includeTamaguiColors — unknown color "${name}".${suggest(String(name), TAMAGUI_COLOR_NAMES)}`,
          );
        }
      }
    }
  }

  // Scales.
  if (options.radius !== undefined) validateScale(options.radius, RADIUS_PRESET_NAMES, "radius");
  if (options.space !== undefined) validateScale(options.space, SPACE_PRESET_NAMES, "space");
  if (options.size !== undefined) validateScale(options.size, SIZE_PRESET_NAMES, "size");
  if (options.fontSizes !== undefined) validateScaleOverride(options.fontSizes, "fontSizes");

  // zIndex.
  if (options.zIndex !== undefined) {
    if (!isPlainObject(options.zIndex)) fail("zIndex must be an object of step → number.");
    for (const [k, v] of Object.entries(options.zIndex)) {
      if (typeof v !== "number") fail(`zIndex.${k} must be a number.`);
    }
  }

  // Raw colors.
  if (options.colors !== undefined) {
    if (!isPlainObject(options.colors)) fail("colors must be an object of name → color string.");
    for (const [k, v] of Object.entries(options.colors)) {
      if (typeof v !== "string") fail(`colors.${k} must be a color string.`);
    }
  }

  // Shadows.
  if (options.shadows !== undefined) {
    if (!isPlainObject(options.shadows)) fail("shadows must be a { light?, dark? } object.");
    for (const scheme of Object.keys(options.shadows)) {
      if (scheme !== "light" && scheme !== "dark") {
        fail(`shadows — unknown scheme "${scheme}". Valid options: light, dark.`);
      }
    }
  }

  // Fonts.
  const fontNames = new Set(["body", "heading", "mono"]);
  if (options.fonts !== undefined) {
    if (!isPlainObject(options.fonts)) fail("fonts must be an object of name → font.");
    for (const [name, value] of Object.entries(options.fonts)) {
      fontNames.add(name);
      validateFontInput(value, `fonts.${name}`);
    }
  }
  if (options.defaultFont !== undefined) {
    if (!fontNames.has(options.defaultFont)) {
      fail(
        `defaultFont "${options.defaultFont}" is not a defined font.${suggest(options.defaultFont, [
          ...fontNames,
        ])}`,
      );
    }
  }

  // Breakpoints.
  if (options.breakpoints !== undefined) {
    if (!isPlainObject(options.breakpoints))
      fail("breakpoints must be an object of step → number.");
    for (const [k, v] of Object.entries(options.breakpoints)) {
      if (!(SCALE_KEYS as readonly string[]).includes(k)) {
        fail(`breakpoints — unknown step "${k}".${suggest(k, SCALE_KEYS)}`);
      }
      if (typeof v !== "number") fail(`breakpoints.${k} must be a number.`);
    }
  }

  return options;
};
