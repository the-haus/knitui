/**
 * Shared functional-variant helpers that map Mantine's NAMED props onto Tamagui
 * style props. Tamagui's `':string'`/`':number'` catch-all variants let a
 * component accept an open-ended value (`<Group justify="space-between" />`)
 * while still resolving tokens. The open-ended `string` is narrowed locally to
 * the exact style-prop type each value targets (never `any`).
 */
import { type FontSizeTokens, isWeb, type RadiusTokens } from "@knitui/core";

import type { BoxProps } from "../Box";
import type { TextProps } from "../Text";
import { controlMetrics as M } from "./control-metrics";
import {
  VARIANT_FILL,
  VARIANT_FOREGROUND_EMPHASIS,
  VARIANT_FOREGROUND_MUTED,
  VARIANT_INTERACTION,
  type VariantKey,
} from "./variant-colors";

/**
 * Re-export the canonical size scale so the 70+ components that already import
 * from this module can alias their public `XxxSize` prop type to `SizeKey`
 * (`type ButtonSize = SizeKey`) without adding a second import. `SizeKey` /
 * `DEFAULT_SIZE` live in `control-metrics.ts` next to the table they describe.
 */
export { DEFAULT_SIZE, type SizeKey } from "./control-metrics";
export {
  FOCUS_RING,
  focusRingStyle,
  VARIANT_FILL,
  VARIANT_FOREGROUND_EMPHASIS,
  VARIANT_FOREGROUND_MUTED,
  VARIANT_INTERACTION,
  VARIANT_KEYS,
  type VariantKey,
} from "./variant-colors";

const SIZE_KEYS = new Set(["xxs", "xs", "sm", "md", "lg", "xl", "xxl"]);

/** `"md"` → `"$md"`; a `$`-token or arbitrary CSS value passes through. */
const toRadius = (val: string) => (SIZE_KEYS.has(val) ? `$${val}` : val) as RadiusTokens;

/**
 * Mantine-style `radius` prop. Accepts a size key (`"md"`), a `$`-token
 * (`"$md"`), an arbitrary CSS value (`"10px"`), or a number.
 */
export const radiusVariant = {
  ":string": (val: string) => ({ borderRadius: toRadius(val) }),
  ":number": (val: number) => ({ borderRadius: val }),
} as const;

/**
 * Like `radiusVariant`, but rounds only the two INLINE-END corners (top-right +
 * bottom-right). Used where one edge carries a solid border that should stay
 * square — e.g. `Blockquote`'s start border.
 */
export const endRadiusVariant = {
  ":string": (val: string) => ({
    borderTopRightRadius: toRadius(val),
    borderBottomRightRadius: toRadius(val),
  }),
  ":number": (val: number) => ({
    borderTopRightRadius: val,
    borderBottomRightRadius: val,
  }),
} as const;

/** Map a flexbox alignment prop name onto its Tamagui style prop. */
export const alignVariant = {
  ":string": (val: string) => ({ alignItems: val as BoxProps["alignItems"] }),
} as const;

export const justifyVariant = {
  ":string": (val: string) => ({ justifyContent: val as BoxProps["justifyContent"] }),
} as const;

export const wrapVariant = {
  ":string": (val: string) => ({ flexWrap: val as BoxProps["flexWrap"] }),
} as const;

/**
 * Mantine-style `spacing`/`gap` prop. A space token (`"$sm"`), arbitrary CSS
 * value, or number maps onto `gap`. Used by `List`'s `spacing`.
 */
export const gapVariant = {
  ":number": (val: number) => ({ gap: val }),
  ":string": (val: string) => ({ gap: val as BoxProps["gap"] }),
} as const;

/** Open-ended `overflow` prop (`"hidden"`, `"scroll"`, …). Used by `Grid`. */
export const overflowVariant = {
  ":string": (val: string) => ({ overflow: val as BoxProps["overflow"] }),
} as const;

/**
 * Mantine-style `maxWidth`/`size` cap. A number is a raw pixel width; a string
 * is a `$`-token or arbitrary CSS value. Used by `Container`'s `size`.
 */
export const maxWidthVariant = {
  ":number": (val: number) => ({ maxWidth: val }),
  ":string": (val: string) => ({ maxWidth: val as BoxProps["maxWidth"] }),
} as const;

