module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Tamagui compiler, pre-configured by the kit. Point it at the FULL config
      // (base + per-component theme templates) assembled in @knitui/components.
      require("@knitui/plugins/babel-plugin"),
      // Reanimated 4 moved the worklet plugin into react-native-worklets.
      // It MUST be listed last.
      "react-native-worklets/plugin",
    ],
  };
};
