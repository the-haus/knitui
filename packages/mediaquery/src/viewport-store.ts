/**
 * Viewport-width store for {@link useBreakpoint} (web) — the `.native` sibling
 * reads React Native's `Dimensions`.
 *
 * Why `mediaquery` owns this rather than reusing `@knitui/hooks`'
 * `useViewportSize`: that hook's `onResize` does `setSize({ width, height })` on
 * an UNTHROTTLED `resize` listener, so a window drag (~60 events/s) allocates a
 * new object and re-renders every subscriber ~60×/s. `useBreakpoint` derives a
 * `BreakpointKey` — one of only 8 values across 7 thresholds — so almost all of
 * those renders produce an identical result, and because the derivation happens
 * AFTER the render is already forced, it cannot bail.
 *
 * The store fixes that at two levels:
 *  - it notifies subscribers ONLY when the resolved band changes, so a drag
 *    within a band wakes nobody at all;
 *  - `useBreakpoint`'s `getSnapshot` returns the band STRING, so even a genuine
 *    notification lets React bail per-component unless that component's band
 *    actually moved (it can differ from the store's when a provider seed is in
 *    play).
 *
 * `useViewportSize` itself is left alone — it lives in `@knitui/hooks` and has
 * other consumers that legitimately want the pixel width.
 */
import { resolveBreakpoint } from "./breakpoints";

let width = 0;
let band = resolveBreakpoint(0);
let wired = false;
const listeners = new Set<() => void>();

const canUseDom = (): boolean => typeof window !== "undefined";

function read(): void {
  const next = window.innerWidth;
  if (next === width) return;
  width = next;
  const nextBand = resolveBreakpoint(next);
  if (nextBand === band) return; // same band — no subscriber can observe this
  band = nextBand;
  for (const listener of listeners) listener();
}

/** Attach the single resize listener exactly once, on first read or subscribe. */
function wireOnce(): void {
  if (wired || !canUseDom()) return;
  wired = true;
  read();
  window.addEventListener("resize", read);
  window.addEventListener("orientationchange", read);
  // Never detached: one listener owned by the module, not by any component.
}

/** Current viewport width in px (`0` before the DOM is available). */
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
