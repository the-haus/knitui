import * as React from "react";

export type GraphicsContextValue = {
  /**
   * Whether the Skia graphics runtime is initialized and ready to render.
   * On native this is always `true`; on web it flips to `true` once the
   * CanvasKit WASM runtime has finished loading.
   */
  ready: boolean;
};

export type GraphicsProviderProps = {
  children?: React.ReactNode;
  /**
   * Rendered on web while the CanvasKit WASM runtime is loading. Defaults to
   * `null`. Ignored on native, where the runtime is ready synchronously.
   */
  fallback?: React.ReactNode;
  /**
   * Override how CanvasKit WASM asset URLs are resolved on web. By default the
   * wasm is loaded from the jsDelivr CDN, matching the installed
   * `@shopify/react-native-skia` `canvaskit-wasm` version. Ignored on native.
   */
  locateFile?: (file: string) => string;
};

export const GraphicsContext = React.createContext<GraphicsContextValue>({
  ready: true,
});

/** Access the graphics runtime context (e.g. its ready state). */
export function useGraphics(): GraphicsContextValue {
  return React.useContext(GraphicsContext);
}

/** Convenience hook returning whether the graphics runtime is ready to render. */
export function useGraphicsReady(): boolean {
  return useGraphics().ready;
}
