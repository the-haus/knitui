import type { SizeKey } from "./control-metrics";

/**
 * THE canonical icon-size ladder — the px an icon takes when it sits INSIDE a
 * control at a given size key. Sibling to `controlMetrics` (heights/fonts) and
 * `variant-colors` (foreground): the single source of truth for icon sizing, so
 * Button/ActionIcon/Menu/Alert/Input chevrons-and-glyphs all scale together.
 *
 * Tuned a touch above the `controlMetrics` font ladder (≈1.1–1.2×) so an icon
 * reads with the same weight as the label beside it — matching the web default
 * where an inline `<svg>` renders at ~1em. The bottom two keys are nudged up so
 * icons in tiny controls stay legible (the font ladder clamps them to 12px).
 *
 *   key   font   icon
 *   xxs    12     14
 *   xs     12     14
 *   sm     14     16
 *   md     18     20
 *   lg     20     24
 *   xl     24     28
 *   xxl    28     32
 */
export const CONTROL_ICON_SIZE = {
  xxs: 14,
  xs: 14,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 28,
  xxl: 32,
} as const satisfies Record<SizeKey, number>;

const ICON_SIZE_KEYS = new Set<string>(Object.keys(CONTROL_ICON_SIZE));

const isSizeKey = (value: unknown): value is SizeKey =>
  typeof value === "string" && ICON_SIZE_KEYS.has(value);

/**
 * Resolve a control size to its in-control icon px. A number passes straight
 * through (an explicit icon px); a non-token / absent size (including an
 * arbitrary CSS size string, which Tamagui's `size` prop allows) falls back to
 * the canonical `md` control → 20px.
 */
export const controlIconSize = (size: SizeKey | number | string | undefined): number => {
  if (typeof size === "number") return size;
  return isSizeKey(size) ? CONTROL_ICON_SIZE[size] : CONTROL_ICON_SIZE.md;
};
