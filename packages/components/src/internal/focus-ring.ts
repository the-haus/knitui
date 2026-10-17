/**
 * THE canonical keyboard-focus ring — the single source of truth for the
 * focus-visible outline shared by every interactive control (Button, ActionIcon,
 * Chip, Radio, Switch, Tabs, Menu items, Pagination, …).
 *
 * v3: the ring is CONFIGURATION, not a style table. Its three values are names
 * owned by `@knitui/core` (`config/focus-ring.ts`, docs/v3/conventions.md §6):
 *
 *  - `focusRingColor`  a theme key in every theme (= that theme's `color8`), so an
 *                      accent sub-theme (`theme="blue"`) recolours the ring;
 *  - `focusRingWidth`  a config variable (2 → `2px` on web);
 *  - `focusRingOffset` a config variable (0).
 *
 * Re-theme the ring for a subtree with `<ThemeUpdate focusRingColor="red9"
 * focusRingWidth={3}>` (web: CSS variables, no re-render). The clauses below name
 * the variables, so that override reaches every control with no prop drilling.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THE FOCUS CONTRACT (two layers — both required, kept honest by the
 * `focus-ring` guardrail test in `src/__tests__/`):
 *
 *   Layer 1 — the VISUAL ring (this): spread `...focusRingStyle` onto a frame's
 *             styled base (or `{...FOCUS_RING}` onto a JSX element). It renders a
 *             `:focus-visible` outline on web; on native it only shows where the
 *             platform reports keyboard focus (touch has no focus ring; AT focus
 *             flows through accessibility, see Layer 2).
 *
 *   Layer 2 — FOCUSABILITY: a styled `Box` renders a `<div>`, which the browser
 *             will NOT tab to, so Layer 1's `:focus-visible` never fires unless the
 *             SAME frame is also made focusable. Pick ONE by the control's
 *             semantics (both are cross-platform-safe):
 *               • `WEB_BUTTON_PROPS` / `webButton()` (internal/style-props) — the
 *                 control IS a button: a real, natively-focusable `<button>` on
 *                 web; a no-op on native (interaction flows through `onPress`).
 *               • `useKeyboardActions()` (@knitui/hooks) — a box with a non-button
 *                 role (link/treeitem/checkbox/…): web adds `tabIndex`+`onKeyDown`.
 *               • a roving `tabIndex` literal — composite widgets (Tabs/Menu).
 *
 *   INVARIANT: never spread the ring onto a frame you don't also make focusable —
 *   that produces a DEAD ring (the bug this contract exists to stop).
 *
 * TEXT FIELDS are the deliberate exception: they express focus as a `borderColor`
 * swap (`focusRingColor`, see Input's `focused` variant in `Input/shared.tsx`)
 * because a border renders cross-platform, unlike the outline.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * The ring as v3 flat clause props. One static object, valid BOTH as a `styled()`
 * base fragment (`styled(Box, { ...focusRingStyle })`) and as JSX props
 * (`<Frame {...FOCUS_RING} />`). Clause strings type-check on every outline prop
 * (the 3.0.18 typing caveat in conventions §6 only bites bare variable names), so
 * width and offset name their config variables too and follow `<ThemeUpdate>`.
 */
export const FOCUS_RING = {
  outlineColor: "focus-visible:focusRingColor",
  outlineWidth: "focus-visible:focusRingWidth",
  outlineStyle: "focus-visible:solid",
  outlineOffset: "focus-visible:focusRingOffset",
} as const;

/**
 * The same ring, under the name ~20 frames spread into their `styled()` base
 * (`...focusRingStyle`). v2 wrapped `FOCUS_RING` in a `focusVisibleStyle` block;
 * in v3 the condition lives in each value, so the two are the same object.
 */
export const focusRingStyle = FOCUS_RING;

/**
 * The ring under `:focus-within` instead of `:focus-visible` — for a wrapper whose
 * focusable element is a descendant it cannot style (e.g. a group around a native
 * input). Layer 2 still applies to that descendant.
 */
export const FOCUS_WITHIN_RING = {
  outlineColor: "focus-within:focusRingColor",
  outlineWidth: "focus-within:focusRingWidth",
  outlineStyle: "focus-within:solid",
  outlineOffset: "focus-within:focusRingOffset",
} as const;

/**
 * {@link FOCUS_RING} for a frame that ALSO resets the resting outline (no UA
 * outline outside keyboard focus). v3 has one value per property, so a base
 * `outlineWidth: 0` next to `...focusRingStyle` is a duplicate key, not a merge —
 * spread this instead of writing both.
 */
export const focusRingResetStyle = {
  outlineColor: "transparent focus-visible:focusRingColor",
  outlineWidth: "0px focus-visible:focusRingWidth",
  outlineStyle: "none focus-visible:solid",
  outlineOffset: "focus-visible:focusRingOffset",
} as const;
