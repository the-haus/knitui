/**
 * Shared variant helpers that map Mantine's NAMED props onto Tamagui style props
 * — the kit's v3 variant vocabulary (docs/v3/conventions.md §5, "Internal helpers").
 *
 * Two shapes, picked by what the prop accepts:
 *
 *  - **Static exact-key maps** (`controlVariant`, `controlFontVariant`,
 *    `squareSizeVariant`, `fontSizeVariant`, `shadowVariant`, the colour ladders):
 *    plain literal objects generated from `controlMetrics` / `variant-colors`.
 *    Compiler-extractable, and they still work per clause (`size="sm md:lg"`).
 *    Spread them at MODULE scope only (`{ ...controlVariant.md, gap: "xs" }`).
 *  - **`styled.dynamic` variants** for an OPEN domain — a size key OR a raw
 *    number / CSS value (`radiusVariant`, `squareSizeVariantFallthrough`,
 *    `fontSizePassthroughVariant`, …). v3 runs a dynamic once per clause payload,
 *    so `radius="sm md:lg"` works. Use them AS the variant (`radius: radiusVariant`),
 *    NEVER spread them: spreading a dynamic copies only its brand symbol and turns
 *    the variant into a style-less "bare" dynamic. To extend a table with extra
 *    keys, build a new one with {@link tableVariant}.
 *
 * v2's `":string"` / `":number"` / `"...size"` catch-all keys are gone (v3 treats
 * them as literal keys that never match), and so are the `$`-sigil helpers
 * (`toRadius` & co.): a string is a token lookup, a number a raw value.
 */
import {
  type MotionPresetName as DriverPresetName,
  type FontSizeTokens,
  isWeb,
  MOTION_PRESETS,
  type RadiusTokens,
  type SizeTokens,
  type SpaceTokens,
  styled,
} from "@knitui/core";

import { controlMetrics as M, type SizeKey } from "./control-metrics";
import {
  VARIANT_CONTROL,
  VARIANT_FILL,
  VARIANT_FOREGROUND_EMPHASIS,
  VARIANT_FOREGROUND_MUTED,
  type VariantKey,
} from "./variant-colors";

/**
 * Re-export the canonical size scale so the 70+ components that already import
 * from this module can alias their public `XxxSize` prop type to `SizeKey`
 * (`type ButtonSize = SizeKey`) without adding a second import. `SizeKey` /
 * `DEFAULT_SIZE` live in `control-metrics.ts` next to the table they describe.
 */
export { DEFAULT_SIZE, type SizeKey } from "./control-metrics";
export { FOCUS_RING, FOCUS_WITHIN_RING, focusRingResetStyle, focusRingStyle } from "./focus-ring";
export {
  VARIANT_COLOR_LADDER,
  VARIANT_CONTROL,
  VARIANT_FILL,
  VARIANT_FOREGROUND_EMPHASIS,
  VARIANT_FOREGROUND_MUTED,
  VARIANT_INTERACTION,
  VARIANT_KEYS,
  type VariantKey,
} from "./variant-colors";

/* -------------------------------------------------------------------------- */
/* Dynamic-variant infrastructure                                             */
/* -------------------------------------------------------------------------- */

/** A style fragment a variant emits (style props, token names, clause strings). */
export type StyleFragment = Record<string, unknown>;

/** An open-ended CSS string (`"10px"`, `"50%"`) that keeps literal autocomplete. */
export type CssString = string & {};

/**
 * A v3 `styled.dynamic` variant accepting `V` — the type every open-domain helper
 * below returns. `GetProps` of the frame widens it to `FlatStyleValue<V>`, so the
 * prop also takes clause programs (`"sm md:lg"`).
 *
 * The brand intersection is load-bearing for the lib build: v3 does not export its
 * `StyledDynamicFn` interface, so a bare `ReturnType<…>` resolves to a type the
 * declaration emitter cannot name (TS2883). An intersection keeps THIS alias as the
 * printed name, so every exported variant emits as `DynamicVariant<…>`.
 */
export type DynamicVariant<V> = ReturnType<typeof styled.dynamic<V>> & {
  readonly __knituiDynamic?: true;
};

const makeDynamic = <V>(fn: (value: V) => StyleFragment | null | undefined): DynamicVariant<V> =>
  styled.dynamic<V>(fn);

/** Output cache cap per dynamic: open domains (arbitrary px) must not grow forever. */
const CACHE_LIMIT = 256;

/**
 * Memoise a value → fragment mapping per primitive value, so a re-render with the
 * same prop hands Tamagui the SAME fragment object (no per-render allocation, and
 * Tamagui's own identity caches hit). Bounded by {@link CACHE_LIMIT}.
 */
