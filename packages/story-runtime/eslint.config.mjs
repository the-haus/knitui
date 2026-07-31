import { defineConfig } from "../../eslint.config.base.mjs";

/**
 * ESLint config for @knitui/story-runtime.
 * Extends the shared monorepo base; no package-specific overrides needed —
 * this package is platform-free TypeScript with a single React boundary.
 */
export default defineConfig();
