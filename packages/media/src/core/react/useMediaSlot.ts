/**
 * The shared-engine slot mechanics common to every media-controller hook —
 * `useAudioController` / `useVideoController` (via {@link createMediaControllerHook})
 * AND `useAudioPlaylistController`. They all register a player slot in the COMMIT
 * phase and keep the same four declarative props in sync; only what they wrap (a
 * facade vs. a queue controller) and how they sync the source (`replace` vs.
 * `setSources`) differ, so those stay in each hook and the common mechanics live
 * here once.
 *
 * T1 tier: T0 + React. No platform import, no Tamagui.
 */
import * as React from "react";

/** The session surface {@link useSlotRegistration} drives. */
export interface SlotRegistrar<Src> {
  register(id: string, init: { source: Src; config: Record<string, unknown> }): void;
  unregister(id: string): void;
}

/**
 * Register a player slot in the COMMIT phase — NOT during render. Register
 * auto-activates the first player and emits to other subscribers (e.g.
 * `<MediaProvider>`'s `useSyncExternalStore`); doing that during render would
 * update subscribers mid-render, which React forbids. `buildInit` is read through
 * a ref so the effect runs only on mount / id change yet still sees the latest
 * props; the cleanup drops the slot (never disposes the shared engine).
 */
export function useSlotRegistration<Src>(
  session: SlotRegistrar<Src>,
  id: string,
  buildInit: () => { source: Src; config: Record<string, unknown> },
): void {
  const buildRef = React.useRef(buildInit);
  buildRef.current = buildInit;
  React.useEffect(() => {
    session.register(id, buildRef.current());
    return () => session.unregister(id);
  }, [session, id]);
}

/** The settable surface {@link useDeclarativeMediaSync} drives. */
export interface DeclarativeSyncTarget<Loop> {
  setLoop(loop: Loop): void;
  setMuted(muted: boolean): void;
  setVolume(volume: number): void;
  setPlaybackRate(rate: number): void;
}

/**
 * Keep a controller/facade's loop / muted / volume / playbackRate in sync with the
 * declarative props — each applied only when provided (stored while inactive,
 * applied live when active; the facade handles that distinction). `Loop` is
 * generic so the player (a `boolean`) and the playlist (a loop mode) share this.
 */
export function useDeclarativeMediaSync<Loop>(
  target: DeclarativeSyncTarget<Loop>,
  props: { loop?: Loop; muted?: boolean; volume?: number; playbackRate?: number },
): void {
  React.useEffect(() => {
    if (props.loop != null) target.setLoop(props.loop);
  }, [target, props.loop]);
  React.useEffect(() => {
    if (props.muted != null) target.setMuted(props.muted);
  }, [target, props.muted]);
  React.useEffect(() => {
    if (props.volume != null) target.setVolume(props.volume);
  }, [target, props.volume]);
  React.useEffect(() => {
    if (props.playbackRate != null) target.setPlaybackRate(props.playbackRate);
  }, [target, props.playbackRate]);
}
