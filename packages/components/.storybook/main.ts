import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook for @knitui/components.
 *
 * The kit is built on Tamagui, which renders on web directly. `viteFinal` wires
 * up the bits Vite doesn't do out of the box for a React Native–flavoured kit:
 *   1. tell Tamagui it's targeting web (`TAMAGUI_TARGET`),
 *   2. resolve React Native platform extensions, preferring `.web.*` so deps
 *      like `expo-image` load their web builds (the native build imports
 *      Flow-typed `react-native` internals that rolldown cannot parse), and
 *   3. alias `react-native` → `react-native-web` for the bare imports that
 *      remain (expo-image's container `View`, the Provider's `useColorScheme`),
 *   4. optionally run the Tamagui v3 compiler (`@knitui/plugins/vite` →
 *      `@tamagui/cli/vite`) so Storybook exercises extraction like an app build
 *      does (`TAMAGUI_COMPILER_STATS=verbose` prints flatten/bail stats).
 *      OPT-IN with `KNITUI_STORYBOOK_COMPILER=1` for now: under Storybook's Vite
 *      config the compiler's evaluation environment inlines `react`'s CommonJS
 *      entry ("ReferenceError: module is not defined" in
 *      node_modules/react/index.js), so it is not on by default until that is
 *      resolved (tracked in docs/v3/conventions.md §10).
 */
const RN_WEB_EXTENSIONS = [
  ".web.tsx",
  ".web.ts",
  ".web.jsx",
  ".web.js",
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".json",
];

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)", "../src/**/*.mdx"],
  addons: ["@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  core: {
    disableTelemetry: true,
  },
  async viteFinal(config) {
    const { mergeConfig } = await import("vite");
    const compiler =
      process.env.KNITUI_STORYBOOK_COMPILER === "1"
        ? [(await import("@knitui/plugins/vite")).knitui()]
        : [];

    return mergeConfig(config, {
      plugins: compiler,
      define: {
        "process.env.TAMAGUI_TARGET": JSON.stringify("web"),
        "process.env.EXPO_OS": JSON.stringify("web"),
        __DEV__: JSON.stringify(process.env.NODE_ENV !== "production"),
      },
      resolve: {
        extensions: RN_WEB_EXTENSIONS,
        alias: {
          "react-native": "react-native-web",
        },
      },
      optimizeDeps: {
        // expo-image ships untranspiled TS and platform-split files; let the
        // dep optimizer resolve its `.web.*` build (and the RN→RNW alias) the
        // same way the main build does.
        include: ["expo-image", "react-native-web"],
        esbuildOptions: {
          resolveExtensions: RN_WEB_EXTENSIONS,
          loader: { ".js": "jsx" },
        },
      },
    });
  },
};

export default config;
