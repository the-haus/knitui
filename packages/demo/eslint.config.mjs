import { defineConfig } from "../../eslint.config.base.mjs";

/**
 * ESLint config for @knitui/demo.
 * Extends the shared monorepo base; add package-specific overrides below.
 * (eslint-config-prettier is appended automatically after these.)
 */
export default defineConfig({
  files: ["src/**/*.{ts,tsx}"],
  rules: {
    // The demo's icon/emoji galleries render the ENTIRE generated set, so they
    // need the root barrels (`iconRegistry`, `emojiRegistry`). `@knitui/demo` is
    // private and dev-only, so the "barrel drags 6.1k modules in" guardrail in
    // eslint.config.base.mjs doesn't apply.
    "no-restricted-imports": "off",
  },
});
// Example — uncomment and edit to customize rules for this package only:
// {
//   files: ["**/*.{ts,tsx}"],
//   rules: {
//     "no-console": "off",
//   },
// },
