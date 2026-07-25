/**
 * Primitive design scales for the fresh Tamagui design system. Self-contained
 * (no dependency on legacy theme files) so the foundation stands on its own.
 */
export const spacing = { xxs: 2, xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

// Powers of two — border rounding.
export const radius = { xxs: 1, xs: 2, sm: 4, md: 8, lg: 16, xl: 32, xxl: 64 } as const;

// Icons and button heights
export const size = { xxs: 18, xs: 24, sm: 32, md: 40, lg: 48, xl: 64, xxl: 96 } as const;

export const font = { xxs: 12, xs: 14, sm: 16, md: 18, lg: 20, xl: 24, xxl: 28 } as const;

/**
 * Unitless line-height multipliers (resolved to px against each font size).
 *
 * The ladder is a HUMP: it rises to 1.5 at `sm` and then TAPERS to 1.3, because the
 * right amount of leading depends on what a size is used for, not just how big it is.
 * The bottom steps are captions, labels and dense UI chrome — short strings where
 * a tall line box just pads the control — so they run tighter. The middle is prose
 * read over many lines, which wants the most air. The top steps are display copy,
 * where a body ratio reads as a gap between lines rather than leading. A ladder that
 * only climbs (the previous shape here, 1.35 → 1.65) inverts the top half: it made
 * `$xxl` headings 46px tall, double-spaced.
 *
 * This matches the systems the kit draws from, which agree on the shape even though
 * they express it differently. Mantine ships two scales — body `lineHeights` that
 * climb 1.4 → 1.65 across 12–20px, and `headings.sizes` that taper 1.5 → 1.3 across
 * 14–34px; our single 12–28px font scale spans BOTH ranges, so it has to be the
 * union of the two, which is this hump. Tailwind's built-in pairings trace the same
 * curve: 12/16 (1.33), 16/24 (1.5), 18/28 (1.56), 24/32 (1.33), 48/48 (1.0).
 *
 * Against the `font` scale above this resolves to 16 / 20 / 24 / 26 / 28 / 32 / 36 —
 * every value even (so a `(height − lineHeight) / 2` centering gap stays on whole
 * pixels), the first four on a 4px grid, and each one equal to the leading Tailwind
 * or Mantine gives that same font size. Retuning here moves every derived line height
 * at once — `config/fonts.ts`, `createTheme`'s font scales, and `getLineHeight`.
 */
export const lineHeightRatios = {
  xxs: 1.35,
  xs: 1.45,
  sm: 1.5,
  md: 1.45,
  lg: 1.4,
  xl: 1.35,
  xxl: 1.3,
} as const;
export const breakpoints = {
  xxs: 480,
  xs: 576,
  sm: 768,
  md: 992,
  lg: 1200,
  xl: 1408,
  xxl: 1920,
} as const;

/** Cross-platform system font stacks (no react-native dependency). */
export const systemFontFamily =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
export const monoFontFamily =
  'ui-monospace, SFMono-Regular, Menlo, Monaco, "Courier New", monospace';
