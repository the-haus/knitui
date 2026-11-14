import { useReleasingSharedObjectWithLifecycle } from "expo-modules-core";
import { useState } from "react";

import { getAudioContext } from "../audio/AudioUtils.web";
import {
  detachHls,
  type HlsSourceOptions,
  needsHlsLibrary,
  syncHlsSource,
} from "../shared/hls.web";
import resolveAssetSource from "./resolveAssetSource";
import type {
  AudioMixingMode,
  AudioTrack,
  BufferOptions,
  PlayerBuilderOptions,
  PlayerError,
  ScrubbingModeOptions,
  SeekTolerance,
  SubtitleTrack,
  VideoPlayer,
  VideoPlayerStatus,
  VideoSize,
  VideoSource,
  VideoTrack,
} from "./VideoPlayer.types";
import type { VideoPlayerEvents } from "./VideoPlayerEvents.types";
import type { VideoThumbnail } from "./VideoThumbnail";

/** The one Web Audio source node each sampled `<video>` owns for its lifetime. */
const samplerSources = new WeakMap<HTMLVideoElement, MediaElementAudioSourceNode>();

function isCrossOrigin(src: string): boolean {
  try {
    return new URL(src, window.location.href).origin !== window.location.origin;
  } catch {
    return false;
  }
}

export function useVideoPlayer(
  source: VideoSource,
  setup?: (player: VideoPlayer) => void,
  _playerBuilderOptions?: PlayerBuilderOptions,
): VideoPlayer {
  const parsedSource = typeof source === "string" ? { uri: source } : source;
  const [forceRecreateCount, setForceRecreateCount] = useState(0);

  return useReleasingSharedObjectWithLifecycle(
    {
      factory: () => {
        const player = new VideoPlayerWeb(parsedSource);
        setup?.(player);
        return player;
      },
      shouldRecreate: (_player, { previousDependencies, dependencies }) => {
        // Recreate if replaceAsync failed ([1]).
        return previousDependencies[1] !== dependencies[1];
      },
      update: (player) => {
        // Source ([0]) changed — use replaceAsync; fall back to recreate on failure.
        return player.replaceAsync(parsedSource).catch(() => {
          setForceRecreateCount((c) => c + 1);
        });
      },
    },
    [JSON.stringify(source), forceRecreateCount], // [0] source, [1] recreate counter
  );
}

/**
 * Put the source's `crossOrigin` on the element before its `src` changes: the
 * attribute only takes effect for a load that starts after it is set. A source
 * object without one leaves the element as the view rendered it.
 */
function applyCrossOrigin(video: HTMLVideoElement, source?: VideoSource): void {
  const crossOrigin =
    source && typeof source === "object"
      ? (source as { crossOrigin?: "anonymous" | "use-credentials" }).crossOrigin
      : undefined;
  if (crossOrigin) {
    if (!renderedCrossOrigin.has(video)) renderedCrossOrigin.set(video, video.crossOrigin);
    video.crossOrigin = crossOrigin;
  } else if (renderedCrossOrigin.has(video)) {
    // The previous source put its own value on the element. This one has none, so
    // the view's value comes back: a server without CORS headers refuses a load
    // that still asks for them.
    video.crossOrigin = renderedCrossOrigin.get(video) ?? null;
    renderedCrossOrigin.delete(video);
  }
}

/** What the view rendered on an element, while a source's `crossOrigin` overrides it. */
const renderedCrossOrigin = new WeakMap<HTMLVideoElement, string | null>();

/** What the HLS adapter needs to know about a source besides its URI. */
function hlsOptions(source?: VideoSource): HlsSourceOptions {
  if (!source || typeof source !== "object") return {};
  return { contentType: source.contentType, headers: source.headers };
}

/**
 * The `src` for the `<video>` attribute: nothing for a stream that hls.js has to
 * play, since the raw playlist URL would only make the element report an error
 * before the library attaches.
 */
export function getElementSrc(source?: VideoSource): string | undefined {
  const uri = getSourceUri(source);
  if (!uri || needsHlsLibrary(uri, hlsOptions(source).contentType)) return undefined;
  return uri;
}

