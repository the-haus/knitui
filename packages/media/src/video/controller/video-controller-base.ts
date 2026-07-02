/**
 * The provider-agnostic controller contract — the single seam the design turns
 * on. The {@link ../controller/expo-controller} backend (over `expo-video`, which
 * resolves to its native module on device and its `.web` backend in the browser)
 * implements `VideoController`, so the hooks, context and chrome program against
 * ONE API regardless of platform.
 *
 * `BaseVideoController` is a thin specialization of the generic
 * {@link BaseMediaController} (`../../core/media-controller-base`): it inherits the
 * state store, typed emitter, subscription, `setState` and the derived commands,
 * and adds ONLY the video deltas — the fullscreen / picture-in-picture toggles
 * (with their reject-swallowing guard) and the tracks / presentation abstract
 * surface. Concrete adapters extend it and implement the imperative surface
 * against their platform.
 */
import { BaseMediaController, type MediaController } from "../../core/media-controller-base";
import { createInitialState } from "../engine";
import type {
  VideoCapabilities,
  VideoControllerEventMap,
  VideoControllerState,
  VideoSource,
} from "../types";

/** The imperative + reactive API shared by every backend. */
export interface VideoController extends MediaController<
  VideoControllerState,
  VideoCapabilities,
  VideoControllerEventMap,
  VideoSource
> {
  /* tracks (no-op where unsupported) */
  selectAudioTrack(id: string | null): void;
  selectSubtitleTrack(id: string | null): void;

  /**
   * Enable/disable the OS now-playing notification + lock-screen controls.
   * Native-only (no-op on web). The displayed title/artist/artwork are read from
   * the source's `metadata`; this only flips expo-video's
   * `showNowPlayingNotification` / `staysActiveInBackground`. Surfacing it on a
   * device build also requires the `expo-video` config plugin's
   * `supportsBackgroundPlayback: true`.
   */
  setNowPlayingEnabled(enabled: boolean): void;

  /* presentation */
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  toggleFullscreen(): Promise<void>;
  startPictureInPicture(): Promise<void>;
  stopPictureInPicture(): Promise<void>;
  /** Enter/exit Picture-in-Picture based on current state. Never rejects. */
  togglePictureInPicture(): Promise<void>;
}

/**
 * Video specialization of {@link BaseMediaController}: adds the fullscreen / PiP
 * toggles and the tracks / presentation abstract surface.
 */
export abstract class BaseVideoController
  extends BaseMediaController<
    VideoControllerState,
    VideoCapabilities,
    VideoControllerEventMap,
    VideoSource
  >
  implements VideoController
{
  constructor(initial?: Partial<VideoControllerState>) {
    super(createInitialState, initial);
  }

  /**
   * Derive the common playback events (via `super`) plus the video-only
   * presentation events from a state transition, so the surface callbacks
   * (`notifyFullscreen` / `notifyPictureInPicture`) only `setState` and never
   * hand-emit. (`tracksChange` carries arrays that aren't part of the base diff,
   * so it stays emitted at the adapter's track-ingest site.)
   */
  protected override deriveEvents(prev: VideoControllerState, next: VideoControllerState): void {
    super.deriveEvents(prev, next);
    if (next.fullscreen !== prev.fullscreen) {
      this.emitEvent("fullscreenChange", { fullscreen: next.fullscreen });
    }
    if (next.pictureInPicture !== prev.pictureInPicture) {
      this.emitEvent("pictureInPictureChange", { pictureInPicture: next.pictureInPicture });
    }
  }

  /**
   * Presentation toggles call into the platform's user-gesture-gated APIs
   * (`requestFullscreen`, `requestPictureInPicture`), which reject when the
   * browser declines the request. We swallow those rejections here so the
   * fire-and-forget call sites in the chrome can't leak unhandled promise
   * rejections; the real outcome is reflected back through the change events.
   */
  async toggleFullscreen(): Promise<void> {
    try {
      if (this._state.fullscreen) await this.exitFullscreen();
      else await this.enterFullscreen();
    } catch {
      /* request declined / not allowed — state stays as the events report it. */
    }
  }

  async togglePictureInPicture(): Promise<void> {
    try {
      if (this._state.pictureInPicture) await this.stopPictureInPicture();
      else await this.startPictureInPicture();
    } catch {
      /* request declined / unsupported — ignored. */
    }
  }

  /* Abstract video surface --------------------------------------------------- */
  abstract setNowPlayingEnabled(enabled: boolean): void;
  abstract selectAudioTrack(id: string | null): void;
  abstract selectSubtitleTrack(id: string | null): void;
  abstract enterFullscreen(): Promise<void>;
  abstract exitFullscreen(): Promise<void>;
  abstract startPictureInPicture(): Promise<void>;
  abstract stopPictureInPicture(): Promise<void>;
}
