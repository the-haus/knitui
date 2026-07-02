/**
 * Babel config used ONLY by Jest (babel-jest) to transform the plain-JS plugin
 * sources and their tests for the Node test target. The published output is built
 * by react-native-builder-bob — this file does not affect it.
 */
module.exports = {
  presets: [["babel-preset-expo", { jsxRuntime: "automatic" }]],
};
