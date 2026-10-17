/**
 * The kit's WEB audio player: one `HTMLAudioElement` (+ an `AnalyserNode` while
 * waveform sampling is on) behind the subset of expo-audio's `AudioPlayer` API
 * that {@link ExpoAudioController} drives — the same event names
 * (`playbackStatusUpdate`, `audioSampleUpdate`) and payload shapes, so the
 * controller is unchanged. The native build uses expo-audio itself
 * (`session/audio-engine.native.ts`); the web build never loads expo.
 *
 * Adapted from expo-audio's `AudioPlayer.web` (MIT, © 650 Industries).
 */
import {
  getSharedAudioContext,
  inertMediaElement,
  mediaSourceUri,
  nextMediaId,
  safeDuration,
  WebEventSource,
} from "../../shared/web-media";
import type { AudioLockScreenOptions, AudioMetadata } from "../types";
import { webMediaSession } from "./media-session";

export const PLAYBACK_STATUS_UPDATE = "playbackStatusUpdate";
export const AUDIO_SAMPLE_UPDATE = "audioSampleUpdate";

/** Every web player alive, so the audio session can pause them all. */
export const activeWebPlayers = new Set<WebAudioPlayer>();

/** `setIsAudioActive(false)` holds every player paused until it is re-enabled. */
let audioActive = true;
export function setWebAudioActive(active: boolean): void {
  audioActive = active;
  if (!active) {
    for (const player of activeWebPlayers) if (player.playing) player.pause();
  }
}

/** Preloaded sources: original URI → a pre-buffered blob URL. */
export const webPreloadCache = new Map<string, { blobUrl: string; audio: HTMLAudioElement }>();

/** expo-audio's `AudioStatus`, as the controller reads it. */
export interface WebAudioStatus {
  id: string;
  isLoaded: boolean;
  duration: number;
  currentTime: number;
  playbackState: string;
  timeControlStatus: "playing" | "paused";
  reasonForWaitingToPlay: string;
  playing: boolean;
  didJustFinish: boolean;
  isBuffering: boolean;
  playbackRate: number;
  shouldCorrectPitch: boolean;
  mute: boolean;
  loop: boolean;
  isLive: boolean;
  currentOffsetFromLive: number | null;
  error: string | null;
}

function statusOf(media: HTMLAudioElement, id: string): WebAudioStatus {
  const playing = media.currentTime > 0 && !media.paused && !media.ended && media.readyState > 2;
  return {
    id,
    isLoaded: true,
    duration: safeDuration(media.duration),
    currentTime: media.currentTime,
    playbackState: "",
    timeControlStatus: playing ? "playing" : "paused",
    reasonForWaitingToPlay: "",
    playing,
    didJustFinish: media.ended,
    isBuffering: false,
    playbackRate: media.playbackRate,
    shouldCorrectPitch: true,
    mute: media.muted,
    loop: media.loop,
    isLive: media.duration === Infinity,
    currentOffsetFromLive: null,
    error: null,
  };
}

let warnedIosVolume = false;

export interface WebAudioPlayerOptions {
  /** How often (ms) `playbackStatusUpdate` fires while playing. */
  updateInterval?: number;
  crossOrigin?: "anonymous" | "use-credentials";
}

export class WebAudioPlayer extends WebEventSource {
  readonly id = nextMediaId();
  isAudioSamplingSupported = false;
  isBuffering = false;
  shouldCorrectPitch = false;
  src: unknown = null;

  private media: HTMLAudioElement;
  private readonly interval: number;
  private readonly crossOrigin: WebAudioPlayerOptions["crossOrigin"];
  private isPlaying = false;
  private loaded = false;
  private analyser: AnalyserNode | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private samplingFrameId: number | null = null;
  private samplingEnabled = false;
  private samplingBuffer: Float32Array<ArrayBuffer> | null = null;

  constructor(source: unknown = null, options: WebAudioPlayerOptions = {}) {
    super();
    this.src = source;
    this.interval = Math.max(options.updateInterval ?? 500, 1);
    this.crossOrigin = options.crossOrigin;
    this.media = this.createMediaElement();
    activeWebPlayers.add(this);
  }

