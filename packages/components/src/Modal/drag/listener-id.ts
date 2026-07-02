/**
 * A single monotonic id source for `SharedValue.addListener` across the whole
 * drag-dismiss subsystem.
 *
 * Reanimated keys listeners in a `Map` by their integer id, so two subscribers to
 * the SAME shared value MUST use distinct ids — otherwise the later `addListener`
 * silently overwrites the earlier one and that listener stops firing. The drag
 * host, the drag overlay, and `useDragDismiss` all subscribe to the same `offset`,
 * so they must draw ids from this shared counter rather than their own per-module
 * one (which would each restart at 0 and collide).
 */
let _nextId = 0;

/** Next globally-unique `addListener` id. */
export function nextListenerId(): number {
  return _nextId++;
}
