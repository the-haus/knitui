/**
 * The {@link AudioPlaylistController} backed by the SHARED audio engine — a queue
 * layered on the ONE real `expo-audio` player, not a second player of its own.
 *
 * Every `<AudioPlaylist>` registers a slot in the same {@link
 * ../../session/media-session MediaSession} as every `<Audio>`, so there is only
 * ever one `<audio>` for the whole app: pressing play on a playlist activates its
 * slot — which pauses whatever else was playing — and advancing a track just
 * `replace()`s the shared player's source. This is why an `<Audio>` and an
 * `<AudioPlaylist>` are mutually exclusive automatically: they share the engine.
 *
 * The queue (sources / currentIndex / loop) is owned HERE; the playback fields
 * (playing / time / duration / volume / …) are MIRRORED from the slot's snapshot
 * via {@link mirror}, so the chrome reads one converged playlist snapshot. Every
 * granular event still fans out from {@link BaseAudioPlaylistController.deriveEvents}
 * on the snapshot diff — this controller only translates, never hand-emits.
 */
import type { AudioControllerState, AudioSource } from "../types";
import type { AudioController } from "./audio-controller-base";
import {
  type AudioPlaylistCapabilities,
  type AudioPlaylistController,
  type AudioPlaylistLoopMode,
  type AudioPlaylistTrack,
  BaseAudioPlaylistController,
} from "./playlist-controller-base";

const SESSION_PLAYLIST_CAPABILITIES: AudioPlaylistCapabilities = {
  canSetVolume: true,
  canSetPlaybackRate: true,
};

/** Display info for a queue entry, from any `AudioSource` shape. */
function trackOf(source: AudioSource): AudioPlaylistTrack {
  if (source == null || typeof source === "number") return { uri: null };
  if (typeof source === "string") return { uri: source };
  return { uri: source.uri ?? null, name: source.name };
}

export interface SessionPlaylistInit {
  sources?: AudioSource[];
  loop?: AudioPlaylistLoopMode;
}

