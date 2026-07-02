import { useSyncExternalStore } from "react";
import { Keyboard } from "react-native";

/**
 * On-screen keyboard tracking — native implementation.
 *
 * A module-level singleton fed by React Native's built-in `Keyboard` events,
 * readable *synchronously* from plain JS (not just React). This is what the
 * floating layer's `getViewport` needs (exclude the keyboard so a dropdown flips
 * above it) and what `useDismissOnScroll` needs (know *that* the keyboard
 * toggled). Both only care about the **settled** height, not the in-between
 * frames, so discrete events are the right (and cheap) tool.
 *
 * No native module setup is required — RN's `Keyboard` API works out of the box,
 * so there is no provider to mount at the app root.
 */

const isFiniteNumber = (n: unknown): n is number => typeof n === "number" && Number.isFinite(n);

let trackedHeight = 0;
let wired = false;
const listeners = new Set<() => void>();

function notify(): void {
  for (const listener of listeners) listener();
}

function setHeight(height: number): void {
  if (isFiniteNumber(height) && height !== trackedHeight) {
    trackedHeight = height;
    notify();
  }
}

/** Wire the keyboard listeners exactly once, on first read or subscribe. */
function wireOnce(): void {
  if (wired) return;
  wired = true;
  // `will*` lands the target height at animation start (iOS); `did*` confirms the
  // final resting height (and is all Android emits). Tracking both keeps the
  // singleton correct whether a consumer reacts early or only cares about the
  // settled value.
  Keyboard.addListener("keyboardWillShow", (e) => setHeight(e.endCoordinates.height));
  Keyboard.addListener("keyboardDidShow", (e) => setHeight(e.endCoordinates.height));
  Keyboard.addListener("keyboardWillHide", () => setHeight(0));
  Keyboard.addListener("keyboardDidHide", () => setHeight(0));
}

/** Current keyboard height in window points (0 when hidden). */
export function getKeyboardHeight(): number {
  wireOnce();
  // Prefer a synchronous read (covers "keyboard already up when the consumer
  // mounts", before our listener has fired). `metrics()` is null when the
  // keyboard is closed or its frame isn't known yet — fall back to the last
  // tracked height in that case.
  if (!Keyboard.isVisible()) return 0;
  const height = Keyboard.metrics()?.height;
  if (isFiniteNumber(height)) return height;
  return trackedHeight;
}

/**
 * Subscribe to keyboard height changes. The listener is called (with no args —
 * read the height via {@link getKeyboardHeight}) whenever the keyboard shows or
 * hides. Returns an unsubscribe.
 */
export function subscribeKeyboardHeight(listener: () => void): () => void {
  wireOnce();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** Reactive keyboard height for components, kept in sync via the shared tracker. */
export function useKeyboardHeight(): number {
  return useSyncExternalStore(subscribeKeyboardHeight, getKeyboardHeight, () => 0);
}
