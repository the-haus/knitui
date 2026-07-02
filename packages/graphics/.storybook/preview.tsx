import * as React from "react";

// Deep import: this pulls in ONLY the CanvasKit loader, not Skia.web.js (which
// captures `global.CanvasKit` at module-eval time — see the await below).
import { LoadSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import skiaPackageJson from "@shopify/react-native-skia/package.json";
import type { Decorator, Preview } from "@storybook/react-vite";

// Skia's web loader (and react-native-web) reach for a Node-style `global`.
// Alias it to `globalThis` so `global.CanvasKit` resolves in the browser. This
// MUST run before any Skia module evaluates. ES `import` statements hoist above
// top-level code, so we cannot rely on statement order against a *static*
// `../src` import — instead `../src` is imported dynamically further down, after
// this polyfill and after CanvasKit has loaded. (Runtime polyfill rather than a
// Vite `define` to avoid mangling the `global` token inside canvaskit's glue.)
(globalThis as { global?: typeof globalThis }).global ||= globalThis;

const canvasKitVersion = skiaPackageJson.dependencies?.["canvaskit-wasm"] ?? "latest";
const locateFile = (file: string) =>
  `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${canvasKitVersion}/bin/full/${file}`;

// Top-level await: block the preview entry until CanvasKit is on the global.
// Storybook awaits the project annotations (this module) before importing any
// story module, so this guarantees `Skia.web.js` — pulled in transitively by
// the barrel below — captures a real CanvasKit instead of `undefined`. Without
// it, the Skia singleton freezes around `undefined` and every canvas render
// throws "Cannot read properties of undefined (reading 'PictureRecorder')".
await LoadSkiaWeb({ locateFile });

// Imported dynamically, AFTER CanvasKit is ready, so the barrel (and the Skia
// runtime it transitively evaluates) binds to a loaded CanvasKit.
const { GraphicsProvider } = await import("../src");

/**
 * Every story renders on top of the Skia runtime. CanvasKit is already loaded
 * (see the top-level await above), so `GraphicsProvider` resolves `ready` on its
 * first render and this fallback is effectively instant — kept as a guard in
 * case the provider is given a slower `locateFile` source.
 */
const Loading = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: 160,
      height: 160,
      borderRadius: 12,
      color: "#94a3b8",
      fontFamily: "ui-sans-serif, system-ui, sans-serif",
      fontSize: 13,
      background: "#f1f5f9",
    }}
  >
    Loading Skia…
  </div>
);

const withGraphics: Decorator = (Story) => (
  <GraphicsProvider fallback={<Loading />}>
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 32,
        minHeight: "100vh",
        boxSizing: "border-box",
        background: "#ffffff",
      }}
    >
      <Story />
    </div>
  </GraphicsProvider>
);

const preview: Preview = {
  decorators: [withGraphics],
  parameters: {
    layout: "fullscreen",
    controls: {
      matchers: {
        color: /(color|tint|background)$/i,
      },
    },
  },
};

export default preview;
