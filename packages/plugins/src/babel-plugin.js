// @knitui/plugins/babel-plugin — DEPRECATED in v3.
//
// Tamagui v3 has no babel plugin (`@tamagui/babel-plugin` stops at 2.x). Native
// compilation moved into Metro: use `@knitui/plugins/metro` (which wraps
// `@tamagui/cli/metro`'s `withTamagui`) in `metro.config.js` and drop this entry
// from `babel.config.js`:
//
//   // metro.config.js
//   const { getDefaultConfig } = require("expo/metro-config");
//   const withKnitui = require("@knitui/plugins/metro");
//   module.exports = withKnitui(getDefaultConfig(__dirname));
//
// This entry is kept so an existing `babel.config.js` keeps building: it is a
// valid NO-OP babel plugin that prints a one-time warning.

let warned = false;

const warn = () => {
  if (warned || process.env.KNITUI_SILENCE_BABEL_PLUGIN_WARNING) return;
  warned = true;
  console.warn(
    "[@knitui/plugins] `@knitui/plugins/babel-plugin` is deprecated and does nothing on " +
      "Tamagui v3 (there is no v3 babel plugin). Remove it from babel.config.js and " +
      "compile through Metro instead: `withKnitui(config)` from `@knitui/plugins/metro`.",
  );
};

/** A babel plugin that does nothing (beyond the deprecation warning). */
function knituiNoopBabelPlugin() {
  warn();
  return { name: "knitui-deprecated-noop" };
}

/** @typedef {[plugin: typeof knituiNoopBabelPlugin, options: Record<string, unknown>]} BabelPluginEntry */

/**
 * @deprecated Kept for source compatibility; options are ignored.
 * @param {Record<string, unknown>} [overrides]
 * @returns {BabelPluginEntry}
 */
function withOptions(overrides = {}) {
  return [knituiNoopBabelPlugin, { ...overrides }];
}

/** @type {BabelPluginEntry & { withOptions: typeof withOptions }} */
const knituiBabelPlugin = Object.assign(withOptions(), { withOptions });

module.exports = knituiBabelPlugin;
