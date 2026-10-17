import * as Colors from "@tamagui/colors";
// The v5 theme builder (v3 dropped `@tamagui/theme-builder`). Only this module
// imports it: the stock config ships precomputed themes (`../themes.generated`),
// so apps that never call `createTheme` never execute the builder, and bundlers
// that honour `sideEffects: false` drop it entirely.
import { createThemes } from "@tamagui/config-v5/builder";
import {
  createFont,
  createTamagui,
  type CreateTamaguiProps,
  createTokens,
  type InferTamaguiConfig,
} from "@tamagui/core";

import { animations } from "../animations";
import { FOCUS_RING_VARIABLES, withFocusRingColor } from "../focus-ring";
import { toFontUnits, toLineHeightUnits } from "../font-units";
import { media as defaultMedia } from "../media";
import { OVER_MEDIA } from "../over-media";
import {
  breakpoints as defaultBreakpoints,
  lineHeightRatios,
  monoFontFamily,
  systemFontFamily,
} from "../scales";
import { KNIT_SETTINGS } from "../settings";
import { shorthands as defaultShorthands } from "../shorthands";
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

/** Turn a scale into a Tamagui token map (adds the `0` step; v3 reserves `true`). */
const scaleToTokens = (scale: Scale): Record<string | number, number> => ({
  0: 0,
  xxs: scale.xxs,
  xs: scale.xs,
  sm: scale.sm,
  md: scale.md,
  lg: scale.lg,
  xl: scale.xl,
  xxl: scale.xxl,
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
  return { size, lineHeight };
};

const BASE_WEIGHT = { 4: "400", 5: "500", 6: "600", 7: "700" };

/** Build the named font map, applying `fonts` overrides onto stock defaults. */
const buildFonts = (
  fontScale: Scale,
  overrides: Record<string, FontInput> | undefined,
): Record<string, ReturnType<typeof createFont>> => {
  const { size, lineHeight } = buildFontScales(fontScale);

  const stock: Record<string, { family: string }> = {
    body: { family: systemFontFamily },
    heading: { family: systemFontFamily },
    mono: { family: monoFontFamily },
  };

  const names = new Set<string>([...Object.keys(stock), ...Object.keys(overrides ?? {})]);
  const out: Record<string, ReturnType<typeof createFont>> = {};

  for (const name of names) {
    const defaults = stock[name] ?? { family: systemFontFamily };
    let config: FontConfig = {
      family: defaults.family,
      size,
      lineHeight,
      weight: { ...BASE_WEIGHT },
      // declared on the first step; `createFont` fills the other size keys
      letterSpacing: { xxs: 0 },
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

    // px in, `rem` out on the web (browser text zoom scales it), numbers on
    // native — applied AFTER the overrides so a caller's px size converts too.
    config = {
      ...config,
      size: toFontUnits(config.size),
      ...(config.lineHeight ? { lineHeight: toLineHeightUnits(config.lineHeight) } : {}),
    };

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
export const createTheme = (options: ThemeOptions = {}): KnitTamaguiConfig => {
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
      // Matches the stock config (`config/themes.ts`) — see the perf note there.
      // Tamagui's `defaultComponentThemes` would cross-multiply 20 component
      // themes across every scheme × palette (2 × N × 20), so a stock
      // `createTheme()` would build 440 themes instead of 22. Keeping this
      // `false` also means a consumer's `createTheme()` output has the SAME
      // theme set as the kit's shipped `config`.
      componentThemes: false as const,
      base: { palette: resolvePalette(neutralPalette), extra: buildExtra(options) },
      accent: { palette: resolvePalette(brandPalette) },
      childrenThemes: buildChildrenThemes(options, brandPalette),
    } as Record<string, unknown>,
    (options.themeBuilder ?? {}) as Record<string, unknown>,
  );
  const themes =
    options.themes ??
    withFocusRingColor(
      createThemes(themeProps as Parameters<typeof createThemes>[0]) as Record<
        string,
        Record<string, string>
      >,
    );

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
      variables: FOCUS_RING_VARIABLES,
      // v3 reads `defaultFont` from `settings` only.
      settings: {
        ...KNIT_SETTINGS,
        defaultFont: options.defaultFont ?? KNIT_SETTINGS.defaultFont,
        ...options.settings,
      },
    } as Record<string, unknown>,
    (options.tamagui ?? {}) as Record<string, unknown>,
  );

  return createTamagui(tamaguiProps as CreateTamaguiProps);
};

/**
 * What {@link createTheme} returns: a full Tamagui config, typed generically
 * (its token / theme names come from runtime options, so they cannot be known
 * statically). Spelled out as a named type (rather than inferred) so the emitted
 * declarations never need to name Tamagui's internal types (TS2883).
 */
export type KnitTamaguiConfig = InferTamaguiConfig<CreateTamaguiProps>;
