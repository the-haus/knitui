import { useEffect, useState } from "react";

import type { AppVisibility } from "./use-app-state.shared";

/**
 * Coarse foreground/background state (web) — maps the Page Visibility API onto
 * the cross-platform `AppVisibility` union. `document.hidden` → `background`,
 * otherwise `active`. SSR-safe. The `use-app-state.native` sibling uses React
 * Native's `AppState`. Use it to pause intervals / animations when backgrounded.
 */
export function useAppState(): AppVisibility {
  const [state, setState] = useState<AppVisibility>("active");

  useEffect(() => {
    if (typeof document === "undefined") return;

    const update = () => setState(document.visibilityState === "hidden" ? "background" : "active");
    update();
    document.addEventListener("visibilitychange", update);
    return () => document.removeEventListener("visibilitychange", update);
  }, []);

  return state;
}
