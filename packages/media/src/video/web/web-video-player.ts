/**
 * The kit's WEB video player: drives the `<video>` element(s) a
 * {@link WebVideoView} mounts, behind the subset of expo-video's `VideoPlayer`
 * API that {@link ExpoVideoController} uses — the same events
 * (`statusChange`, `playingChange`, `timeUpdate`, `volumeChange`, `mutedChange`,
 * `playbackRateChange`, `playToEnd`, `sourceChange`) and payloads, so the
 * controller and `expo-events` are unchanged. The native build uses expo-video
 * itself (`session/video-engine.native.ts`); the web build never loads expo.
 *
 * Like expo-video's web player it can drive several mounted elements in sync
 * (the shared engine normally mounts ONE `<video>` and teleports it between
 * frames, so the set holds one element). Audio-node mixing between multiple
 * views is not carried over: the kit never mounts two views of one player.
 *
 * Adapted from expo-video's `VideoPlayer.web` (MIT, © 650 Industries).
 */
import { mediaSourceUri, WebEventSource } from "../../shared/web-media";

export type WebVideoStatus = "idle" | "loading" | "readyToPlay" | "error";

/** expo-video's `getSourceUri`, without the asset registry. */
export function videoSourceUri(source: unknown): string | null {
  return mediaSourceUri(source);
}

export class WebVideoPlayer extends WebEventSource {
  src: unknown = null;
  previousSrc: unknown = null;
  playing = false;

  // Fields the controller reads or writes that the browser can't honour; kept
  // so the expo `VideoPlayer` contract holds.
  audioMixingMode = "auto";
  allowsExternalPlayback = false;
  staysActiveInBackground = false;
  showNowPlayingNotification = false;
  currentLiveTimestamp: number | null = null;
  currentOffsetFromLive: number | null = null;
  targetOffsetFromLive = 0;
  bufferOptions = {};
  subtitleTrack: unknown = null;
  availableSubtitleTracks: unknown[] = [];
  audioTrack: unknown = null;
  availableAudioTracks: unknown[] = [];
  videoTrack: unknown = null;
  availableVideoTracks: unknown[] = [];
  isExternalPlaybackActive = false;
  keepScreenOnWhilePlaying = false;

  private readonly mounted = new Set<HTMLVideoElement>();
  private _muted = false;
  private _volume = 1;
  private _loop = false;
  private _playbackRate = 1;
  private _preservesPitch = true;
  private _status: WebVideoStatus = "idle";
  private _error: { message: string } | null = null;
  private timeUpdateLoop: ReturnType<typeof setInterval> | null = null;
  private _timeUpdateEventInterval = 0;

  constructor(source: unknown = null) {
    super();
    this.src = typeof source === "string" ? { uri: source } : source;
  }

  private get first(): HTMLVideoElement | undefined {
    for (const video of this.mounted) return video;
    return undefined;
  }

  private each(fn: (video: HTMLVideoElement) => void): void {
    this.mounted.forEach(fn);
  }

  get muted(): boolean {
    return this._muted;
  }
  set muted(value: boolean) {
    this.each((v) => (v.muted = value));
    this._muted = value;
  }
  get playbackRate(): number {
    return this._playbackRate;
  }
  set playbackRate(value: number) {
    this.each((v) => (v.playbackRate = value));
    this._playbackRate = value;
  }
  get isLive(): boolean {
    return this.first?.duration === Infinity;
  }
  get volume(): number {
    return this._volume;
  }
  set volume(value: number) {
    this.each((v) => (v.volume = value));
    this._volume = value;
  }
  get loop(): boolean {
    return this._loop;
  }
  set loop(value: boolean) {
    this.each((v) => (v.loop = value));
    this._loop = value;
  }
  get currentTime(): number {
    return this.first?.currentTime ?? 0;
  }
  set currentTime(value: number) {
    this.each((v) => (v.currentTime = value));
  }
  get duration(): number {
    return this.first?.duration ?? 0;
  }
  get preservesPitch(): boolean {
    return this._preservesPitch;
  }
  set preservesPitch(value: boolean) {
    this.each((v) => (v.preservesPitch = value));
    this._preservesPitch = value;
  }

  get timeUpdateEventInterval(): number {
    return this._timeUpdateEventInterval;
  }
  set timeUpdateEventInterval(value: number) {
    this._timeUpdateEventInterval = value;
    if (this.timeUpdateLoop) clearInterval(this.timeUpdateLoop);
    this.timeUpdateLoop = null;
    if (value > 0) {
      // The first tick is immediate, as on the native players.
      this.emitTimeUpdate();
      this.timeUpdateLoop = setInterval(() => this.emitTimeUpdate(), value * 1000);
    }
  }

  get status(): WebVideoStatus {
    return this._status;
  }
  set status(value: WebVideoStatus) {
    if (this._status === value) return;
    if (value === "error" && this._error) {
      this.emit("statusChange", { status: value, oldStatus: this._status, error: this._error });
    } else {
      this.emit("statusChange", { status: value, oldStatus: this._status });
      this._error = null;
    }
    this._status = value;
  }

