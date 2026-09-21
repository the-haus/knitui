/**
 * Where the web map loads maplibre's worker from.
 *
 * maplibre-gl v6 is ESM-only and derives its worker URL from `import.meta.url`
 * at runtime. Inside a bundler (webpack, Next, Vite, Metro web) that never points
 * at a real file, so the map mounts, paints its background and never loads a
 * tile. Serve `maplibre-gl-worker.mjs` together with the `maplibre-gl-shared.mjs`
 * it imports, and point this at the worker once at startup:
 *
 * ```ts
 * import { setWorkerUrl } from "@knitui/map/worker";
 *
 * setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");
 * ```
 *
 * This module only stores the URL. It deliberately doesn't import maplibre, so
 * calling it from an app's root doesn't pull the map engine into every page. The
 * web `Map` hands it to maplibre before it creates its first map. On native it's
 * unused: MapLibre Native has no web worker.
 */

let workerUrl: string | undefined;

/** Set the URL of `maplibre-gl-worker.mjs` for the web `Map`. Call before the first map mounts. */
export function setWorkerUrl(url: string): void {
  workerUrl = url;
}

/** @internal The URL passed to {@link setWorkerUrl}, if any. */
export function getConfiguredWorkerUrl(): string | undefined {
  return workerUrl;
}
