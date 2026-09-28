import { useSyncExternalStore } from "react";
import { AppState, type AppStateStatus } from "react-native";

import type { AppVisibility } from "./use-app-state.shared";

const normalize = (status: AppStateStatus | null | undefined): AppVisibility => {
  if (status === "active") return "active";
  if (status === "inactive") return "inactive";
  return "background";
};

/**
 * Current coarse foreground/background state on React Native, readable from
 * plain JS — `AppState.currentState` normalized onto the `AppVisibility` union
 * (RN's `unknown` / `extension` read as `"background"`).
 */
export function getAppState(): AppVisibility {
  return normalize(AppState.currentState);
}

/**
 * Subscribe to foreground/background transitions on React Native (`AppState`'s
 * `"change"` event, normalized). iOS passes through `"inactive"` on the way to
 * and from the background (app switcher, incoming call); Android goes straight
 * between `"active"` and `"background"`. Returns the unsubscribe.
 */
export function subscribeAppState(listener: (state: AppVisibility) => void): () => void {
  const subscription = AppState.addEventListener("change", (next) => listener(normalize(next)));
  return () => subscription.remove();
}

/**
 * Coarse foreground/background state on React Native — native counterpart of
 * `use-app-state`: {@link getAppState} as a hook, re-rendering on each change.
 */
export function useAppState(): AppVisibility {
  return useSyncExternalStore(subscribeAppState, getAppState, getAppState);
}