export function getSourceUri(source?: VideoSource): string | null {
  if (typeof source === "string") {
    return source;
  }
  if (typeof source === "number") {
    return resolveAssetSource(source)?.uri ?? null;
  }
  if (typeof source?.assetId === "number" && !source?.uri) {
    return resolveAssetSource(source.assetId)?.uri ?? null;
  }

  return source?.uri ?? null;
}

export function createVideoPlayer(source: VideoSource): VideoPlayer {
  const parsedSource = typeof source === "string" ? { uri: source } : source;

  return new VideoPlayerWeb(parsedSource);
}

export default class VideoPlayerWeb
  extends globalThis.expo.SharedObject<VideoPlayerEvents>
  implements VideoPlayer
{
  constructor(source: VideoSource) {
    super();
    this.src = source;
  }

  src: VideoSource = null;
  previousSrc: VideoSource = null;
  _mountedVideos: Set<HTMLVideoElement> = new Set();
  _audioNodes: Set<MediaElementAudioSourceNode> = new Set();
  playing: boolean = false;
  _muted: boolean = false;
  _volume: number = 1;
  _loop: boolean = false;
  _playbackRate: number = 1.0;
  _preservesPitch: boolean = true;
  _status: VideoPlayerStatus = "idle";
  _error: PlayerError | null = null;
  _timeUpdateLoop: ReturnType<typeof setTimeout> | null = null;
  _timeUpdateEventInterval: number = 0;
  audioMixingMode: AudioMixingMode = "auto"; // Not supported on web. Dummy to match the interface.
  allowsExternalPlayback: boolean = false; // Not supported on web. Dummy to match the interface.
  staysActiveInBackground: boolean = false; // Not supported on web. Dummy to match the interface.
  showNowPlayingNotification: boolean = false; // Not supported on web. Dummy to match the interface.
  currentLiveTimestamp: number | null = null; // Not supported on web. Dummy to match the interface.
  currentOffsetFromLive: number | null = null; // Not supported on web. Dummy to match the interface.
  targetOffsetFromLive: number = 0; // Not supported on web. Dummy to match the interface.
  bufferOptions: BufferOptions = {} as BufferOptions; // Not supported on web. Dummy to match the interface.
  subtitleTrack: SubtitleTrack | null = null; // Embedded subtitles are not supported by the html web player. Dummy to match the interface.
  availableSubtitleTracks: SubtitleTrack[] = []; // Embedded subtitles are not supported by the html web player. Dummy to match the interface.
  audioTrack: AudioTrack | null = null; // Not supported on web. Dummy to match the interface.
  availableAudioTracks: AudioTrack[] = []; // Not supported on web. Dummy to match the interface.
  videoTrack: VideoTrack | null = null; // Not supported on web. Dummy to match the interface.
  availableVideoTracks: VideoTrack[] = []; // Not supported on web. Dummy to match the interface.
  maxResolution: VideoSize | null = null; // Not supported on web. Dummy to match the interface.
  isExternalPlaybackActive: boolean = false; // Not supported on web. Dummy to match the interface.
  keepScreenOnWhilePlaying: boolean = false; // Not supported on web. Dummy to match the interface
  seekTolerance: SeekTolerance = {} as SeekTolerance; // Not supported on web. Dummy to match the interface.
  scrubbingModeOptions: ScrubbingModeOptions = {} as ScrubbingModeOptions; // Not supported on web. Dummy to match the interface.

  set muted(value: boolean) {
    this._mountedVideos.forEach((video) => {
      video.muted = value;
    });
    this._muted = value;
  }

  get muted(): boolean {
    return this._muted;
  }

  set playbackRate(value: number) {
    this._mountedVideos.forEach((video) => {
      video.playbackRate = value;
    });
    this._playbackRate = value;
  }

  get playbackRate(): number {
    return this._playbackRate;
  }

  get isLive(): boolean {
    return [...this._mountedVideos][0]?.duration === Infinity;
  }

  set volume(value: number) {
    this._mountedVideos.forEach((video) => {
      video.volume = value;
    });
    this._volume = value;
  }

  get volume(): number {
    return this._volume;
  }

  set loop(value: boolean) {
    this._mountedVideos.forEach((video) => {
      video.loop = value;
    });
    this._loop = value;
  }

  get loop(): boolean {
    return this._loop;
  }

  get currentTime(): number {
    // All videos should be synchronized, so we return the position of the first video.
    return [...this._mountedVideos][0]?.currentTime ?? 0;
  }

  set currentTime(value: number) {
    this._mountedVideos.forEach((video) => {
      video.currentTime = value;
    });
  }

  get duration(): number {
    // All videos should have the same duration, so we return the duration of the first video.
    return [...this._mountedVideos][0]?.duration ?? 0;
  }

  get preservesPitch(): boolean {
    return this._preservesPitch;
  }

  set preservesPitch(value: boolean) {
    this._mountedVideos.forEach((video) => {
      video.preservesPitch = value;
    });
    this._preservesPitch = value;
  }

  get timeUpdateEventInterval(): number {
    return this._timeUpdateEventInterval;
  }
  set timeUpdateEventInterval(value: number) {
    this._timeUpdateEventInterval = value;
    if (this._timeUpdateLoop) {
      clearInterval(this._timeUpdateLoop);
    }
    if (value > 0) {
      // Emit the first event immediately like on other platforms
      this.emit("timeUpdate", {
        currentTime: this.currentTime,
        currentLiveTimestamp: null,
        currentOffsetFromLive: null,
        bufferedPosition: this.bufferedPosition,
      });

      this._timeUpdateLoop = setInterval(() => {
        this.emit("timeUpdate", {
          currentTime: this.currentTime,
          currentLiveTimestamp: null,
          currentOffsetFromLive: null,
          bufferedPosition: this.bufferedPosition,
        });
      }, value * 1000);
    }
  }

  get status(): VideoPlayerStatus {
    return this._status;
  }

  get bufferedPosition(): number {
    if (this._mountedVideos.size === 0 || this.status === "error") {
      return -1;
    }
    const buffered = [...this._mountedVideos][0]?.buffered;
    if (buffered != null) {
      for (let i = 0; i < buffered.length; i++) {
        if (buffered.start(i) <= this.currentTime && buffered.end(i) >= this.currentTime) {
          return buffered.end(i);
        }
      }
    }
    return 0;
  }

  private set status(value: VideoPlayerStatus) {
    if (this._status === value) return;

    if (value === "error" && this._error) {
      this.emit("statusChange", {
        status: value,
        oldStatus: this._status,
        error: this._error,
      });
    } else {
      this.emit("statusChange", {
        status: value,
        oldStatus: this._status,
      });
      this._error = null;
    }
    this._status = value;
  }

  mountVideoView(video: HTMLVideoElement) {
    // The video will be the first video, it should inherit the properties set in the setup() function
    if (this._mountedVideos.size === 0) {
      video.preservesPitch = this._preservesPitch;
      video.loop = this._loop;
      video.volume = this._volume;
      video.muted = this._muted;
      video.playbackRate = this._playbackRate;
    }
    this._mountedVideos.add(video);
    this._addListeners(video);
    // The view leaves `src` off for a stream hls.js has to play (see VideoView).
    syncHlsSource(video, getSourceUri(this.src), hlsOptions(this.src));
    this._synchronizeWithFirstVideo(video);
    this._syncSampler();
  }

  unmountVideoView(video: HTMLVideoElement) {
    detachHls(video);
    this._mountedVideos.delete(video);
    this._syncSampler();
  }

  mountAudioNode(
    audioContext: AudioContext,
    zeroGainNode: GainNode,
    audioSourceNode: MediaElementAudioSourceNode,
  ): void {
    if (!audioContext || !zeroGainNode) return;

    this._audioNodes.add(audioSourceNode);
    // First mounted video should be connected to the audio context. All other videos have to be muted.
    if (this._audioNodes.size === 1) {
      audioSourceNode.connect(audioContext.destination);
    } else {
      audioSourceNode.connect(zeroGainNode);
    }
  }

  unmountAudioNode(
    video: HTMLVideoElement,
    audioContext: AudioContext,
    audioSourceNode: MediaElementAudioSourceNode,
  ) {
    const mountedVideos = [...this._mountedVideos];
    const videoPlayingAudio = mountedVideos[0];
    this._audioNodes.delete(audioSourceNode);
    audioSourceNode.disconnect();

    // If video playing audio has been removed, select a new video to be the audio player by disconnecting it from the mute node.
    if (videoPlayingAudio === video && this._audioNodes.size > 0 && audioContext) {
      const newMainAudioSource = [...this._audioNodes][0];

      if (newMainAudioSource != null) {
        newMainAudioSource.disconnect();
        newMainAudioSource.connect(audioContext.destination);
      }
    }
  }

  play(): void {
    this._mountedVideos.forEach((video) => {
      video.play();
    });
  }

  pause(): void {
    this._mountedVideos.forEach((video) => {
      video.pause();
    });
  }

  replace(source: VideoSource): void {
    this._mountedVideos.forEach((video) => {
      const uri = getSourceUri(source);
      video.pause();
      applyCrossOrigin(video, source);
      if (uri) {
        // An HLS stream this browser can't play itself goes through hls.js, which
        // owns the element's `src` from here on.
        if (syncHlsSource(video, uri, hlsOptions(source))) {
          // hls.js attaches once its chunk has loaded. Empty the element now, or
          // `play()` below would resume the previous source in the meantime. On
          // an empty element `play()` only records the intent, and the stream
          // starts when hls.js attaches it.
          video.removeAttribute("src");
          video.load();
        } else {
          video.setAttribute("src", uri);
          video.load();
        }
        video.play();
      } else {
        detachHls(video);
        video.removeAttribute("src");
        video.load();
      }
    });
    // TODO @behenate: this won't work when we add support for playlists
    this.previousSrc = this.src;
    this.src = source;
    this.playing = true;
    // The new source may be readable where the old one was not (or the reverse).
    this._syncSampler();
  }

  // The HTML5 player already offloads loading of the asset onto a different thread so we can keep the same
  // implementation until `replace` is deprecated and removed.
  async replaceAsync(source: VideoSource): Promise<void> {
    return this.replace(source);
  }

  seekBy(seconds: number): void {
    this._mountedVideos.forEach((video) => {
      video.currentTime += seconds;
    });
  }

  replay(): void {
    this._mountedVideos.forEach((video) => {
      video.currentTime = 0;
      video.play();
    });
    this.playing = true;
  }

  /* audio sampling ---------------------------------------------------------- */

  private _samplingEnabled = false;
  private _sampler: { video: HTMLVideoElement; analyser: AnalyserNode } | null = null;

  setAudioSamplingEnabled(enabled: boolean): void {
    this._samplingEnabled = enabled;
    this._syncSampler();
  }

  readAudioSamples(target: Float32Array): number {
    const sampler = this._sampler;
    if (!sampler || sampler.video.paused) {
      return 0;
    }
    sampler.analyser.getFloatTimeDomainData(target as Float32Array<ArrayBuffer>);
    return Math.min(target.length, sampler.analyser.fftSize);
  }

  /**
   * Keeps the analyser on the video that carries the audio (the first mounted one),
   * following it across mounts. A cross-origin source without CORS is left alone:
   * routing it through Web Audio would silence it.
   */
  _syncSampler(): void {
    const video = [...this._mountedVideos][0];
    if (this._sampler && (!this._samplingEnabled || this._sampler.video !== video)) {
      this._sampler.analyser.disconnect();
      this._sampler = null;
    }
    if (!this._samplingEnabled || !video || this._sampler) {
      return;
    }
    if (!video.crossOrigin && isCrossOrigin(video.currentSrc || video.src)) {
      return;
    }
    const viewNode = [...this._audioNodes][0];
    let source = viewNode ?? samplerSources.get(video);
    if (!source) {
      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        void ctx.resume();
      }
      // An element can only ever have one source node, and from here on its sound
      // plays through this graph: keep the node and keep it connected.
      source = ctx.createMediaElementSource(video);
      source.connect(ctx.destination);
      samplerSources.set(video, source);
    }
    const analyser = source.context.createAnalyser();
    analyser.fftSize = 2048;
    source.connect(analyser);
    this._sampler = { video, analyser };
  }

  generateThumbnailsAsync(times: number | number[]): Promise<VideoThumbnail[]> {
    throw new Error("Generating video thumbnails is not supported on Web yet");
  }

  _synchronizeWithFirstVideo(video: HTMLVideoElement): void {
    const firstVideo = [...this._mountedVideos][0];
    if (!firstVideo) return;

    if (firstVideo.paused) {
      video.pause();
    } else {
      video.play();
    }
    video.currentTime = firstVideo.currentTime;
    video.volume = firstVideo.volume;
    video.muted = firstVideo.muted;
    video.playbackRate = firstVideo.playbackRate;
  }

  /**
   * If there are multiple mounted videos, all of them will emit an event, as they are synchronised.
   * We want to avoid this, so we only emit the event if it came from the first video.
   */
  _emitOnce<EventName extends keyof VideoPlayerEvents>(
    eventSource: HTMLVideoElement,
    eventName: EventName,
    ...args: Parameters<VideoPlayerEvents[EventName]>
  ): void {
    const mountedVideos = [...this._mountedVideos];
    if (mountedVideos[0] === eventSource) {
      this.emit(eventName, ...args);
    }
  }

  _addListeners(video: HTMLVideoElement): void {
    video.onplay = (e) => {
      this._emitOnce(video, "playingChange", {
        isPlaying: true,
        oldIsPlaying: this.playing,
      });
      this.playing = true;
      this._mountedVideos.forEach((mountedVideo) => {
        if (e.target !== mountedVideo) {
          mountedVideo.play();
        }
      });
    };

    video.onpause = (e) => {
      this._emitOnce(video, "playingChange", {
        isPlaying: false,
        oldIsPlaying: this.playing,
      });
      this.playing = false;
      this._mountedVideos.forEach((mountedVideo) => {
        if (e.target !== mountedVideo) {
          mountedVideo.pause();
        }
      });
    };

    video.onvolumechange = () => {
      this._emitOnce(video, "volumeChange", { volume: video.volume, oldVolume: this.volume });
      this._emitOnce(video, "mutedChange", { muted: video.muted, oldMuted: this.muted });
      this.volume = video.volume;
      this.muted = video.muted;
    };

    video.onseeking = () => {
      this._mountedVideos.forEach((mountedVideo) => {
        if (mountedVideo === video || mountedVideo.currentTime === video.currentTime) return;
        mountedVideo.currentTime = video.currentTime;
      });
    };

    video.onseeked = () => {
      this._mountedVideos.forEach((mountedVideo) => {
        if (mountedVideo === video || mountedVideo.currentTime === video.currentTime) return;
        mountedVideo.currentTime = video.currentTime;
      });
    };

    video.onratechange = () => {
      this._emitOnce(video, "playbackRateChange", {
        playbackRate: video.playbackRate,
        oldPlaybackRate: this.playbackRate,
      });
      this._mountedVideos.forEach((mountedVideo) => {
        if (mountedVideo.playbackRate === video.playbackRate) return;
        this._playbackRate = video.playbackRate;
        mountedVideo.playbackRate = video.playbackRate;
      });
      this._playbackRate = video.playbackRate;
    };

    video.onerror = () => {
      this._error = {
        message: video.error?.message ?? "Unknown player error",
      };
      this.status = "error";
    };

    video.oncanplay = () => {
      const allCanPlay = [...this._mountedVideos].reduce((previousValue, video) => {
        return previousValue && video.readyState >= 3;
      }, true);
      if (!allCanPlay) return;

      this.status = "readyToPlay";
    };

    video.onwaiting = () => {
      if (this._status === "loading") return;
      this.status = "loading";
    };

    video.onended = () => {
      this._emitOnce(video, "playToEnd");
    };

    video.onloadstart = () => {
      this._emitOnce(video, "sourceChange", { source: this.src, oldSource: this.previousSrc });
    };
  }
}
