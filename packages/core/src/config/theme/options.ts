import type { PaletteInput, TamaguiColorName } from "./palette";
import type { RadiusPreset, Scale, ScaleKey, SizePreset, SpacePreset } from "./scale-presets";

/** Full override for a single font (superset of the `family`-only string form). */
export interface FontOverride {
  family?: string;
  size?: Partial<Record<string, number>>;
  lineHeight?: Partial<Record<string, number>>;
  weight?: Partial<Record<string, string>>;
  letterSpacing?: Partial<Record<string, number>>;
}

/** A font entry: a bare family string, or a full {@link FontOverride}. */
export type FontInput = string | FontOverride;

/** Per-scheme shadow token overrides, spread into every theme's `extra`. */
export interface ShadowOverrides {
  light?: Record<string, string>;
  dark?: Record<string, string>;
}

/**
 * Inputs to {@link createTheme}. Every field is optional and layers onto the
 * kit's stock defaults, so override as little or as much as you need.
 */
export interface ThemeOptions {
  /* brand & accents ------------------------------------------------ */
  /** Primary brand ramp — a hex, a `@tamagui/colors` name, `{light,dark}`, or ramps. */
  brand?: PaletteInput;
  /** Theme name the brand is exposed under (`<Theme name="…">`). Default `"brand"`. */
  brandThemeName?: string;
  /** Extra accent themes, each `theme="<key>"`. Values are palette inputs. */
  accents?: Record<string, PaletteInput>;
  /** Keep the built-in blue/red/green/… accent themes. Default `true`. */
  includeDefaultAccents?: boolean;
  /** Register all 28 `@tamagui/colors` ramps, or just the named subset. */
  includeTamaguiColors?: boolean | TamaguiColorName[];

  /* neutral chrome ------------------------------------------------- */
  /** Base UI (grayscale) ramp. Default `"gray"`. */
  neutral?: PaletteInput;
  /** Elevation/shadow token overrides per scheme. */
  shadows?: ShadowOverrides;

  /* tokens --------------------------------------------------------- */
  /** Radius preset name or per-step overrides merged onto the default preset. */
  radius?: RadiusPreset | Partial<Scale>;
  /** Spacing preset name or per-step overrides merged onto the default preset. */
  space?: SpacePreset | Partial<Scale>;
  /** Sizing preset name or per-step overrides (defaults to match `space`). */
  size?: SizePreset | Partial<Scale>;
  /** Font-size scale overrides, merged onto the default font scale. */
  fontSizes?: Partial<Scale>;
  /** Extra `zIndex` steps merged onto the defaults. */
  zIndex?: Record<string | number, number>;
  /** Extra raw color tokens (not ramps) — e.g. `{ brandRaw: "#7C3AED" }`. */
  colors?: Record<string, string>;

  /* fonts ---------------------------------------------------------- */
  /** Named fonts. `body`/`heading`/`mono` default; add any others. */
  fonts?: Record<string, FontInput>;
  /** Default font family key. Default `"body"`. Must name an existing font. */
  defaultFont?: string;

  /* responsive ----------------------------------------------------- */
  /** Breakpoint overrides — rebuilds the media queries. */
  breakpoints?: Partial<Record<ScaleKey, number>>;
  /** Extra media queries merged onto the built-in set. */
  media?: Record<string, object>;

  /* motion / styling ---------------------------------------------- */
  /** Replace the animation driver. */
  animations?: unknown;
  /** Extra style shorthands merged onto the defaults. */
  shorthands?: Record<string, string>;
  /** `createTamagui` settings, merged onto the defaults. */
  settings?: Record<string, unknown>;

  /* escape hatches ------------------------------------------------- */
  /** Deep-merged into the `createThemes` props (templates, masks, …). */
  themeBuilder?: Record<string, unknown>;
  /** A fully-built themes object — bypasses the theme builder entirely. */
  themes?: Record<string, unknown>;
  /** Deep-merged into `createTamagui()` — augments, never clobbers. */
  tamagui?: Record<string, unknown>;
}

/** Theme names the builder reserves; accent/brand names must not collide. */
export const RESERVED_THEME_NAMES: ReadonlySet<string> = new Set([
  "light",
  "dark",
  "accent",
  "base",
  "true",
]);

/** Every recognized top-level option key (used for typo detection). */
export const THEME_OPTION_KEYS: readonly (keyof ThemeOptions)[] = [
  "brand",
  "brandThemeName",
  "accents",
  "includeDefaultAccents",
  "includeTamaguiColors",
  "neutral",
  "shadows",
  "radius",
  "space",
  "size",
  "fontSizes",
  "zIndex",
  "colors",
  "fonts",
  "defaultFont",
  "breakpoints",
  "media",
  "animations",
  "shorthands",
  "settings",
  "themeBuilder",
  "themes",
  "tamagui",
];