  get playing(): boolean {
    return this.isPlaying;
  }
  get muted(): boolean {
    return this.media.muted;
  }
  set muted(value: boolean) {
    this.media.muted = value;
  }
  get loop(): boolean {
    return this.media.loop;
  }
  set loop(value: boolean) {
    this.media.loop = value;
  }
  get duration(): number {
    return safeDuration(this.media.duration);
  }
  get currentTime(): number {
    return this.media.currentTime;
  }
  get paused(): boolean {
    return this.media.paused;
  }
  get isLoaded(): boolean {
    return this.loaded;
  }
  get playbackRate(): number {
    return this.media.playbackRate;
  }
  set playbackRate(value: number) {
    this.media.playbackRate = value;
  }
  get volume(): number {
    return this.media.volume;
  }
  set volume(value: number) {
    if (!warnedIosVolume && /iPad|iPhone|iPod/.test(navigator.userAgent)) {
      warnedIosVolume = true;
      console.warn(
        "@knitui/media: browsers on iOS ignore programmatic volume; the device buttons control it.",
      );
    }
    this.media.volume = value;
  }
  get currentStatus(): WebAudioStatus {
    return statusOf(this.media, this.id);
  }

  play(): void {
    if (!audioActive) return;
    void this.media.play()?.catch?.(() => {
      // Autoplay refused (no user gesture yet): the pause event reports it.
    });
    this.isPlaying = true;
    this.startSampling();
  }

  pause(): void {
    this.media.pause();
    this.isPlaying = false;
    this.stopSampling();
  }

  replace(source: unknown): void {
    const wasPlaying = this.isPlaying;
    const wasSampling = this.samplingEnabled;
    const nowPlaying = webMediaSession.getActiveState(this);
    this.remove();
    this.src = source;
    this.isPlaying = false;
    this.loaded = false;
    this.media = this.createMediaElement();
    activeWebPlayers.add(this);
    if (wasSampling) this.setAudioSamplingEnabled(true);
    if (nowPlaying) {
      webMediaSession.setActivePlayer(
        this,
        nowPlaying.metadata ?? undefined,
        nowPlaying.options ?? undefined,
      );
    }
    if (wasPlaying) this.play();
  }

  async seekTo(seconds: number): Promise<void> {
    this.media.currentTime = seconds;
  }

  setPlaybackRate(rate: number, pitchCorrectionQuality?: string): void {
    this.media.playbackRate = rate;
    this.shouldCorrectPitch = pitchCorrectionQuality === "high";
    this.media.preservesPitch = this.shouldCorrectPitch;
    webMediaSession.updatePositionState(this);
  }