/**
 * Named content-width scale for overlay panels (`Modal`, etc.). Each key maps to
 * a sensible `maxWidth` (px) for a centred dialog card; a raw `:number`/`:string`
 * passes an arbitrary width through. UNLIKE `maxWidthVariant` (number/string
 * only, so named keys silently fall through to an invalid `maxWidth: "md"`) and
 * UNLIKE `Container`'s viewport-`breakpoints` caps, these are dialog-scale widths
 * tuned after Mantine's modal sizes (xs 320 → xl 780).
 */
export const modalSizeVariant = {
  xxs: { maxWidth: 240 },
  xs: { maxWidth: 320 },
  sm: { maxWidth: 380 },
  md: { maxWidth: 440 },
  lg: { maxWidth: 620 },
  xl: { maxWidth: 780 },
  xxl: { maxWidth: 1040 },
  ":number": (val: number) => ({ maxWidth: val }),
  ":string": (val: string) => ({ maxWidth: val as BoxProps["maxWidth"] }),
} as const;

/**
 * Named content-width scale for `Container`. Each key maps to a sensible
 * `maxWidth` (px) for a centred page-content column; a raw `:number`/`:string`
 * passes an arbitrary width through. UNLIKE `maxWidthVariant` (number/string
 * only — named keys would silently fall through to an invalid `maxWidth: "md"`),
 * and UNLIKE `modalSizeVariant` (dialog-card scale), these are page-column
 * widths tuned after Mantine's container sizes (xs 540 → xl 1320), extended to
 * the kit's full seven-step scale.
 */
export const containerSizeVariant = {
  xxs: { maxWidth: 420 },
  xs: { maxWidth: 540 },
  sm: { maxWidth: 720 },
  md: { maxWidth: 960 },
  lg: { maxWidth: 1140 },
  xl: { maxWidth: 1320 },
  xxl: { maxWidth: 1608 },
  ":number": (val: number) => ({ maxWidth: val }),
  ":string": (val: string) => ({ maxWidth: val as BoxProps["maxWidth"] }),
} as const;

/**
 * Square `size` prop — maps a single value onto BOTH `width` and `height`. A
 * number is raw pixels; a string is a `$`-token or arbitrary CSS value. Pair it
 * with named `$size`-token keys for the standard scale and spread this for the
 * arbitrary escape hatch:
 *
 * ```ts
 * size: { xs: { width: "$xs", height: "$xs" }, …, ...squareSizeVariant }
 * ```
 *
 * Used by `ActionIcon`, `AngleSlider`, `Avatar`, and `ColorSwatch`.
 */
export const squareSizeVariant = {
  xxs: { minWidth: M.xxs.height, width: M.xxs.height, height: M.xxs.height },
  xs: { minWidth: M.xs.height, width: M.xs.height, height: M.xs.height },
  sm: { minWidth: M.sm.height, width: M.sm.height, height: M.sm.height },
  md: { minWidth: M.md.height, width: M.md.height, height: M.md.height },
  lg: { minWidth: M.lg.height, width: M.lg.height, height: M.lg.height },
  xl: { minWidth: M.xl.height, width: M.xl.height, height: M.xl.height },
  xxl: { minWidth: M.xxl.height, width: M.xxl.height, height: M.xxl.height },
} as const;

export const squareSizeRoundedVariant = {
  xxs: {
    minWidth: M.xxs.height,
    width: M.xxs.height,
    height: M.xxs.height,
    borderRadius: M.xxs.borderRadius,
  },
  xs: {
    minWidth: M.xs.height,
    width: M.xs.height,
    height: M.xs.height,
    borderRadius: M.xs.borderRadius,
  },
  sm: {
    minWidth: M.sm.height,
    width: M.sm.height,
    height: M.sm.height,
    borderRadius: M.sm.borderRadius,
  },
  md: {
    minWidth: M.md.height,
    width: M.md.height,
    height: M.md.height,
    borderRadius: M.md.borderRadius,
  },
  lg: {
    minWidth: M.lg.height,
    width: M.lg.height,
    height: M.lg.height,
    borderRadius: M.lg.borderRadius,
  },
  xl: {
    minWidth: M.xl.height,
    width: M.xl.height,
    height: M.xl.height,
    borderRadius: M.xl.borderRadius,
  },
  xxl: {
    minWidth: M.xxl.height,
    width: M.xxl.height,
    height: M.xxl.height,
    borderRadius: M.xxl.borderRadius,
  },
  ":string": (val: string) => ({ borderRadius: toRadius(val) }),
  ":number": (val: number) => ({ borderRadius: val }),
} as const;

