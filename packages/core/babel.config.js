/**
 * Babel config used ONLY by Jest (babel-jest) to transform the config sources
 * and the untranspiled RN/Tamagui packages for the test target. The library
 * itself is built by react-native-builder-bob — this file does not affect the
 * published output.
 */
module.exports = {
  presets: [["babel-preset-expo", { jsxRuntime: "automatic" }]],
};
