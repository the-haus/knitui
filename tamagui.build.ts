import type { TamaguiBuildOptions } from "@tamagui/core";

/**
 * Tamagui v3 compiler / CLI configuration for the monorepo (`tamagui check`,
 * `tamagui generate`, `tamagui build`). The bundler adapters in
 * `@knitui/plugins` bake in the same two settings for apps.
 *
 * v3's loader defaults `components` to the `tamagui` package, which this kit
 * does not use, so both keys must stay explicit.
 */
export default {
  config: "./packages/core/src/config/config.ts",
  components: [
    "@knitui/core",
    "@knitui/components",
    "@knitui/dates",
    "@knitui/media",
    "@knitui/sheet",
    "@knitui/carousel",
  ],
  // Same list as STATIC_EVALUATION_IGNORED_MODULES in @knitui/plugins: the
  // compiler evaluates the kit in Node, where these native modules can't load.
  dangerouslyIgnoreStaticEvaluationModules: [
    "react-native-gesture-handler",
    "expo",
    "expo-modules-core",
    "expo-image",
    "expo-audio",
    "expo-video",
  ],
} satisfies TamaguiBuildOptions;
