import { getTokenValue } from "@knitui/core";

/**
 * THE canonical control-sizing table — the single source of truth for how every
 * control-shaped component scales across the `xxs → xxl` size keys. Each archetype
 * variant in `style-props.ts` (and the input host sizing in `Input/shared.tsx`) is
 * DERIVED from this table, so the relationship between height, font, padding, gap,
 * and radius is defined exactly once. Re-tune a column here and Button, Input,
 * Badge, Avatar, Progress, and Slider all move together.
 *
 * Every value is a TOKEN KEY (`"$md"`), which resolves per-property: `$md` is
 * `size.md` (40) on `height`, `space.md` (16) on `paddingHorizontal`/`gap`,
 * `font.md` (18) on `fontSize`, `radius.md` (8) on `borderRadius`. See
 * `core/config/scales.ts` for the raw numbers and `docs/sizing/README.md` for the
 * design rationale (balanced text-to-height ratio, capped radius curve).
 *
 *  key  height  font   ratio  padX   padX(pill)  gap    radius
 *  xxs   24     12     .50     6      10           6      2
 *  xs    28     12     .43    10      12          10      2
 *  sm    32     14     .44    12      16          12      4
 *  md    40     18     .45    16      20          16      4
 *  lg    48     20     .42    20      24          20      8
 *  xl    56     24     .43    24      24          24      8
 *  xxl   64     28     .44    32      32          32     16
 *
 * `fontSize` is intentionally CLAMPED at the bottom two steps (xxs/xs borrow the
 * 12px `$xxs` font instead of their same-key font) so tiny controls aren't
 * dominated by text; `sm → xxl` hold a flat ~0.42–0.45 ratio. `borderRadius` is
 * CAPPED at `$lg` (16) so large controls stay rectangles, not accidental pills.
 * `paddingHorizontalPill` is the standard padding bumped one space step — the one
 * sanctioned divergence, used by the pill family (Badge/Chip/Pill).
 */
export const controlMetrics = {
  xxs: {
    height: "$xxs",
    fontSize: "$xxs",
    paddingHorizontal: "$xxs",
    paddingHorizontalPill: "$xs",
    gap: "$xxs",
    borderRadius: "$xs",
  },
  xs: {
    height: "$xs",
    fontSize: "$xxs",
    paddingHorizontal: "$xs",
    paddingHorizontalPill: "$sm",
    gap: "$xxs",
    borderRadius: "$xs",
  },
  sm: {
    height: "$sm",
    fontSize: "$xs",
    paddingHorizontal: "$sm",
    paddingHorizontalPill: "$md",
    gap: "$xs",
    borderRadius: "$sm",
  },
  md: {
    height: "$md",
    fontSize: "$md",
    paddingHorizontal: "$md",
    paddingHorizontalPill: "$lg",
    gap: "$xs",
    borderRadius: "$sm",
  },
  lg: {
    height: "$lg",
    fontSize: "$lg",
    paddingHorizontal: "$lg",
    paddingHorizontalPill: "$xl",
    gap: "$sm",
    borderRadius: "$md",
  },
  xl: {
    height: "$xl",
    fontSize: "$xl",
    paddingHorizontal: "$xl",
    paddingHorizontalPill: "$xl",
    gap: "$sm",
    borderRadius: "$md",
  },
  xxl: {
    height: "$xxl",
    fontSize: "$xxl",
    paddingHorizontal: "$xxl",
    paddingHorizontalPill: "$xxl",
    gap: "$md",
    borderRadius: "$lg",
  },
} as const;

/** The size keys this system spans, in ascending order. */
export const SIZE_KEYS = ["xxs", "xs", "sm", "md", "lg", "xl", "xxl"] as const;

export type SizeKey = (typeof SIZE_KEYS)[number];

/** The library-wide canonical default size (see docs/sizing/README.md §4). */
export const DEFAULT_SIZE = "md" as const satisfies SizeKey;

/**
 * Resolve a size key (`"md"`) to its raw pixel HEIGHT, or pass a number through,
 * via Tamagui's token system (`$md` on the `size` group → 40). RENDER-TIME only:
 * `getTokenValue` reads the live config, which exists once `createTamagui` has run,
 * so never call this while building a styled variant (module-load) — express those
 * with `$`-token strings instead, which resolve at the style layer without the config.
 */
export const resolveSizePx = (size: SizeKey | number): number => {
  if (typeof size === "number") return size;
  const resolved = getTokenValue(`$${size}` as Parameters<typeof getTokenValue>[0], "size");
  return typeof resolved === "number" ? resolved : 0;
};
