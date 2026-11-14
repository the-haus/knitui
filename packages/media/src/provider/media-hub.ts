/**
 * The one control point over everything `<MediaProvider>` owns.
 *
 * Audio and video each have their own engine (one real player apiece), which is
 * what lets any number of `<Audio>` / `<Video>` share them. The hub sits above both
 * and answers the questions that span them:
 *
 *  - **What is playing?** `focus` is the domain that started playing last.
 *  - **Only one thing at a time.** With `exclusive` on (the default), audible
 *    playback starting in one domain pauses the other, the way a music app goes
 *    quiet when a video starts. A muted video takes nothing over.
 *  - **Stop everything.** `pauseAll()`, for a route change or an incoming call UI.
 *  - **Get ready.** `preload()` warms a source of either kind before it is played.
 *
 * No React here. `useMediaHub()` hands it to components and `useMediaState()`
 * exposes `focus` reactively.
 */
import type { AudioController } from "../audio/controller/audio-controller-base";
import type { AudioEngine } from "../audio/session/audio-engine.shared";
import { preload as preloadAudio } from "../audio/session/preload";
import type { AudioSource } from "../audio/types";
import { sourceUriOf } from "../shared";
import type { VideoController } from "../video/controller/video-controller-base";
import { preload as preloadVideo } from "../video/session/preload";
import type { VideoEngine } from "../video/session/video-engine.shared";
import type { VideoSource } from "../video/types";

export type MediaKind = "audio" | "video";

export interface MediaPreloadOptions {
  /**
   * Which player the source is for. Left out, it is read from the file extension:
   * the usual video containers and streaming manifests are video, anything else is
   * audio.
   */
  kind?: MediaKind;
  /** How many seconds to buffer ahead. Default `10`. */
  preferredForwardBufferDuration?: number;
}

const VIDEO_EXTENSION = /\.(mp4|m4v|mov|webm|mkv|m3u8|mpd|ogv|avi|ts)(\?|#|$)/i;

function kindOf(source: AudioSource | VideoSource): MediaKind {
  const uri = sourceUriOf(source);
  return uri !== null && VIDEO_EXTENSION.test(uri) ? "video" : "audio";
}

/** Preload a source of either kind (see {@link MediaPreloadOptions.kind}). */
export function preloadMedia(
  source: AudioSource | VideoSource,
  options: MediaPreloadOptions = {},
): Promise<void> {
  const { kind = kindOf(source), ...rest } = options;
  return kind === "video"
    ? preloadVideo(source as VideoSource, rest)
    : preloadAudio(source as AudioSource, rest);
}

interface Engines {
  audio: AudioEngine;
  video: VideoEngine;
}

export class MediaHub {
  private _exclusive = true;
  private _focus: MediaKind | null = null;
  private readonly listeners = new Set<() => void>();
  private readonly unbind: (() => void)[];

  constructor(private readonly engines: Engines) {
    const audio = engines.audio.session.controller;
    const video = engines.video.session.controller;
    this.unbind = [
      audio.on("playingChange", ({ playing }) => this.onPlaying("audio", playing)),
      video.on("playingChange", ({ playing }) => this.onPlaying("video", playing)),
    ];
  }

  /** Pause the other domain when audible playback starts in one. Default `true`. */
  get exclusive(): boolean {
    return this._exclusive;
  }

  set exclusive(exclusive: boolean) {
    if (this._exclusive === exclusive) return;
    this._exclusive = exclusive;
    // Mixing is also the platform's call: Android hands audio focus to whichever
    // player started last and stops the other, whatever this hub decides. So when
    // the two may play together, the video is told to share.
    const { audio, video } = this.engines;
    // Turned on while both are playing: decide here which one goes quiet (the one
    // without focus), before the platform's audio focus picks for us.
    if (
      exclusive &&
      audio.session.controller.state.playing &&
      video.session.controller.state.playing
    ) {
      this.pause(this._focus === "audio" ? "video" : "audio");
    }
    video.session.controller.setPlaybackOptions({
      audioMixingMode: exclusive ? "auto" : "mixWithOthers",
    });
  }

  /** The domain that started playing last, or `null` before anything has played. */
  get focus(): MediaKind | null {
    return this._focus;
  }

  /** The id of the player that owns the focused domain's engine, if any. */
  get activeId(): string | null {
    return this._focus ? this.engines[this._focus].session.activeId : null;
  }

  /** The focused player's controller: the one a global play/pause button drives. */
  get active(): AudioController | VideoController | null {
    const kind = this._focus;
    if (!kind) return null;
    const id = this.engines[kind].session.activeId;
    return id ? this.engines[kind].getFacade(id) : null;
  }

  /** Whether anything is playing, in either domain. */
  get playing(): boolean {
    return (
      this.engines.audio.session.controller.state.playing ||
      this.engines.video.session.controller.state.playing
    );
  }

  /** Subscribe to `focus` changes. Returns an unsubscribe function. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Pause audio and video. */
  pauseAll(): void {
    this.pause("audio");
    this.pause("video");
  }

  /** Play or pause whatever has focus. Does nothing before anything has played. */
  togglePlay(): void {
    this.active?.togglePlay();
  }

  preload(source: AudioSource | VideoSource, options?: MediaPreloadOptions): Promise<void> {
    return preloadMedia(source, options);
  }

  dispose(): void {
    for (const off of this.unbind) off();
    this.unbind.length = 0;
    this.listeners.clear();
  }

  private pause(kind: MediaKind): void {
    const controller = this.engines[kind].session.controller;
    if (controller.state.playing) controller.pause();
  }

  private onPlaying(kind: MediaKind, playing: boolean): void {
    if (!playing) return;
    if (this._focus !== kind) {
      this._focus = kind;
      for (const listener of [...this.listeners]) listener();
    }
    if (!this._exclusive) return;
    // A silent player takes nothing over: a muted background video must not stop
    // the music.
    const { muted, volume } = this.engines[kind].session.controller.state;
    if (muted || volume <= 0) return;
    this.pause(kind === "audio" ? "video" : "audio");
  }
}