export class SessionAudioPlaylistController
  extends BaseAudioPlaylistController
  implements AudioPlaylistController
{
  readonly capabilities = SESSION_PLAYLIST_CAPABILITIES;

  /** The shared-engine slot facade this playlist drives (one per `<AudioPlaylist>`). */
  private readonly player: AudioController;
  private sources: AudioSource[];
  private readonly offSnapshot: () => void;
  private readonly offEnd: () => void;
  private disposed = false;

  constructor(player: AudioController, init: SessionPlaylistInit = {}) {
    const sources = init.sources ?? [];
    super({
      tracks: sources.map(trackOf),
      trackCount: sources.length,
      currentIndex: 0,
      loop: init.loop ?? "none",
    });
    this.player = player;
    this.sources = sources;
    // Mirror the slot's playback fields into our snapshot. Coarse (fires on any
    // session change) but cheap: `mergeState` no-ops when nothing this playlist
    // reads actually moved, so an inactive playlist (stable idle snapshot) never
    // re-emits.
    this.offSnapshot = player.subscribe((s) => this.mirror(s));
    // Auto-advance when the shared player finishes the current track. The facade's
    // `on` only fires while THIS slot is active, so an inactive playlist is inert.
    this.offEnd = player.on("playToEnd", () => this.advanceOnEnd());
    this.mirror(player.state);
  }

  /**
   * Copy the slot's playback fields onto the playlist snapshot. Queue fields
   * (`tracks` / `currentIndex` / `loop`) are owned here and never touched. `ended`
   * is NOT mirrored: the slot ends per-TRACK, but the PLAYLIST ends only when the
   * last track finishes with no loop — decided in {@link advanceOnEnd}.
   */
  private mirror(s: AudioControllerState): void {
    if (this.disposed) return;
    this.setState({
      status: s.status,
      playing: s.playing,
      currentTime: s.currentTime,
      duration: s.duration,
      volume: s.volume,
      muted: s.muted,
      playbackRate: s.playbackRate,
      isBuffering: s.isBuffering,
      isLoaded: s.isLoaded,
      error: s.error,
    });
  }

  /** Point the shared player at track `index`; optionally start it playing. */
  private loadTrack(index: number, opts: { play: boolean }): void {
    this.setState({ currentIndex: index, ended: false });
    void this.player.replace(this.sources[index] ?? null);
    if (opts.play) this.player.play();
  }

  /** Called when the active slot reaches the end of the current track. */
  private advanceOnEnd(): void {
    if (this.sources.length === 0) return;
    const { currentIndex, loop } = this._state;
    if (loop === "single") {
      this.player.replay();
      return;
    }
    const lastIndex = this.sources.length - 1;
    if (currentIndex < lastIndex) {
      this.loadTrack(currentIndex + 1, { play: true });
    } else if (loop === "all") {
      this.loadTrack(0, { play: true });
    } else {
      // End of the queue with no loop — the playlist itself has ended.
      this.setState({ ended: true, playing: false });
    }
  }

  /* playback ---------------------------------------------------------------- */

  play(): void {
    if (this.sources.length === 0) return;
    // Just play. `play()` activates this slot (pausing any other audio through the
    // shared session), and the session's `activate()` already re-cues this slot's
    // descriptor source and restores its remembered position. Do NOT `replace()`
    // here: when the slot is already active and merely paused, replacing the same
    // source reloads it and resets `currentTime` to 0 — so resume-after-pause
    // would restart the track. Track switches go through `loadTrack`, which cues
    // the new source explicitly.
    this.player.play();
  }

  pause(): void {
    this.player.pause();
  }

  seekTo(seconds: number): void | Promise<void> {
    return this.player.seekTo(seconds);
  }

  /* navigation (preserve the current play/pause state across the move) ------- */

  next(): void {
    const lastIndex = this.sources.length - 1;
    if (this._state.currentIndex < lastIndex) {
      this.loadTrack(this._state.currentIndex + 1, { play: this._state.playing });
    } else if (this._state.loop === "all") {
      this.loadTrack(0, { play: this._state.playing });
    }
  }

  previous(): void {
    if (this._state.currentIndex > 0) {
      this.loadTrack(this._state.currentIndex - 1, { play: this._state.playing });
    } else if (this._state.loop === "all") {
      this.loadTrack(this.sources.length - 1, { play: this._state.playing });
    }
  }

  skipTo(index: number): void {
    if (index < 0 || index >= this.sources.length) return;
    this.loadTrack(index, { play: this._state.playing });
  }

  /* settable properties (delegated to the shared slot facade) ---------------- */

  setVolume(volume: number): void {
    this.player.setVolume(volume);
  }

  setMuted(muted: boolean): void {
    this.player.setMuted(muted);
  }

  setPlaybackRate(rate: number): void {
    this.player.setPlaybackRate(rate);
  }

  setLoop(loop: AudioPlaylistLoopMode): void {
    // Playlist-level loop is OWNED here (the slot's single-track loop stays off so
    // a track fires `playToEnd` and we can advance); just record it.
    this.setState({ loop });
  }

  /* queue management -------------------------------------------------------- */

  /**
   * Replace the whole queue (the hook calls this when the `sources` prop changes).
   * Keeps the current index in range and re-cues that track into the slot WITHOUT
   * auto-playing.
   */
  setSources(sources: AudioSource[]): void {
    this.sources = sources;
    const currentIndex =
      sources.length === 0 ? 0 : Math.min(this._state.currentIndex, sources.length - 1);
    this.setState({ tracks: sources.map(trackOf), trackCount: sources.length, currentIndex });
    void this.player.replace(sources[currentIndex] ?? null);
  }

  add(source: AudioSource): void {
    this.sources = [...this.sources, source];
    this.publishQueue();
  }

  insert(source: AudioSource, index: number): void {
    const clamped = Math.max(0, Math.min(index, this.sources.length));
    this.sources = [...this.sources.slice(0, clamped), source, ...this.sources.slice(clamped)];
    this.publishQueue();
  }

  remove(index: number): void {
    if (index < 0 || index >= this.sources.length) return;
    this.sources = [...this.sources.slice(0, index), ...this.sources.slice(index + 1)];
    this.publishQueue();
  }

  clear(): void {
    this.sources = [];
    this.setState({ tracks: [], trackCount: 0, currentIndex: 0 });
  }

  private publishQueue(): void {
    const currentIndex =
      this.sources.length === 0 ? 0 : Math.min(this._state.currentIndex, this.sources.length - 1);
    this.setState({
      tracks: this.sources.map(trackOf),
      trackCount: this.sources.length,
      currentIndex,
    });
  }

  override dispose(): void {
    this.disposed = true;
    this.offSnapshot();
    this.offEnd();
    super.dispose();
  }
}
