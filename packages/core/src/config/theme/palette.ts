import * as Colors from "@tamagui/colors";

/**
 * Palette resolution for the theme builder.
 *
 * A "palette input" describes one color ramp and can be given four ways:
 *  - a `@tamagui/colors` name  — `"violet"`            (real Radix ramp, dark auto)
 *  - a hex seed                — `"#7C3AED"`           (12-step ramp derived below)
 *  - per-scheme seeds          — `{ light, dark }`     (each a name or hex)
 *  - explicit ramps            — `{ light: [...12], dark: [...12] }`
 *
 * Names resolve to the exact Radix scale from `@tamagui/colors`. Hex seeds are
 * expanded into a 12-step scale by `rampFromHex` — a deliberate approximation
 * (fixed per-step lightness, seed hue + saturation). Consumers who need a
 * pixel-exact ramp should pass a `@tamagui/colors` name or explicit 12-step ramps.
 */

/** Every base ramp name shipped by `@tamagui/colors` (each has a `<name>Dark` twin). */
export const TAMAGUI_COLOR_NAMES = [
  "amber",
  "blue",
  "bronze",
  "brown",
  "crimson",
  "cyan",
  "gold",
  "grass",
  "gray",
  "green",
  "indigo",
  "lime",
  "mauve",
  "mint",
  "olive",
  "orange",
  "pink",
  "plum",
  "purple",
  "red",
  "sage",
  "sand",
  "sky",
  "slate",
  "teal",
  "tomato",
  "violet",
  "yellow",
] as const;

export type TamaguiColorName = (typeof TAMAGUI_COLOR_NAMES)[number];

const COLOR_NAME_SET: ReadonlySet<string> = new Set(TAMAGUI_COLOR_NAMES);

/** True if `value` is a `@tamagui/colors` base ramp name. */
export const isColorName = (value: string): value is TamaguiColorName => COLOR_NAME_SET.has(value);

/** True if `value` looks like a `#rgb` / `#rrggbb` hex color. */
export const isHex = (value: string): boolean => /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);

/** A single 12-step color ramp (step 1 = background … step 12 = highest-contrast text). */
export type Ramp = readonly string[];

/** A resolved palette: parallel light + dark 12-step ramps. */
export interface ResolvedPalette {
  light: string[];
  dark: string[];
}

/** Per-scheme seed colors — each a `@tamagui/colors` name or a hex string. */
export interface SchemeSeeds {
  light: string;
  dark: string;
}

/** Explicit, pre-built 12-step ramps per scheme. */
export interface SchemeRamps {
  light: Ramp;
  dark: Ramp;
}

export type PaletteInput = string | SchemeSeeds | SchemeRamps;

/* ------------------------------------------------------------------ */
/* Color-space helpers                                                 */
/* ------------------------------------------------------------------ */

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Parse `#rgb` / `#rrggbb` → `[r, g, b]` in 0..255. Throws on malformed input. */
const hexToRgb = (hex: string): [number, number, number] => {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length !== 6 || /[^0-9a-fA-F]/.test(h)) {
    throw new Error(`Invalid hex color: "${hex}"`);
  }
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
};

/** RGB (0..255) → HSL with `h` in 0..360 and `s`/`l` in 0..1. */
const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return [0, 0, l];
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  return [h * 60, s, l];
};

/** HSL (`h` 0..360, `s`/`l` 0..1) → `#rrggbb`. */
const hslToHex = (h: number, s: number, l: number): string => {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = (((h % 360) + 360) % 360) / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r = 0;
  let g = 0;
  let b = 0;
  if (hp >= 0 && hp < 1) [r, g, b] = [c, x, 0];
  else if (hp < 2) [r, g, b] = [x, c, 0];
  else if (hp < 3) [r, g, b] = [0, c, x];
  else if (hp < 4) [r, g, b] = [0, x, c];
  else if (hp < 5) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const m = l - c / 2;
  const to255 = (v: number): string =>
    Math.round(clamp01(v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${to255(r)}${to255(g)}${to255(b)}`;
};

/* ------------------------------------------------------------------ */
/* Ramp generation                                                     */
/* ------------------------------------------------------------------ */

// Per-step [lightness, saturationMultiplier] anchors, applied over the seed's
// hue and saturation. Lightness is fixed per step (Radix ramps keep a fairly
// stable per-step lightness across hues), so the seed chiefly drives hue while
// steps stay legible and consistent. Steps 1-8 are surfaces/borders, 9-10 the
// solid accent, 11-12 text.
const LIGHT_STOPS: ReadonlyArray<readonly [number, number]> = [
  [0.995, 0.3],
  [0.985, 0.4],
  [0.965, 0.5],
  [0.945, 0.58],
  [0.92, 0.66],
  [0.89, 0.74],
  [0.85, 0.82],
  [0.79, 0.9],
  [0.56, 1.0],
  [0.51, 1.0],
  [0.43, 0.92],
  [0.26, 0.9],
];

const DARK_STOPS: ReadonlyArray<readonly [number, number]> = [
  [0.115, 0.3],
  [0.135, 0.42],
  [0.17, 0.52],
  [0.2, 0.6],
  [0.235, 0.66],
  [0.275, 0.72],
  [0.33, 0.8],
  [0.4, 0.88],
  [0.56, 1.0],
  [0.61, 1.0],
  [0.72, 0.6],
  [0.93, 0.5],
];

/** Expand a hex seed into a 12-step ramp for the given scheme. */
export const rampFromHex = (hex: string, scheme: "light" | "dark"): string[] => {
  const [h, s] = rgbToHsl(...hexToRgb(hex));
  const stops = scheme === "light" ? LIGHT_STOPS : DARK_STOPS;
  return stops.map(([l, sMul]) => hslToHex(h, clamp01(s * sMul), l));
};

/* ------------------------------------------------------------------ */
/* Palette resolution                                                  */
/* ------------------------------------------------------------------ */

const rampFromName = (name: TamaguiColorName, scheme: "light" | "dark"): string[] => {
  const key = scheme === "light" ? name : (`${name}Dark` as keyof typeof Colors);
  return Object.values(Colors[key] as Record<string, string>);
};

/** Resolve a single seed (name or hex) into a 12-step ramp for one scheme. */
const seedToRamp = (seed: string, scheme: "light" | "dark"): string[] =>
  isColorName(seed) ? rampFromName(seed, scheme) : rampFromHex(seed, scheme);

const isSchemeObject = (input: PaletteInput): input is SchemeSeeds | SchemeRamps =>
  typeof input === "object" && input !== null && "light" in input && "dark" in input;

/**
 * Resolve any {@link PaletteInput} into `{ light, dark }` 12-step ramps.
 * Assumes the input already passed validation.
 */
export const resolvePalette = (input: PaletteInput): ResolvedPalette => {
  if (typeof input === "string") {
    return { light: seedToRamp(input, "light"), dark: seedToRamp(input, "dark") };
  }
  if (isSchemeObject(input)) {
    // Explicit ramps (arrays) pass through; string seeds expand per scheme.
    const light = Array.isArray(input.light)
      ? [...(input.light as Ramp)]
      : seedToRamp(input.light as string, "light");
    const dark = Array.isArray(input.dark)
      ? [...(input.dark as Ramp)]
      : seedToRamp(input.dark as string, "dark");
    return { light, dark };
  }
  throw new Error(`Invalid palette input: ${JSON.stringify(input)}`);
};
