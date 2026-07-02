// @knitui/plugins/babel-plugin — the Tamagui compiler, pre-configured for the kit.
//
// The Tamagui compiler is an OPTIONAL build-time optimizer: it flattens the
// kit's `styled()` components into static styles for faster runtime. Drop this
// into your babel config and you install ZERO Tamagui packages yourself —
// `@tamagui/babel-plugin` ships as a dependency of `@knitui/plugins`, and the kit's
// config + component list are baked in.
//
//   // babel.config.js
//   module.exports = {
//     presets: ["babel-preset-expo"],
//     plugins: [
//       require("@knitui/plugins/babel-plugin"),
//       "react-native-reanimated/plugin", // must stay LAST
//     ],
//   };
//
// Need to tweak options? Use `.withOptions`:
//   require("@knitui/plugins/babel-plugin").withOptions({ logTimings: false })

/** Packages the compiler scans for kit components to optimize. */
const DEFAULT_COMPONENTS = ["@knitui/components", "@knitui/core"];

// The kit's packages ship their TypeScript source (see the "lib-ship not viable"
// constraint), so the Tamagui static loader can't `require()` them during its
// extraction pass — their barrels use ESM directory imports and chain back into
// `@knitui/core`'s `.ts` source, which Node can't load. That made the loader emit
//   [tamagui] skipped loading 2 module, see: .../errors#warning-001
// once per transformed batch. These packages are intentionally bundle-unloadable,
// so register them with Tamagui's own ignore list to silence the noise. (Metro
// resolves the kit from `source` at runtime, so nothing here affects the app.)
if (!process.env.TAMAGUI_IGNORE_BUNDLE_ERRORS) {
  process.env.TAMAGUI_IGNORE_BUNDLE_ERRORS = DEFAULT_COMPONENTS.join(",");
}

/** @typedef {{ config?: string, components?: string[], logTimings?: boolean, disableExtraction?: boolean, [option: string]: unknown }} KnituiCompilerOptions */

/** @typedef {[plugin: string, options: KnituiCompilerOptions]} BabelPluginEntry */

/**
 * Build a configured `[plugin, options]` babel entry, with optional overrides.
 *
 * @param {Partial<KnituiCompilerOptions>} [overrides]
 * @returns {BabelPluginEntry}
 */
function withOptions(overrides = {}) {
  return [
    require.resolve("@tamagui/babel-plugin"),
    {
      // The kit's design-system config — resolved from this package, so the
      // consumer never references an internal path.
      config: require.resolve("@knitui/core/config"),
      components: DEFAULT_COMPONENTS,
      logTimings: true,
      // Extraction off in dev keeps fast-refresh snappy; on for production.
      disableExtraction: process.env.NODE_ENV === "development",
      ...overrides,
    },
  ];
}

// Default export is a ready-to-use babel plugin entry (the `[plugin, options]`
// array). `.withOptions` is attached for the override case.
/** @type {BabelPluginEntry & { withOptions: typeof withOptions }} */
const knituiBabelPlugin = Object.assign(withOptions(), { withOptions });

module.exports = knituiBabelPlugin;
