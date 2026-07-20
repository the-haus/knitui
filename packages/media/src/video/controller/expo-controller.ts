/**
 * The {@link VideoController} backend over an `expo-video` `VideoPlayer`. This is
 * cross-platform: `expo-video` resolves to its native module on device and to its
 * `.web` backend (an `HTMLVideoElement` + the web `VideoView`) in the browser, so
 * the same wrapper drives both — there is no hand-written web player anymore.
 *
 * The player is created and disposed by the engine / hook; this controller only
 * wraps it, binds its events, and maps them onto the shared snapshot. Fullscreen
 * and Picture-in-Picture live on the `VideoView` (not the player) on both
 * platforms, so the surface registers a view handle and forwards the view's
 * fullscreen/PiP callbacks back in via {@link notifyFullscreen} /
 * {@link notifyPictureInPicture}.
 */
import type {
  AudioTrack as ExpoAudioTrack,
  SubtitleTrack as ExpoSubtitleTrack,
  VideoSource as ExpoVideoSource,
  VideoPlayer,
} from "expo-video";

import { isWeb } from "@knitui/core";

import { type Cue, NATIVE_CAPABILITIES, resolveWebRuntimeCapabilities } from "../engine";
import type {
  AudioTrack,
  SubtitleTrack,
  VideoCapabilities,
  VideoControllerState,
  VideoEventType,
  VideoPlayerConfig,
  VideoSource,
  VideoTextTrack,
  VideoTrack,
} from "../types";
import { type CaptionHost, ensureCuesLoaded, updateActiveCue } from "./expo-captions";
import {
  bindExpoEvents,
  type ExpoEventHost,
  mapStatus,
  toVideoError,
  trackId,
} from "./expo-events";
import { BaseVideoController } from "./video-controller-base";

/** Minimal handle the `VideoView` exposes for fullscreen / PiP control. */
export interface ExpoVideoViewHandle {
  enterFullscreen(): Promise<void>;
  exitFullscreen(): Promise<void>;
  startPictureInPicture(): Promise<void>;
  stopPictureInPicture(): Promise<void>;
}

interface ExpoSubscription {
  remove(): void;
}

const DEFAULT_TIME_UPDATE_INTERVAL = 0.25;

export class ExpoVideoController extends BaseVideoController {
  // On web, refine the browser baseline with the live runtime probes (PiP /
  // fullscreen availability, the mobile-Safari volume lock); native exposes the
  // full expo-video feature set.
  readonly capabilities: VideoCapabilities = isWeb
    ? resolveWebRuntimeCapabilities()
    : NATIVE_CAPABILITIES;

  /** The wrapped expo-video player. Read by the surface to bind the view. */
  readonly player: VideoPlayer;
  private view: ExpoVideoViewHandle | null = null;
  private subscriptions: ExpoSubscription[] = [];
  /** id → expo track object, so we can select by our string id. */
  private subtitleById = new Map<string, ExpoSubtitleTrack>();
  private audioById = new Map<string, ExpoAudioTrack>();
  /** Subtitle tracks embedded in the manifest (from expo `sourceLoad`). */
  private embeddedSubtitles: SubtitleTrack[] = [];

  /* Custom caption pipeline (external sidecar `textTracks`) ------------------ */
  /** synthetic id (`custom:N`) → the sidecar track descriptor. */
  private customTrackById = new Map<string, VideoTextTrack>();
  /** synthetic id → parsed cues (lazily fetched on first selection). */
  private captionCuesById = new Map<string, Cue[]>();
  private textTracks: VideoTextTrack[] = [];
  /** The selected custom track id, or `null` when a custom track isn't active. */
  private activeCustomId: string | null = null;
  /** Generation counter so a slow cue fetch can't apply after switching away. */
  private loadToken = 0;
  /** Whether the one-time default-track auto-selection has run. */
  private autoSelectDone = false;

  /** The last source loaded, for `retry()`. */
  private lastSource: VideoSource;

