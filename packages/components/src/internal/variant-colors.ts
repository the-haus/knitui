/**
 * THE canonical variant-color table — the COLOR counterpart to
 * `control-metrics.ts`. Where `controlMetrics` is the single source of truth for
 * how a control SIZES across the size keys, this is the single source of truth
 * for how it COLORS across the `variant` keys. Every value is a palette-ramp
 * token (`$color1…$color12`, `$white`, `$borderColor`) drawn from the ACTIVE
 * theme, so `theme="red"` recolors a component with no per-component logic — the
 * same property that already makes Button/ActionIcon/Badge/Alert theme-aware,
 * now factored into one place instead of copied into a dozen styled() frames.
 *
 * Three ladders, each keyed by the canonical variant set:
 *
 *  - `VARIANT_FILL`        background + border for the FRAME (the painted box).
 *  - `VARIANT_INTERACTION` hover / press / focus states layered ON TOP of the
 *                          fill for INTERACTIVE controls (buttons, action icons).
 *                          Static surfaces (Badge, Alert) take only the fill.
 *  - `VARIANT_FOREGROUND`  text/glyph color — two ladders: `emphasis` (labels,
 *                          titles) and `muted` (body copy, e.g. Alert message).
 *
 *  variant      fill bg       border        emphasis fg   muted fg
 *  filled       $color9       —             $color1       $color1
 *  light        $color4       —             $color11      $color12
 *  outline      transparent   $color7       $color11      $color12
 *  subtle       transparent   —             $color11      $color12
 *  default      $color3       $borderColor  $color12      $color12
 *  white        $white        —             $color9       $color12
 *  transparent  transparent   —             $color11      $color12
 *  dot          transparent   $borderColor  $color12      $color12   (pill family)
 *  gradient     transparent*  —             $white        $white     (*painted at runtime)
 *
 * `gradient` is the odd one out: its FILL can't be a static ramp token because a
 * linear-gradient is not expressible as a Tamagui style value cross-platform. The
 * base stays `transparent` here and the actual gradient is painted at render by
 * the `useGradient` primitive (web `backgroundImage`, native `react-native-svg`
 * layer) from a per-instance `gradient={{ from, to, deg }}` / multi-`stops` prop.
 * Foreground is `$white` (Mantine parity — light text on a saturated gradient).
 *
 * `borderColor` is set ONLY where it is non-transparent (outline/default/dot);
 * the other variants inherit the frame's base `borderColor: "transparent"`, so
 * spreading these maps is output-identical to the hand-written frames they
 * replace. See `control-metrics.ts` for the sizing twin and
 * `core/config/themes.ts` for how the `$colorN` ramp is generated per theme.
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
 * THE canonical keyboard-focus ring — the single source of truth for the 2px
 * focus-visible outline shared by every interactive control (Button, ActionIcon,
 * Chip, Radio, Switch, Tabs, Menu items, Pagination, …). Centralises the literal
 * that was otherwise copy-pasted across ~two dozen styled frames, so the ring's
 * color/width/style is tuned in ONE place and every control moves together — the
 * same contract `VARIANT_FILL`/`controlMetrics` give color/size.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE FOCUS CONTRACT (two layers — both required, kept honest by the
 * `focus-ring` guardrail test in `src/__tests__/`):
 *
 *   Layer 1 — the VISUAL ring (this): spread `...focusRingStyle` onto a frame's
 *             styled base. It renders a `:focus-visible` outline on WEB only —
 *             react-native-web maps `outline*` to the CSS outline; on native it's
 *             a no-op (touch has no focus ring; keyboard/AT focus on native flows
 *             through accessibility, see Layer 2).
 *
 *   Layer 2 — FOCUSABILITY: a styled `Box` renders a `<div>`, which the browser
 *             will NOT tab to, so Layer 1's `:focus-visible` never fires unless the
 *             SAME frame is also made focusable. Pick ONE by the control's
 *             semantics (both are cross-platform-safe):
 *               • `webButton()`  (internal/style-props) — the control IS a button:
 *                 renders a real, natively-focusable `<button>` on web; a no-op on
 *                 native (interaction flows through `onPress`).
 *               • `useKeyboardActions()` (@knitui/hooks) — a box with a non-button
 *                 role (link/treeitem/checkbox/…): web adds `tabIndex`+`onKeyDown`
 *                 (Space/Enter → `onActivate`), native maps to accessibility
 *                 actions; `onPress` still drives native activation.
 *               • a roving `tabIndex` literal — composite widgets (Tabs/Menu).
 *
 *   INVARIANT: never spread `focusRingStyle` onto a frame you don't also make
 *   focusable — that produces a DEAD ring (the bug this contract exists to stop).
 *
 * TEXT FIELDS are the deliberate exception: they express focus as a `borderColor`
 * swap (`$borderColorFocus`, see Input's `focused` variant in `Input/shared.tsx`)
 * because a border renders cross-platform, unlike the web-only outline.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * `$color8` is a mid step of the ACTIVE theme's ramp, so `theme="blue"` (or any
 * accent sub-theme) recolors the ring with no per-component logic.
 */