  setAudioSamplingEnabled(enabled: boolean): void {
    if (enabled) {
      // A cross-origin source without CORS taints the graph: the analyser would
      // read silence, so report sampling as unsupported instead.
      if (!this.media.crossOrigin && this.isCrossOrigin()) {
        this.isAudioSamplingSupported = false;
        return;
      }
      if (this.analyser) return;
      const ctx = getSharedAudioContext();
      if (ctx.state === "suspended") void ctx.resume();
      this.sourceNode ??= ctx.createMediaElementSource(this.media);
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 2048;
      this.sourceNode.disconnect();
      this.sourceNode.connect(this.analyser);
      this.analyser.connect(ctx.destination);
      // A waveform buffer is fftSize long (frequencyBinCount would truncate it).
      this.samplingBuffer = new Float32Array(this.analyser.fftSize);
      this.samplingEnabled = true;
      if (this.isPlaying) this.startSampling();
      this.isAudioSamplingSupported = true;
      return;
    }
    this.stopSampling();
    if (this.analyser) {
      this.analyser.disconnect();
      this.analyser = null;
    }
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode.connect(getSharedAudioContext().destination);
    }
    this.samplingBuffer = null;
    this.samplingEnabled = false;
  }

  setActiveForLockScreen(
    active: boolean,
    metadata?: AudioMetadata,
    options?: AudioLockScreenOptions,
  ): void {
    if (active) webMediaSession.setActivePlayer(this, metadata, options);
    else webMediaSession.clear(this);
  }

  updateLockScreenMetadata(metadata: AudioMetadata): void {
    webMediaSession.updateMetadata(this, metadata);
  }

  clearLockScreenControls(): void {
    webMediaSession.clear(this);
  }

  /** Tear the element down (the player stays usable via {@link replace}). */
  remove(): void {
    webMediaSession.clear(this);
    this.stopSampling();
    this.analyser?.disconnect();
    this.analyser = null;
    this.sourceNode?.disconnect();
    this.sourceNode = null;
    this.samplingEnabled = false;
    this.media.pause();
    this.media.ontimeupdate = null;
    this.media.onplay = null;
    this.media.onpause = null;
    this.media.onseeked = null;
    this.media.onended = null;
    this.media.onloadeddata = null;
    this.media.onerror = null;
    this.media.removeAttribute("src");
    this.media.load();
    activeWebPlayers.delete(this);
  }

  release(): void {
    this.remove();
  }

  private startSampling(): void {
    if (!this.samplingEnabled || !this.analyser || !this.samplingBuffer) return;
    const loop = () => {
      if (!this.analyser || !this.samplingBuffer) return;
      this.analyser.getFloatTimeDomainData(this.samplingBuffer);
      this.emit(AUDIO_SAMPLE_UPDATE, {
        channels: [{ frames: Array.from(this.samplingBuffer) }],
        timestamp: this.media.currentTime,
      });
      this.samplingFrameId = requestAnimationFrame(loop);
    };
    this.samplingFrameId = requestAnimationFrame(loop);
  }

  private stopSampling(): void {
    if (this.samplingFrameId != null) {
      cancelAnimationFrame(this.samplingFrameId);
      this.samplingFrameId = null;
    }
  }

  private isCrossOrigin(): boolean {
    try {
      return new URL(this.media.src).origin !== window.location.origin;
    } catch {
      return false;
    }
  }

  private createMediaElement(): HTMLAudioElement {
    const uri = mediaSourceUri(this.src);
    const cached = uri ? webPreloadCache.get(uri)?.blobUrl : undefined;
    // No `Audio` on a server render: an inert, idle stand-in (`inertMediaElement`).
    const media =
      typeof Audio === "undefined"
        ? inertMediaElement(cached ?? uri)
        : new Audio(cached ?? uri ?? undefined);
    if (this.crossOrigin !== undefined) media.crossOrigin = this.crossOrigin;
    let lastEmit = 0;
    const intervalSec = this.interval / 1000;
    const status = (patch?: Partial<WebAudioStatus>) =>
      this.emit(PLAYBACK_STATUS_UPDATE, { ...statusOf(media, this.id), ...patch });

    media.ontimeupdate = () => {
      const now = media.currentTime;
      if (now < lastEmit) lastEmit = now; // looped or seeked back
      if (now - lastEmit >= intervalSec) {
        lastEmit = now;
        status();
        webMediaSession.updatePositionState(this);
      }
    };
    media.onplay = () => {
      this.isPlaying = true;
      lastEmit = media.currentTime;
      status({ playing: true });
      webMediaSession.updatePlaybackState(this);
      webMediaSession.updatePositionState(this);
    };
    media.onpause = () => {
      this.isPlaying = false;
      lastEmit = media.currentTime;
      status({ playing: false });
      webMediaSession.updatePlaybackState(this);
      webMediaSession.updatePositionState(this);
    };
    media.onseeked = () => {
      lastEmit = media.currentTime;
      status();
      webMediaSession.updatePositionState(this);
    };
    media.onended = () => {
      lastEmit = 0;
      webMediaSession.updatePlaybackState(this);
    };
    media.onloadeddata = () => {
      this.loaded = true;
      lastEmit = media.currentTime;
      status({ isLoaded: true });
      webMediaSession.updatePositionState(this);
    };
    media.onerror = () => {
      this.loaded = false;
      this.isPlaying = false;
      status({
        isLoaded: false,
        playing: false,
        error: media.error ? `Playback error (code ${media.error.code})` : "Unknown playback error",
      });
    };
    return media;
  }
}
