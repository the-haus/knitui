/**
 * Generic, domain-agnostic "shared media engine" core — used by BOTH the audio
 * and video packages so a single real controller (one `<audio>` / one `<video>`)
 * is shared across every player of that medium.
 *
 * A {@link MediaSession} owns ONE real controller plus a per-id registry of
 * lightweight player descriptors. Exactly one id is "active" and drives the real
 * controller; the rest are idle, remembering their last position. Pressing play
 * on another player calls {@link MediaSession.activate}, which swaps the engine's
 * source to that player and resumes from its remembered position.
 *
 * This file has NO React, NO DOM, NO domain types — the domain bits (how to build
 * an idle snapshot, how to re-apply config, lock-screen / fullscreen handoff) are
 * injected via {@link MediaSessionOptions}, so it is unit-testable with a fake
 * controller and shared verbatim by audio + video.
 */

import { booleanOr, type MediaSessionState, numberOr } from "../shared";

/** The common reactive/imperative surface both `AudioController` and `VideoController` satisfy. */
export interface FacadeController<S> {
  readonly state: S;
  readonly capabilities: unknown;
  subscribe(listener: (state: S) => void): () => void;
  // Permissive (`any`) on purpose — each domain's generic `on<K>` and typed
  // `replace`/`setPlaybackRate` are assignable to this structural constraint.
  // Real type-safety comes from each domain facade's `implements Audio/VideoController`.
  on(type: any, listener: (payload: any) => void): () => void;
  /**
   * OPTIONAL per-field subscription (every `@knitui/media` controller provides it
   * via `StatefulEmitter.subscribeKeys`). Lets the session forward field-scoped
   * wakes so a player's scrubber is bound to `currentTime` alone. Keys are the
   * field names the React selector tracked (always strings at runtime; typed
   * `PropertyKey` so any controller's `keyof State` set is assignable).
   */
  subscribeKeys?(keys: Iterable<PropertyKey>, listener: () => void): () => void;
  play(): void;
  pause(): void;
  replay(): void;
  seekTo(seconds: number): void | Promise<void>;
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  setPlaybackRate(rate: number, pitchCorrection?: any): void;
  setLoop(loop: boolean): void;
  replace(source: any): void | Promise<void>;
  retry(): void | Promise<void>;
  dispose(): void;
}

/**
 * The state shape the session core reads. Aliased to the shared
 * {@link BaseMediaState} so the session bound and the domain controller states
 * are defined from one source — both domain states satisfy it, and the session
 * only ever reads the common fields.
 */
export type { MediaSessionState };

/** One registered player slot. `config` carries the domain's declarative props. */
export interface MediaDescriptor<Src> {
  source: Src;
  config: Record<string, unknown>;
  /** Where playback was when this player last lost focus (resume point). */
  lastPosition: number;
  /** The duration known when it last lost focus (so the idle bar isn't empty). */
  lastDuration: number;
}

/** A partial descriptor update; `config` is shallow-merged. */
export interface MediaDescriptorPatch<Src> {
  source?: Src;
  config?: Record<string, unknown>;
  lastPosition?: number;
  lastDuration?: number;
}

/** The base playback fields the common settable properties cover. */
interface CommonSettable {
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  setLoop(loop: boolean): void;
  setPlaybackRate(rate: number): void;
}

/**
 * The idle-snapshot fields every domain seeds the same way from a descriptor
 * (resume point + last-known declarative config). Each domain's `createIdleState`
 * spreads this and adds its own fields, so the shared seeding lives in one place.
 */
export function commonIdleFields<Src>(
  d: MediaDescriptor<Src>,
): Pick<
  MediaSessionState,
  "currentTime" | "duration" | "volume" | "muted" | "loop" | "playbackRate"
> {
  return {
    currentTime: d.lastPosition,
    duration: d.lastDuration,
    volume: numberOr(d.config.volume, 1),
    muted: booleanOr(d.config.muted, false),
    loop: booleanOr(d.config.loop, false),
    playbackRate: numberOr(d.config.playbackRate, 1),
  };
}

/**
 * Re-apply the declarative config fields common to every media controller
 * (volume / muted / loop / playbackRate) on activation. Domains call this, then
 * apply their own extras (audio: sampling).
 */
