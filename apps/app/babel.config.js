module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Tamagui v3 has no babel plugin: the compiler runs through Metro
      // (`withKnitui` from @knitui/plugins/metro in metro.config.js).
      // Reanimated 4 moved the worklet plugin into react-native-worklets.
      // It MUST be listed last.
      "react-native-worklets/plugin",
    ],
  };
};