export const squareSizeVariantFallthrough = {
  ...squareSizeVariant,
  ":string": (val: string) => ({ minWidth: val, width: val, height: val }),
  ":number": (val: number) => ({ minWidth: val, width: val, height: val }),
} as const;

/**
 * Mantine-style `size` prop for a text-bearing control (Button, etc.): each key
 * maps to a `height` (from the `size` token scale), `paddingHorizontal` (from
 * the `space` scale), and `borderRadius` (from the `radius` scale). This is the
 * single source of truth for control metrics — spread it instead of re-declaring
 * the ladder inline. Token groups resolve by property: `$md` is size.md on
 * `height`, space.md on `paddingHorizontal`, radius.md on `borderRadius`.
 *
 * Used by `Button`, `Button.GroupSection`, `SegmentedControl.Control`.
 */
export const controlVariant = {
  xxs: { height: M.xxs.height, paddingHorizontal: M.xxs.paddingHorizontal },
  xs: { height: M.xs.height, paddingHorizontal: M.xs.paddingHorizontal },
  sm: { height: M.sm.height, paddingHorizontal: M.sm.paddingHorizontal },
  md: { height: M.md.height, paddingHorizontal: M.md.paddingHorizontal },
  lg: { height: M.lg.height, paddingHorizontal: M.lg.paddingHorizontal },
  xl: { height: M.xl.height, paddingHorizontal: M.xl.paddingHorizontal },
  xxl: { height: M.xxl.height, paddingHorizontal: M.xxl.paddingHorizontal },
} as const;

/**
 * Balanced control-text font ladder — the `fontSize` column of `controlMetrics`.
 * UNLIKE `fontSizeVariant` (which maps each key to its same-key font token), this
 * CLAMPS the two smallest steps (xxs/xs → `$xxs`) so a tiny control isn't
 * dominated by its label. Text-BEARING controls (Button, SegmentedControl, Tabs,
 * input hosts) should size their label/value text with this so control text stays
 * proportional to control height; standalone typography keeps `fontSizeVariant`.
 */
export const controlFontVariant = {
  xxs: { fontSize: M.xxs.fontSize },
  xs: { fontSize: M.xs.fontSize },
  sm: { fontSize: M.sm.fontSize },
  md: { fontSize: M.md.fontSize },
  lg: { fontSize: M.lg.fontSize },
  xl: { fontSize: M.xl.fontSize },
  xxl: { fontSize: M.xxl.fontSize },
} as const;

/**
 * Like `controlVariant`, but for a pill-shaped control that pins its own
 * `borderRadius` (e.g. `borderRadius: 9999`) and lays out inline children with a
 * `gap`: each key maps `height` + `paddingHorizontal` (identical to
 * `controlVariant`) + `gap` (from the `space` scale), with NO `borderRadius`. A
 * `:number` passes a raw pixel size through to a proportional height/padding/gap.
 *
 * Used by `Badge`, `Chip`, `Pill` so the three stay in lockstep.
 */
export const controlGapVariant = {
  xxs: { height: M.xxs.height, paddingHorizontal: M.xxs.paddingHorizontalPill, gap: M.xxs.gap },
  xs: { height: M.xs.height, paddingHorizontal: M.xs.paddingHorizontalPill, gap: M.xs.gap },
  sm: { height: M.sm.height, paddingHorizontal: M.sm.paddingHorizontalPill, gap: M.sm.gap },
  md: { height: M.md.height, paddingHorizontal: M.md.paddingHorizontalPill, gap: M.md.gap },
  lg: { height: M.lg.height, paddingHorizontal: M.lg.paddingHorizontalPill, gap: M.lg.gap },
  xl: { height: M.xl.height, paddingHorizontal: M.xl.paddingHorizontalPill, gap: M.xl.gap },
  xxl: { height: M.xxl.height, paddingHorizontal: M.xxl.paddingHorizontalPill, gap: M.xxl.gap },
  ":number": (val: number) => ({
    height: val,
    paddingHorizontal: Math.round(val * 0.5),
    gap: Math.max(4, Math.round(val * 0.25)),
  }),
} as const;