const memoFragment = <V>(build: (value: V) => StyleFragment | undefined) => {
  const cache = new Map<unknown, StyleFragment | undefined>();
  return (value: V): StyleFragment | undefined => {
    const primitive = typeof value === "string" || typeof value === "number";
    if (primitive) {
      const hit = cache.get(value);
      if (hit !== undefined || cache.has(value)) return hit;
    }
    const out = build(value);
    if (primitive) {
      if (cache.size >= CACHE_LIMIT) cache.clear();
      cache.set(value, out);
    }
    return out;
  };
};

/**
 * A `styled.dynamic` variant that maps one value straight onto one or more style
 * props (`passthroughVariant<RadiusValue>("borderRadius")` →
 * `radius="md"` ⇒ `{ borderRadius: "md" }`, `radius={6}` ⇒ `{ borderRadius: 6 }`).
 * Token names resolve per property at the style layer; numbers are px.
 */
export function passthroughVariant<V>(...props: readonly [string, ...string[]]): DynamicVariant<V> {
  const fragment = memoFragment<V>((value) => {
    const out: StyleFragment = {};
    for (const prop of props) out[prop] = value;
    return out;
  });
  return makeDynamic<V>(fragment);
}

/**
 * Build a `styled.dynamic` variant from a STATIC key table plus an optional
 * fallthrough for any other value — the v3 replacement for v2's
 * `{ xs: {...}, md: {...}, ":number": fn, ":string": fn }` maps. A table hit
 * returns the table's own (static, shared) fragment; anything else goes to
 * `fallback` (memoised per value). Runs per clause, so `size="sm md:lg"` works.
 *
 * ```ts
 * size: tableVariant(
 *   { ...fontSizeVariant, h1: { fontSize: "xxl" } },
 *   (value: number | CssString) => ({ fontSize: value }),
 * )
 * ```
 */
export function tableVariant<const Table extends Record<string, StyleFragment>>(
  table: Table,
): DynamicVariant<Extract<keyof Table, string>>;
export function tableVariant<const Table extends Record<string, StyleFragment>, Extra>(
  table: Table,
  fallback: (value: Extra) => StyleFragment | undefined,
): DynamicVariant<Extract<keyof Table, string> | Extra>;
export function tableVariant(
  table: Record<string, StyleFragment>,
  fallback?: (value: unknown) => StyleFragment | undefined,
): DynamicVariant<unknown> {
  const fall = fallback ? memoFragment(fallback) : undefined;
  return makeDynamic<unknown>((value) => {
    if (typeof value === "string" && Object.prototype.hasOwnProperty.call(table, value)) {
      return table[value];
    }
    return fall?.(value);
  });
}

/* -------------------------------------------------------------------------- */
/* Shape / layout variants                                                    */
/* -------------------------------------------------------------------------- */

/** What a `radius` prop accepts: a radius token, a number (px), or a CSS length. */
export type RadiusValue = SizeKey | RadiusTokens | number | CssString;

/**
 * Mantine-style `radius` prop. Accepts a size key (`"md"`, a radius token), a
 * number (px), or an arbitrary CSS value (`"10px"`). Use as the variant
 * (`radius: radiusVariant`), never spread it.
 */
export const radiusVariant = passthroughVariant<RadiusValue>("borderRadius");

/**
 * Like `radiusVariant`, but rounds only the two INLINE-END corners (top-right +
 * bottom-right). Used where one edge carries a solid border that should stay
 * square — e.g. `Blockquote`'s start border.
 */
export const endRadiusVariant = passthroughVariant<RadiusValue>(
  "borderTopRightRadius",
  "borderBottomRightRadius",
);

/** Flexbox cross-axis alignment values. */
export type AlignValue =
  "flex-start" | "flex-end" | "center" | "stretch" | "baseline" | "start" | "end" | CssString;

/** Flexbox main-axis distribution values. */
export type JustifyValue =
  | "flex-start"
  | "flex-end"
  | "center"
  | "space-between"
  | "space-around"
  | "space-evenly"
  | "start"
  | "end"
  | CssString;

/** Map a flexbox alignment prop name onto its Tamagui style prop. */
export const alignVariant = passthroughVariant<AlignValue>("alignItems");

export const justifyVariant = passthroughVariant<JustifyValue>("justifyContent");

export const wrapVariant = passthroughVariant<"wrap" | "nowrap" | "wrap-reverse">("flexWrap");

/**
 * Mantine-style `spacing`/`gap` prop. A space token (`"sm"`), arbitrary CSS
 * value, or number maps onto `gap`. Used by `List`'s `spacing`, `PinInput`'s `gap`.
 */
