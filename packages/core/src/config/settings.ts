/**
 * The kit's `createTamagui` settings (Tamagui v3). Shared with `createTheme` so a
 * consumer config behaves exactly like the stock one. Lives in its own module so
 * importing it never evaluates the stock `createTamagui` call in `config.ts`.
 *
 * - `defaultFont` lives in `settings` in v3 (a top-level `defaultFont` is ignored).
 * - `allowedStyleValues: "somewhat-strict-web"` keeps tsc as the oracle for
 *   leftover v2 spellings: `p="$md"` is a type error ("not assignable to
 *   FlatStyleValue"), while raw numbers / percentages / rgba() / web keywords
 *   still type.
 * - `styleCompat: "web"` is v3's default (CSS flex expansion), spelled out so a
 *   future default flip can't silently change layout.
 * - `onlyAllowShorthands: false`: the kit accepts both `p` and `padding`.
 * - `optimizeFor` / `styleValueSyntax` stay at their defaults ("updates" on web /
 *   "first-render" on native; both string and object condition syntax) until
 *   the Phase 7 benchmarks say otherwise.
 * - v2's `autocompleteSpecificTokens` no longer exists.
 */
export const KNIT_SETTINGS = {
  defaultFont: "body",
  allowedStyleValues: "somewhat-strict-web",
  styleCompat: "web",
  onlyAllowShorthands: false,
} as const;
