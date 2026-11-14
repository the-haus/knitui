/**
 * Babel config used ONLY by Jest (babel-jest) to transform audio, test and
 * RN/Tamagui sources for the web/jsdom test target. The library itself is built
 * by react-native-builder-bob, which has its own pipeline — this file does not
 * affect the published output.
 */
module.exports = {
  presets: [["babel-preset-expo", { jsxRuntime: "automatic" }]],
  // Jest runs CommonJS, where a real `import()` is refused. Turn the lazy imports
  // (the on-demand HLS library) into deferred `require`s for the tests.
  plugins: ["@babel/plugin-transform-dynamic-import"],
};
