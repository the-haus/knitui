/**
 * Babel config used ONLY by Jest (babel-jest) to transform hook and test sources
 * for the web/jsdom test target. The library itself is built by
 * react-native-builder-bob, which has its own pipeline — this file does not
 * affect the published output.
 */
module.exports = {
  presets: [["babel-preset-expo", { jsxRuntime: "automatic" }]],
};
