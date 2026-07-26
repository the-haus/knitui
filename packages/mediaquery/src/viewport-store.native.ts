/**
 * Viewport-width store for {@link useBreakpoint} — native counterpart of
 * `viewport-store`. Same contract: ONE `Dimensions` subscription for the whole
 * app, and subscribers are woken only when the resolved breakpoint BAND changes,
 * so a fold/rotation that stays inside a band costs nothing.
 */
import { Dimensions } from "react-native";

import { resolveBreakpoint } from "./breakpoints";

let width = 0;
let band = resolveBreakpoint(0);
let wired = false;
const listeners = new Set<() => void>();

function set(next: number): void {
  if (next === width) return;
  width = next;
  const nextBand = resolveBreakpoint(next);
  if (nextBand === band) return; // same band — no subscriber can observe this
  band = nextBand;
  for (const listener of listeners) listener();
}

/** Attach the single `Dimensions` listener exactly once, on first read/subscribe. */
function wireOnce(): void {
  if (wired) return;
  wired = true;
  // Seeded lazily rather than at module eval so importing this file never depends
  // on `Dimensions` being ready.
  width = Dimensions.get("window").width;
  band = resolveBreakpoint(width);
  Dimensions.addEventListener("change", ({ window }) => set(window.width));
}

/** Current viewport width in px. Native always has a real value. */
export function getViewportWidth(): number {
  wireOnce();
  return width;
}

/** Subscribe to breakpoint-band changes. Returns an unsubscribe. */
export function subscribeViewportWidth(listener: () => void): () => void {
  wireOnce();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