  constructor(
    player: VideoPlayer,
    config: VideoPlayerConfig = {},
    initialSource: VideoSource = null,
    textTracks: VideoTextTrack[] = [],
  ) {
    super({
      volume: config.volume ?? player.volume ?? 1,
      muted: config.muted ?? player.muted ?? false,
      playbackRate: config.playbackRate ?? player.playbackRate ?? 1,
      loop: config.loop ?? player.loop ?? false,
    });
    this.player = player;
    this.lastSource = initialSource;
    player.timeUpdateEventInterval =
      config.updateInterval ?? config.timeUpdateInterval ?? DEFAULT_TIME_UPDATE_INTERVAL;
    if (config.loop != null) player.loop = config.loop;
    if (config.muted != null) player.muted = config.muted;
    if (config.volume != null) player.volume = config.volume;
    if (config.playbackRate != null) player.playbackRate = config.playbackRate;
    this.bindEvents();
    this.syncFromPlayer();
    this.setTextTracks(textTracks);
    if (config.autoPlay) player.play();
  }

  /** Called by the surface to register the `VideoView` handle. */
  attachView(view: ExpoVideoViewHandle | null): void {
    this.view = view;
  }

  /* custom captions --------------------------------------------------------- */

  /**
   * Register the external (sidecar) caption files. `expo-video` can't load these
   * itself, so we expose them as selectable subtitle tracks and render their
   * cues with our own overlay. Re-runnable: the React hook calls this whenever
   * the `textTracks` prop changes.
   */
  setTextTracks(tracks: VideoTextTrack[]): void {
    this.textTracks = tracks;
    this.customTrackById.clear();
    this.captionCuesById.clear();
    tracks.forEach((track, i) => this.customTrackById.set(`custom:${i}`, track));

    // Drop an active custom selection that no longer exists.
    if (this.activeCustomId !== null && !this.customTrackById.has(this.activeCustomId)) {
      this.activeCustomId = null;
      this.player.subtitleTrack = null;
      this.setState({ subtitleTrackId: null, activeCueText: null });
    }

    this.publishSubtitleTracks();

    // Auto-show a `default` track once, mirroring web's `<track default>`.
    if (!this.autoSelectDone && tracks.length > 0) {
      this.autoSelectDone = true;
      const defaultIndex = tracks.findIndex((t) => t.default);
      if (defaultIndex !== -1 && this._state.subtitleTrackId === null) {
        this.selectSubtitleTrack(`custom:${defaultIndex}`);
      }
    }
  }

  /** Publish the merged subtitle list (embedded + custom) into state. */
  private publishSubtitleTracks(): void {
    const custom: SubtitleTrack[] = this.textTracks.map((track, i) => ({
      id: `custom:${i}`,
      label: track.label,
      language: track.language ?? "",
      isDefault: track.default,
    }));
    const availableSubtitleTracks = [...this.embeddedSubtitles, ...custom];
    this.setState({ availableSubtitleTracks });
    this.emitEvent("tracksChange", {
      availableAudioTracks: this._state.availableAudioTracks,
      availableSubtitleTracks,
      availableVideoTracks: this._state.availableVideoTracks,
    });
  }

  /**
   * The caption-state view the sidecar pipeline (`expo-captions`) reads/writes.
   * Bound to this instance's private caption fields + state plumbing so the
   * pipeline's fetch/parse + active-cue logic can live outside the class. The
   * `activeCustomId`/`loadToken`/`state` getters read live (they change across
   * an `await` inside the pipeline), so the host can't be a flat snapshot.
   */
  private makeCaptionHost(): CaptionHost {
    /* eslint-disable @typescript-eslint/no-this-alias */
    const ctrl = this;
    /* eslint-enable @typescript-eslint/no-this-alias */
    return {
      captionCuesById: ctrl.captionCuesById,
      customTrackById: ctrl.customTrackById,
      get activeCustomId(): string | null {
        return ctrl.activeCustomId;
      },
      get loadToken(): number {
        return ctrl.loadToken;
      },
      set loadToken(value: number) {
        ctrl.loadToken = value;
      },
      get state(): VideoControllerState {
        return ctrl._state;
      },
      setState: (patch) => ctrl.setState(patch),
    };
  }