export const FOCUS_RING = {
  outlineColor: "$color8",
  outlineWidth: 2,
  outlineStyle: "solid",
} as const;

/**
 * `FOCUS_RING` pre-wrapped as a `focusVisibleStyle` block, ready to SPREAD onto a
 * styled frame's base config (`...focusRingStyle`). Pass {@link FOCUS_RING}
 * directly to a JSX `focusVisibleStyle={...}` prop instead where the ring lives on
 * a rendered element rather than a `styled()` definition.
 */
export const focusRingStyle = { focusVisibleStyle: FOCUS_RING } as const;

/**
 * Background + border for the painted frame. Border is omitted where it should
 * stay the frame's base transparent (filled/light/subtle/white/transparent), so
 * these are drop-in for the existing inline maps.
 */
export const VARIANT_FILL = {
  filled: { backgroundColor: "$color9" },
  light: { backgroundColor: "$color4" },
  outline: { backgroundColor: "transparent", borderColor: "$color7" },
  subtle: { backgroundColor: "transparent" },
  default: { backgroundColor: "$color3", borderColor: "$borderColor" },
  white: { backgroundColor: "$white" },
  transparent: { backgroundColor: "transparent" },
  dot: { backgroundColor: "transparent", borderColor: "$borderColor" },
  // Base stays transparent; the gradient is painted at render by `useGradient`.
  gradient: { backgroundColor: "transparent" },
} as const;

/**
 * Hover / press states layered on top of `VARIANT_FILL` for INTERACTIVE controls.
 * The keyboard-focus ring is NOT here — it's variant-independent, so consumers
 * spread `...focusRingStyle` (see {@link FOCUS_RING}) onto the frame BASE so every
 * variant gets it, rather than the ring riding only the `filled` variant. Static
 * surfaces (Badge, Alert, `dot`) intentionally have no entry here.
 */
export const VARIANT_INTERACTION = {
  filled: {
    hoverStyle: { backgroundColor: "$color10" },
    pressStyle: { backgroundColor: "$color8" },
  },
  light: {
    hoverStyle: { backgroundColor: "$color5" },
    pressStyle: { backgroundColor: "$color6" },
  },
  outline: {
    hoverStyle: { backgroundColor: "$color3" },
    pressStyle: { backgroundColor: "$color4" },
  },
  subtle: {
    hoverStyle: { backgroundColor: "$color4" },
    pressStyle: { backgroundColor: "$color5" },
  },
  default: {
    hoverStyle: { backgroundColor: "$color4" },
    pressStyle: { backgroundColor: "$color5" },
  },
  white: {
    hoverStyle: { backgroundColor: "$color2" },
    pressStyle: { backgroundColor: "$color3" },
  },
  transparent: {
    hoverStyle: { backgroundColor: "$color3" },
    pressStyle: { backgroundColor: "$color4" },
  },
} as const;

/**
 * EMPHASIS foreground — labels, titles, glyphs that sit on the fill. This is the
 * ladder used by `Button`/`ActionIcon` text, `Badge` text, and `Alert.Title`.
 */
export const VARIANT_FOREGROUND_EMPHASIS = {
  filled: { color: "$color1" },
  light: { color: "$color11" },
  outline: { color: "$color11" },
  subtle: { color: "$color11" },
  default: { color: "$color12" },
  white: { color: "$color9" },
  transparent: { color: "$color11" },
  dot: { color: "$color12" },
  gradient: { color: "$white" },
} as const;

/**
 * MUTED foreground — body copy that should read softer than a label. Only the
 * `filled` variant inverts to `$color1` (it sits on the strong `$color9` fill);
 * every other variant uses `$color12`. Used by `Alert.Message`.
 */
export const VARIANT_FOREGROUND_MUTED = {
  filled: { color: "$color1" },
  light: { color: "$color12" },
  outline: { color: "$color12" },
  subtle: { color: "$color12" },
  default: { color: "$color12" },
  white: { color: "$color12" },
  transparent: { color: "$color12" },
  dot: { color: "$color12" },
  gradient: { color: "$white" },
} as const;
