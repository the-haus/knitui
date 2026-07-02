// @knitui/plugins/vite — Vite plugin wrapper, pre-configured for the kit.
//
// Wraps `@tamagui/vite-plugin` with the kit's design-system `config` and
// component list baked in, so a Vite app installs ZERO Tamagui packages and
// wires up nothing by hand:
//
//   // vite.config.ts
//   import { tamagui } from "@knitui/plugins/vite";
//
//   export default {
//     plugins: [tamagui()],
//   };
//
// Need to tweak options? Pass overrides:
//   tamagui({ disableExtraction: true })
//
// ESM-only, mirroring `@tamagui/vite-plugin` (the wrapper ships as `.mjs`).

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** Packages the compiler scans for kit components to optimize. */
const DEFAULT_COMPONENTS = ["@knitui/components", "@knitui/core"];

/** @typedef {typeof import("@tamagui/vite-plugin").tamaguiPlugin} TamaguiPluginFactory */
/** @typedef {Partial<NonNullable<Parameters<TamaguiPluginFactory>[0]>>} KnituiViteOptions */
/** @typedef {ReturnType<TamaguiPluginFactory>} KnituiVitePlugin */

/**
 * Build the kit's Tamagui Vite plugin, with optional overrides.
 *
 * @param {KnituiViteOptions} [overrides]
 * @returns {KnituiVitePlugin}
 */
export function knitui(overrides = {}) {
  // Imported lazily: only Vite apps pull this path, and the plugin is an
  // optional dependency (see package.json).
  const { tamaguiPlugin } = require("@tamagui/vite-plugin");
  return tamaguiPlugin({
    // The kit's design-system config, resolved from this package so the
    // consumer never references an internal path.
    config: require.resolve("@knitui/core/config"),
    components: DEFAULT_COMPONENTS,
    ...overrides,
  });
}

export default knitui;
