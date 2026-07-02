import { useEffect, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

import type { AppVisibility } from "./use-app-state.shared";

const normalize = (status: AppStateStatus): AppVisibility => {
  if (status === "active") return "active";
  if (status === "inactive") return "inactive";
  return "background";
};

/**
 * Coarse foreground/background state on React Native — native counterpart of
 * `use-app-state`. Seeds from `AppState.currentState` and tracks the `"change"`
 * event, normalizing RN's status onto the `AppVisibility` union.
 */
export function useAppState(): AppVisibility {
  const [state, setState] = useState<AppVisibility>(() => normalize(AppState.currentState));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => setState(normalize(next)));
    return () => subscription.remove();
  }, []);

  return state;
}
