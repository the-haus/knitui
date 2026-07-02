import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook for @knitui/dates.
 *
 * The kit is built on Tamagui (via @knitui/components + @knitui/core), which renders
 * on web directly. Like the @knitui/components storybook, `viteFinal` wires up the
 * bits Vite doesn't do out of the box for a React Native–flavoured kit:
 *   1. tell Tamagui it's targeting web (`TAMAGUI_TARGET`),
 *   2. resolve React Native platform extensions, preferring `.web.*` so deps load
 *      their web builds (the native builds import Flow-typed `react-native`
 *      internals that rolldown cannot parse — the "Flow is not supported" error),
 *      and
 *   3. alias `react-native` → `react-native-web` for the bare imports that remain
 *      (e.g. `react-native-teleport`, expo-image's container `View`, the
 *      Provider's `useColorScheme`).
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

    return mergeConfig(config, {
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
        // expo-image (re-exported through @knitui/components) ships untranspiled TS
        // and platform-split files; let the dep optimizer resolve its `.web.*`
        // build (and the RN→RNW alias) the same way the main build does.
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
