/**
 * A tiny typed event emitter — the reactive primitive shared by the media
 * controllers (`@knitui/media/audio`, `@knitui/media/video`) and anything else that needs a
 * dependency-free pub/sub. Pure — no platform deps, no React. Listeners are
 * stored per event type; `on` returns an unsubscribe fn.
 *
 * Lives in `@knitui/media`'s shared internals so the audio + video controllers
 * share ONE implementation; their `engine` barrels re-export it so existing
 * `../engine` imports keep working.
 */
export type Listener<T> = (payload: T) => void;

export class TypedEmitter<EventMap> {
  private readonly listeners = new Map<keyof EventMap, Set<Listener<never>>>();

  /** Subscribe to an event. Returns an unsubscribe function. */
  on<K extends keyof EventMap>(type: K, listener: Listener<EventMap[K]>): () => void {
    let set = this.listeners.get(type);
    if (!set) {
      set = new Set();
      this.listeners.set(type, set);
    }
    set.add(listener as Listener<never>);
    return () => this.off(type, listener);
  }

  /** Unsubscribe a previously registered listener. */
  off<K extends keyof EventMap>(type: K, listener: Listener<EventMap[K]>): void {
    this.listeners.get(type)?.delete(listener as Listener<never>);
  }

  /**
   * Whether anyone is currently listening for `type`. Lets a hot emitter skip
   * building a payload object when nothing would receive it (e.g. the per-frame
   * `timeUpdate` tick, which only matters when a consumer opted into it).
   */
  hasListeners<K extends keyof EventMap>(type: K): boolean {
    const set = this.listeners.get(type);
    return set !== undefined && set.size > 0;
  }

  /** Emit an event to all current listeners. A throwing listener never blocks others. */
  emit<K extends keyof EventMap>(type: K, payload: EventMap[K]): void {
    const set = this.listeners.get(type);
    if (!set) return;
    // Copy so a listener unsubscribing mid-emit doesn't disturb iteration.
    for (const listener of [...set]) {
      try {
        (listener as Listener<EventMap[K]>)(payload);
      } catch (error) {
        // One faulty subscriber must not stop the rest from being notified
        // (and the media state from staying consistent). Surface it for debug.
        console.error(`TypedEmitter: listener for "${String(type)}" threw`, error);
      }
    }
  }

  /** Drop every listener (called on dispose). */
  clear(): void {
    this.listeners.clear();
  }
}
