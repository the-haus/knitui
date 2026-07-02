import * as React from "react";

import { isGraphicsRuntimeReady, loadGraphicsRuntime } from "../loadRuntime.web";
import { GraphicsContext, type GraphicsProviderProps } from "./GraphicsContext";

export function GraphicsProvider({ children, fallback = null, locateFile }: GraphicsProviderProps) {
  const [ready, setReady] = React.useState(isGraphicsRuntimeReady);
  const [error, setError] = React.useState<unknown>(null);

  React.useEffect(() => {
    if (ready || isGraphicsRuntimeReady()) {
      setReady(true);
      return;
    }

    let cancelled = false;

    loadGraphicsRuntime(locateFile)
      .then(() => {
        if (!cancelled) {
          setError(null);
          setReady(true);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setError(error);
          console.error("[@knitui/graphics] Failed to load CanvasKit on web", error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [locateFile, ready]);

  const value = React.useMemo(() => ({ ready, error }), [ready, error]);

  return (
    <GraphicsContext.Provider value={value}>
      <>{ready ? children : fallback}</>
    </GraphicsContext.Provider>
  );
}
