/**
 * THE canonical variant-color table — the COLOR counterpart to
 * `control-metrics.ts`. Where `controlMetrics` is the single source of truth for
 * how a control SIZES across the size keys, this is the single source of truth
 * for how it COLORS across the `variant` keys. Every value is a palette-ramp
 * theme key (`color1…color12`, `borderColor`) or colour token (`white`) drawn
 * from the ACTIVE theme, so `theme="red"` recolors a component with no
 * per-component logic.
 *
 * ONE ladder ({@link VARIANT_COLOR_LADDER}) holds every step; the spreadable
 * tables below are GENERATED from it at module load, so they are static,
 * literal-shaped objects (compiler-friendly, zero per-render work):
 *
 *  - `VARIANT_FILL`        background + border for the FRAME (the painted box).
 *  - `VARIANT_INTERACTION` the hover / press clauses ALONE (`"hover:color10
 *                          press:color8"`), for a frame that composes its own base.
 *  - `VARIANT_CONTROL`     fill + interaction as ONE flat value per property
 *                          (`bg: "color9 hover:color10 press:color8"`) — what
 *                          interactive frames (Button, ActionIcon) put in their
 *                          `variant` variant (via `controlColorVariant`).
 *  - `VARIANT_FOREGROUND`  text/glyph color — `emphasis` (labels, titles) and
 *                          `muted` (body copy, e.g. Alert message). Single tokens,
 *                          no clauses: they are also read as data (icon colour).
 *
 *  variant      fill bg       border        hover    press    emphasis   muted
 *  filled       color9        —             color10  color8   color1     color1
 *  light        color4        —             color5   color6   color11    color12
 *  outline      transparent   color7        color3   color4   color11    color12
 *  subtle       transparent   —             color4   color5   color11    color12
 *  default      color3        borderColor   color4   color5   color12    color12
 *  white        white         —             color2   color3   color9     color12
 *  transparent  transparent   —             color3   color4   color11    color12
 *  dot          transparent   borderColor   —        —        color12    color12  (pill family)
 *  gradient     transparent*  —             —        —        white      white    (*painted at runtime)
 *
 * v3: interaction states are FLAT CLAUSES inside the property they change (no
 * `hoverStyle` / `pressStyle` objects — v3 forwards those to the DOM). Clause
 * slots merge per (property, condition) across tiers, so a frame's base
 * `scale: "press:0.97"` and a variant's `bg: "… press:color8"` compose, exactly
 * as v2's deep-merged `pressStyle` did.
 *
 * `gradient` is the odd one out: its FILL can't be a static theme value because a
 * linear-gradient is not expressible as a Tamagui style value cross-platform. The
 * base stays `transparent` and the gradient is painted at render by `useGradient`
 * (web `backgroundImage`, native `react-native-svg` layer). It has no hover/press
 * colour (it would sit invisibly beneath the gradient).
 *
 * `borderColor` is set ONLY where it is non-transparent (outline/default/dot); the
 * other variants inherit the frame's base `borderColor: "transparent"`.
 */

/** The canonical variant vocabulary, in the order they're declared on a frame. */
export const VARIANT_KEYS = [
  "filled",
  "light",
  "outline",
  "subtle",
  "default",
  "white",
  "transparent",
  "dot",
  "gradient",
] as const;

export type VariantKey = (typeof VARIANT_KEYS)[number];

/**
 * THE colour ladder — every variant's steps in one literal table. Re-tune a step
 * here and every generated table (and so every component) moves together.
 */
export const VARIANT_COLOR_LADDER = {
  filled: {
    fill: "color9",
    hover: "color10",
    press: "color8",
    emphasis: "color1",
    muted: "color1",
  },
  light: {
    fill: "color4",
    hover: "color5",
    press: "color6",
    emphasis: "color11",
    muted: "color12",
  },
  outline: {
    fill: "transparent",
    border: "color7",
    hover: "color3",
    press: "color4",
    emphasis: "color11",
    muted: "color12",
  },
  subtle: {
    fill: "transparent",
    hover: "color4",
    press: "color5",
    emphasis: "color11",
    muted: "color12",
  },
  default: {
    fill: "color3",
    border: "borderColor",
    hover: "color4",
    press: "color5",
    emphasis: "color12",
    muted: "color12",
  },
  white: { fill: "white", hover: "color2", press: "color3", emphasis: "color9", muted: "color12" },
  transparent: {
    fill: "transparent",
    hover: "color3",
    press: "color4",
    emphasis: "color11",
    muted: "color12",
  },
  dot: { fill: "transparent", border: "borderColor", emphasis: "color12", muted: "color12" },
  gradient: { fill: "transparent", emphasis: "white", muted: "white" },
} as const satisfies Record<VariantKey, LadderStep>;

