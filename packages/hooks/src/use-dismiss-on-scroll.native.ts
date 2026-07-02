import * as React from "react";

import type { TamaguiElement } from "@knitui/core";

import { subscribeKeyboardHeight } from "./use-keyboard-height";

/** Per-poll movement (in px) beyond which the reference is considered to have moved. */
const MOVE_THRESHOLD = 6;
/** Size delta (in px) beyond which the reference is treated as having reflowed (not scrolled). */
const SIZE_THRESHOLD = 2;
/** Poll cadence — low frequency keeps this cheap (vs. a per-frame loop). */
const POLL_MS = 100;
/** Quiet period after open / a keyboard toggle during which movement never dismisses
 *  (the keyboard animation moves the reference under `KeyboardAvoidingView` /
 *  `adjustResize`, which is NOT a scroll and runs for ~250ms). */
const KEYBOARD_SETTLE_MS = 350;
/** Consecutive polls of continuous movement required to count as a scroll. A real
 *  drag/momentum scroll moves across several polls; a one-shot layout jump moves
 *  once and then stops, so it never reaches this. */
const MOVED_TICKS_TO_DISMISS = 2;

type Measurable = {
  measureInWindow?: (cb: (x: number, y: number, width: number, height: number) => void) => void;
};

type Sample = { x: number; y: number; width: number; height: number };

/**
 * Native: close the overlay when the page scrolls. There is no global scroll
 * event in React Native and the overlay is teleported out of the `ScrollView`,
 * so we detect scrolling by polling the reference's window rect at a low cadence
 * and dismissing once it scrolls. The poll only runs while `enabled` (the overlay
 * is open) and stops as soon as it dismisses.
 *
 * The hard part is telling a *scroll* apart from a *layout shift* — both move the
 * reference, but only a scroll should dismiss. Three things move the reference
 * without it being a scroll, and each is filtered out:
 *
 * 1. **The keyboard animating in/out.** It shifts the reference under a
 *    `KeyboardAvoidingView` (or Android's `adjustResize`) over ~250ms. Every
 *    keyboard show/hide opens a {@link KEYBOARD_SETTLE_MS} quiet window during
 *    which movement is ignored, and the initial open gets the same window.
 * 2. **A late `KeyboardAvoidingView` re-layout.** KAV can re-lay out in a render
 *    well *after* `keyboardDidShow` — past any settle window — landing as a single
 *    abrupt jump. A scroll, by contrast, moves *continuously*: it only dismisses
 *    after {@link MOVED_TICKS_TO_DISMISS} consecutive polls of movement, so a
 *    one-shot jump (move once, then still) never qualifies.
 * 3. **Content reflow that resizes the reference.** Adding a pill to a searchable
 *    `MultiSelect` grows the field (and shifts it under KAV); navigating a
 *    `DateInput` calendar resizes the dropdown while the keyboard is up. A real
 *    scroll never changes the reference's *size*, so any poll where the measured
 *    width/height changed is treated as a reflow: it re-baselines instead of
 *    counting toward a dismiss.
 *
 * Trade-off: a scroll so fast it clears the threshold in a single poll
 * (~<100ms of motion) won't dismiss. That's rare for a touch drag/fling, and
 * far preferable to closing the dropdown mid-interaction — the user can still
 * dismiss by pressing outside it.
 */
export function useDismissOnScroll(
  enabled: boolean,
  referenceRef: React.RefObject<TamaguiElement | null>,
  onDismiss: () => void,
): void {
  // Keep the latest callback without re-subscribing the poll each render.
  const onDismissRef = React.useRef(onDismiss);
  onDismissRef.current = onDismiss;

  React.useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    /** Previous poll's rect — the comparison point for the next poll. */
    let prev: Sample | null = null;
    /** Consecutive polls of continuous movement seen so far. */
    let movedTicks = 0;
    let suspendUntil = Date.now() + KEYBOARD_SETTLE_MS; // settle the initial open

    // Read the reference fresh each time: it may mount after this effect runs, or
    // be swapped while the overlay is open. Bailing on a null ref here would wedge
    // the detector permanently; instead we just skip ticks until it's measurable.
    const measureNode = (cb: (sample: Sample) => void) => {
      const node = referenceRef.current as unknown as Measurable | null;
      if (node && typeof node.measureInWindow === "function") {
        node.measureInWindow((x, y, width, height) => {
          if (!cancelled) cb({ x, y, width, height });
        });
      }
    };

    // The keyboard animating isn't a scroll — open a fresh quiet window so its
    // shift is ignored however late the KAV/adjustResize layout lands.
    const onKeyboard = () => {
      suspendUntil = Date.now() + KEYBOARD_SETTLE_MS;
      movedTicks = 0;
      prev = null;
    };
    const unsubscribeKeyboard = subscribeKeyboardHeight(onKeyboard);

    const interval = setInterval(() => {
      if (cancelled) return;
      measureNode((sample) => {
        if (prev == null) {
          prev = sample;
          return;
        }

        const reflowed =
          Math.abs(sample.width - prev.width) > SIZE_THRESHOLD ||
          Math.abs(sample.height - prev.height) > SIZE_THRESHOLD;
        const moved =
          Math.abs(sample.x - prev.x) > MOVE_THRESHOLD ||
          Math.abs(sample.y - prev.y) > MOVE_THRESHOLD;

        // A resized reference is a content reflow, not a scroll — re-baseline and
        // never let it count toward a dismiss (a scroll keeps the size constant).
        // Within the settle window, ignore movement entirely (keyboard animation).
        if (reflowed || Date.now() < suspendUntil) {
          prev = sample;
          movedTicks = 0;
          return;
        }

        // Sustained, same-size translation is a scroll; a one-shot jump (a late
        // layout shift) moves for a single poll and then stops, so it resets here.
        if (moved) {
          movedTicks += 1;
          prev = sample;
          if (movedTicks >= MOVED_TICKS_TO_DISMISS) onDismissRef.current();
        } else {
          movedTicks = 0;
          prev = sample;
        }
      });
    }, POLL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      unsubscribeKeyboard();
    };
  }, [enabled, referenceRef]);
}
