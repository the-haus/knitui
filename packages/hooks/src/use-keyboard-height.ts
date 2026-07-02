/**
 * On-screen keyboard tracking — web stub.
 *
 * Web has no software keyboard that overlaps layout the way native does, so every
 * export here is a zero / no-op. The real tracking lives in the `.native` sibling.
 * Keeping a cross-platform module (rather than a native-only one) lets callers —
 * including non-React code like the floating positioning layer — call
 * `getKeyboardHeight()` / `subscribeKeyboardHeight()` on any platform without a
 * `Platform.OS` guard.
 */

/** Current keyboard height in viewport points. Always `0` on web. */
export function getKeyboardHeight(): number {
  return 0;
}

/**
 * Subscribe to keyboard height changes. No-op on web (the keyboard never moves
 * layout), so the listener is never called; returns an unsubscribe for symmetry.
 */
export function subscribeKeyboardHeight(_listener: (height: number) => void): () => void {
  return () => {};
}

/** Reactive keyboard height for components. Always `0` on web. */
export function useKeyboardHeight(): number {
  return 0;
}
