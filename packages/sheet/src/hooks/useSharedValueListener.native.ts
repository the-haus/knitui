import * as React from "react";
import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

/**
 * Subscribe to a reanimated `SharedValue` (NATIVE build).
 *
 * On native, `SharedValue.addListener` may only be called from the UI runtime —
 * calling it from JS throws "Adding listeners is only possible on the UI runtime"
 * (Reanimated 4). So instead of the web build's `addListener`, this reacts to the
 * value on the UI runtime via `useAnimatedReaction` and hops the change back to JS
 * with `scheduleOnRN`. Same signature and contract as the web twin
 * (`useSharedValueListener.ts`), so consumers stay platform-agnostic.
 *
 * `fn` is read through a ref so a fresh closure each render doesn't restart the
 * reaction. The current value is delivered on the reaction's first run too, so
 * consumers are in sync from the start (matching the web build's once-on-subscribe).
 */
export function useSharedValueListener<T>(
  sv: SharedValue<T>,
  fn: (value: T) => void,
  filter?: (value: T) => boolean,
): void {
  const latest = React.useRef(fn);
  latest.current = fn;

  // Stable JS sink the worklet schedules onto; reads the latest `fn` via the ref.
  const deliver = React.useCallback((value: T) => latest.current(value), []);

  useAnimatedReaction(
    () => sv.value,
    (current) => {
      "worklet";
      // `filter` runs on the UI thread so an uninteresting value costs NOTHING — no
      // `scheduleOnRN`, no JS-thread wake-up. Load-bearing for drag performance: a
      // dragged/springing sheet writes its offset every frame, and an unfiltered
      // listener woke the JS thread 60–120×/s (while it may be busy rendering) just
      // for the subscriber to test a condition and return.
      if (filter && !filter(current)) return;
      scheduleOnRN(deliver, current);
    },
    [sv, deliver, filter],
  );
}
