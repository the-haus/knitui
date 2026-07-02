import { createTokens } from "@tamagui/core";

import { radius, size, spacing } from "./scales";

export const tokens = createTokens({
  color: {
    white: "#ffffff",
    black: "#000000",
    transparent: "rgba(0,0,0,0)",
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
    true: spacing.sm,
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
    true: size.sm,
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
    true: radius.sm,
  },
  zIndex: { 0: 0, 1: 100, 2: 200, 3: 300, 4: 400, 5: 500 },
});
