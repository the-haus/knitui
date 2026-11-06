import * as React from "react";
import { BackHandler } from "react-native";

/** Runs `onBack` on Android hardware back while `enabled`. Return `true` to consume it. */
export function useBackPress(enabled: boolean, onBack: () => boolean): void {
  const latest = React.useRef(onBack);
  latest.current = onBack;
  React.useEffect(() => {
    if (!enabled) return undefined;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => latest.current());
    return () => sub.remove();
  }, [enabled]);
}
