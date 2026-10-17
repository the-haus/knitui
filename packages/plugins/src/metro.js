// @knitui/plugins/metro — Expo/Metro config wrapper, pre-configured for the kit.
//
// Wraps Tamagui v3's Metro compiler (`@tamagui/cli/metro` `withTamagui`) with the
// kit's design-system `config` and component list baked in, so an Expo app
// installs ZERO Tamagui packages and wires up nothing by hand:
//
//   // metro.config.js
//   const { getDefaultConfig } = require("expo/metro-config");
//   const withKnitui = require("@knitui/plugins/metro");
//
//   module.exports = withKnitui(getDefaultConfig(__dirname));
//
// In v3 this is THE native compiler (the babel plugin is gone): it hoists static
// layout and colours out of render. Override options as the second argument:
//   withKnitui(config, { disableExtraction: true })
//
// CACHE NOTE: Metro does not invalidate its transform cache when the Tamagui
// config or another compiler input changes. After editing the config, restart
// with `npx expo start -c` (or `rm -rf node_modules/.cache/tamagui` and
// `expo export --clear` for a warm CLI build).

const { DEFAULT_COMPONENTS, KNIT_CONFIG, ignoredStaticEvaluationModules } = require("./components");

/** @typedef {import("@tamagui/cli/metro").MetroTamaguiOptions} MetroTamaguiOptions */
/** @typedef {Record<string, any>} MetroConfig */

/**
 * Wrap a Metro config with the kit's Tamagui compiler, with optional overrides.
 *
 * @param {MetroConfig} metroConfig
 * @param {Partial<MetroTamaguiOptions>} [overrides]
 * @returns {MetroConfig}
 */
function withKnitui(metroConfig, overrides = {}) {
  // Required lazily: only Expo apps pull this path, and the CLI is an optional
  // dependency (see package.json).
  const { withTamagui } = require("@tamagui/cli/metro");
  return withTamagui(metroConfig, {
    // The kit's design-system config, resolved from this package so the
    // consumer never references an internal path.
    config: require.resolve(KNIT_CONFIG),
    components: DEFAULT_COMPONENTS,
    ...overrides,
    dangerouslyIgnoreStaticEvaluationModules: ignoredStaticEvaluationModules(overrides),
  });
}

module.exports = withKnitui;
module.exports.withKnitui = withKnitui;