export const gapVariant = passthroughVariant<SizeKey | SpaceTokens | number | CssString>("gap");

/** Open-ended `overflow` prop (`"hidden"`, `"scroll"`, …). Used by `Grid`. */
export const overflowVariant = passthroughVariant<"visible" | "hidden" | "scroll" | CssString>(
  "overflow",
);

/**
 * Mantine-style `maxWidth` cap. A number is a raw pixel width; a string is a
 * token or arbitrary CSS value.
 */
export const maxWidthVariant = passthroughVariant<SizeTokens | number | CssString>("maxWidth");

/** A raw width / height escape hatch: px number or CSS length. */
type Length = number | CssString;

const maxWidthOf = (value: Length): StyleFragment => ({ maxWidth: value });
const widthOf = (value: Length): StyleFragment => ({ width: value });
const heightOf = (value: Length): StyleFragment => ({ height: value });

/**
 * Named content-width scale for overlay panels (`Modal`, etc.): dialog-scale
 * `maxWidth`s tuned after Mantine's modal sizes (xs 320 → xl 780). Any other
 * number / CSS value passes through as the `maxWidth`.
 */
export const MODAL_SIZES = {
  xxs: { maxWidth: 240 },
  xs: { maxWidth: 320 },
  sm: { maxWidth: 380 },
  md: { maxWidth: 440 },
  lg: { maxWidth: 620 },
  xl: { maxWidth: 780 },
  xxl: { maxWidth: 1040 },
} as const;

export const modalSizeVariant = tableVariant(MODAL_SIZES, maxWidthOf);

/**
 * Named content-width scale for `Container`: page-column `maxWidth`s tuned after
 * Mantine's container sizes (xs 540 → xl 1320), on the kit's seven-step scale.
 * Any other number / CSS value passes through as the `maxWidth`.
 */
export const CONTAINER_SIZES = {
  xxs: { maxWidth: 420 },
  xs: { maxWidth: 540 },
  sm: { maxWidth: 720 },
  md: { maxWidth: 960 },
  lg: { maxWidth: 1140 },
  xl: { maxWidth: 1320 },
  xxl: { maxWidth: 1608 },
} as const;

export const containerSizeVariant = tableVariant(CONTAINER_SIZES, maxWidthOf);

/**
 * Square `size` ladder — maps a size key onto BOTH `width` and `height` (+
 * `minWidth`) from the canonical control heights. A static exact-key map; use
 * {@link squareSizeVariantFallthrough} when the prop also takes a number / CSS
 * value. Used by `Radio`, `Stepper` (spread into their own size map) and read as
 * data by `PinInput` / `ColorPicker`.
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

/**
 * The square fallthrough body — a raw px / CSS size onto `minWidth` + `width` +
 * `height`. Exported for frames that build their own {@link tableVariant} on top
 * of it (Pagination).
 */
export const squareSizeOf = (value: Length): StyleFragment => ({
  minWidth: value,
  width: value,
  height: value,
});

/**
 * {@link squareSizeVariant} plus the raw escape hatch: `size={44}` / `size="3rem"`
 * size the square directly. Used by `ActionIcon`-likes, `Avatar`, `ColorSwatch`,
 * `Loader`, `Burger`, `Rating`, `AngleSlider`, `Indicator`.
 */
export const squareSizeVariantFallthrough = tableVariant(squareSizeVariant, squareSizeOf);

/**
 * The corner a square control (`ActionIcon`, `ThemeIcon`) takes from `sm` to `xl`
 * — `md` (8), the SAME corner `Button` uses at every size. The tiny steps keep the
 * table's 2px (an 8px corner on an 18–24px square reads as a circle); `xxl` keeps
 * its 16.
 */
const SQUARE_CONTROL_RADIUS = "md";

/** Square control sizes WITH the matching corner, per size key. */
export const SQUARE_ROUNDED_SIZES = {
  xxs: { ...squareSizeVariant.xxs, borderRadius: M.xxs.borderRadius },
  xs: { ...squareSizeVariant.xs, borderRadius: M.xs.borderRadius },
  sm: { ...squareSizeVariant.sm, borderRadius: SQUARE_CONTROL_RADIUS },
  md: { ...squareSizeVariant.md, borderRadius: SQUARE_CONTROL_RADIUS },
  lg: { ...squareSizeVariant.lg, borderRadius: SQUARE_CONTROL_RADIUS },
  xl: { ...squareSizeVariant.xl, borderRadius: SQUARE_CONTROL_RADIUS },
  xxl: { ...squareSizeVariant.xxl, borderRadius: M.xxl.borderRadius },
} as const;