/* -------------------------------------------------------------------------- */
/* Variant COLOR builders — the color twin of the size builders above. Each is */
/* a ready-to-spread `variant:` map sourced from `variant-colors.ts`, so a      */
/* component spreads one of these instead of re-declaring the palette ladder    */
/* inline. Re-tune a ramp token in `variant-colors.ts` and every consumer moves */
/* together (the same contract `controlMetrics` gives the size builders).       */
/* -------------------------------------------------------------------------- */

/**
 * Keep only `keys` from a variant-color map — lets a component expose a SUBSET
 * of the canonical vocabulary (e.g. Badge wants `dot` but not `subtle`) while
 * still sourcing every value from the shared ladder. Unknown keys are ignored.
 */
export const pickVariants = <T extends Record<string, unknown>, K extends keyof T>(
  map: T,
  keys: readonly K[],
): Pick<T, K> => {
  const out = {} as Pick<T, K>;
  for (const key of keys) if (key in map) out[key] = map[key];
  return out;
};

/**
 * INTERACTIVE control fill — background + border + hover/press/focus per variant.
 * The frame ladder for `Button` and `ActionIcon`. Spread into `variants.variant`.
 */
export const controlColorVariant = {
  filled: { ...VARIANT_FILL.filled, ...VARIANT_INTERACTION.filled },
  light: { ...VARIANT_FILL.light, ...VARIANT_INTERACTION.light },
  outline: { ...VARIANT_FILL.outline, ...VARIANT_INTERACTION.outline },
  subtle: { ...VARIANT_FILL.subtle, ...VARIANT_INTERACTION.subtle },
  default: { ...VARIANT_FILL.default, ...VARIANT_INTERACTION.default },
  white: { ...VARIANT_FILL.white, ...VARIANT_INTERACTION.white },
  transparent: { ...VARIANT_FILL.transparent, ...VARIANT_INTERACTION.transparent },
  // No hover/press color: the runtime gradient sits in `backgroundImage` (web) or
  // an SVG layer (native), so a hover/press `backgroundColor` would be invisible
  // beneath it. The shared press-dip (`pressScaleStyle`) still gives tactile feedback.
  gradient: { ...VARIANT_FILL.gradient },
} as const;

/**
 * STATIC surface fill — background + border only, no pseudo states. The frame
 * ladder for non-interactive surfaces (`Badge`, `Alert`). Includes the pill-only
 * `dot` variant; `pickVariants` to expose just the subset a component supports.
 */
export const surfaceColorVariant = { ...VARIANT_FILL } as const;

/**
 * EMPHASIS text color per variant — labels, titles, glyphs sitting on the fill.
 * The text ladder for `Button`/`ActionIcon` labels, `Badge` text, `Alert.Title`.
 */
export const controlTextColorVariant = { ...VARIANT_FOREGROUND_EMPHASIS } as const;

/**
 * MUTED text color per variant — softer body copy (e.g. `Alert.Message`). Only
 * `filled` inverts to sit on the strong fill; the rest resolve to `$color12`.
 */
export const mutedTextColorVariant = { ...VARIANT_FOREGROUND_MUTED } as const;

/** The canonical variant keys, re-exported as a Set for cheap membership checks. */
const VARIANT_KEY_SET = new Set<VariantKey>([
  "filled",
  "light",
  "outline",
  "subtle",
  "default",
  "white",
  "transparent",
  "dot",
  "gradient",
]);

/** True when `value` is one of the canonical variant keys. */
export const isVariantKey = (value: string): value is VariantKey =>
  VARIANT_KEY_SET.has(value as VariantKey);

/**
 * Thickness/height-only `size` prop — maps a size key onto `height` (from the
 * `size` scale), or a number straight through. The single source of truth for
 * tracks/boxes whose only size dimension is height.
 *
 * Used by `Loader` (frame) and `Progress` (track).
 */
export const heightVariant = {
  xxs: { height: M.xxs.height },
  xs: { height: M.xs.height },
  sm: { height: M.sm.height },
  md: { height: M.md.height },
  lg: { height: M.lg.height },
  xl: { height: M.xl.height },
  xxl: { height: M.xxl.height },
  ":number": (val: number) => ({ height: val }),
} as const;