export function applyCommonConfig<Src>(c: CommonSettable, d: MediaDescriptor<Src>): void {
  if (typeof d.config.volume === "number") c.setVolume(d.config.volume);
  if (typeof d.config.muted === "boolean") c.setMuted(d.config.muted);
  if (typeof d.config.loop === "boolean") c.setLoop(d.config.loop);
  if (typeof d.config.playbackRate === "number") c.setPlaybackRate(d.config.playbackRate);
}

export interface MediaSessionOptions<
  C extends FacadeController<S>,
  S extends MediaSessionState,
  Src,
> {
  /** The ONE real controller this session drives. */
  controller: C;
  /** Build the idle snapshot shown by an inactive player (seeded from its descriptor). */
  createIdleState: (descriptor: MediaDescriptor<Src>) => S;
  /** Re-apply a player's declarative config to the real controller on activation. */
  applyConfig?: (controller: C, descriptor: MediaDescriptor<Src>) => void;
  /** Domain hook fired after a player becomes active (lock-screen / fullscreen target). */
  onActivate?: (controller: C, descriptor: MediaDescriptor<Src>) => void;
  /** Domain hook fired before a player loses focus (clear lock-screen, exit fullscreen/PiP). */
  onDeactivate?: (controller: C, descriptor: MediaDescriptor<Src>) => void;
}

export class MediaSession<C extends FacadeController<S>, S extends MediaSessionState, Src> {
  readonly controller: C;
  private readonly opts: MediaSessionOptions<C, S, Src>;
  private readonly registry = new Map<string, MediaDescriptor<Src>>();
  /** Per-id idle snapshot cache — same ref until the descriptor changes (useSyncExternalStore guard). */
  private readonly idleCache = new Map<string, S>();
  private readonly listeners = new Set<() => void>();
  /**
   * STRUCTURAL listeners — woken only on activation flips and descriptor edits
   * (activate / update / unregister), NEVER on a per-frame controller tick. The
   * per-player field-scoped stores subscribe here for the rare "the active player
   * changed, or my idle snapshot was edited — re-read" signal, so they aren't
   * dragged into the 60 Hz coarse `change` fan-out that `listeners` carries.
   */
  private readonly structuralListeners = new Set<() => void>();
  private _activeId: string | null = null;
  private readonly unsubscribeController: () => void;

  constructor(opts: MediaSessionOptions<C, S, Src>) {
    this.opts = opts;
    this.controller = opts.controller;
    // Every real-controller change fans out to our subscribers (the active player re-renders).
    this.unsubscribeController = opts.controller.subscribe(() => this.emit());
  }

  get activeId(): string | null {
    return this._activeId;
  }

  isActive(id: string): boolean {
    return this._activeId === id;
  }

  /** The declarative config bag a player registered (used by the provider's surface). */
  getConfig(id: string): Record<string, unknown> | undefined {
    return this.registry.get(id)?.config;
  }

  /** Register a player slot (idempotent — re-registering the same id keeps its remembered state). */
  register(id: string, init: { source: Src; config?: Record<string, unknown> }): void {
    if (this.registry.has(id)) return;
    this.registry.set(id, {
      source: init.source,
      config: { ...init.config },
      lastPosition: 0,
      lastDuration: 0,
    });
    this.idleCache.delete(id);
    // The first player to register while nothing owns the engine becomes active
    // (paused) — so a lone player (or the first of several) is immediately live
    // instead of idle, and pressing play on another switches to it.
    if (this._activeId === null) this.activate(id);
  }

  /** Patch a player's descriptor. If it's the active player, source/config changes apply live. */
  update(id: string, patch: MediaDescriptorPatch<Src>): void {
    const desc = this.registry.get(id);
    if (!desc) return;
    if (patch.source !== undefined) desc.source = patch.source;
    if (patch.config) desc.config = { ...desc.config, ...patch.config };
    if (patch.lastPosition !== undefined) desc.lastPosition = patch.lastPosition;
    if (patch.lastDuration !== undefined) desc.lastDuration = patch.lastDuration;
    this.idleCache.delete(id);
    // Notify either way: an inactive player re-renders its idle snapshot, and the
    // video provider re-reads the active player's surface config.
    this.emit();
    this.emitStructural();
  }

