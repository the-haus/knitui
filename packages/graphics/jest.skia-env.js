/**
 * Jest environment for the graphics story smoke test: jsdom (the kit renders
 * through react-native-web) plus a REAL CanvasKit on the global, which is what
 * Skia's own `jestEnv.js` does for the node environment. Skia's jest mock
 * (`@shopify/react-native-skia/lib/module/mock`) builds its `Skia` API from
 * `global.CanvasKit`, so `Skia.Path.Make()` and friends work in render, and
 * `GraphicsProvider` sees the runtime as ready on its first render.
 *
 * Opted into per file with a `@jest-environment ./jest.skia-env.js` docblock
 * (resolved against the package root); the pure engine tests stay on `node`.
 */
const { TestEnvironment } = require("jest-environment-jsdom");

class SkiaJsdomEnvironment extends TestEnvironment {
  async setup() {
    await super.setup();
    const CanvasKitInit = require("canvaskit-wasm/bin/full/canvaskit.js");
    this.global.CanvasKit = await CanvasKitInit({});
  }
}

module.exports = SkiaJsdomEnvironment;