/**
 * The input root frame's per-size HEIGHT (a `md` field is 40px, matching a `md`
 * Button), with `:string`/`:number` catch-alls for a custom height. Like
 * `heightVariant` but with the extra `:string` pass-through. It lives HERE — not in
 * `Input/shared.tsx` — so the styled input frame's `size` variant doesn't create a
 * circular TYPE reference back through its own props (frame → variant →
 * frame-props → frame). Derived from the canonical control heights.
 */
export const fieldHeightVariant = {
  xxs: { height: M.xxs.height },
  xs: { height: M.xs.height },
  sm: { height: M.sm.height },
  md: { height: M.md.height },
  lg: { height: M.lg.height },
  xl: { height: M.xl.height },
  xxl: { height: M.xxl.height },
  ":string": (val: string) => ({ height: val as BoxProps["height"] }),
  ":number": (val: number) => ({ height: val }),
} as const;

/**
 * Track-thickness `size` ladder for thin horizontal bars (Progress). A bar track
 * is far thinner than a control height, so it keeps its own small px ladder rather
 * than reading `controlMetrics.height` — but it lives here as a NAMED shared
 * variant (reviewed as a set, `:number` escape hatch preserved) instead of an
 * inline magic-number map. Used by `Progress`.
 */
export const progressThicknessVariant = {
  xxs: { height: 2 },
  xs: { height: 3 },
  sm: { height: 5 },
  md: { height: 8 },
  lg: { height: 12 },
  xl: { height: 16 },
  xxl: { height: 20 },
  ":number": (val: number) => ({ height: val }),
} as const;

/**
 * Slider track-thickness ladder — like `progressThicknessVariant` but tuned for a
 * draggable track. Maps a size key onto the track `height`. Used by `Slider`.
 */
export const sliderTrackVariant = {
  xxs: { height: 3 },
  xs: { height: 4 },
  sm: { height: 5 },
  md: { height: 6 },
  lg: { height: 8 },
  xl: { height: 10 },
  xxl: { height: 12 },
  ":number": (val: number) => ({ height: val }),
} as const;

/**
 * Slider thumb ladder — square width+height for the draggable handle. Tuned to sit
 * proportionally above the track of the same key. Used by `Slider`.
 */
export const sliderThumbVariant = {
  xxs: { width: 12, height: 12 },
  xs: { width: 14, height: 14 },
  sm: { width: 16, height: 16 },
  md: { width: 20, height: 20 },
  lg: { width: 24, height: 24 },
  xl: { width: 28, height: 28 },
  xxl: { width: 32, height: 32 },
  ":number": (val: number) => ({ width: val, height: val }),
} as const;

/**
 * Fixed content-WIDTH ladder for panels (Dialog, Drawer width axis). A single
 * shared width scale so a `md` of any panel is the same width; a `:number`/`:string`
 * passes an arbitrary px/CSS width through. Distinct from `maxWidthVariant`, which
 * sets a max-width cap rather than a fixed width.
 */
export const panelWidthVariant = {
  xxs: { width: 160 },
  xs: { width: 200 },
  sm: { width: 280 },
  md: { width: 340 },
  lg: { width: 400 },
  xl: { width: 480 },
  xxl: { width: 560 },
  ":number": (val: number) => ({ width: val }),
  ":string": (val: string) => ({ width: val as BoxProps["width"] }),
} as const;

/**
 * Cursor is a web affordance in this kit. Passing it as a Tamagui style prop on
 * native can leak to React Native's host node as a top-level prop and trigger
 * "nest it in a style object" warnings, so component frames gate it here.
 */
export const webCursor = <T extends string>(cursor: T): { cursor?: T } => (isWeb ? { cursor } : {});

export const webCursorStyle = <T extends string>(cursor: T): { cursor: T } | undefined =>
  isWeb ? { cursor } : undefined;

/**
 * Make a Box-based interactive control a real, natively-focusable `<button>` on
 * web. A bare `<div role="button">` cannot receive keyboard focus, so its
 * `:focus-visible` outline (the shared {@link focusRingStyle}) never fires; a real
 * `<button>` is tab-focusable and activates on Enter/Space for free. Returns the
 * Tamagui host-element override (`render="button"`) plus `type="button"` (so it
 * doesn't submit an enclosing form), gated to web — a no-op `{}` on native, where
 * there's no button host and outline-based focus rings don't apply anyway. Spread
 * onto the frame: `<Frame {...webButton()} />`. Mirrors `webCursor`'s web-gating.
 */
export const webButton = (): { render?: "button"; type?: string } =>
  isWeb ? { render: "button", type: "button" } : {};

