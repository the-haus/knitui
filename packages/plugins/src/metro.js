// @knitui/plugins/metro — Expo/Metro config wrapper, pre-configured for the kit.
//
// Wraps `@tamagui/metro-plugin`'s `withTamagui` with the kit's design-system
// `config` and component list baked in, so an Expo app installs ZERO Tamagui
// packages and wires up nothing by hand:
//
//   // metro.config.js
//   const { getDefaultConfig } = require("expo/metro-config");
//   const withTamagui = require("@knitui/plugins/metro");
//
//   module.exports = withTamagui(getDefaultConfig(__dirname));
//
// Need to tweak options? Pass overrides as the second argument:
//   withTamagui(config, { disableExtraction: true })

/** Packages the compiler scans for kit components to optimize. */
const DEFAULT_COMPONENTS = ["@knitui/components", "@knitui/core"];

/** @typedef {import("@tamagui/metro-plugin").MetroTamaguiOptions} MetroTamaguiOptions */
/** @typedef {Record<string, any>} MetroConfig */

/**
 * Wrap a Metro config with the kit's Tamagui plugin, with optional overrides.
 *
 * @param {MetroConfig} metroConfig
 * @param {Partial<MetroTamaguiOptions>} [overrides]
 * @returns {MetroConfig}
 */
function withKnitui(metroConfig, overrides = {}) {
  // Required lazily: only Expo apps pull this path, and the plugin is an
  // optional dependency (see package.json).
  const { withTamagui: withTamaguiPlugin } = require("@tamagui/metro-plugin");
  return withTamaguiPlugin(metroConfig, {
    // The kit's design-system config, resolved from this package so the
    // consumer never references an internal path.
    config: require.resolve("@knitui/core/config"),
    components: DEFAULT_COMPONENTS,
    ...overrides,
  });
}

module.exports = withKnitui;
module.exports.withKnitui = withKnitui;
