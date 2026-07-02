/**
 * The lowest shared layer of every `@knitui/media` controller: an immutable state
 * snapshot behind a typed emitter, with a `setState` that merges-and-fans-out on
 * the fixed `"change"` channel. It is deliberately domain-blind — it knows
 * nothing about playback, recording, or media at all — so the player controller
 * base ({@link ./media-controller-base BaseMediaController}), the playlist controller
 * base, and the recorder controller base can ALL extend it instead of each
 * re-implementing the identical store mechanics (the three had byte-identical
 * `emitter` / `_state` / `subscribe` / `on` / `setState` / `emitEvent` / `dispose`
 * bodies before this was hoisted).
 *
 * ## Per-field channels (state-level isolation)
 *
 * On top of the coarse `"change"` event (which fires on EVERY transition), the
 * store also keeps a per-field listener registry and a {@link subscribeKeys}
 * method. `setState` notifies ONLY the listeners of the fields that actually
 * moved — so a 60 Hz `currentTime` tick reaches the scrubber's subscription and
 * literally never the volume button's, AT THE STORE LEVEL (not merely the React
 * render level). This is purely additive: the single immutable snapshot, its
 * `===` identity, the coarse `"change"` event, and {@link deriveEvents} are all
 * unchanged, so the shared-engine session and every existing subscriber keep
 * working. {@link ./react/useMediaSelector} auto-tracks which fields a selector
 * reads and binds to exactly those channels.
 *
 * T1 tier: depends only on T0 (`../shared`). No platform, no React.
 */
import { type Listener, mergeState, TypedEmitter } from "../shared";

/**
 * The one structural requirement for an event map used here: a full-snapshot
 * `change` event carrying the current `State`. Every media event map satisfies it.
 */
export interface ChangeEventMap<State> {
  change: State;
}

/**
 * Owns the state store + emitter and exposes `setState` / `emitEvent` to
 * subclasses, which call them from their platform event handlers.
 *
 * The one type seam is the fixed `"change"` channel: `Events extends
 * ChangeEventMap<State>` guarantees a `change: State` event, but TypeScript
 * cannot narrow the generic `Events[keyof Events]` back to `State`, so the two
 * `"change"` accesses carry a localized cast. It never leaks to subclasses, whose
 * `on` / `subscribe` stay fully typed.
 */
export abstract class StatefulEmitter<State extends object, Events extends ChangeEventMap<State>> {
  protected readonly emitter = new TypedEmitter<Events>();
  protected _state: State;
  /**
   * Per-field listener registry — the state-level isolation channel. A listener
   * registered for `volume` is notified only when `volume` actually changes, not
   * on every snapshot. Lazily populated (no entry until something subscribes to
   * that field), so a store nobody field-subscribes to pays nothing.
   */
  private readonly fieldListeners = new Map<keyof State, Set<() => void>>();

  protected constructor(initial: State) {
    this._state = initial;
  }

  /** The live, immutable state snapshot. Replaced (never mutated) on change. */
  get state(): State {
    return this._state;
  }

  /** Subscribe to the full-snapshot `change` event. Returns an unsubscribe fn. */
  subscribe(listener: (state: State) => void): () => void {
    return this.emitter.on("change" as keyof Events, listener as Listener<Events[keyof Events]>);
  }

  /** Subscribe to a granular typed event. Returns an unsubscribe fn. */
  on<K extends keyof Events>(type: K, listener: (payload: Events[K]) => void): () => void {
    return this.emitter.on(type, listener);
  }

