/**
 * Native graphics-runtime loader — a no-op.
 *
 * On iOS/Android the Skia runtime is linked into the app binary and available
 * synchronously, so there's nothing to load. Mirrors the web counterpart
 * (`loadRuntime.web.ts`) so cross-platform callers can `await loadGraphicsRuntime()`
 * unconditionally. Bundlers pick this file on native via the
 * `@knitui/graphics/runtime` conditional export.
 */

/** Always already ready on native. */
export function isGraphicsRuntimeReady(): boolean {
  return true;
}

/** Resolves immediately — Skia is ready synchronously on native. */
export function loadGraphicsRuntime(_locateFile?: (file: string) => string): Promise<void> {
  return Promise.resolve();
}