  /** Drop a player slot. Never disposes the engine (that's the provider's job). */
  unregister(id: string): void {
    const desc = this.registry.get(id);
    this.registry.delete(id);
    this.idleCache.delete(id);
    if (this._activeId === id) {
      // The active player is going away — STOP the shared controller so its
      // playback doesn't outlive the component that owned it. Without this, the
      // shared `<audio>`/`<video>` keeps playing after the owning player unmounts;
      // and in React StrictMode (dev), the mount→unmount→remount cycle would
      // otherwise leave the first autoplay's stream running while the remount
      // starts a SECOND one on top of it — the "plays double on mount" symptom.
      if (desc) this.opts.onDeactivate?.(this.controller, desc);
      this.controller.pause();
      this._activeId = null;
      this.emit();
      this.emitStructural();
    }
  }

  /**
   * Make `id` the active player: capture the outgoing player's position, swap the
   * engine to this player's source, re-apply its config, and resume from where it
   * left off. No-op if `id` is already active or not registered.
   */
  activate(id: string): void {
    if (this._activeId === id) return;
    const next = this.registry.get(id);
    if (!next) return;

    const prevId = this._activeId;
    if (prevId != null) {
      const prev = this.registry.get(prevId);
      if (prev) {
        prev.lastPosition = this.controller.state.currentTime;
        prev.lastDuration = this.controller.state.duration;
        this.idleCache.delete(prevId);
        this.opts.onDeactivate?.(this.controller, prev);
      }
      this.controller.pause();
    }

    this._activeId = id;
    this.idleCache.delete(id);
    void this.controller.replace(next.source);
    this.opts.applyConfig?.(this.controller, next);
    this.opts.onActivate?.(this.controller, next);
    if (next.lastPosition > 0) void this.controller.seekTo(next.lastPosition);
    this.emit();
    this.emitStructural();
  }

  /** The state a given player should display: live when active, else a memoized idle snapshot. */
  snapshotFor(id: string): S {
    if (this._activeId === id) return this.controller.state;
    const cached = this.idleCache.get(id);
    if (cached) return cached;
    const desc =
      this.registry.get(id) ??
      ({
        source: undefined as Src,
        config: {},
        lastPosition: 0,
        lastDuration: 0,
      } satisfies MediaDescriptor<Src>);
    const snapshot = this.opts.createIdleState(desc);
    this.idleCache.set(id, snapshot);
    return snapshot;
  }

  /** Subscribe to any change (active-player state OR active-id flips). */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Subscribe to STRUCTURAL changes only — activation flips and descriptor edits,
   * never a per-frame controller tick. The per-player field-scoped store pairs
   * this (the "active player changed / my idle snapshot was edited" wake) with
   * {@link subscribeControllerKeys} (the live field wakes) so a player re-reads on
   * activation but isn't dragged into every 60 Hz tick.
   */
  subscribeStructural(listener: () => void): () => void {
    this.structuralListeners.add(listener);
    return () => {
      this.structuralListeners.delete(listener);
    };
  }

  /**
   * Field-scoped subscription to the ONE shared real controller: the listener
   * fires when any of `keys` changes on the active controller. Forwards to the
   * controller's per-field channels when available (it always is for our
   * controllers), else degrades to its coarse `subscribe`. The caller is
   * responsible for ignoring wakes while its player is inactive (the active
   * controller drives whichever player currently owns it) — see the hook store.
   */
  subscribeControllerKeys(keys: Iterable<PropertyKey>, listener: () => void): () => void {
    const c = this.controller;
    return c.subscribeKeys ? c.subscribeKeys(keys, listener) : c.subscribe(() => listener());
  }

  dispose(): void {
    this.unsubscribeController();
    this.listeners.clear();
    this.registry.clear();
    this.idleCache.clear();
    this._activeId = null;
    this.controller.dispose();
  }

  private emit(): void {
    for (const listener of [...this.listeners]) listener();
  }

  private emitStructural(): void {
    for (const listener of [...this.structuralListeners]) listener();
  }
}
