import * as React from "react";
import { Gesture } from "react-native-gesture-handler";

import type { SheetScrollGesture } from "./drag.types";

/**
 * The RNGH `Native` gesture a nested `Sheet.ScrollView` attaches to its scroller,
 * so the list recognises simultaneously with the sheet's Pan (NATIVE build).
 */
export function useScrollGesture(): SheetScrollGesture | undefined {
  return React.useMemo(() => Gesture.Native(), []);
}
