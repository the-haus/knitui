import * as React from "react";
import { SafeAreaInsetsContext } from "react-native-safe-area-context";

/** The safe area. The context, not the hook: it's null without a provider. */
export function useSafeInsets(bottomOverride: number | undefined): {
  top: number;
  bottom: number | string;
} {
  const insets = React.useContext(SafeAreaInsetsContext);
  return { top: insets?.top ?? 0, bottom: bottomOverride ?? insets?.bottom ?? 0 };
}
