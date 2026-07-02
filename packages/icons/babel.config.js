/**
 * Babel config used ONLY by Jest (babel-jest) to transform the icon sources and
 * tests for the web/Node test target. The published output is built by
 * react-native-builder-bob — this file does not affect it.
 */
module.exports = {
  presets: [["babel-preset-expo", { jsxRuntime: "automatic" }]],
};
