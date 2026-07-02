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

/** Unitless line-height multipliers (resolved to px against each font size). */
export const lineHeightRatios = {
  xxs: 1.35,
  xs: 1.4,
  sm: 1.45,
  md: 1.5,
  lg: 1.55,
  xl: 1.6,
  xxl: 1.65,
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
