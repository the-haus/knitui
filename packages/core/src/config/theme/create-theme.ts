import * as Colors from "@tamagui/colors";
import { createFont, createTamagui, createTokens } from "@tamagui/core";
import { createThemes } from "@tamagui/theme-builder";

import { animations } from "../animations";
import { media as defaultMedia } from "../media";
import {
  breakpoints as defaultBreakpoints,
  lineHeightRatios,
  monoFontFamily,
  systemFontFamily,
} from "../scales";
import { shorthands as defaultShorthands } from "../shorthands";
import { OVER_MEDIA } from "../themes";
import { deepMerge } from "./merge";
import type { FontInput, ThemeOptions } from "./options";
import { type PaletteInput, resolvePalette, TAMAGUI_COLOR_NAMES } from "./palette";
import {
  FONT_SIZE_DEFAULT,
  RADIUS_PRESETS,
  type Scale,
  SCALE_KEYS,
  SIZE_PRESETS,
  SPACE_PRESETS,
} from "./scale-presets";
import { validateThemeOptions } from "./validate";

/** The kit's built-in accent themes (blue/red/green/…). */
const DEFAULT_ACCENT_NAMES = [
  "blue",
  "red",
  "green",
  "orange",
  "pink",
  "purple",
  "teal",
  "yellow",
  "gray",
] as const;

const DEFAULT_ZINDEX: Record<string | number, number> = {
  0: 0,
  1: 100,
  2: 200,
  3: 300,
  4: 400,
  5: 500,
};

const DEFAULT_SETTINGS = {
  allowedStyleValues: "somewhat-strict-web" as const,
  autocompleteSpecificTokens: "except-special" as const,
};

/* ------------------------------------------------------------------ */
/* Scales                                                              */
/* ------------------------------------------------------------------ */

/**
 * Resolve a scale option (preset name | per-step overrides | undefined) into a
 * full scale, merging overrides onto the chosen default preset.
 */
const resolveScale = (
  input: string | Partial<Scale> | undefined,
  presets: Record<string, Scale>,
  defaultPreset: string,
): Scale => {
  if (typeof input === "string") return presets[input];
  const base = presets[defaultPreset];
  return input ? { ...base, ...input } : base;
};

/** Turn a scale into a Tamagui token map (adds `0` and `true` aliases). */
const scaleToTokens = (scale: Scale): Record<string | number, number> => ({
  0: 0,
  xxs: scale.xxs,
  xs: scale.xs,
  sm: scale.sm,
  md: scale.md,
  lg: scale.lg,
  xl: scale.xl,
  xxl: scale.xxl,
  true: scale.sm,
});

/* ------------------------------------------------------------------ */
/* Fonts                                                               */
/* ------------------------------------------------------------------ */

type FontConfig = Parameters<typeof createFont>[0];

const buildFontScales = (fontScale: Scale) => {
  const size: Record<string, number> = {};
  const lineHeight: Record<string, number> = {};
  for (const key of SCALE_KEYS) {
    size[key] = fontScale[key];
    lineHeight[key] = Math.round(fontScale[key] * lineHeightRatios[key]);
  }
  size.true = fontScale.md;
  lineHeight.true = Math.round(fontScale.md * lineHeightRatios.md);
  return { size, lineHeight };
};

const BASE_WEIGHT = { 4: "400", 5: "500", 6: "600", 7: "700" };

/** Build the named font map, applying `fonts` overrides onto stock defaults. */
const buildFonts = (
  fontScale: Scale,
  overrides: Record<string, FontInput> | undefined,
): Record<string, ReturnType<typeof createFont>> => {
  const { size, lineHeight } = buildFontScales(fontScale);

  const stock: Record<string, { family: string; trueWeight: string }> = {
    body: { family: systemFontFamily, trueWeight: "400" },
    heading: { family: systemFontFamily, trueWeight: "700" },
    mono: { family: monoFontFamily, trueWeight: "400" },
  };

  const names = new Set<string>([...Object.keys(stock), ...Object.keys(overrides ?? {})]);
  const out: Record<string, ReturnType<typeof createFont>> = {};

  for (const name of names) {
    const defaults = stock[name] ?? { family: systemFontFamily, trueWeight: "400" };
    let config: FontConfig = {
      family: defaults.family,
      size,
      lineHeight,
      weight: { ...BASE_WEIGHT, true: defaults.trueWeight },
      letterSpacing: { true: 0 },
    };

    const override = overrides?.[name];
    if (typeof override === "string") {
      config = { ...config, family: override };
    } else if (override) {
      config = {
        ...config,
        ...(override.family ? { family: override.family } : {}),
        size: { ...config.size, ...override.size },
        lineHeight: { ...config.lineHeight, ...override.lineHeight },
        weight: { ...config.weight, ...override.weight },
        letterSpacing: { ...config.letterSpacing, ...override.letterSpacing },
      } as FontConfig;
    }

    out[name] = createFont(config);
  }

  return out;
};

/* ------------------------------------------------------------------ */
/* Themes                                                              */
/* ------------------------------------------------------------------ */