interface LadderStep {
  /** Resting background. */
  fill: string;
  /** Border colour where non-transparent. */
  border?: string;
  /** Hover / press backgrounds — interactive variants only. */
  hover?: string;
  press?: string;
  /** Label/title foreground. */
  emphasis: string;
  /** Body-copy foreground. */
  muted: string;
}

type Ladder = typeof VARIANT_COLOR_LADDER;

/** The variants that carry hover/press steps (everything but `dot` / `gradient`). */
export type InteractiveVariantKey = {
  [K in VariantKey]: Ladder[K] extends { hover: string } ? K : never;
}[VariantKey];

type BorderOf<K extends VariantKey> = Ladder[K] extends { border: infer B extends string }
  ? { borderColor: B }
  : unknown;

type FillOf<K extends VariantKey> = { backgroundColor: Ladder[K]["fill"] } & BorderOf<K>;

type InteractionOf<K extends VariantKey> = Ladder[K] extends {
  hover: infer H extends string;
  press: infer P extends string;
}
  ? { backgroundColor: `hover:${H} press:${P}` }
  : never;

type ControlOf<K extends VariantKey> = Ladder[K] extends {
  fill: infer F extends string;
  hover: infer H extends string;
  press: infer P extends string;
}
  ? { backgroundColor: `${F} hover:${H} press:${P}` } & BorderOf<K>
  : FillOf<K>;

type ForegroundOf<K extends VariantKey, Field extends "emphasis" | "muted"> = {
  color: Ladder[K][Field];
};

const step = (key: VariantKey): LadderStep => VARIANT_COLOR_LADDER[key];

const build = <T>(make: (key: VariantKey, s: LadderStep) => object | undefined): T => {
  const out: Record<string, object> = {};
  for (const key of VARIANT_KEYS) {
    const value = make(key, step(key));
    if (value) out[key] = value;
  }
  // Not frozen: these are handed to `styled()` as variant bodies.
  return out as T;
};

/**
 * Background + border for the painted frame. Border is omitted where it should
 * stay the frame's base transparent (filled/light/subtle/white/transparent).
 */
export const VARIANT_FILL = build<{ readonly [K in VariantKey]: FillOf<K> }>((_key, s) =>
  s.border ? { backgroundColor: s.fill, borderColor: s.border } : { backgroundColor: s.fill },
);

/**
 * The hover / press clauses ALONE for INTERACTIVE variants
 * (`{ backgroundColor: "hover:color10 press:color8" }`). Use it when a frame
 * supplies its own resting background (an override that keeps the kit's
 * interaction steps); for the usual fill + interaction use {@link VARIANT_CONTROL}.
 * The keyboard-focus ring is NOT here — it's variant-independent, see
 * `focusRingStyle` in `./focus-ring`. Static variants (`dot`, `gradient`) have no
 * entry.
 */
export const VARIANT_INTERACTION = build<{
  readonly [K in InteractiveVariantKey]: InteractionOf<K>;
}>((_key, s) =>
  s.hover && s.press ? { backgroundColor: `hover:${s.hover} press:${s.press}` } : undefined,
);

/**
 * Fill + interaction as ONE flat value per property, per variant
 * (`filled → { backgroundColor: "color9 hover:color10 press:color8" }`). The
 * interactive-control frame ladder (Button / ActionIcon). Excludes the pill-only
 * `dot`; `gradient` carries only its transparent base (no hover/press colour).
 */
export const VARIANT_CONTROL = build<{
  readonly [K in Exclude<VariantKey, "dot">]: ControlOf<K>;
}>((key, s) => {
  if (key === "dot") return undefined;
  const backgroundColor =
    s.hover && s.press ? `${s.fill} hover:${s.hover} press:${s.press}` : s.fill;
  return s.border ? { backgroundColor, borderColor: s.border } : { backgroundColor };
});

/**
 * EMPHASIS foreground — labels, titles, glyphs that sit on the fill. This is the
 * ladder used by `Button`/`ActionIcon` text, `Badge` text, and `Alert.Title`.
 * Single tokens (no clauses): `ControlIconProvider` reads `.color` as data.
 */
export const VARIANT_FOREGROUND_EMPHASIS = build<{
  readonly [K in VariantKey]: ForegroundOf<K, "emphasis">;
}>((_key, s) => ({ color: s.emphasis }));

/**
 * MUTED foreground — body copy that should read softer than a label. Only the
 * `filled` variant inverts to `color1` (it sits on the strong `color9` fill);
 * `gradient` is white; every other variant uses `color12`. Used by `Alert.Message`.
 */
export const VARIANT_FOREGROUND_MUTED = build<{
  readonly [K in VariantKey]: ForegroundOf<K, "muted">;
}>((_key, s) => ({ color: s.muted }));

/*
 * Back-compat re-exports: the focus ring moved to `./focus-ring` (it is not a
 * colour-variant concern), but ~20 call sites import it from here / style-props.
 */
export { FOCUS_RING, focusRingStyle } from "./focus-ring";