/**
 * Web-only reset for the native `<button>` user-agent `text-align: center`.
 * Returned as a raw `style` fragment to spread onto the element's `style` prop —
 * NOT a `styled()` config value: Tamagui classifies `textAlign` as a Text style
 * and FILTERS it out of a View/Stack-based `styled()` frame (verified: a frame's
 * `maxWidth` survives to the DOM but its `textAlign` does not), so the element's
 * forwarded `style` is the only reliable channel. `undefined` on native, where a
 * pressable's text already starts at the inline edge and View style has no
 * `textAlign` — spread it into a `style` array so the native `undefined` entry is
 * simply ignored. Place it BEFORE the caller's `style` so explicit alignment
 * still wins. Mirrors {@link webButton} / {@link webCursorStyle} web-gating; pair
 * the two on any pressable that renders a real `<button>` and hosts text content
 * (e.g. `UnstyledButton`), so web text matches native's start-aligned default.
 */
export const webButtonTextReset = (): { textAlign: "left" } | undefined =>
  isWeb ? { textAlign: "left" } : undefined;

/**
 * Mantine's `direction` (flex main-axis) cannot be a styled variant: Tamagui
 * reserves `direction` for the CSS writing-direction style prop (`"ltr" | "rtl"
 * | …`), whose type wins over any same-named variant. Components expose it via a
 * styleable wrapper that maps `direction` → `flexDirection` instead (see `Flex`).
 */
export type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";

/**
 * Transition keys registered in `@knitui/core`'s `createAnimations` config
 * (`config/animations.ts` + `.native.ts`). Kept in sync with those maps.
 *
 * Split into duration presets + named effects (the first eight) and the CSS
 * easing-curve keys (the last five). The curve keys are what `resolveTransition`
 * maps a `transitionTimingFunction` onto so the easing is exact.
 */
export type TransitionName =
  | "100ms"
  | "fast"
  | "medium"
  | "slow"
  | "bouncy"
  | "pulse"
  | "spin"
  | "stripe"
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out";

export type TransitionValue = TransitionName | [TransitionName, { duration?: number }] | null;

/**
 * Map a CSS `transition-timing-function` onto the registered easing curve that
 * reproduces it. The matching `ease`/`ease-in`/`ease-out`/`ease-in-out`/`linear`
 * keys carry the curve; the exact duration is applied separately via a
 * `{ duration }` override (see {@link timedTransition}), so this resolver only
 * picks the *shape*. An arbitrary `cubic-bezier(...)` can't be a static config
 * key, so it approximates to `bouncy` (its overshoot curve) — the one lossy case
 * on web; `CollapseBox.native` parses the bezier exactly off the shared
 * `CSS_EASING_BEZIER` table (`@knitui/core`).
 * Unknown values fall back to `ease`, the library-wide default.
 *
 * This is the single source of truth — `CollapseBox` (web), `RollingNumber`, and
 * the native `Transition` all import it instead of re-deriving the mapping.
 */
export const resolveTransition = (timingFunction = "ease"): TransitionName => {
  switch (timingFunction.trim().toLowerCase()) {
    case "linear":
      return "linear";
    case "ease":
      return "ease";
    case "ease-in":
      return "ease-in";
    case "ease-out":
      return "ease-out";
    case "ease-in-out":
      return "ease-in-out";
    default:
      return timingFunction.includes("cubic-bezier") ? "bouncy" : "ease";
  }
};

/**
 * Build the `[curve, { duration }]` transition value for a timed (non-spring)
 * animation: pick the easing curve for `timingFunction`, then pin the exact
 * `duration` via the driver's duration override. Pass the result to
 * {@link transitionProps}. Centralises the `[resolveTransition(fn), { duration }]`
 * idiom the size/height-clip components all repeat.
 */
export const timedTransition = (duration: number, timingFunction = "ease"): TransitionValue => [
  resolveTransition(timingFunction),
  { duration },
];

/**
 * Build a precisely-typed `{ transition }` object to spread onto a styled
 * component. Keeping this prop present and passing `null` when disabled follows
 * Tamagui's animation-driver rules and preserves hook order for animated views.
 */
export const transitionProps = (transition: TransitionValue): { transition: TransitionValue } => ({
  transition,
});