const buildExtra = (options: ThemeOptions) => ({
  light: {
    ...Colors.blue,
    ...Colors.red,
    dropShadowColor: "rgba(0,0,0,0.1)",
    dropShadowColorHover: "rgba(0,0,0,0.2)",
    ...OVER_MEDIA,
    ...options.shadows?.light,
  },
  dark: {
    ...Colors.blueDark,
    ...Colors.redDark,
    dropShadowColor: "rgba(0,0,0,0.4)",
    dropShadowColorHover: "rgba(0,0,0,0.6)",
    ...OVER_MEDIA,
    ...options.shadows?.dark,
  },
});

const buildChildrenThemes = (options: ThemeOptions, brandPalette: PaletteInput) => {
  const children: Record<string, { palette: ReturnType<typeof resolvePalette> }> = {};

  if (options.includeDefaultAccents ?? true) {
    for (const name of DEFAULT_ACCENT_NAMES) {
      children[name] = { palette: resolvePalette(name) };
    }
  }

  if (options.includeTamaguiColors) {
    const names = Array.isArray(options.includeTamaguiColors)
      ? options.includeTamaguiColors
      : TAMAGUI_COLOR_NAMES;
    for (const name of names) {
      children[name] = { palette: resolvePalette(name) };
    }
  }

  for (const [name, input] of Object.entries(options.accents ?? {})) {
    children[name] = { palette: resolvePalette(input) };
  }

  // The brand rides along as a named theme so `<Theme name="brand">` works.
  children[options.brandThemeName ?? "brand"] = { palette: resolvePalette(brandPalette) };

  return children;
};

/* ------------------------------------------------------------------ */
/* Media                                                               */
/* ------------------------------------------------------------------ */

const buildMedia = (bp: Record<string, number>) => ({
  xs: { maxWidth: bp.xs },
  sm: { maxWidth: bp.sm },
  md: { maxWidth: bp.md },
  lg: { maxWidth: bp.lg },
  xl: { maxWidth: bp.xl },
  gtXs: { minWidth: bp.xs + 1 },
  gtSm: { minWidth: bp.sm + 1 },
  gtMd: { minWidth: bp.md + 1 },
  gtLg: { minWidth: bp.lg + 1 },
  gtXl: { minWidth: bp.xl + 1 },
});

/* ------------------------------------------------------------------ */
/* createTheme                                                         */
/* ------------------------------------------------------------------ */

/**
 * Build a fully-configured Tamagui config from a set of brand inputs. Every
 * option is optional and falls back to the kit's stock defaults, so
 * `createTheme()` with no arguments reproduces the kit's stock look. See the
 * package README for the full option reference.
 */
export const createTheme = (options: ThemeOptions = {}) => {
  validateThemeOptions(options);

  // Scales. `size` defaults to whatever `space` preset was chosen.
  const spaceScale = resolveScale(options.space, SPACE_PRESETS, "default");
  const sizeDefaultPreset = typeof options.space === "string" ? options.space : "default";
  const sizeScale = resolveScale(options.size, SIZE_PRESETS, sizeDefaultPreset);
  const radiusScale = resolveScale(options.radius, RADIUS_PRESETS, "default");
  const fontScale: Scale = { ...FONT_SIZE_DEFAULT, ...options.fontSizes };

  // Tokens.
  const tokens = createTokens({
    color: {
      white: "#ffffff",
      black: "#000000",
      transparent: "rgba(0,0,0,0)",
      ...options.colors,
    },
    space: scaleToTokens(spaceScale),
    size: scaleToTokens(sizeScale),
    radius: scaleToTokens(radiusScale),
    zIndex: { ...DEFAULT_ZINDEX, ...options.zIndex },
  });

  // Fonts.
  const fonts = buildFonts(fontScale, options.fonts);

  // Themes — either a pre-built object (escape hatch) or the builder output.
  const brandPalette: PaletteInput = options.brand ?? "blue";
  const neutralPalette: PaletteInput = options.neutral ?? "gray";
  const themeProps = deepMerge(
    {
      base: { palette: resolvePalette(neutralPalette), extra: buildExtra(options) },
      accent: { palette: resolvePalette(brandPalette) },
      childrenThemes: buildChildrenThemes(options, brandPalette),
    } as Record<string, unknown>,
    (options.themeBuilder ?? {}) as Record<string, unknown>,
  );
  const themes = options.themes ?? createThemes(themeProps as Parameters<typeof createThemes>[0]);

  // Media.
  const bp = { ...defaultBreakpoints, ...options.breakpoints };
  const baseMedia = options.breakpoints ? buildMedia(bp) : defaultMedia;
  const media = { ...baseMedia, ...options.media };

  // Assemble.
  const tamaguiProps = deepMerge(
    {
      animations: (options.animations ?? animations) as never,
      fonts,
      tokens,
      themes,
      shorthands: { ...defaultShorthands, ...options.shorthands },
      media,
      defaultFont: options.defaultFont ?? "body",
      settings: { ...DEFAULT_SETTINGS, ...options.settings },
    } as Record<string, unknown>,
    (options.tamagui ?? {}) as Record<string, unknown>,
  );

  return createTamagui(tamaguiProps as Parameters<typeof createTamagui>[0]);
};

export type KnitTamaguiConfig = ReturnType<typeof createTheme>;
