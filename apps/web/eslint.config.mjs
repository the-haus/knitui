import next from "@next/eslint-plugin-next";
import { defineConfig } from "../../eslint.config.base.mjs";

/**
 * ESLint config for @knitui/web = shared monorepo base + Next.js rules.
 * Replaces the deprecated `next lint`; this app is linted with `eslint .`.
 * (eslint-config-prettier is appended automatically after these overrides.)
 */
export default defineConfig({
  files: ["**/*.{ts,tsx,js,jsx}"],
  plugins: { "@next/next": next },
  rules: {
    ...next.configs.recommended.rules,
    ...next.configs["core-web-vitals"].rules,
  },
});
