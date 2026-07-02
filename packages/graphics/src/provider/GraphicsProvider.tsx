import * as React from "react";

import { GraphicsContext, type GraphicsProviderProps } from "./GraphicsContext";

// Native entry point. On iOS/Android the Skia runtime is linked into the app
// binary and available synchronously, so there is nothing to initialize — the
// provider is a thin pass-through that always reports ready. The web-specific
// loading logic lives in `GraphicsProvider.web.tsx`, which bundlers resolve in
// place of this file for web targets.
const NATIVE_VALUE = { ready: true } as const;

export function GraphicsProvider({ children }: GraphicsProviderProps) {
  return (
    <GraphicsContext.Provider value={NATIVE_VALUE}>
      <>{children}</>
    </GraphicsContext.Provider>
  );
}
