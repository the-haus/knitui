import * as React from "react";
import type { SharedValue } from "react-native-reanimated";

import { useSharedValueListener } from "../hooks/useSharedValueListener";

/**
 * Web twin of `./selectedDot`: which dot is selected, derived once per row from
 * a `progress` listener (the shared file's web branch), without Reanimated's
 * `useAnimatedReaction` or Worklets — so no web bundle reaches them. See the
 * native file for why it is one derivation per row, not one per dot.
 *
 * Returns `-1` when there are no dots.
 */
export function useSelectedIndex(progress: SharedValue<number>, count: number): number {
  const selectedFrom = React.useCallback(
    (p: number): number => {
      if (count <= 0) return -1;
      // Real-item space wraps: at the loop seam `progress` approaches `count`,
      // which rounds onto dot 0.
      return ((Math.round(p) % count) + count) % count;
    },
    [count],
  );

  const [selected, setSelected] = React.useState(() => selectedFrom(progress.value));

  useSharedValueListener(progress, (p) => {
    setSelected((prev) => {
      const next = selectedFrom(p);
      return next === prev ? prev : next;
    });
  });

  // A `count` change must re-derive right away — the listener only fires on a
  // `progress` write, which may be far off.
  React.useEffect(() => {
    setSelected((prev) => {
      const next = selectedFrom(progress.value);
      return next === prev ? prev : next;
    });
  }, [selectedFrom, progress]);

  return selected;
}
