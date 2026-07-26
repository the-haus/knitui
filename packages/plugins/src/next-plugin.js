// @knitui/plugins/next-plugin — Next.js config wrapper, pre-configured for the kit.
//
// Wraps `@tamagui/next-plugin`'s `withTamagui` with the kit's design-system
// `config` and component list baked in. This is the build-time half of the
// Next integration: the Tamagui compiler flattens the kit's `styled()`
// components into atomic CSS and injects it through Next's own CSS pipeline,
// and the plugin also handles the `react-native` -> `react-native-web` alias
// and the `__DEV__` define — so a Next app installs ZERO Tamagui packages and
// drops the hand-rolled webpack aliasing it used to carry.
//
//   // next.config.mjs
//   import { withTamagui } from "@knitui/plugins/next-plugin";
//
//   export default withTamagui({
//     reactStrictMode: true,
//     transpilePackages: [
//       "react-native-web",
//       "react-native-reanimated",
//       "react-native-gesture-handler",
//       "@knitui/core",
//       "@knitui/components",
//       "@knitui/hooks",
//       "@knitui/demo",
//     ],
//   });
//
// The runtime half stays `@knitui/plugins/next` (the `NextTamaguiProvider` that
// flushes theme/token CSS into the SSR stream). Need to tweak compiler options?
//   withTamagui(nextConfig, { disableExtraction: true })
//
// `@tamagui/next-plugin` is an optional dependency (only Next apps pull this
// path); native/Vite apps never import it.

/** Packages the compiler scans for kit components to optimize. */
const DEFAULT_COMPONENTS = ["@knitui/components", "@knitui/core"];

/**
 * Kit packages whose public entry is a big re-export barrel. Next rewrites
 * `import { X } from "pkg"` into a direct deep import per named binding, so the
 * barrel's module graph is never built in the first place.
 *
 * This matters far more here than for a typical dependency: the kit SRC-SHIPS,
 * so `transpilePackages` makes Next compile every file it reaches — and
 * `@knitui/icons`' barrel alone re-exports ~6.1k modules (`@knitui/emoji` is the
 * same shape). Without this, one `import { IconCheck } from "@knitui/icons"` in
 * app code costs thousands of module compiles on every cold start before
 * tree-shaking can throw them away.
 */
const DEFAULT_OPTIMIZE_PACKAGE_IMPORTS = [
  "@knitui/icons",
  "@knitui/emoji",
  "@knitui/components",
  "@knitui/dates",
  "@knitui/map",
];

/** @typedef {import("@tamagui/next-plugin").WithTamaguiProps} WithTamaguiProps */
/** @typedef {Record<string, any>} NextConfig */

/**
 * Augment a Next config with the kit's Knitui compiler.
 *
 * @param {NextConfig} [nextConfig] the app's Next config (transpilePackages, etc.)
 * @param {Partial<WithTamaguiProps>} [overrides] optional Tamagui compiler-option overrides
 * @returns {NextConfig}
 */
function withKnitui(nextConfig = {}, overrides = {}) {
  // Required lazily: only Next apps pull this path, and the plugin is an
  // optional dependency (see package.json).
  const { withTamagui: withTamaguiPlugin } = require("@tamagui/next-plugin");

  const plugin = withTamaguiPlugin({
    // The kit's design-system config, resolved from this package so the
    // consumer never references an internal path.
    config: require.resolve("@knitui/core/config"),
    components: DEFAULT_COMPONENTS,
    // App Router: emit `"use client"`-safe output and skip the legacy pages glue.
    appDir: true,
    // Extraction off in dev keeps fast-refresh snappy; on for production so the
    // shipped bundle is flattened to atomic CSS. Mirrors `@knitui/plugins/babel-plugin`.
    disableExtraction: process.env.NODE_ENV === "development",
    ...overrides,
  });

  return plugin(withKnituiWebpack(withKnituiExperimental(nextConfig)));
}

/**
 * Merge the kit's `experimental` defaults into a Next config without clobbering
 * anything the app already set. `optimizePackageImports` is concatenated (app
 * entries first, kit entries appended, de-duped) rather than replaced.
 *
 * @param {NextConfig} nextConfig
 * @returns {NextConfig}
 */
function withKnituiExperimental(nextConfig = {}) {
  const experimental = nextConfig.experimental ?? {};
  const userList = experimental.optimizePackageImports ?? [];
  return {
    ...nextConfig,
    experimental: {
      ...experimental,
      optimizePackageImports: [...new Set([...userList, ...DEFAULT_OPTIMIZE_PACKAGE_IMPORTS])],
    },
  };
}

/**
 * Layer the kit's webpack tweaks onto a Next config, preserving any `webpack`
 * the app already defined.
 *
 * Tamagui aliases the bare `react-native` import to `react-native-web`, but not
 * deep subpaths. `@shopify/react-native-skia`'s web build reaches straight into
 * `react-native/Libraries/Image/AssetRegistry`, which ships as untranspiled
 * Flow/TS source and crashes Next's parser. RNW carries an API-compatible
 * `AssetRegistry` (`getAssetByID`/`registerAsset`), so alias the subpath to it.
 *
 * Skia's web loader pulls `canvaskit-wasm`, whose bundle references Node's `fs`
 * for the SSR/Node path; in the browser bundle those have no equivalent, so
 * mark them as empty fallbacks.
 *
 * `react-native-reanimated`'s web build touches the Node-ism `global` at
 * module-eval time (e.g. `updateProps` assigns `global.UpdatePropsManager`).
 * The browser has no `global`, so merely importing reanimated — which every
 * `@knitui/carousel`/gesture consumer pulls in — throws `ReferenceError:
 * global is not defined`. Alias the bare identifier to `globalThis` in the
 * client bundle via DefinePlugin. Server-side `global` is a real Node global,
 * so this rewrite is gated to `!isServer` to leave it untouched there.
 *
 * @param {NextConfig} nextConfig
 * @returns {NextConfig}
 */
function withKnituiWebpack(nextConfig = {}) {
  const userWebpack = nextConfig.webpack;
  return {
    ...nextConfig,
    webpack(config, options) {
      config.resolve = config.resolve || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        "react-native/Libraries/Image/AssetRegistry":
          require.resolve("react-native-web/dist/modules/AssetRegistry"),
      };
      if (!options.isServer) {
        config.resolve.fallback = {
          ...config.resolve.fallback,
          fs: false,
          path: false,
        };
        config.plugins = config.plugins || [];
        config.plugins.push(new options.webpack.DefinePlugin({ global: "globalThis" }));
      }
      return typeof userWebpack === "function" ? userWebpack(config, options) : config;
    },
  };
}

module.exports = withKnitui;
module.exports.withKnitui = withKnitui;