  /**
   * Subscribe to a SET of state fields: the listener fires whenever ANY of
   * `keys` changes value (and only then). This is the state-level isolation
   * primitive — a component that reads only `currentTime` subscribes to just
   * `["currentTime"]` and is never woken by a `volume` write. Returns an
   * unsubscribe fn that drops the listener from every key it was registered on.
   * The listener takes no argument: it's a "one of your fields moved, re-read the
   * snapshot" signal (the same shape `useSyncExternalStore` wants).
   */
  subscribeKeys(keys: Iterable<keyof State>, listener: () => void): () => void {
    const keyList = [...keys];
    for (const key of keyList) {
      let set = this.fieldListeners.get(key);
      if (!set) {
        set = new Set();
        this.fieldListeners.set(key, set);
      }
      set.add(listener);
    }
    return () => {
      for (const key of keyList) {
        const set = this.fieldListeners.get(key);
        if (!set) continue;
        set.delete(listener);
        if (set.size === 0) this.fieldListeners.delete(key);
      }
    };
  }

  /**
   * Merge a patch into the snapshot. When something actually changed, it fans the
   * transition out on THREE channels, all from ONE place: (1) the coarse `change`
   * event with the fresh snapshot (back-compat — the session + global now-playing
   * read this); (2) the per-field channels, notifying only the listeners of the
   * fields that actually moved ({@link notifyFields} — the state-level isolation);
   * (3) {@link deriveEvents}, fanning out the granular typed events implied by the
   * transition. Returns whether the snapshot actually changed, so callers can
   * chain side effects on a real transition.
   */
  protected setState(patch: Partial<State>): boolean {
    const prev = this._state;
    const next = mergeState(prev, patch);
    if (next === prev) return false;
    this._state = next;
    this.emitter.emit("change" as keyof Events, next as Events[keyof Events]);
    this.notifyFields(prev, next, patch);
    this.deriveEvents(prev, next);
    return true;
  }

  /**
   * Notify the per-field listeners for every field the patch actually moved.
   * Only patched keys can differ (the merge spreads the patch over the previous
   * snapshot), so iterating the patch and comparing `next[k] !== prev[k]` is both
   * complete and cheap. A throwing field listener never blocks the others (it
   * would otherwise leave some subscribers stale). No-op when nothing is
   * field-subscribed.
   */
  private notifyFields(prev: State, next: State, patch: Partial<State>): void {
    if (this.fieldListeners.size === 0) return;
    // Collect the affected listeners across every changed field FIRST, deduped, so
    // a listener registered for several fields (e.g. a `{ volume, muted }`
    // selector) fires exactly once even when one `setState` moves more than one of
    // them — not once per changed key.
    let toNotify: Set<() => void> | null = null;
    for (const key in patch) {
      const k = key as keyof State;
      if (next[k] === prev[k]) continue;
      const set = this.fieldListeners.get(k);
      if (!set || set.size === 0) continue;
      toNotify ??= new Set();
      for (const listener of set) toNotify.add(listener);
    }
    if (toNotify === null) return;
    for (const listener of toNotify) {
      try {
        listener();
      } catch (error) {
        console.error("StatefulEmitter: field listener threw", error);
      }
    }
  }

  /**
   * Fan out the granular typed events implied by a real state transition. Called
   * once per actual change, AFTER `change`. The default is a no-op; each
   * controller base overrides it to map field diffs onto events in ONE place, so
   * adapters only translate their backend's events into `setState` and never
   * hand-emit. (Hand-emitting previously double-fired `statusChange` — the base
   * emitted it AND every adapter re-emitted it — and let the audio / video /
   * recorder adapters derive the same events three different, drifting ways.)
   * Override and call `super.deriveEvents(prev, next)` first to keep the inherited
   * derivations.
   */
  protected deriveEvents(_prev: State, _next: State): void {}

  /** Convenience for subclasses: emit a granular event. */
  protected emitEvent<K extends keyof Events>(type: K, payload: Events[K]): void {
    this.emitter.emit(type, payload);
  }

  /** Whether anyone is listening for `type` — gate hot per-frame emissions on it. */
  protected hasListeners<K extends keyof Events>(type: K): boolean {
    return this.emitter.hasListeners(type);
  }

  /** Release the emitter and drop all listeners (coarse, granular, and per-field). */
  dispose(): void {
    this.emitter.clear();
    this.fieldListeners.clear();
  }
}
