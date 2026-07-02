import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook for @knitui/map.
 *
 * The map kit itself is a *plain* cross-platform hybrid — its web (`*.tsx`)
 * implementations are pure DOM + `maplibre-gl` and never import `react-native`.
 * The STORIES, however, author their chrome (panels, buttons, marker labels)
 * with `@knitui/components` so the examples are React Native–compatible and run
 * unchanged on native. That kit is built on Tamagui + React Native, so this
 * web Storybook wires up the same bits the components Storybook does:
 *   1. tell Tamagui it's targeting web (`TAMAGUI_TARGET`),
 *   2. resolve React Native platform extensions, preferring `.web.*`, and
 *   3. alias `react-native` → `react-native-web`.
 * None of this touches the map package's runtime code — it's dev-only.
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
        include: [
          "maplibre-gl",
          "@maplibre/maplibre-gl-style-spec",
          "expo-image",
          "react-native-web",
        ],
        esbuildOptions: {
          resolveExtensions: RN_WEB_EXTENSIONS,
          loader: { ".js": "jsx" },
        },
      },
    });
  },
};

export default config;