  get bufferedPosition(): number {
    const video = this.first;
    if (!video || this.status === "error") return -1;
    const buffered = video.buffered;
    for (let i = 0; i < buffered.length; i++) {
      if (buffered.start(i) <= this.currentTime && buffered.end(i) >= this.currentTime) {
        return buffered.end(i);
      }
    }
    return 0;
  }

  /** Called by {@link WebVideoView} when its `<video>` mounts. */
  mountVideoView(video: HTMLVideoElement): void {
    // The first element inherits what was set before any view existed.
    if (this.mounted.size === 0) {
      video.preservesPitch = this._preservesPitch;
      video.loop = this._loop;
      video.volume = this._volume;
      video.muted = this._muted;
      video.playbackRate = this._playbackRate;
    }
    this.mounted.add(video);
    this.addListeners(video);
    this.syncWithFirst(video);
  }

  unmountVideoView(video: HTMLVideoElement): void {
    this.mounted.delete(video);
  }

  play(): void {
    this.each((v) => void v.play()?.catch?.(() => {}));
  }

  pause(): void {
    this.each((v) => v.pause());
  }

  replace(source: unknown): void {
    const uri = videoSourceUri(source);
    this.each((video) => {
      video.pause();
      if (uri) {
        video.setAttribute("src", uri);
        video.load();
        void video.play()?.catch?.(() => {});
      } else {
        video.removeAttribute("src");
        video.load();
      }
    });
    this.previousSrc = this.src;
    this.src = source;
    this.playing = true;
  }

  async replaceAsync(source: unknown): Promise<void> {
    this.replace(source);
  }

  seekBy(seconds: number): void {
    this.each((v) => (v.currentTime += seconds));
  }

  replay(): void {
    this.each((v) => {
      v.currentTime = 0;
      void v.play()?.catch?.(() => {});
    });
    this.playing = true;
  }

  release(): void {
    if (this.timeUpdateLoop) clearInterval(this.timeUpdateLoop);
    this.timeUpdateLoop = null;
    this.mounted.clear();
  }

  private emitTimeUpdate(): void {
    this.emit("timeUpdate", {
      currentTime: this.currentTime,
      currentLiveTimestamp: null,
      currentOffsetFromLive: null,
      bufferedPosition: this.bufferedPosition,
    });
  }

  private syncWithFirst(video: HTMLVideoElement): void {
    const first = this.first;
    if (!first) return;
    if (first.paused) video.pause();
    else void video.play()?.catch?.(() => {});
    video.currentTime = first.currentTime;
    video.volume = first.volume;
    video.muted = first.muted;
    video.playbackRate = first.playbackRate;
  }

  /** Synced elements all fire; only the first one's event is forwarded. */
  private emitOnce(from: HTMLVideoElement, event: string, payload?: unknown): void {
    if (this.first === from) this.emit(event, payload);
  }

  private addListeners(video: HTMLVideoElement): void {
    video.onplay = (e) => {
      this.emitOnce(video, "playingChange", { isPlaying: true, oldIsPlaying: this.playing });
      this.playing = true;
      this.each((v) => {
        if (e.target !== v) void v.play()?.catch?.(() => {});
      });
    };
    video.onpause = (e) => {
      this.emitOnce(video, "playingChange", { isPlaying: false, oldIsPlaying: this.playing });
      this.playing = false;
      this.each((v) => {
        if (e.target !== v) v.pause();
      });
    };
    video.onvolumechange = () => {
      this.emitOnce(video, "volumeChange", { volume: video.volume, oldVolume: this.volume });
      this.emitOnce(video, "mutedChange", { muted: video.muted, oldMuted: this.muted });
      this.volume = video.volume;
      this.muted = video.muted;
    };
    const followSeek = () => {
      this.each((v) => {
        if (v !== video && v.currentTime !== video.currentTime) v.currentTime = video.currentTime;
      });
    };
    video.onseeking = followSeek;
    video.onseeked = followSeek;
    video.onratechange = () => {
      this.emitOnce(video, "playbackRateChange", {
        playbackRate: video.playbackRate,
        oldPlaybackRate: this.playbackRate,
      });
      this.each((v) => {
        if (v.playbackRate !== video.playbackRate) v.playbackRate = video.playbackRate;
      });
      this._playbackRate = video.playbackRate;
    };
    video.onerror = () => {
      this._error = { message: video.error?.message || "Unknown player error" };
      this.status = "error";
    };
    video.oncanplay = () => {
      for (const v of this.mounted) if (v.readyState < 3) return;
      this.status = "readyToPlay";
    };
    video.onwaiting = () => {
      if (this._status !== "loading") this.status = "loading";
    };
    video.onended = () => this.emitOnce(video, "playToEnd");
    video.onloadstart = () =>
      this.emitOnce(video, "sourceChange", { source: this.src, oldSource: this.previousSrc });
  }
}