/**
 * Fraction an interactive control scales DOWN to while pressed — the tactile
 * "dip" shared by `Button`, `ActionIcon`, `Chip`, … `0.97` is a 3% shrink: clearly
 * felt without looking broken on the smallest controls. Tune the press feel here
 * once for the whole kit.
 */
export const PRESS_SCALE = 0.97;

/**
 * Tactile "shrink on press" feedback. Spread onto a pressable frame's BASE style
 * (`...pressScaleStyle`): Tamagui MERGES this base `pressStyle` with the
 * per-variant `pressStyle` color, so on press the control both darkens (variant)
 * and dips (this). Pair the frame with `transitionProps("fast")` (or any
 * `transition`) so the dip EASES instead of snapping — the `scale` rides
 * Tamagui's `transform` transition on web and the Reanimated `scale` driver on
 * native, using the kit's own animation/press internals end to end.
 */
export const pressScaleStyle = { pressStyle: { scale: PRESS_SCALE } } as const;

/**
 * Build a precisely-typed `{ animateOnly }` object to spread onto a styled
 * component. `animateOnly` scopes the CSS animation driver's `transition` to ONLY
 * the listed properties (see `@tamagui/animations-css`); without it a plain
 * `transition="fast"` expands to `transition: all …`, which animates `top`/`left`
 * too. Floating elements (Tooltip/Popover) position via `top`/`left` from
 * floating-ui and must NOT transition those — otherwise the element visibly slides
 * across the screen on every re-measure. Restricting to `["transform", "opacity"]`
 * keeps the enter/exit fade + scale/slide while positioning stays instant. Like
 * `transitionProps`, this dodges the excess-property check WITHOUT widening to `any`.
 */
export const animateOnlyProps = (properties: string[]): { animateOnly: string[] } => ({
  animateOnly: properties,
});

/**
 * Build a precisely-typed `{ onHoverIn?, onHoverOut? }` object to spread onto a
 * styled component. Tamagui resolves these web hover events at runtime (they are
 * no-ops on native), but the generated style-prop types don't surface them, so a
 * direct attribute fails to typecheck. Spreading a precise object dodges the
 * excess-property check WITHOUT widening to `any` — the same technique as
 * `transitionProps`. Used by `Rating` for its hover preview.
 */
export const hoverProps = (handlers: {
  onHoverIn?: () => void;
  onHoverOut?: () => void;
}): { onHoverIn?: () => void; onHoverOut?: () => void } => handlers;

/**
 * Mantine-style `shadow` scale (xxs→xxl). Elevation rises with the key; colour
 * comes from the `$dropShadowColor` semantic token so it adapts to light/dark.
 *
 * Expressed as the cross-platform `boxShadow` style prop (`"{x}px {y}px {blur}px
 * {spread}px {color}"`) rather than legacy RN `shadow*` props: `shadow*` only
 * renders on iOS (Android needs `elevation`), whereas `boxShadow` works on web +
 * iOS + Android 9+ (RN 0.76 New Arch, enabled here). Tamagui resolves the
 * embedded `$dropShadowColor` token theme-aware on every platform
 * (`resolveCompoundTokens`/`parseBoxShadow`), so iOS and Android stay aligned
 * with no runtime polyfill.
 *
 * The token is deliberately NOT named `$shadowColor`: that key collides with
 * React Native's reserved legacy `shadowColor` style prop, which makes Tamagui's
 * native pipeline drop the token's alpha on iOS (shadows render washed-out).
 */
export const shadowVariant = {
  xxs: { boxShadow: "0px 1px 1px 0px $dropShadowColor" },
  xs: { boxShadow: "0px 1px 3px 0px $dropShadowColor" },
  sm: { boxShadow: "0px 3px 6px 0px $dropShadowColor" },
  md: { boxShadow: "0px 5px 12px 0px $dropShadowColor" },
  lg: { boxShadow: "0px 8px 20px 0px $dropShadowColor" },
  xl: { boxShadow: "0px 12px 28px 0px $dropShadowColor" },
  xxl: { boxShadow: "0px 16px 40px 0px $dropShadowColor" },
} as const;

/**
 * Mantine-style `size` prop for text: a size key (`"md"`) maps to the matching
 * font-size token; a `$`-token / CSS value / number passes through to
 * `fontSize`. Line height is intentionally left unset so it derives from the
 * font config's per-fontSize line-height mapping.
 */