  /** Fetch + parse a custom track's cues once, then refresh the active cue. */
  private ensureCuesLoaded(id: string): Promise<void> {
    return ensureCuesLoaded(this.makeCaptionHost(), id);
  }

  /** Recompute the cue to paint from the active custom track + current time. */
  private updateActiveCue(): void {
    updateActiveCue(this.makeCaptionHost());
  }

  /* event binding ----------------------------------------------------------- */

  private bindEvents(): void {
    /* eslint-disable @typescript-eslint/no-this-alias */
    const ctrl = this;
    /* eslint-enable @typescript-eslint/no-this-alias */
    const sub = (subscription: ExpoSubscription): void => {
      this.subscriptions.push(subscription);
    };
    // The player-event wiring lives in `expo-events`; bridge it to the
    // controller's (protected) state plumbing + private hooks.
    const host: ExpoEventHost = {
      setState: (patch) => this.setState(patch),
      emitEvent: (type, payload) => this.emitEvent(type as VideoEventType, payload as never),
      updateActiveCue: () => this.updateActiveCue(),
      ingestTracks: (audio, subtitles, video) => this.ingestTracks(audio, subtitles, video),
      get state(): VideoControllerState {
        return ctrl._state;
      },
    };
    bindExpoEvents(host, this.player, sub);
  }

  private ingestTracks(
    audio: ExpoAudioTrack[],
    subtitles: ExpoSubtitleTrack[],
    video: VideoTrack[] | unknown[],
  ): void {
    this.audioById.clear();
    this.subtitleById.clear();

    const availableAudioTracks: AudioTrack[] = audio.map((t, i) => {
      const id = trackId(t, i);
      this.audioById.set(id, t);
      return { id, label: t.label, language: t.language, isDefault: t.isDefault };
    });
    this.embeddedSubtitles = subtitles.map((t, i) => {
      const id = trackId(t, i);
      this.subtitleById.set(id, t);
      return { id, label: t.label, language: t.language, isDefault: t.isDefault };
    });
    const availableVideoTracks = (video as VideoTrack[]).map((t, i): VideoTrack => ({
      id: t.id ?? `video-${i}`,
      size: t.size ?? { width: 0, height: 0 },
      averageBitrate: t.averageBitrate ?? null,
      peakBitrate: t.peakBitrate ?? null,
      frameRate: t.frameRate ?? null,
      mimeType: t.mimeType ?? null,
      videoRange: t.videoRange,
    }));

    this.setState({ availableAudioTracks, availableVideoTracks });
    // Publish the merged subtitle list (manifest-embedded + custom sidecar) and
    // emit `tracksChange`.
    this.publishSubtitleTracks();
  }

  private syncFromPlayer(): void {
    const p = this.player;
    this.setState({
      status: mapStatus(p.status),
      playing: p.playing,
      currentTime: p.currentTime,
      duration: p.duration,
      bufferedPosition: p.bufferedPosition,
      volume: p.volume,
      muted: p.muted,
      playbackRate: p.playbackRate,
      loop: p.loop,
      isLive: p.isLive,
    });
  }

  /* surface callbacks ------------------------------------------------------- */

  notifyFullscreen(fullscreen: boolean): void {
    // `fullscreenChange` fans out from the diff in `deriveEvents`.
    this.setState({ fullscreen });
  }

  notifyPictureInPicture(active: boolean): void {
    // `pictureInPictureChange` fans out from the diff in `deriveEvents`.
    this.setState({ pictureInPicture: active });
  }

  /* imperative API ---------------------------------------------------------- */

  play(): void {
    this.player.play();
  }

  pause(): void {
    this.player.pause();
  }

  replay(): void {
    this.player.replay();
  }

