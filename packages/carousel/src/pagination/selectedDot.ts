import * as React from "react";
import { type SharedValue, useAnimatedReaction } from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { isWeb } from "@knitui/core";

import { useSharedValueListener } from "../hooks/useSharedValueListener";

/** A predicate: is this dot the selected (rounded-to) one at `progress`? Must be a worklet. */
export type DotActiveFn = (progress: number) => boolean;

/**
 * Tracks which dot is selected, in real-item space. The boolean flips only when
 * the rounded active dot actually changes — no per-frame state churn.
 *
 * The platform split is forced by Reanimated 4: a `SharedValue.addListener` can
 * only be added on the UI runtime, so native flips the boolean from a UI-thread
 * `useAnimatedReaction`; web (where `useAnimatedReaction` does not re-run on
 * value changes under this repo's tooling) keeps the JS-thread listener, which
 * also fires synchronously in jest. Both hooks are called unconditionally so the
 * hook order stays stable across platforms; each is gated to its platform.
 *
 * This intentionally tracks only the boolean — the visible transition is owned
 * by the caller: `Pagination`'s discrete dot lets Tamagui's `animation` driver
 * tween `scale` / `opacity` between the two states declaratively, while
 * `useDotHost` (the fill variant) pairs this with its own `useAnimatedStyle`
 * transform. This is the single source of truth for "which dot is active".
 *
 * `deps` is copied before it reaches `useAnimatedReaction` because reanimated
 * mutates its dependency array in place (it `.push`es worklet hashes): a caller
 * that shares the same array with another reanimated hook — e.g. `useDotHost`'s
 * `useAnimatedStyle` — would otherwise see both arrays change size between
 * renders ("dependency array changed size").
 */
export function useSelectedDot(
  progress: SharedValue<number>,
  isActive: DotActiveFn,
  deps: unknown[],
): boolean {
  const [selected, setSelected] = React.useState(() => isActive(progress.value));

  // Native: track on the UI thread (addListener is UI-runtime-only in RN-Reanimated 4).
  useAnimatedReaction(
    () => isActive(progress.value),
    (next, prev) => {
      if (next !== prev) scheduleOnRN(setSelected, next);
    },
    [...deps],
  );

  // Web: the UI-thread reaction above doesn't re-fire; the SharedValue listener does.
  useSharedValueListener(
    progress,
    (p) => {
      setSelected((prev) => {
        const next = isActive(p);
        return next === prev ? prev : next;
      });
    },
    isWeb,
  );

  return selected;
}