export const fontSizeVariant = {
  xxs: { fontSize: "$xxs" },
  xs: { fontSize: "$xs" },
  sm: { fontSize: "$sm" },
  md: { fontSize: "$md" },
  lg: { fontSize: "$lg" },
  xl: { fontSize: "$xl" },
  xxl: { fontSize: "$xxl" },
} as const;

/**
 * Kbd keycap `size` ladder. A keycap is a text-bearing inline chip, so it scales
 * like a control: `fontSize` (clamped at the bottom two steps), `paddingHorizontal`,
 * and `borderRadius` all read straight from the canonical `controlMetrics` table so
 * a keycap stays in lockstep with same-key Buttons/Badges. It ADDS a tighter
 * proportional `paddingVertical` ladder so the keycap HEIGHT grows with the label
 * instead of staying pinned to one padding (a `<kbd>` is a `Text`, so height comes
 * from line-height + vertical padding, not an explicit `height`). Used by `Kbd`.
 */
export const kbdSizeVariant = {
  xxs: {
    fontSize: M.xxs.fontSize,
    paddingHorizontal: M.xxs.paddingHorizontal,
    paddingVertical: 2,
    borderRadius: M.xxs.borderRadius,
  },
  xs: {
    fontSize: M.xs.fontSize,
    paddingHorizontal: M.xs.paddingHorizontal,
    paddingVertical: 2,
    borderRadius: M.xs.borderRadius,
  },
  sm: {
    fontSize: M.sm.fontSize,
    paddingHorizontal: M.sm.paddingHorizontal,
    paddingVertical: 4,
    borderRadius: M.sm.borderRadius,
  },
  md: {
    fontSize: M.md.fontSize,
    paddingHorizontal: M.md.paddingHorizontal,
    paddingVertical: 6,
    borderRadius: M.md.borderRadius,
  },
  lg: {
    fontSize: M.lg.fontSize,
    paddingHorizontal: M.lg.paddingHorizontal,
    paddingVertical: 8,
    borderRadius: M.lg.borderRadius,
  },
  xl: {
    fontSize: M.xl.fontSize,
    paddingHorizontal: M.xl.paddingHorizontal,
    paddingVertical: 10,
    borderRadius: M.xl.borderRadius,
  },
  xxl: {
    fontSize: M.xxl.fontSize,
    paddingHorizontal: M.xxl.paddingHorizontal,
    paddingVertical: 12,
    borderRadius: M.xxl.borderRadius,
  },
} as const;

/**
 * Plain `fontSize` pass-through — UNLIKE `fontSizeVariant` it does NOT map a
 * bare size key to a `$`-token; every value (key, `$`-token, CSS value) flows
 * straight to `fontSize`. Use it as the catch-all alongside explicit token keys:
 *
 * ```ts
 * size: { xs: { fontSize: "$xs" }, …, ...fontSizePassthroughVariant }
 * ```
 */
export const fontSizePassthroughVariant = {
  ...fontSizeVariant,
  ":string": (val: string) => ({ fontSize: val as FontSizeTokens }),
  ":number": (val: number) => ({ fontSize: val }),
} as const;

/** Open-ended `fontWeight` prop (`"700"`, `600`, `"bold"`, …). */
export const fontWeightVariant = {
  ":string": (val: string) => ({ fontWeight: val as TextProps["fontWeight"] }),
  ":number": (val: number) => ({ fontWeight: val as TextProps["fontWeight"] }),
} as const;

/** Open-ended `textAlign` prop (`"left"`, `"center"`, `"justify"`, …). */
export const textAlignVariant = {
  ":string": (val: string) => ({ textAlign: val as TextProps["textAlign"] }),
} as const;

/** Open-ended `textTransform` prop (`"uppercase"`, `"capitalize"`, …). */
export const textTransformVariant = {
  ":string": (val: string) => ({ textTransform: val as TextProps["textTransform"] }),
} as const;

/**
 * CSS `text-wrap` values (`"balance"`, `"pretty"`, …) — web-only and not modeled
 * by Tamagui's style props, so the variant narrows the open-ended string locally.
 */
export type TextWrap = "wrap" | "nowrap" | "balance" | "pretty" | "stable";

/** Mantine-style `textWrap` prop. Web-only; a no-op on native. Used by `Title`. */
export const textWrapVariant = {
  ":string": (val: string) => ({ textWrap: val as TextWrap }),
} as const;
