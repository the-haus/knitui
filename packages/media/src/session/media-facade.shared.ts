/**
 * Generic per-player FACADE base over a {@link MediaSession}. Each `<Audio>` /
 * `<Video>` gets one; it implements the common controller surface by delegating:
 *
 *  - reads (`state`, `capabilities`) → the session's snapshot for this id,
 *  - play-intent (`play` / `togglePlay`→play / `replay` / `retry`) → activate this
 *    player first, then drive the real controller,
 *  - writes while INACTIVE (`seekTo`, `setVolume`, `setMuted`, `setLoop`,
 *    `setPlaybackRate`, `replace`) → stored on the descriptor so they take effect
 *    on next activation; while ACTIVE → delegated straight through,
 *  - `dispose()` → unregister the slot (NEVER disposes the shared engine).
 *
 * Domain subclasses (`AudioControllerFacade`, `VideoControllerFacade`) extend this
 * and add their exclusive methods (lock-screen / sampling vs fullscreen / PiP /
 * tracks), then declare `implements AudioController` / `VideoController` so the
 * existing chrome keeps programming against ONE unchanged contract.
 */
import type { FacadeController, MediaSession, MediaSessionState } from "./media-session.shared";

export abstract class MediaFacadeBase<
  C extends FacadeController<S>,
  S extends MediaSessionState,
  Src,
> {
  constructor(
    protected readonly session: MediaSession<C, S, Src>,
    protected readonly id: string,
  ) {}

  /** The real (shared) controller. */
  protected get rc(): C {
    return this.session.controller;
  }

  /** Whether this player currently owns the shared engine. */
  protected get active(): boolean {
    return this.session.isActive(this.id);
  }

  get state(): S {
    return this.session.snapshotFor(this.id);
  }

  get capabilities(): C["capabilities"] {
    return this.rc.capabilities;
  }

  subscribe(listener: (state: S) => void): () => void {
    return this.session.subscribe(() => listener(this.session.snapshotFor(this.id)));
  }

  on(type: any, listener: (payload: any) => void): () => void {
    // Granular events only reach a player while it owns the engine.
    return this.rc.on(type, (payload: unknown) => {
      if (this.active) listener(payload);
    });
  }

  /* playback (play-intent activates this player first) -------------------------- */

  play(): void {
    this.session.activate(this.id);
    this.rc.play();
  }

  pause(): void {
    if (this.active) this.rc.pause();
  }

  togglePlay(): void {
    if (this.active && this.state.playing) this.rc.pause();
    else this.play();
  }

  replay(): void {
    this.session.activate(this.id);
    this.rc.replay();
  }

  retry(): void | Promise<void> {
    this.session.activate(this.id);
    return this.rc.retry();
  }

  seekTo(seconds: number): void | Promise<void> {
    if (this.active) return this.rc.seekTo(seconds);
    // Inactive: just move the resume point (reflected by the idle snapshot).
    this.session.update(this.id, { lastPosition: seconds });
    return undefined;
  }

  seekBy(seconds: number): void | Promise<void> {
    return this.seekTo(this.state.currentTime + seconds);
  }

  /* settable properties (stored on the descriptor while inactive) -------------- */

  setVolume(volume: number): void {
    if (this.active) this.rc.setVolume(volume);
    else this.session.update(this.id, { config: { volume } });
  }

  setMuted(muted: boolean): void {
    if (this.active) this.rc.setMuted(muted);
    else this.session.update(this.id, { config: { muted } });
  }

  toggleMuted(): void {
    this.setMuted(!this.state.muted);
  }

  setPlaybackRate(rate: number, pitchCorrection?: unknown): void {
    if (this.active) this.rc.setPlaybackRate(rate, pitchCorrection);
    else this.session.update(this.id, { config: { playbackRate: rate } });
  }

  setLoop(loop: boolean): void {
    if (this.active) this.rc.setLoop(loop);
    else this.session.update(this.id, { config: { loop } });
  }

  replace(source: Src): void | Promise<void> {
    this.session.update(this.id, { source });
    if (this.active) return this.rc.replace(source);
    return undefined;
  }

  dispose(): void {
    this.session.unregister(this.id);
  }
}
