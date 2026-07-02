/**
 * The provider-agnostic playlist controller contract. Mirrors the single-track
 * {@link ./audio-controller-base} design: the {@link ./session-playlist-controller}
 * backend drives the SHARED audio engine (a queue over the one real player, so a
 * playlist and a plain `<Audio>` are mutually exclusive), and the hook, context
 * and chrome program against ONE API regardless of platform.
 *
 * `BaseAudioPlaylistController` is a thin specialization of the generic
 * {@link ../../core/stateful-emitter StatefulEmitter}: it inherits the immutable
 * state snapshot, the typed emitter, subscription, `setState`, `emitEvent` and the
 * per-field channels, and adds only the playlist deltas (the queue/navigation
 * surface + the playback conveniences). Like the player and recorder bases, it
 * centralizes EVERY granular event in {@link BaseAudioPlaylistController.deriveEvents}
 * — fanning out `statusChange` / `playingChange` / `trackChange` / `volumeChange`
 * / `durationChange` / `timeUpdate` / `playToEnd` / `error` from the snapshot diff
 * in ONE place — so the concrete adapter only translates backend events into
 * `setState` and never hand-emits (which previously double-derived and left half
 * the event map declared-but-never-fired). Concrete adapters extend it.
 */
import { StatefulEmitter } from "../../core/stateful-emitter";
import type { AudioError, AudioSource } from "../types";

/** Playlist loop behaviour, matching expo-audio. */
export type AudioPlaylistLoopMode = "none" | "single" | "all";

/** A track entry in the playlist (display info). */
export interface AudioPlaylistTrack {
  uri: string | null;
  name?: string;
}

/** What the active playlist backend can do — read by the chrome. */
export interface AudioPlaylistCapabilities {
  canSetVolume: boolean;
  canSetPlaybackRate: boolean;
}

/** An immutable snapshot of the playlist + current-track state. */
export interface AudioPlaylistState {
  status: "idle" | "loading" | "readyToPlay" | "error";
  currentIndex: number;
  trackCount: number;
  tracks: AudioPlaylistTrack[];
  playing: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  playbackRate: number;
  loop: AudioPlaylistLoopMode;
  isBuffering: boolean;
  isLoaded: boolean;
  ended: boolean;
  error: AudioError | null;
}

/** Typed event payloads emitted by a playlist controller. */
export interface AudioPlaylistEventMap {
  change: AudioPlaylistState;
  statusChange: { status: AudioPlaylistState["status"]; error: AudioError | null };
  playingChange: { playing: boolean };
  timeUpdate: { currentTime: number; duration: number };
  trackChange: { previousIndex: number; currentIndex: number };
  volumeChange: { volume: number; muted: boolean };
  durationChange: { duration: number };
  playToEnd: void;
  error: AudioError;
}

export type AudioPlaylistEventType = keyof AudioPlaylistEventMap;

/** The imperative + reactive API shared by every playlist backend. */
export interface AudioPlaylistController {
  readonly state: AudioPlaylistState;
  readonly capabilities: AudioPlaylistCapabilities;

  subscribe(listener: (state: AudioPlaylistState) => void): () => void;
  on<K extends AudioPlaylistEventType>(
    type: K,
    listener: (payload: AudioPlaylistEventMap[K]) => void,
  ): () => void;

  /* playback */
  play(): void;
  pause(): void;
  togglePlay(): void;
  seekTo(seconds: number): void | Promise<void>;
  seekBy(seconds: number): void | Promise<void>;

  /* navigation */
  next(): void;
  previous(): void;
  skipTo(index: number): void;

  /* settable properties */
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  toggleMuted(): void;
  setPlaybackRate(rate: number): void;
  setLoop(loop: AudioPlaylistLoopMode): void;

  /* queue management */
  add(source: AudioSource): void;
  insert(source: AudioSource, index: number): void;
  remove(index: number): void;
  clear(): void;

  dispose(): void;
}

/**
 * Shared base: inherits the state store + emitter from {@link StatefulEmitter}
 * and adds only the playlist's playback conveniences + abstract queue surface.
 */
export abstract class BaseAudioPlaylistController
  extends StatefulEmitter<AudioPlaylistState, AudioPlaylistEventMap>
  implements AudioPlaylistController
{
  abstract readonly capabilities: AudioPlaylistCapabilities;

  constructor(initial?: Partial<AudioPlaylistState>) {
    super({
      status: "idle",
      currentIndex: 0,
      trackCount: 0,
      tracks: [],
      playing: false,
      currentTime: 0,
      duration: 0,
      volume: 1,
      muted: false,
      playbackRate: 1,
      loop: "none",
      isBuffering: false,
      isLoaded: false,
      ended: false,
      error: null,
      ...initial,
    });
  }

  /**
   * Fan out the granular playlist events from a real state transition — the
   * single derivation point, mirroring {@link ../../core/media-controller-base
   * BaseMediaController.deriveEvents}. `trackChange` derives from the
   * `currentIndex` diff (so it fires once whether the move arrived via the
   * `trackChanged` or the `playlistStatusUpdate` backend event); `timeUpdate` is
   * the hot per-tick event, gated on having a listener.
   */
  protected override deriveEvents(prev: AudioPlaylistState, next: AudioPlaylistState): void {
    if (next.status !== prev.status) {
      this.emitEvent("statusChange", { status: next.status, error: next.error });
    }
    if (next.playing !== prev.playing) {
      this.emitEvent("playingChange", { playing: next.playing });
    }
    if (next.currentIndex !== prev.currentIndex) {
      this.emitEvent("trackChange", {
        previousIndex: prev.currentIndex,
        currentIndex: next.currentIndex,
      });
    }
    if (next.volume !== prev.volume || next.muted !== prev.muted) {
      this.emitEvent("volumeChange", { volume: next.volume, muted: next.muted });
    }
    if (next.duration !== prev.duration) {
      this.emitEvent("durationChange", { duration: next.duration });
    }
    if (!prev.ended && next.ended) {
      this.emitEvent("playToEnd", undefined);
    }
    if (prev.error == null && next.error != null) {
      this.emitEvent("error", next.error);
    }
    if (next.currentTime !== prev.currentTime && this.hasListeners("timeUpdate")) {
      this.emitEvent("timeUpdate", { currentTime: next.currentTime, duration: next.duration });
    }
  }

  togglePlay(): void {
    if (this._state.playing) this.pause();
    else this.play();
  }

  toggleMuted(): void {
    this.setMuted(!this._state.muted);
  }

  seekBy(seconds: number): void | Promise<void> {
    return this.seekTo(this._state.currentTime + seconds);
  }

  /* Abstract platform surface ------------------------------------------------ */
  abstract play(): void;
  abstract pause(): void;
  abstract seekTo(seconds: number): void | Promise<void>;
  abstract next(): void;
  abstract previous(): void;
  abstract skipTo(index: number): void;
  abstract setVolume(volume: number): void;
  abstract setMuted(muted: boolean): void;
  abstract setPlaybackRate(rate: number): void;
  abstract setLoop(loop: AudioPlaylistLoopMode): void;
  abstract add(source: AudioSource): void;
  abstract insert(source: AudioSource, index: number): void;
  abstract remove(index: number): void;
  abstract clear(): void;
}
