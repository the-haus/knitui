// @knitui/plugins/webpack — Webpack plugin wrapper, pre-configured for the kit.
//
// Wraps `tamagui-loader`'s `TamaguiPlugin` with the kit's design-system
// `config` and component list baked in, so a Webpack app installs ZERO Tamagui
// packages and wires up nothing by hand:
//
//   // webpack.config.js
//   const TamaguiPlugin = require("@knitui/plugins/webpack");
//   config.plugins.push(TamaguiPlugin());
//
// Need to tweak options? Pass overrides:
//   config.plugins.push(TamaguiPlugin({ disableExtraction: true }))

const { DEFAULT_COMPONENTS, KNIT_CONFIG, ignoredStaticEvaluationModules } = require("./components");

/** @typedef {import("tamagui-loader").TamaguiPlugin} TamaguiPluginInstance */
/** @typedef {import("tamagui-loader").PluginOptions} PluginOptions */

/**
 * Build a `TamaguiPlugin` instance configured for the kit, with overrides.
 *
 * @param {Partial<PluginOptions>} [overrides]
 * @returns {TamaguiPluginInstance}
 */
function createTamaguiPlugin(overrides = {}) {
  // Required lazily: only Webpack apps pull this path, and the loader is an
  // optional dependency (see package.json).
  const { TamaguiPlugin } = require("tamagui-loader");
  return new TamaguiPlugin({
    // The kit's design-system config, resolved from this package so the
    // consumer never references an internal path.
    config: require.resolve(KNIT_CONFIG),
    components: DEFAULT_COMPONENTS,
    ...overrides,
    dangerouslyIgnoreStaticEvaluationModules: ignoredStaticEvaluationModules(overrides),
  });
}

module.exports = createTamaguiPlugin;
module.exports.TamaguiPlugin = createTamaguiPlugin;
