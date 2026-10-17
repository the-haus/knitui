import { defineConfig, tamaguiV3Restrictions } from "../../eslint.config.base.mjs";

/**
 * ESLint config for @knitui/core.
 * Extends the shared monorepo base; add package-specific overrides below.
 * (eslint-config-prettier is appended automatically after these.)
 */
export default defineConfig(
  // @knitui/core is the one package that wraps Tamagui, and it implements the
  // config-driven `isToken` / `resolveToken` (which accept a legacy `$name`).
  tamaguiV3Restrictions({ tamaguiImports: false, sigil: false }),
);
// Example — uncomment and edit to customize rules for this package only:
// {
//   files: ["**/*.{ts,tsx}"],
//   rules: {
//     "no-console": "off",
//   },
// },
