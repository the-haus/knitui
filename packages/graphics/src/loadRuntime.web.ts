/**
 * Web graphics-runtime loader — boots the CanvasKit WASM runtime.
 *
 * This is the single source of truth for loading Skia on web: `GraphicsProvider`
 * uses it to gate rendering, and consumers that lazy-import graphics modules call
 * it FIRST. The deep `…/lib/module/web` import pulls ONLY the CanvasKit loader —
 * NOT the Skia runtime barrel (`Skia.web.js`), which captures `global.CanvasKit`
 * at module-eval time. So importing this file is safe to do before the barrel is
 * ever evaluated; that's the whole point — call `loadGraphicsRuntime()` before
 * importing anything that re-exports `@shopify/react-native-skia`, or the Skia
 * singleton freezes around `undefined` and every canvas render throws.
 *
 * The native counterpart (`loadRuntime.native.ts`) is a no-op: Skia is linked
 * into the app binary and ready synchronously. Bundlers resolve the right file
 * via the `@knitui/graphics/runtime` conditional export.
 */
import { LoadSkiaWeb } from "@shopify/react-native-skia/lib/module/web";
import skiaPackageJson from "@shopify/react-native-skia/package.json";

type CanvasKitGlobal = typeof globalThis & { CanvasKit?: unknown };

// Skia's web loader (and react-native-web) reach for a Node-style `global`.
// Alias it to `globalThis` so `global.CanvasKit` resolves in the browser. Must
// run before any Skia module evaluates — importing this file guarantees that.
(globalThis as { global?: typeof globalThis }).global ||= globalThis;

const canvasKitVersion = skiaPackageJson.dependencies?.["canvaskit-wasm"] ?? "latest";

/** Default CanvasKit asset resolver: the jsDelivr CDN, pinned to the installed version. */
export const defaultLocateFile = (file: string): string =>
  `https://cdn.jsdelivr.net/npm/canvaskit-wasm@${canvasKitVersion}/bin/full/${file}`;

/** Whether the CanvasKit runtime is already on the global. */
export function isGraphicsRuntimeReady(): boolean {
  return Boolean((globalThis as CanvasKitGlobal).CanvasKit);
}

let loadPromise: Promise<void> | null = null;

/**
 * Load CanvasKit once and resolve when it's on the global. Concurrent and repeat
 * callers share the same in-flight (then resolved) promise. A failure clears the
 * cache so a remount/re-open can retry. Pass `locateFile` to override the asset
 * source (defaults to {@link defaultLocateFile}).
 */
export function loadGraphicsRuntime(
  locateFile: (file: string) => string = defaultLocateFile,
): Promise<void> {
  if (isGraphicsRuntimeReady()) return Promise.resolve();
  if (!loadPromise) {
    loadPromise = LoadSkiaWeb({ locateFile })
      .then(() => undefined)
      .catch((error) => {
        loadPromise = null; // allow retry on remount / next open
        throw error;
      });
  }
  return loadPromise;
}
