import { defineConfig, tamaguiV3Restrictions } from "../../eslint.config.base.mjs";

/**
 * ESLint config for @knitui/plugins.
 * Extends the shared monorepo base; add package-specific overrides below.
 * (eslint-config-prettier is appended automatically after these.)
 */
export default defineConfig(
  // The bundler wrappers load the Tamagui compilers (`@tamagui/cli`, …).
  tamaguiV3Restrictions({ tamaguiImports: false }),
);
// Example — uncomment and edit to customize rules for this package only:
// {
//   files: ["**/*.{ts,tsx}"],
//   rules: {
//     "no-console": "off",
//   },
// },
