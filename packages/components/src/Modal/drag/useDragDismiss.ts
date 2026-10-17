/// <reference lib="dom" />
import * as React from "react";

import type { DragValue } from "./drag-value";
import { shouldDismiss } from "./engine";
import { ACTIVATION_THRESHOLD, DEFAULT_DISMISS_SPRING, type DragAxis } from "./spring";
import type { DragDismissParams } from "./types";

export { DEFAULT_DISMISS_SPRING, type DragAxis, type DragDismissParams };

/**
 * The web drag-to-dismiss gesture, handed to `DragDismissDetector`, which
 * attaches it to its child's DOM node.
 */
export interface WebDragGesture {
  /** Whether a drag may start (measured, opened, `dragToDismiss` on). */
  readonly enabled: boolean;
  /** Listen on `node`; returns the cleanup. */
  attach(node: HTMLElement): () => void;
}

/** How far back (ms) the release velocity is measured over. */
const VELOCITY_WINDOW_MS = 100;

type Sample = { t: number; along: number };

/**
 * Web drag-to-dismiss, from pointer events — the same decision and settle as the
 * native `Gesture.Pan` (`useDragDismiss.native.ts`), without RNGH, Reanimated or
 * worklets in the web build:
 *
 * - a press only becomes a drag once it has travelled {@link ACTIVATION_THRESHOLD}
 *   px along the axis, so taps on the scrim (tap-to-dismiss) and presses on
 *   controls keep working;
 * - on activation the panel is caught where its spring currently is (re-grabbing
 *   a flying panel cancels its pending dismiss);
 * - the finger is tracked toward the dismiss edge, hard-clamped at rest the other
 *   way;
 * - on release the pure {@link shouldDismiss} decides with the release velocity
 *   (px/s, over the last {@link VELOCITY_WINDOW_MS} ms): dismiss → spring
 *   off-screen, then `onDismiss`; otherwise spring back. A cancelled pointer
 *   (the browser took the touch) springs back and never dismisses.
 *
 * Mouse, pen and touch all drag. After a real drag the click it produces is
 * swallowed, so releasing over the scrim doesn't also tap-dismiss.
 */
export function useDragDismiss(params: DragDismissParams): WebDragGesture {
  // The listeners are attached once per node; they read the latest params here.
  const latest = React.useRef(params);
  latest.current = params;
  const { enabled } = params;

  const attach = React.useCallback((node: HTMLElement) => {
    let pointerId: number | null = null;
    let start = { x: 0, y: 0 };
    let active = false;
    let panStart = 0;
    let samples: Sample[] = [];
    let restoreSelect: string | null = null;

    const along = (e: PointerEvent) =>
      latest.current.axis === "x" ? e.clientX - start.x : e.clientY - start.y;

    const stopListening = () => {
      window.removeEventListener("pointermove", onMove, true);
      window.removeEventListener("pointerup", onUp, true);
      window.removeEventListener("pointercancel", onCancel, true);
      if (restoreSelect != null) {
        document.body.style.userSelect = restoreSelect;
        restoreSelect = null;
      }
      pointerId = null;
      active = false;
      samples = [];
    };

    const onDown = (e: PointerEvent) => {
      if (!latest.current.enabled || pointerId != null) return;
      if (e.pointerType === "mouse" && e.button !== 0) return;
      pointerId = e.pointerId;
      start = { x: e.clientX, y: e.clientY };
      active = false;
      samples = [];
      window.addEventListener("pointermove", onMove, true);
      window.addEventListener("pointerup", onUp, true);
      window.addEventListener("pointercancel", onCancel, true);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const { offset, sign } = latest.current;
      const value = offset as DragValue;
      const travel = along(e);
      if (!active) {
        if (Math.abs(travel) < ACTIVATION_THRESHOLD) return;
        // Activation: catch the panel wherever its spring is, with no jump.
        active = true;
        value.cancel();
        panStart = value.value;
        restoreSelect = document.body.style.userSelect;
        document.body.style.userSelect = "none";
      }
      e.preventDefault();
      const d = panStart + travel * sign;
      value.value = d > 0 ? d : 0;
      samples.push({ t: e.timeStamp, along: travel });
      const cutoff = e.timeStamp - VELOCITY_WINDOW_MS;
      while (samples.length > 2 && samples[0]!.t < cutoff) samples.shift();
    };

    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const wasActive = active;
      const velocity = releaseVelocity(samples) * latest.current.sign;
      stopListening();
      if (!wasActive) return;
      swallowNextClick();
      const { offset, extent, dismissTravel, threshold, spring, onDismiss } = latest.current;
      const value = offset as DragValue;
      const config = spring ?? DEFAULT_DISMISS_SPRING;
      if (shouldDismiss({ offset: value.value, velocity, extent, threshold })) {
        const exitTo = dismissTravel != null && dismissTravel > extent ? dismissTravel : extent;
        value.animateTo(exitTo, config, velocity, (finished) => {
          if (finished) onDismiss();
        });
      } else {
        value.animateTo(0, config, velocity);
      }
    };

    const onCancel = (e: PointerEvent) => {
      if (e.pointerId !== pointerId) return;
      const wasActive = active;
      stopListening();
      if (!wasActive) return;
      const { offset, spring } = latest.current;
      (offset as DragValue).animateTo(0, spring ?? DEFAULT_DISMISS_SPRING);
    };

    node.addEventListener("pointerdown", onDown);
    return () => {
      node.removeEventListener("pointerdown", onDown);
      stopListening();
    };
  }, []);

  return React.useMemo(() => ({ enabled, attach }), [enabled, attach]);
}

/** px/s along the axis across the sampled window (0 with fewer than 2 samples). */
function releaseVelocity(samples: readonly Sample[]): number {
  if (samples.length < 2) return 0;
  const first = samples[0]!;
  const last = samples[samples.length - 1]!;
  const dt = last.t - first.t;
  return dt > 0 ? ((last.along - first.along) / dt) * 1000 : 0;
}

/** Eat the click a drag release produces (it would hit the scrim's tap-dismiss). */
function swallowNextClick(): void {
  const swallow = (e: MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    window.removeEventListener("click", swallow, true);
  };
  window.addEventListener("click", swallow, true);
  // No click follows a release outside the element that was pressed.
  setTimeout(() => window.removeEventListener("click", swallow, true), 0);
}
