/**
 * Factory for the headless `useAudioController` / `useVideoController` hooks. The
 * two hooks were byte-identical except the engine accessor, the descriptor
 * `configBag`, and one domain-specific sync effect — so the shared wiring lives
 * here once and each domain supplies only its three deltas.
 *
 * The wiring (identical across domains): `useId` → idempotent `register` →
 * `useMemo(getFacade)` → a memoized {@link MediaStore} bound to this player's id
 * → source-sync effect with a skip-first ref → loop / muted / volume / rate sync
 * effects → the domain extra-sync hook → autoplay-on-mount → unregister on
 * unmount.
 *
 * The hook returns the stable `controller` facade plus a `store` — it does NOT
 * subscribe to the snapshot itself, so the player ROOT never re-renders on a
 * per-frame `currentTime` tick. Each chrome leaf subscribes to just the slice it
 * reads via {@link useMediaSelector}, so only the time/scrubber components
 * re-render per tick instead of the whole subtree.
 *
 * T1 tier: T0 + React. No platform import, no Tamagui.
 */
import * as React from "react";

import type { MediaStore } from "./useMediaSelector";
import { useDeclarativeMediaSync, useSlotRegistration } from "./useMediaSlot";

/** The per-player facade surface the shared wiring drives. */
export interface MediaControllerFacade<Source> {
  replace(source: Source): void | Promise<void>;
  setLoop(loop: boolean): void;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
  play(): void;
}

/** The slice of the shared-engine session the wiring touches. */
export interface MediaSessionLike<Source, State> {
  register(id: string, descriptor: { source: Source; config: Record<string, unknown> }): void;
  subscribe(listener: () => void): () => void;
  snapshotFor(id: string): State;
  update(id: string, patch: { source?: Source; config?: Record<string, unknown> }): void;
  unregister(id: string): void;
  /**
   * OPTIONAL field-scoping surface — the real {@link MediaSession} provides all
   * three. When present, the per-player store binds each selector to just the
   * fields it reads (state-level isolation): `subscribeControllerKeys` for the
   * live field wakes on the active player, `subscribeStructural` for activation
   * flips, `isActive` to ignore field wakes while this player is inactive (the
   * shared controller is driving whichever player owns it). When absent (a test
   * fake), the store falls back to the coarse `subscribe`.
   */
  isActive?(id: string): boolean;
  subscribeStructural?(listener: () => void): () => void;
  subscribeControllerKeys?(keys: Iterable<PropertyKey>, listener: () => void): () => void;
}

/** The shared engine a domain's `useEngine()` returns. */
export interface MediaEngineLike<Source, State, Facade> {
  session: MediaSessionLike<Source, State>;
  getFacade(id: string): Facade;
}

/** Hook options every domain shares; each domain extends this with its own props. */
export interface MediaControllerHookOptionsBase<Source> {
  source: Source;
  id?: string;
  autoPlay?: boolean;
  loop?: boolean;
  muted?: boolean;
  volume?: number;
  playbackRate?: number;
}

/** What the per-domain extra-sync hook receives. */
export interface MediaControllerHookContext<Source, State, Facade, Options> {
  engine: MediaEngineLike<Source, State, Facade>;
  facade: Facade;
  id: string;
  options: Options;
}

export interface CreateMediaControllerHookConfig<Source, State, Facade, Options> {
  /** Read the shared engine from its provider. */
  useEngine: () => MediaEngineLike<Source, State, Facade>;
  /** Fold a player's declarative props into its registry descriptor's config bag. */
  configBag: (options: Options) => Record<string, unknown>;
  /**
   * The one domain-specific sync effect (audio: `setSamplingEnabled`; video:
   * `session.update({ surface })`). Named with a `use` prefix because it calls
   * hooks — it runs unconditionally inside the generated hook.
   */
  useExtraSync: (ctx: MediaControllerHookContext<Source, State, Facade, Options>) => void;
}

export interface MediaControllerHookResult<Facade, State> {
  /** The imperative + reactive controller. Stable across renders. */
  controller: Facade;
  /**
   * The external store for this player's snapshot. Stable across renders.
   * Components read slices of it with {@link useMediaSelector} so they only
   * re-render when the fields they read change — the root never re-renders on a
   * per-frame tick. (Read the full snapshot any time via `store.getSnapshot()`.)
   */
  store: MediaStore<State>;
}

/**
 * Builds a headless media-controller hook that joins the shared engine: it
 * registers a player slot (keyed by a stable id), mirrors the engine's snapshot
 * for that slot into React via `useSyncExternalStore`, and returns a per-player
 * facade.
 */
export function createMediaControllerHook<
  Source,
  State,
  Facade extends MediaControllerFacade<Source>,
  Options extends MediaControllerHookOptionsBase<Source>,
>(
  config: CreateMediaControllerHookConfig<Source, State, Facade, Options>,
): (options: Options) => MediaControllerHookResult<Facade, State> {
  const { useEngine, configBag, useExtraSync } = config;

  return function useMediaController(options: Options): MediaControllerHookResult<Facade, State> {
    const engine = useEngine();
    const reactId = React.useId();
    const id = options.id ?? reactId;

    const facade = React.useMemo(() => engine.getFacade(id), [engine, id]);

    // The per-player store: subscribe to the session, snapshot this id's slot.
    // Stable across renders (deps: engine, id), so the leaf selectors built on
    // it never re-subscribe.
    //
    // When the session exposes the field-scoping surface (the real MediaSession
    // does), the store also offers `subscribeKeys`, so a leaf's selector is bound
    // to just the fields it reads: a `currentTime` tick wakes the scrubber alone,
    // never the mute button — at the store level, not merely via a render bail.
    // `subscribeKeys` = live field wakes on THIS player when it's active
    // (`subscribeControllerKeys`, guarded by `isActive` so an inactive player
    // ignores the shared controller's ticks driven by whoever owns it) + a
    // structural wake on activation flips / idle-snapshot edits.
    const store = React.useMemo<MediaStore<State>>(() => {
      const { session } = engine;
      const base: MediaStore<State> = {
        subscribe: (listener) => session.subscribe(listener),
        getSnapshot: () => session.snapshotFor(id),
      };
      if (session.subscribeStructural && session.subscribeControllerKeys && session.isActive) {
        base.subscribeKeys = (keys, listener) => {
          // Call through `session.` (not destructured) to keep `this` bound.
          const offStructural = session.subscribeStructural!(listener);
          const offKeys = session.subscribeControllerKeys!(keys, () => {
            if (session.isActive!(id)) listener();
          });
          return () => {
            offStructural();
            offKeys();
          };
        };
      }
      return base;
    }, [engine, id]);

    // Register this player slot in the COMMIT phase (see useSlotRegistration).
    useSlotRegistration(engine.session, id, () => ({
      source: options.source,
      config: configBag(options),
    }));

    // Keep the source in sync (skip the first run — register set it).
    const firstSource = React.useRef(true);
    React.useEffect(() => {
      if (firstSource.current) {
        firstSource.current = false;
        return;
      }
      void facade.replace(options.source);
    }, [facade, options.source]);

    // Keep declarative props in sync (stored while inactive, applied live when active).
    useDeclarativeMediaSync(facade, {
      loop: options.loop,
      muted: options.muted,
      volume: options.volume,
      playbackRate: options.playbackRate,
    });

    // The one domain-specific sync effect.
    useExtraSync({ engine, facade, id, options });

    // Autoplay claims the shared engine on mount.
    React.useEffect(() => {
      if (options.autoPlay) facade.play();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [facade]);

    return { controller: facade, store };
  };
}
