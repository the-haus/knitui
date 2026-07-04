import { defineTheme } from "./extend-theme";

/**
 * Curated starting points for {@link createTheme} / {@link extendTheme}. Each is
 * a plain {@link ThemeOptions} object — layer your brand on top:
 *
 * ```ts
 * extendTheme(themePresets.vibrant, { brand: "#7C3AED" });
 * ```
 */
export const themePresets = {
  /** Restrained, monochromatic, tight spacing and square corners. */
  minimal: defineTheme({
    neutral: "slate",
    brand: "slate",
    radius: "sharp",
    space: "compact",
    includeDefaultAccents: false,
    accents: { blue: "blue", red: "red" },
  }),

  /** Saturated brand, generous spacing, soft corners, full color set. */
  vibrant: defineTheme({
    brand: "violet",
    radius: "rounded",
    space: "comfortable",
    includeTamaguiColors: true,
  }),

  /** Calm neutral chrome with an indigo brand and business-y accents. */
  professional: defineTheme({
    neutral: "gray",
    brand: "indigo",
    radius: "default",
    space: "default",
    accents: { teal: "teal", amber: "amber" },
  }),
} as const;

export type ThemePresetName = keyof typeof themePresets;
