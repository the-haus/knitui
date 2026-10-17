import { createTokens } from "@tamagui/core";

import { radius, size, spacing } from "./scales";

/**
 * The kit's design tokens. v3 rules (see docs/v3/conventions.md §2):
 *
 * - No `true` keys (v3 reserves `true` for "the component's default"; the kit's
 *   defaults come from `controlMetrics`, which already default to `md`).
 * - No `transparent` colour token: v3's `createTamagui` rejects CSS keywords as
 *   token names, and the keyword itself is valid everywhere.
 * - A STRING is a token lookup and a NUMBER is a raw value: `p="md"` vs `p={12}`.
 *   The bare-numeric keys (`space.0`, `zIndex.1`…`5`) are therefore only reached
 *   by the string spelling (`zIndex="3"` → 300); `zIndex={3}` is a raw 3.
 */
export const tokens = createTokens({
  color: {
    white: "#ffffff",
    black: "#000000",
  },
  space: {
    0: 0,
    xxs: spacing.xxs,
    xs: spacing.xs,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
    xl: spacing.xl,
    xxl: spacing.xxl,
  },
  size: {
    0: 0,
    xxs: size.xxs,
    xs: size.xs,
    sm: size.sm,
    md: size.md,
    lg: size.lg,
    xl: size.xl,
    xxl: size.xxl,
  },
  radius: {
    0: 0,
    xxs: radius.xxs,
    xs: radius.xs,
    sm: radius.sm,
    md: radius.md,
    lg: radius.lg,
    xl: radius.xl,
    xxl: radius.xxl,
  },
  zIndex: { 0: 0, 1: 100, 2: 200, 3: 300, 4: 400, 5: 500 },
});
