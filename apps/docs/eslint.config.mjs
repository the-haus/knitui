import next from "@next/eslint-plugin-next";

import { defineConfig } from "../../eslint.config.base.mjs";

/**
 * ESLint config for @knitui/docs = shared monorepo base + Next.js rules.
 *
 * `src/generated/**` is machine-written (see scripts/docs/) and deliberately not
 * linted — it carries its own `eslint-disable` header, but ignoring it outright
 * keeps `pnpm lint` fast on a 1,500-entry import map.
 */
export default defineConfig(
  { ignores: ["src/generated/**", "out/**"] },
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    plugins: { "@next/next": next },
    rules: {
      ...next.configs.recommended.rules,
      ...next.configs["core-web-vitals"].rules,
    },
  },
);
