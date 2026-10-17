import { defineConfig, tamaguiV3Restrictions } from "../../eslint.config.base.mjs";

/**
 * ESLint config for @knitui/map.
 * Extends the shared monorepo base; add package-specific overrides below.
 * (eslint-config-prettier is appended automatically after these.)
 */
export default defineConfig(
  // MapLibre style expressions use `$type` / `$id` keys — not Tamagui tokens.
  tamaguiV3Restrictions({ sigil: false }),
);
