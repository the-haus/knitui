import * as React from "react";
import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { isWeb } from "@knitui/core";

import { useSharedValueListener } from "../hooks/useSharedValueListener";

/**
 * Which dot is selected, in real-item space — derived ONCE per pagination row.
 *
 * The carousel writes `progress` every frame, so this must be as cheap as
 * possible: one reaction (native) / one listener (web) for the whole row, whose
 * result is a plain index that flips only when the rounded active dot actually
 * changes. Each dot then compares that index to its own — no per-dot reanimated
 * mapper. (It used to be one reaction PER DOT, i.e. one mapper evaluation per
 * dot per frame on the UI thread, linear in dot count.)
 *
 * The platform split is forced by Reanimated 4: a `SharedValue.addListener` can
 * only be added on the UI runtime, so native derives from a UI-thread
 * `useAnimatedReaction`; web (where `useAnimatedReaction` does not re-run on
 * value changes under this repo's tooling) uses the JS-thread listener, which
 * also fires synchronously in jest. Both hooks are called unconditionally so the
 * hook order stays stable across platforms; each is gated to its platform.
 *
 * This is the single source of truth for "which dot is active": the visible
 * transition is owned by the caller — `Pagination`'s discrete dot lets Tamagui's
 * `animation` driver tween `scale`/`opacity` between the two states, while
 * `useDotHost` (the fill variant) pairs the boolean with its own continuous
 * `useAnimatedStyle` transform.
 *
 * Returns `-1` when there are no dots.
 */
export function useSelectedIndex(progress: SharedValue<number>, count: number): number {
  // Worklet: runs on the UI thread inside the reaction below.
  const selectedFrom = React.useCallback(
    (p: number): number => {
      "worklet";
      if (count <= 0) return -1;
      // Real-item space wraps: at the loop seam `progress` approaches `count`,
      // which rounds onto dot 0.
      return ((Math.round(p) % count) + count) % count;
    },
    [count],
  );

  const [selected, setSelected] = React.useState(() => selectedFrom(progress.value));

  // Native: derive on the UI thread (addListener is UI-runtime-only in Reanimated 4).
  useAnimatedReaction(
    () => selectedFrom(progress.value),
    (next, prev) => {
      if (next !== prev) scheduleOnRN(setSelected, next);
    },
    // A fresh array literal: reanimated appends worklet hashes to the dependency
    // array in place, so it must not be shared with another reanimated hook.
    [selectedFrom],
  );

  // Web: the UI-thread reaction above doesn't re-fire; the SharedValue listener does.
  useSharedValueListener(
    progress,
    (p) => {
      setSelected((prev) => {
        const next = selectedFrom(p);
        return next === prev ? prev : next;
      });
    },
    isWeb,
  );

  // A `count` change must re-derive right away — the reaction and the listener
  // only fire on a `progress` write, which may be far off.
  React.useEffect(() => {
    setSelected((prev) => {
      const next = selectedFrom(progress.value);
      return next === prev ? prev : next;
    });
  }, [selectedFrom, progress]);

  return selected;
}