/**
 * Square control `size` (ActionIcon, ThemeIcon): a size key sizes the square AND
 * picks its corner; a raw number / CSS value sizes the square only (the corner
 * comes from the frame's `radius`).
 */
export const squareSizeRoundedVariant = tableVariant(SQUARE_ROUNDED_SIZES, squareSizeOf);

/**
 * Mantine-style `size` prop for a text-bearing control (Button, etc.): each key
 * maps to a `height` (from the `size` token scale) and `paddingHorizontal` (from
 * the `space` scale). Token names resolve by property: `md` is size.md on
 * `height`, space.md on `paddingHorizontal`. Static exact-key map.
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
 * CLAMPS the two smallest steps (xxs/xs → `xxs`) so a tiny control isn't
 * dominated by its label. Static exact-key map.
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

/** Pill-control sizes: height + pill padding + gap, NO borderRadius. */
export const CONTROL_GAP_SIZES = {
  xxs: { height: M.xxs.height, paddingHorizontal: M.xxs.paddingHorizontalPill, gap: M.xxs.gap },
  xs: { height: M.xs.height, paddingHorizontal: M.xs.paddingHorizontalPill, gap: M.xs.gap },
  sm: { height: M.sm.height, paddingHorizontal: M.sm.paddingHorizontalPill, gap: M.sm.gap },
  md: { height: M.md.height, paddingHorizontal: M.md.paddingHorizontalPill, gap: M.md.gap },
  lg: { height: M.lg.height, paddingHorizontal: M.lg.paddingHorizontalPill, gap: M.lg.gap },
  xl: { height: M.xl.height, paddingHorizontal: M.xl.paddingHorizontalPill, gap: M.xl.gap },
  xxl: { height: M.xxl.height, paddingHorizontal: M.xxl.paddingHorizontalPill, gap: M.xxl.gap },
} as const;

/**
 * Like `controlVariant`, but for a pill-shaped control that pins its own
 * `borderRadius` and lays out inline children with a `gap`. A number passes a raw
 * pixel height through to a proportional height/padding/gap.
 *
 * Used by `Badge`, `Chip`, `Pill` so the three stay in lockstep.
 */
export const controlGapVariant = tableVariant(CONTROL_GAP_SIZES, (value: number) => ({
  height: value,
  paddingHorizontal: Math.round(value * 0.5),
  gap: Math.max(4, Math.round(value * 0.25)),
}));

/* -------------------------------------------------------------------------- */
/* Variant COLOR builders — the color twin of the size builders above. Static  */
/* exact-key maps generated from `variant-colors.ts`, so a component puts one  */
/* in its `variant` variant instead of re-declaring the palette ladder inline. */
/* -------------------------------------------------------------------------- */

/**
 * Keep only `keys` from a variant map — lets a component expose a SUBSET of the
 * canonical vocabulary (e.g. Badge wants `dot` but not `subtle`) while still
 * sourcing every value from the shared ladder. Module-scope use only (it
 * allocates). Unknown keys are ignored.
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
 * INTERACTIVE control fill — background (+ border) with hover/press clauses per
 * variant (`filled → { backgroundColor: "color9 hover:color10 press:color8" }`).
 * The frame ladder for `Button` and `ActionIcon`. Use as (or spread into, at
 * module scope) `variants.variant`. `gradient` has no hover/press colour: its
 * runtime gradient would hide it; the press-dip still gives tactile feedback.
 */
export const controlColorVariant = VARIANT_CONTROL;

/**
 * STATIC surface fill — background + border only, no interaction clauses. The
 * frame ladder for non-interactive surfaces (`Badge`, `Alert`). Includes the
 * pill-only `dot`; `pickVariants` to expose just the subset a component supports.
 */
export const surfaceColorVariant = VARIANT_FILL;

/**
 * EMPHASIS text color per variant — labels, titles, glyphs sitting on the fill.
 * The text ladder for `Button`/`ActionIcon` labels, `Badge` text, `Alert.Title`.
 */
export const controlTextColorVariant = VARIANT_FOREGROUND_EMPHASIS;

/**
 * MUTED text color per variant — softer body copy (e.g. `Alert.Message`). Only
 * `filled` inverts to sit on the strong fill; the rest resolve to `color12`.
 */
export const mutedTextColorVariant = VARIANT_FOREGROUND_MUTED;

