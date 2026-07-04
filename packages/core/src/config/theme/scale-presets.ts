import { font, radius, size, spacing } from "../scales";

/** The seven named steps every design scale is keyed by. */
export const SCALE_KEYS = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;
export type ScaleKey = (typeof SCALE_KEYS)[number];
export type Scale = Record<ScaleKey, number>;

/** Spacing (padding/margin/gap) presets. `default` is the kit's stock scale. */
export const SPACE_PRESETS = {
  default: spacing,
  compact: { xxs: 2, xs: 3, sm: 6, md: 9, lg: 12, xl: 18, xxl: 24 },
  comfortable: { xxs: 3, xs: 6, sm: 12, md: 16, lg: 24, xl: 32, xxl: 48 },
} as const satisfies Record<string, Scale>;
export type SpacePreset = keyof typeof SPACE_PRESETS;

/** Border-radius presets. `sharp` removes rounding; `rounded` exaggerates it. */
export const RADIUS_PRESETS = {
  default: radius,
  rounded: { xxs: 2, xs: 4, sm: 8, md: 12, lg: 20, xl: 36, xxl: 72 },
  sharp: { xxs: 0, xs: 0, sm: 0, md: 0, lg: 0, xl: 0, xxl: 0 },
} as const satisfies Record<string, Scale>;
export type RadiusPreset = keyof typeof RADIUS_PRESETS;

/**
 * Control-height / icon-size presets. Keyed by the SAME names as {@link SPACE_PRESETS}
 * so `size` can default to whatever `space` preset was chosen (compact space ⇒
 * compact controls) unless overridden.
 */
export const SIZE_PRESETS = {
  default: size,
  compact: { xxs: 16, xs: 20, sm: 28, md: 34, lg: 42, xl: 56, xxl: 84 },
  comfortable: { xxs: 20, xs: 28, sm: 36, md: 44, lg: 54, xl: 72, xxl: 108 },
} as const satisfies Record<string, Scale>;
export type SizePreset = keyof typeof SIZE_PRESETS;

/** Default font-size scale (overridable per-step via `fontSizes`). */
export const FONT_SIZE_DEFAULT: Scale = font;

export const RADIUS_PRESET_NAMES = Object.keys(RADIUS_PRESETS) as RadiusPreset[];
export const SPACE_PRESET_NAMES = Object.keys(SPACE_PRESETS) as SpacePreset[];
export const SIZE_PRESET_NAMES = Object.keys(SIZE_PRESETS) as SizePreset[];
