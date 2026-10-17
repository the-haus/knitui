// @knitui/plugins/vite — Vite plugin wrapper, pre-configured for the kit.
//
// Wraps Tamagui v3's Vite compiler (`@tamagui/cli/vite` `tamaguiPlugin`) with the
// kit's design-system `config` and component list baked in, so a Vite app (or a
// Storybook on `@storybook/react-vite`) installs ZERO Tamagui packages:
//
//   // vite.config.ts
//   import { knitui } from "@knitui/plugins/vite";
//
//   export default {
//     plugins: [knitui()],
//   };
//
// Need to tweak options? Pass overrides:
//   knitui({ disableExtraction: true })
//
// ESM-only (the wrapper ships as `.mjs`).
// `TAMAGUI_COMPILER_STATS=verbose` prints the compiler's flatten/bail stats.

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
// Mirrors `./components.js` (kept inline: the built `lib/module` is `type:
// module`, so this file cannot `require` a CommonJS sibling there). The plugins
// test asserts the two lists stay identical.
/** Packages the compiler scans for kit components to optimize. */
export const DEFAULT_COMPONENTS = [
  "@knitui/core",
  "@knitui/components",
  "@knitui/dates",
  "@knitui/media",
  "@knitui/sheet",
  "@knitui/carousel",
];
const KNIT_CONFIG = "@knitui/core/config";

/** Mirrors `STATIC_EVALUATION_IGNORED_MODULES` in components.js (see there for why). */
export const STATIC_EVALUATION_IGNORED_MODULES = [
  "react-native-gesture-handler",
  "expo",
  "expo-modules-core",
  "expo-image",
  "expo-audio",
  "expo-video",
];

/** @typedef {typeof import("@tamagui/cli/vite").tamaguiPlugin} TamaguiPluginFactory */
/** @typedef {Partial<NonNullable<Parameters<TamaguiPluginFactory>[0]>>} KnituiViteOptions */
/** @typedef {ReturnType<TamaguiPluginFactory>} KnituiVitePlugin */

/**
 * Build the kit's Tamagui Vite plugin, with optional overrides.
 *
 * @param {KnituiViteOptions} [overrides]
 * @returns {KnituiVitePlugin}
 */
export function knitui(overrides = {}) {
  // Required lazily: only Vite apps pull this path, and the CLI is an optional
  // dependency (see package.json).
  const { tamaguiPlugin } = require("@tamagui/cli/vite");
  return tamaguiPlugin({
    // The kit's design-system config, resolved from this package so the
    // consumer never references an internal path.
    config: require.resolve(KNIT_CONFIG),
    components: DEFAULT_COMPONENTS,
    ...overrides,
    // Merged, never replaced: an app's own modules are added to the kit's.
    dangerouslyIgnoreStaticEvaluationModules: [
      ...new Set([
        ...STATIC_EVALUATION_IGNORED_MODULES,
        ...(overrides.dangerouslyIgnoreStaticEvaluationModules ?? []),
      ]),
    ],
  });
}

/** Alias kept for the README's original spelling. */
export const tamagui = knitui;

export default knitui;