  seekTo(seconds: number): void {
    const duration = this.player.duration;
    const target =
      Number.isFinite(duration) && duration > 0
        ? Math.min(Math.max(0, seconds), duration)
        : Math.max(0, seconds);
    this.player.currentTime = target;
    this.setState({ currentTime: target });
  }

  // No `seekBy` override: the base routes it through the clamping, optimistic
  // `seekTo` above, like every other adapter. (The removed override called the
  // raw `player.seekBy`, which skipped the [0, duration] clamp + state update.)

  setVolume(volume: number): void {
    const v = Math.max(0, Math.min(1, volume));
    this.player.volume = v;
    this.setState({ volume: v });
  }

  setMuted(muted: boolean): void {
    this.player.muted = muted;
    this.setState({ muted });
  }

  setPlaybackRate(rate: number): void {
    this.player.playbackRate = rate;
    this.setState({ playbackRate: rate });
  }

  setLoop(loop: boolean): void {
    this.player.loop = loop;
    this.setState({ loop });
  }

  setNowPlayingEnabled(enabled: boolean): void {
    // Native-only. expo-video reads the displayed title/artist/artwork from the
    // source's `metadata`; these two player flags surface that as the OS
    // now-playing notification + lock-screen controls and keep playback alive in
    // the background. The web backend has no such concept, so skip it (assigning
    // would be a no-op at best).
    if (isWeb) return;
    this.player.showNowPlayingNotification = enabled;
    this.player.staysActiveInBackground = enabled;
  }

  selectSubtitleTrack(id: string | null): void {
    if (id !== null && this.customTrackById.has(id)) {
      // Custom sidecar track: turn off the native player subtitle (so it can't
      // double up) and drive our own overlay from the parsed cues.
      this.player.subtitleTrack = null;
      this.activeCustomId = id;
      this.setState({ subtitleTrackId: id, activeCueText: null });
      void this.ensureCuesLoaded(id);
      return;
    }
    // Manifest-embedded track, or "off".
    this.activeCustomId = null;
    this.player.subtitleTrack = id ? (this.subtitleById.get(id) ?? null) : null;
    this.setState({ subtitleTrackId: id, activeCueText: null });
  }

  selectAudioTrack(id: string | null): void {
    this.player.audioTrack = id ? (this.audioById.get(id) ?? null) : null;
    this.setState({ audioTrackId: id });
  }

  async enterFullscreen(): Promise<void> {
    await this.view?.enterFullscreen();
  }

  async exitFullscreen(): Promise<void> {
    await this.view?.exitFullscreen();
  }

  async startPictureInPicture(): Promise<void> {
    await this.view?.startPictureInPicture();
  }

  async stopPictureInPicture(): Promise<void> {
    await this.view?.stopPictureInPicture();
  }

  async replace(source: VideoSource): Promise<void> {
    this.lastSource = source;
    this.setState({
      status: "loading",
      currentTime: 0,
      duration: 0,
      bufferedPosition: -1,
      ended: false,
      error: null,
    });
    await this.loadAsync(source);
  }

  async retry(): Promise<void> {
    this.setState({ status: "loading", error: null, ended: false });
    await this.loadAsync(this.lastSource);
  }

  /**
   * Swap the player source, turning a rejected `replaceAsync` into the normal
   * error status + `error` event instead of an unhandled promise rejection
   * (callers fire these as `void controller.replace(...)` / `retry()`).
   */
  private async loadAsync(source: VideoSource): Promise<void> {
    try {
      await this.player.replaceAsync(source as ExpoVideoSource);
    } catch (err) {
      // The `error` + `statusChange` events fan out from the diff in
      // BaseMediaController.deriveEvents — just set the error status.
      this.setState({ status: "error", error: toVideoError(err) });
    }
  }

  override dispose(): void {
    for (const subscription of this.subscriptions) subscription.remove();
    this.subscriptions = [];
    this.view = null;
    // Invalidate any in-flight cue fetch and drop the caches.
    this.loadToken++;
    this.customTrackById.clear();
    this.captionCuesById.clear();
    // The player itself is owned/released by the useVideoPlayer hook.
    super.dispose();
  }
}