/** The canonical variant keys, as a Set for cheap membership checks. */
const VARIANT_KEY_SET = new Set<string>([
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
export const isVariantKey = (value: string): value is VariantKey => VARIANT_KEY_SET.has(value);

/* -------------------------------------------------------------------------- */
/* Thickness / extent ladders                                                 */
/* -------------------------------------------------------------------------- */

/** Height-only sizes from the canonical control heights. */
const HEIGHT_SIZES = {
  xxs: { height: M.xxs.height },
  xs: { height: M.xs.height },
  sm: { height: M.sm.height },
  md: { height: M.md.height },
  lg: { height: M.lg.height },
  xl: { height: M.xl.height },
  xxl: { height: M.xxl.height },
} as const;

/**
 * Thickness/height-only `size` prop — a size key onto `height` (from the `size`
 * scale), or a number straight through. Used by `Loader` (frame).
 */
export const heightVariant = tableVariant(HEIGHT_SIZES, (value: number) => ({ height: value }));

/**
 * The input root frame's per-size HEIGHT (a `md` field is 40px, matching a `md`
 * Button), with a number / CSS value escape hatch. It lives HERE — not in
 * `Input/shared.tsx` — so the styled input frame's `size` variant doesn't create a
 * circular TYPE reference back through its own props.
 */
export const fieldHeightVariant = tableVariant(HEIGHT_SIZES, heightOf);

/**
 * Track-thickness ladder for thin horizontal bars (Progress) — far thinner than a
 * control height, so its own small px ladder. Read as data by `Progress` for the
 * vertical orientation.
 */
export const PROGRESS_THICKNESS = {
  xxs: { height: 2 },
  xs: { height: 3 },
  sm: { height: 5 },
  md: { height: 8 },
  lg: { height: 12 },
  xl: { height: 16 },
  xxl: { height: 20 },
} as const;

export const progressThicknessVariant = tableVariant(PROGRESS_THICKNESS, (value: number) => ({
  height: value,
}));

/** Slider track-thickness ladder — tuned for a draggable track. Used by `Slider`. */
export const SLIDER_TRACK_SIZES = {
  xxs: { height: 3 },
  xs: { height: 4 },
  sm: { height: 5 },
  md: { height: 6 },
  lg: { height: 8 },
  xl: { height: 10 },
  xxl: { height: 12 },
} as const;

export const sliderTrackVariant = tableVariant(SLIDER_TRACK_SIZES, (value: number) => ({
  height: value,
}));

/** Slider thumb ladder — square handle tuned above the same-key track. Used by `Slider`. */
export const SLIDER_THUMB_SIZES = {
  xxs: { width: 12, height: 12 },
  xs: { width: 14, height: 14 },
  sm: { width: 16, height: 16 },
  md: { width: 20, height: 20 },
  lg: { width: 24, height: 24 },
  xl: { width: 28, height: 28 },
  xxl: { width: 32, height: 32 },
} as const;

export const sliderThumbVariant = tableVariant(SLIDER_THUMB_SIZES, (value: number) => ({
  width: value,
  height: value,
}));

/**
 * Fixed content-WIDTH ladder for panels (Dialog, Drawer width axis), so a `md` of
 * any panel is the same width. Read as data by `Drawer`.
 */
export const PANEL_WIDTH = {
  xxs: { width: 160 },
  xs: { width: 200 },
  sm: { width: 280 },
  md: { width: 340 },
  lg: { width: 400 },
  xl: { width: 480 },
  xxl: { width: 560 },
} as const;

/** {@link PANEL_WIDTH} as a variant; a number / CSS value passes through as `width`. */
export const panelWidthVariant = tableVariant(PANEL_WIDTH, widthOf);

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
 *
 * `isWeb` is a BUILD-time constant, so the result is one of two invariant objects
 * — {@link WEB_BUTTON_PROPS}. It used to be freshly allocated on every render of
 * every button-like control; prefer spreading the constant directly. Frozen
 * because it is shared: callers spread it (`{...WEB_BUTTON_PROPS}`), never mutate it.
 */
export const WEB_BUTTON_PROPS: { render?: "button"; type?: string } = Object.freeze(
  isWeb ? { render: "button" as const, type: "button" } : {},
);

export const webButton = (): { render?: "button"; type?: string } => WEB_BUTTON_PROPS;

/**
 * {@link WEB_BUTTON_PROPS}, or — when the control NAVIGATES — a real `<a href>`
 * with `role="link"`. A control that goes somewhere must be a link on web, or
 * middle-click / ⌘-click / "copy link" / the hover URL preview all silently fail;
 * wrapping a `<button>` in an `<a>` instead nests interactive content (an axe
 * `nested-interactive` failure). So the button-like frames take `href` and swap
 * their host element here. Native has no link host: `href` is dropped there and
 * the caller's `onPress` does the navigating.
 *
 * The anchor keeps the browser's default click behaviour; an app that routes
 * in-app cancels it itself (e.g. `preventDefault` in a capture-phase click
 * handler for plain clicks, letting modified clicks through).
 */
export const webButtonOrLink = (
  href: string | undefined,
): { render?: "button" | "a"; type?: string; href?: string; role?: "link" } =>
  isWeb && href ? { render: "a", href, role: "link" } : WEB_BUTTON_PROPS;

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
 *
 * Also build-time invariant, so it is the module constant
 * {@link WEB_BUTTON_TEXT_RESET} rather than a per-render object — a fresh object
 * (and, worse, the fresh `[reset, style]` array around it) invalidates Tamagui's
 * style cache on every render. Frozen: it is only ever read.
 */
export const WEB_BUTTON_TEXT_RESET: { textAlign: "left" } | undefined = isWeb
  ? Object.freeze({ textAlign: "left" as const })
  : undefined;

export const webButtonTextReset = (): { textAlign: "left" } | undefined => WEB_BUTTON_TEXT_RESET;

/**
 * Mantine's `direction` (flex main-axis) cannot be a styled variant: Tamagui
 * reserves `direction` for the CSS writing-direction style prop (`"ltr" | "rtl"
 * | …`), whose type wins over any same-named variant. Components expose it via a
 * styleable wrapper that maps `direction` → `flexDirection` instead (see `Flex`).
 */
export type FlexDirection = "row" | "column" | "row-reverse" | "column-reverse";

/* -------------------------------------------------------------------------- */
/* Transitions (v3 `transition` prop values)                                  */
/* -------------------------------------------------------------------------- */

/**
 * The named presets registered in `@knitui/core`'s animation drivers — the keys
 * of the one `MOTION_PRESETS` table both drivers are built from (`fast`,
 * `medium`, `slow`, `bouncy`, `pulse`, `spin`, `stripe`, and the easing-curve
 * keys `linear` / `ease` / `ease-in` / `ease-out` / `ease-in-out`). v2's
 * `"100ms"` key is gone: a duration is plain CSS in v3.
 */
export type TransitionName = DriverPresetName;

/**
 * The object form of a v3 transition — the subset of Tamagui's `TransitionConfig`
 * the kit authors. `properties` scopes the transition (v2's `animateOnly`, as a
 * CSS `transition-property` list: `"transform, opacity"`).
 */
export type TransitionSpec = {
  preset?: TransitionName;
  /** ms. Overrides the preset's duration (a spring preset re-solves). */
  duration?: number;
  /** Any CSS timing function (`"ease-out"`, `"cubic-bezier(…)"`) — exact on web AND native. */
  easing?: string;
  /** ms. */
  delay?: number;
  /** Comma-separated style properties this transition applies to. */
  properties?: string;
  /** The transition while mounting, if it differs. */
  enter?: TransitionName | TransitionSpec;
  /** The transition while unmounting, if it differs. */
  exit?: TransitionName | TransitionSpec;
};

/**
 * A kit transition value: a preset name, an object, or `null` (keep the
 * `transition` key present but animate nothing — Tamagui's rule for animated
 * views, so hook order never changes).
 */
export type TransitionValue = TransitionName | TransitionSpec | null;

/** `["transform", "opacity"]` / `"transform, opacity"` → `"transform, opacity"`. */
export const toTransitionProperties = (properties: readonly string[] | string): string =>
  typeof properties === "string" ? properties : properties.join(", ");

/**
 * Scope a transition to `properties` (the v3 home of v2's `animateOnly`): a preset
 * name becomes `{ preset, properties }`, an object gains `properties`, `null` stays
 * `null`. Without it a plain `transition="fast"` animates EVERY changing property,
 * which slides floating elements across the screen on each re-measure.
 */
export const withTransitionProperties = (
  value: TransitionValue,
  properties: readonly string[] | string | undefined,
): TransitionValue => {
  if (value == null || properties === undefined) return value;
  const list = toTransitionProperties(properties);
  return typeof value === "string"
    ? { preset: value, properties: list }
    : { ...value, properties: list };
};

/**
 * Map a CSS `transition-timing-function` onto the registered easing preset that
 * reproduces it (`"ease-out"` → `"ease-out"`; unknown → `"ease"`; a
 * `cubic-bezier(…)` → `"ease"`). v3 accepts any CSS easing in the object form,
 * so prefer {@link timedTransition}, which keeps the curve EXACT; this stays for
 * callers that need a preset NAME.
 */
export const resolveTransition = (timingFunction = "ease"): TransitionName => {
  switch (timingFunction.trim().toLowerCase()) {
    case "linear":
      return "linear";
    case "ease-in":
      return "ease-in";
    case "ease-out":
      return "ease-out";
    case "ease-in-out":
      return "ease-in-out";
    default:
      return "ease";
  }
};

/**
 * A timed (non-spring) transition: exact `duration` (ms) and exact CSS easing
 * curve, as the v3 object form `{ duration, easing }` — both drivers take any CSS
 * timing function (`cubic-bezier(…)` included), so nothing approximates any more.
 * Pass `properties` to scope it.
 */
export const timedTransition = (
  duration: number,
  timingFunction = "ease",
  properties?: readonly string[] | string,
): TransitionSpec =>
  properties === undefined
    ? { duration, easing: timingFunction }
    : { duration, easing: timingFunction, properties: toTransitionProperties(properties) };

/**
 * Build a precisely-typed `{ transition }` object to spread onto a styled
 * component (or a `styled()` base), optionally scoped to `properties`. Keep the
 * prop present and pass `null` when disabled (Tamagui's animated-view rule).
 *
 * ```ts
 * styled(Box, { ...transitionProps("fast", ["backgroundColor"]) })
 * ```
 */
export const transitionProps = (
  transition: TransitionValue,
  properties?: readonly string[] | string,
): { transition: TransitionValue } => ({
  transition: withTransitionProperties(transition, properties),
});

const scopedCache = new WeakMap<object, Map<string, { transition: TransitionValue }>>();

/**
 * Scope an existing `{ transition }` result (e.g. from `useReducedTransition`) to
 * `properties` — the v3 replacement for the v2 pair
 * `{...fade} {...animateOnlyProps(["opacity"])}` → `{...scopeTransition(fade, ["opacity"])}`.
 * Cached per (result object, property list), so a memoised `fade` yields the same
 * object every render.
 */
export const scopeTransition = (
  result: { transition: TransitionValue },
  properties: readonly string[] | string,
): { transition: TransitionValue } => {
  const list = toTransitionProperties(properties);
  let byList = scopedCache.get(result);
  if (!byList) scopedCache.set(result, (byList = new Map()));
  let hit = byList.get(list);
  if (!hit)
    byList.set(list, (hit = { transition: withTransitionProperties(result.transition, list) }));
  return hit;
};

/** The base duration (ms) of a timed preset, or `undefined` for a spring. */
export const presetDurationMs = (name: TransitionName): number | undefined => {
  const preset = MOTION_PRESETS[name] as { duration?: number };
  return typeof preset.duration === "number" ? preset.duration : undefined;
};

/* -------------------------------------------------------------------------- */
/* Press feedback                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Fraction an interactive control scales DOWN to while pressed — the tactile
 * "dip" shared by `Button`, `ActionIcon`, `Chip`, … `0.97` is a 3% shrink: clearly
 * felt without looking broken on the smallest controls.
 */
export const PRESS_SCALE = 0.97;

/**
 * Tactile "shrink on press" feedback as a v3 flat clause. Spread onto a pressable
 * frame's BASE style (`...pressScaleStyle`). v3 merges clause slots per (property,
 * condition) across tiers, so this base `scale: "press:0.97"` composes with a
 * variant's `bg: "… press:color8"` (different properties) — on press the control
 * both darkens (variant) and dips (this). Pair the frame with `usePressScale()` at
 * render so the dip EASES (and collapses under reduced motion).
 */
export const pressScaleStyle = { scale: `press:${PRESS_SCALE}` } as const;

/** Hover handlers as spread by {@link hoverProps}: web keys OR native keys. */
export interface HoverHandlerProps<E = unknown> {
  onMouseEnter?: (event: E) => void;
  onMouseLeave?: (event: E) => void;
  onHoverIn?: (event: E) => void;
  onHoverOut?: (event: E) => void;
}

/**
 * Pointer-hover handlers for a Tamagui frame, per platform. Spread the result:
 * `<Frame {...hoverProps({ onHoverIn, onHoverOut })} />`. The platform event is
 * forwarded to the handler (typed `unknown` unless `E` is given).
 *
 * v3 (3.0.18) only attaches its web mouse listeners when the element has
 * `onMouseEnter`/`onMouseLeave` (or a `hover:` style): `onHoverIn`/`onHoverOut`
 * ALONE are never wired on web (`createComponent` → `attachHover`), so a frame that
 * only declared them silently ignored the pointer. Web therefore gets the mouse
 * handlers; native keeps Tamagui's `onHoverIn`/`onHoverOut` (pointer devices on
 * iPad / Android). Absent handlers stay absent (no `undefined` keys).
 */
export function hoverProps<E = unknown>(handlers: {
  onHoverIn?: (event: E) => void;
  onHoverOut?: (event: E) => void;
}): HoverHandlerProps<E> {
  const { onHoverIn, onHoverOut } = handlers;
  const out: HoverHandlerProps<E> = {};
  if (isWeb) {
    if (onHoverIn) out.onMouseEnter = onHoverIn;
    if (onHoverOut) out.onMouseLeave = onHoverOut;
  } else {
    if (onHoverIn) out.onHoverIn = onHoverIn;
    if (onHoverOut) out.onHoverOut = onHoverOut;
  }
  return out;
}

/* -------------------------------------------------------------------------- */
/* Shadows                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Mantine-style `shadow` scale (xxs→xxl). Elevation rises with the key; colour
 * comes from the `dropShadowColor` theme key so it adapts to light/dark.
 *
 * Expressed as the cross-platform `boxShadow` style prop (`"{x}px {y}px {blur}px
 * {spread}px {color}"`) rather than legacy RN `shadow*` props: `boxShadow` works
 * on web + iOS + Android 9+ (RN New Arch). v3 resolves the bare theme name
 * embedded in the shadow recipe on every platform (`getSplitStyles`
 * `configuredValue` → `grammar.embeddedTokens`, where a recipe word that is not a
 * token is resolved as a COLOR against the active theme): web emits
 * `var(--dropShadowColor)`, native the theme's raw rgba. So these stay static
 * strings — no runtime theme read. Verified by `shadow.test.tsx`.
 *
 * The key is deliberately NOT named `shadowColor`: that collides with React
 * Native's reserved legacy `shadowColor` style prop, which makes the native
 * pipeline drop the token's alpha on iOS (shadows render washed-out).
 */
export const shadowVariant = {
  xxs: { boxShadow: "0px 1px 1px 0px dropShadowColor" },
  xs: { boxShadow: "0px 1px 3px 0px dropShadowColor" },
  sm: { boxShadow: "0px 3px 6px 0px dropShadowColor" },
  md: { boxShadow: "0px 5px 12px 0px dropShadowColor" },
  lg: { boxShadow: "0px 8px 20px 0px dropShadowColor" },
  xl: { boxShadow: "0px 12px 28px 0px dropShadowColor" },
  xxl: { boxShadow: "0px 16px 40px 0px dropShadowColor" },
} as const;

/** The shadow scale's keys (`shadow` prop values). */
export type ShadowKey = keyof typeof shadowVariant;

/* -------------------------------------------------------------------------- */
/* Typography                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * Mantine-style `size` prop for text: a size key (`"md"`) maps to the matching
 * font-size token. Line height is intentionally left unset so it derives from
 * the font config's per-fontSize line-height mapping. Static exact-key map.
 */
export const fontSizeVariant = {
  xxs: { fontSize: "xxs" },
  xs: { fontSize: "xs" },
  sm: { fontSize: "sm" },
  md: { fontSize: "md" },
  lg: { fontSize: "lg" },
  xl: { fontSize: "xl" },
  xxl: { fontSize: "xxl" },
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

/** The plain `fontSize` fallthrough body: a raw px / font token / CSS value. */
export const fontSizeOf = (value: number | FontSizeTokens | CssString): StyleFragment => ({
  fontSize: value,
});

/**
 * {@link fontSizeVariant} plus the escape hatch: a number / font token / CSS value
 * flows straight to `fontSize`. To add keys (Title's `h1`…), build a new one:
 * `tableVariant({ ...fontSizeVariant, h1: { fontSize: "xxl" } }, fontSizeOf)`.
 */
export const fontSizePassthroughVariant = tableVariant(fontSizeVariant, fontSizeOf);

/** Open-ended `fontWeight` prop (`"700"`, `600`, `"bold"`, …). */
export const fontWeightVariant = passthroughVariant<number | CssString>("fontWeight");

/** Open-ended `textAlign` prop (`"left"`, `"center"`, `"justify"`, …). */
export const textAlignVariant = passthroughVariant<
  "auto" | "left" | "right" | "center" | "justify" | CssString
>("textAlign");

/** Open-ended `textTransform` prop (`"uppercase"`, `"capitalize"`, …). */
export const textTransformVariant = passthroughVariant<
  "none" | "uppercase" | "lowercase" | "capitalize" | CssString
>("textTransform");

/**
 * CSS `text-wrap` values (`"balance"`, `"pretty"`, …) — web-only and not modeled
 * by Tamagui's style props.
 */
export type TextWrap = "wrap" | "nowrap" | "balance" | "pretty" | "stable";

/** Mantine-style `textWrap` prop. Web-only; a no-op on native. Used by `Title`. */
export const textWrapVariant = passthroughVariant<TextWrap>("textWrap");
