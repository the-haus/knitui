/**
 * Babel config used ONLY by Jest (babel-jest) to transform the dates sources and
 * their tests for the web/jsdom test target. The library itself is built by
 * react-native-builder-bob, which has its own pipeline — this file does not
 * affect the published output. Mirrors packages/components/babel.config.js.
 */
module.exports = {
  presets: [["babel-preset-expo", { jsxRuntime: "automatic" }]],
};
