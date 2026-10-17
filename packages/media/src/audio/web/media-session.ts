/**
 * The browser's now-playing card (`navigator.mediaSession`) for the kit's web
 * audio player — what the lock screen / OS media keys show and control. ONE
 * player owns it at a time, like the native lock-screen controls.
 *
 * Adapted from expo-audio's `MediaSessionController.web` (MIT, © 650 Industries).
 */
import type { AudioLockScreenOptions, AudioMetadata } from "../types";

const SKIP_SECONDS = 10;

/** What the media session needs from a player. */
export interface MediaSessionPlayer {
  readonly playing: boolean;
  readonly duration: number;
  readonly currentTime: number;
  readonly playbackRate: number;
  play(): void;
  pause(): void;
  seekTo(seconds: number): Promise<void> | void;
}

type Action = MediaSessionAction;

function session(): MediaSession | null {
  return typeof navigator !== "undefined" && "mediaSession" in navigator
    ? navigator.mediaSession
    : null;
}

class WebMediaSessionController {
  private activePlayer: MediaSessionPlayer | null = null;
  private metadata: AudioMetadata | null = null;
  private options: AudioLockScreenOptions | null = null;

  setActivePlayer(
    player: MediaSessionPlayer,
    metadata?: AudioMetadata,
    options?: AudioLockScreenOptions,
  ): void {
    if (!session()) return;
    if (this.activePlayer && this.activePlayer !== player) this.clear(this.activePlayer);
    this.activePlayer = player;
    this.metadata = metadata ?? null;
    this.options = options ?? null;
    this.applyMetadata();
    this.applyActionHandlers();
    this.updatePlaybackState(player);
    this.updatePositionState(player);
  }

  updateMetadata(player: MediaSessionPlayer, metadata: AudioMetadata): void {
    if (!session() || this.activePlayer !== player) return;
    this.metadata = metadata;
    this.applyMetadata();
  }

  clear(player: MediaSessionPlayer): void {
    const ms = session();
    if (!ms || this.activePlayer !== player) return;
    this.activePlayer = null;
    this.metadata = null;
    this.options = null;
    ms.metadata = null;
    ms.playbackState = "none";
    const actions: Action[] = [
      "play",
      "pause",
      "seekto",
      "seekforward",
      "seekbackward",
      "previoustrack",
      "nexttrack",
    ];
    for (const action of actions) this.setHandler(action, null);
    try {
      ms.setPositionState();
    } catch {
      // Not every browser accepts an empty position state.
    }
  }

  updatePlaybackState(player: MediaSessionPlayer): void {
    const ms = session();
    if (!ms || this.activePlayer !== player) return;
    ms.playbackState = player.playing ? "playing" : "paused";
  }

  updatePositionState(player: MediaSessionPlayer): void {
    const ms = session();
    if (!ms || this.activePlayer !== player) return;
    const duration = player.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    const position = Math.min(Math.max(player.currentTime, 0), duration);
    try {
      ms.setPositionState({ duration, playbackRate: player.playbackRate || 1, position });
    } catch {
      // A position outside the reported duration (a live edge) is refused.
    }
  }

  getActiveState(
    player: MediaSessionPlayer,
  ): { metadata: AudioMetadata | null; options: AudioLockScreenOptions | null } | null {
    if (this.activePlayer !== player) return null;
    return { metadata: this.metadata, options: this.options };
  }

  private applyMetadata(): void {
    const ms = session();
    if (!ms) return;
    if (!this.metadata || typeof MediaMetadata === "undefined") {
      ms.metadata = null;
      return;
    }
    const { title, artist, albumTitle } = this.metadata;
    const artworkUrl = this.metadata.artwork ?? this.metadata.artworkUrl;
    ms.metadata = new MediaMetadata({
      title: title ?? "",
      artist: artist ?? "",
      album: albumTitle ?? "",
      artwork: artworkUrl ? [{ src: artworkUrl }] : [],
    });
  }

  private setHandler(action: Action, handler: MediaSessionActionHandler | null): void {
    try {
      session()?.setActionHandler(action, handler);
    } catch {
      // An action this browser doesn't know.
    }
  }

  private applyActionHandlers(): void {
    const player = this.activePlayer;
    if (!player) return;
    this.setHandler("play", () => player.play());
    this.setHandler("pause", () => player.pause());
    this.setHandler("seekto", (details) => {
      if (details.seekTime != null) {
        void player.seekTo(details.seekTime);
        this.updatePositionState(player);
      }
    });
    const seekForward: MediaSessionActionHandler = (details) => {
      const skip = details.seekOffset ?? SKIP_SECONDS;
      void player.seekTo(Math.min(player.currentTime + skip, player.duration || 0));
      this.updatePositionState(player);
    };
    const seekBackward: MediaSessionActionHandler = (details) => {
      const skip = details.seekOffset ?? SKIP_SECONDS;
      void player.seekTo(Math.max(player.currentTime - skip, 0));
      this.updatePositionState(player);
    };
    const forward = this.options?.showSeekForward === true ? seekForward : null;
    const backward = this.options?.showSeekBackward === true ? seekBackward : null;
    this.setHandler("seekforward", forward);
    this.setHandler("nexttrack", forward);
    this.setHandler("seekbackward", backward);
    this.setHandler("previoustrack", backward);
  }
}

/** The one media-session owner for the page. */
export const webMediaSession = new WebMediaSessionController();
