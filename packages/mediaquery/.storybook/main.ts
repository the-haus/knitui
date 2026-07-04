import type { StorybookConfig } from "@storybook/react-vite";

/**
 * Storybook for @knitui/mediaquery.
 *
 * The hooks are headless and render on web directly, but they transitively pull
 * in @knitui/core (Tamagui) and @knitui/hooks, so `viteFinal` applies the same
 * React Native → web wiring the other kit storybooks use: target web, prefer
 * `.web.*` extensions, and alias `react-native` → `react-native-web`.
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
        include: ["react-native-web"],
        esbuildOptions: {
          resolveExtensions: RN_WEB_EXTENSIONS,
          loader: { ".js": "jsx" },
        },
      },
    });
  },
};

export default config;
