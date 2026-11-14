/**
 * The {@link AudioController} backend over an `expo-audio` `AudioPlayer`. This is
 * cross-platform: `expo-audio` resolves to its native module on device and to its
 * `.web` backend (`HTMLAudioElement` + Web Audio + `MediaSessionController`) in
 * the browser, so the same wrapper drives both — there is no hand-written web
 * player anymore.
 *
 * The player is created and disposed by the engine / hook; this controller only
 * wraps it, binds its events, and maps them onto the shared snapshot. All status
 * flows through a single `playbackStatusUpdate` event carrying an `AudioStatus`;
 * waveform data is pulled from the player's tap by a {@link SamplePump} (the
 * AudioWorklet sampler is reserved for the mic-sourced meter / live-stream sites,
 * which never touch this player element).
 */
import { isWeb } from "@knitui/core";
import type {
  AudioPlayer,
  AudioStatus,
  AudioSource as ExpoAudioSource,
} from "@knitui/media/native/audio";

import { clampSeekTarget, clampVolume, StallWatch } from "../../core/playback";
import { SamplePump } from "../../core/sample-pump";
import { STREAM_STALL_MESSAGE, STREAM_STALL_TIMEOUT_MS } from "../../shared";
import { NATIVE_CAPABILITIES, resolveWebRuntimeCapabilities } from "../engine";
import type {
  AudioCapabilities,
  AudioError,
  AudioLockScreenOptions,
  AudioMetadata,
  AudioPlaybackStatus,
  AudioPlayerConfig,
  AudioSource,
  PitchCorrectionQuality,
} from "../types";
import { BaseAudioController } from "./audio-controller-base";

interface ExpoSubscription {
  remove(): void;
}

/**
 * expo-audio's `AudioMetadata` carries the cover image under `artworkUrl`; our
 * canonical field is `artwork`. Map `artwork` onto `artworkUrl` before handing
 * metadata to the native player (falling back to the deprecated `artworkUrl`).
 */
function toExpoMetadata(metadata?: AudioMetadata): AudioMetadata | undefined {
  if (!metadata) return metadata;
  const artworkUrl = metadata.artwork ?? metadata.artworkUrl;
  return artworkUrl ? { ...metadata, artworkUrl } : metadata;
}

/**
 * The pitch-correction state to assume on WEB before anything sets it.
 *
 * `HTMLMediaElement.preservesPitch` defaults to `true` in every browser, and
 * expo's web backend does not touch it until the first `setPlaybackRate` — so
 * correction really is on. (Its own `player.shouldCorrectPitch` field initializes
 * to `false` and describes nothing until that first call, which is why we do NOT
 * seed from it on web.) Matches `AudioPlayerConfig.shouldCorrectPitch`'s
 * documented default and native's `AudioPlayer.swift` default.
 */
const WEB_DEFAULT_PITCH_CORRECTION = true;

/** The initial pitch-correction state, per platform (see the constant above). */
function initialPitchCorrection(config: AudioPlayerConfig, player: AudioPlayer): boolean {
  if (config.shouldCorrectPitch != null) return config.shouldCorrectPitch;
  return isWeb ? WEB_DEFAULT_PITCH_CORRECTION : (player.shouldCorrectPitch ?? true);
}

/** The element events that mean a stall is over. */
const RESUMED_EVENTS = ["playing", "canplay", "pause", "ended"] as const;

const STREAM_FAILURE_MESSAGE = "The connection was lost before the track finished.";

/**
 * Whether a "finished" report really means the stream gave out. AVFoundation treats
 * a connection that dies for good as the end of the file. The margin is wide because
 * a length read from an MP3 header can be off, and a track that simply finished must
 * never read as a failure.
 */
function endedEarly(stoppedAt: number, status: AudioStatus): boolean {
  if (status.isLive || !(status.duration > 0)) return false;
  return status.duration - stoppedAt > Math.max(5, status.duration * 0.1);
}

export class ExpoAudioController extends BaseAudioController {
  // On web, refine with the live browser probes (iOS volume lock, MediaSession,
  // Web Audio availability); native exposes the full feature set.
  readonly capabilities: AudioCapabilities = isWeb
    ? resolveWebRuntimeCapabilities()
    : NATIVE_CAPABILITIES;

  /** The wrapped expo-audio player. */
  readonly player: AudioPlayer;
  private subscriptions: ExpoSubscription[] = [];
  /**
   * The sampling loop. It pulls the newest window from the player once per display
   * frame, straight into a reused `Float32Array`, and only while a `sampleUpdate`
   * listener is attached: `setSamplingEnabled` is driven by mount effects that can
   * outlive the visualizer, and an armed sampler nobody reads must cost nothing.
   */
  private readonly samplePump = new SamplePump(
    (target) => this.player.readAudioSamples(target),
    () => this.hasListeners("sampleUpdate"),
    () => this._state.currentTime,
    (sample) => this.emitSample(sample),
  );
  private lastSource: AudioSource;
  /** The id this player's own status updates carry — adopted from its first event. */
  private ownStatusId: string | null = null;
  /**
   * The standing PLAY INTENT: whether playback has been asked for, independent of
   * whether sound is coming out right now. Backends report `playing: false` for as
   * long as they're rebuffering, which on its own would flip the toggle to "Play"
   * (so pressing it could never pause) and drop the mid-playback spinner.
   */
  private wantsPlay = false;
  /** `playing` as last reported by the backend, to spot a pause it made on its own. */
  private backendPlaying = false;
  /** Bumped to abandon a replay whose seek is still in flight. */
  private replayToken = 0;
  /** A seek made before the source has loaded, applied once it has. */
  private pendingSeek: number | null = null;
  /** Set when a stream gave out mid-track; stands even though the item stays loaded. */
  private streamFailure: AudioError | null = null;
  /**
   * Set by a load, until the new source reports itself loaded. A finish reported
   * before that is the replaced source's, arriving late: read against the new
   * track's position it would look like a stream that gave out.
   */
  private finishIsStale = false;
  /**
   * The status objects already ingested. iOS hands the SAME object to the
   * constructor's listener and, a render later, to the status bridge; the second
   * delivery can land after a finish has already moved a playlist on, so it must be
   * a true no-op, which the snapshot's own de-dupe cannot promise once the state has
   * changed in between.
   */
  private ingested = new WeakSet<object>();
  /**
   * Whether the backend has reported playing since play was last asked for, and
   * whether the request has been repeated. AVFoundation can drop a play made as a
   * track ends (its own pause-at-end lands after it), leaving the next track loaded
   * and silent: a request still standing when the source reports loaded, idle and
   * not buffering is made once more.
   */
  private playHonoured = false;
  private playRepeated = false;
  /** WEB: expo's backend never sets `isBuffering`, so the element's events do. */
  private elementBuffering = false;
  private detachElement: (() => void) | null = null;
  private readonly stallWatch = new StallWatch(STREAM_STALL_TIMEOUT_MS, () =>
    this.failStalledStream(),
  );

  constructor(
    player: AudioPlayer,
    config: AudioPlayerConfig = {},
    initialSource: AudioSource = null,
  ) {
    super({
      volume: config.volume ?? player.volume ?? 1,
      muted: config.muted ?? player.muted ?? false,
      playbackRate: config.playbackRate ?? player.playbackRate ?? 1,
      shouldCorrectPitch: initialPitchCorrection(config, player),
      loop: config.loop ?? player.loop ?? false,
    });
    this.player = player;
    this.lastSource = initialSource;
    this.applyCrossOrigin(initialSource);
    if (config.loop != null) player.loop = config.loop;
    if (config.muted != null) player.muted = config.muted;
    if (config.volume != null) player.volume = config.volume;
    if (config.playbackRate != null) {
      player.setPlaybackRate(config.playbackRate);
    }
    if (config.shouldCorrectPitch != null) player.shouldCorrectPitch = config.shouldCorrectPitch;
    this.bindEvents();
    this.bindElementBuffering();
    this.syncFromPlayer();
    if (config.autoPlay) this.play();
  }

  /* event binding ----------------------------------------------------------- */

  private bindEvents(): void {
    const p = this.player;
    // Imperative subscription. This works on web + Android, but on iOS a listener
    // attached to an imperatively-created `createAudioPlayer` player OFF the React
    // render phase (the engine builds this controller inside the provider's
    // `useMemo`) never receives `playbackStatusUpdate` — playback runs but no
    // status ever reaches JS, freezing the whole snapshot. So on iOS the status is
    // ALSO driven from a commit-phase hook via {@link applyStatus} (see
    // `<AudioStatusBridge>`). Where both feeds deliver (seen on iOS with expo-audio
    // 58: the same status object, the bridge a render behind), `applyStatus` takes
    // each object once.
    this.subscriptions.push(
      p.addListener("playbackStatusUpdate", (status: AudioStatus) => this.applyStatus(status)),
    );
  }

  /**
   * WEB: report stalls from the `<audio>` element. expo's web backend hardcodes
   * `isBuffering` to false and goes quiet when time stops advancing, so without this
   * a stalled stream looks like it's playing. `replace` builds a new element, hence
   * the re-bind from {@link load}.
   */
  private bindElementBuffering(): void {
    this.stallWatch.clear();
    this.detachElement?.();
    this.detachElement = null;
    this.elementBuffering = false;
    const media = (this.player as { media?: HTMLMediaElement }).media;
    if (!isWeb || !media?.addEventListener) return;
    const update = (buffering: boolean): void => {
      this.elementBuffering = buffering;
      this.stallWatch.clear();
      if (buffering && this.wantsPlay) this.stallWatch.arm();
      this.setState({ isBuffering: buffering });
    };
    const onWaiting = (): void => update(true);
    const onResumed = (): void => update(false);
    media.addEventListener("waiting", onWaiting);
    for (const type of RESUMED_EVENTS) media.addEventListener(type, onResumed);
    this.detachElement = () => {
      media.removeEventListener("waiting", onWaiting);
      for (const type of RESUMED_EVENTS) media.removeEventListener(type, onResumed);
    };
  }

  private failStalledStream(): void {
    this.elementBuffering = false;
    this.streamFailure = { message: STREAM_STALL_MESSAGE };
    this.player.pause();
    this.setState({
      status: "error",
      error: this.streamFailure,
      playing: false,
      isBuffering: false,
    });
  }

  /**
   * Feed a backend `AudioStatus` into the snapshot. Public so a React status
   * bridge can drive it on iOS, where the constructor-attached `addListener`
   * may not deliver events (see {@link bindEvents}). Idempotent per status object,
   * so the imperative listener and the bridge can both call it.
   *
   * Same-file isolation: ignore a SIBLING player's status leaking onto a shared
   * bus (the web backend, two players from the same source). We adopt the id from
   * the first status and drop later ones bearing a DIFFERENT id — EXCEPT we also
   * (re-)adopt whenever the id matches our own live `player.id`, so a backend that
   * rotates the payload id across `replace()` can never permanently freeze the one
   * shared player. We can't gate on `player.id` ALONE: the web backend ships a
   * payload id that never equals `player.id`, hence the first-event adoption.
   */
  applyStatus(status: AudioStatus): void {
    const id = status?.id;
    if (id != null) {
      if (id === this.player.id || this.ownStatusId == null) this.ownStatusId = id;
      else if (id !== this.ownStatusId) return;
    }
    // One delivery per status object, however many feeds carry it.
    if (status != null && typeof status === "object") {
      if (this.ingested.has(status)) return;
      this.ingested.add(status);
    }
    this.ingestStatus(status);
  }

  private ingestStatus(status: AudioStatus): void {
    if (this.finishIsStale) {
      // The finish of the source this load replaced, not of the one loading.
      if (status.didJustFinish) return;
      if (status.isLoaded) this.finishIsStale = false;
    }
    // A backend reports an error once, and follows it with statuses that simply
    // don't mention it. It stands until the source loads (a `replace`/`retry` clears
    // it explicitly), otherwise a dead URL reads as "loading" forever.
    const failure = status.error ? { message: status.error } : this._state.error;
    const stoppedAt = this.player.currentTime;
    if (status.didJustFinish && endedEarly(stoppedAt, status)) {
      this.streamFailure = { message: STREAM_FAILURE_MESSAGE };
    }
    const cutShort = this.streamFailure !== null;
    const error: AudioError | null =
      this.streamFailure ?? (status.isLoaded && !status.error ? null : failure);
    const buffering = !error && (status.isBuffering || this.elementBuffering);
    const stoppedByBackend =
      this.backendPlaying && !status.playing && !status.isBuffering && status.isLoaded;
    if (status.didJustFinish || (stoppedByBackend && !error)) this.wantsPlay = false;
    this.backendPlaying = status.playing;
    // Translate the backend status into the snapshot; the granular events
    // (statusChange / playingChange / volumeChange / playbackRateChange /
    // durationChange / timeUpdate / playToEnd / error) all fan out from the diff
    // in BaseMediaController.deriveEvents — this adapter never hand-emits them.
    this.setState({
      status: mapStatus(status, error),
      playing: !error && (status.playing || (this.wantsPlay && (buffering || !status.isLoaded))),
      currentTime: cutShort ? stoppedAt : status.currentTime,
      duration: status.duration,
      muted: status.mute,
      loop: status.loop,
      playbackRate: status.playbackRate,
      shouldCorrectPitch: status.shouldCorrectPitch,
      isBuffering: buffering,
      isLoaded: status.isLoaded,
      isLive: status.isLive,
      ended: !cutShort && (status.didJustFinish || (this._state.ended && !status.playing)),
      error,
    });
    if (status.playing) {
      this.playHonoured = true;
    } else if (
      this.wantsPlay &&
      !this.playHonoured &&
      !this.playRepeated &&
      !error &&
      status.isLoaded &&
      !buffering &&
      !status.didJustFinish
    ) {
      this.playRepeated = true;
      this.player.play();
    }
    if (status.isLoaded && this.pendingSeek !== null) {
      const target = this.pendingSeek;
      this.pendingSeek = null;
      void this.seekTo(target);
    }
  }

  private syncFromPlayer(): void {
    const p = this.player;
    this.setState({
      status: p.isLoaded ? "readyToPlay" : "loading",
      playing: p.playing,
      currentTime: p.currentTime,
      duration: p.duration,
      volume: p.volume,
      muted: p.muted,
      playbackRate: p.playbackRate,
      shouldCorrectPitch: p.shouldCorrectPitch,
      loop: p.loop,
      isBuffering: p.isBuffering,
      isLoaded: p.isLoaded,
    });
  }

  /* imperative API ---------------------------------------------------------- */

  play(): void {
    if (this._state.ended) {
      this.replay();
      return;
    }
    this.wantsPlay = true;
    if (this._state.status === "error") {
      this.retry();
      return;
    }
    this.requestPlay();
  }

  /** Ask the backend to play, and watch for it being honoured (see `playHonoured`). */
  private requestPlay(): void {
    this.playHonoured = false;
    this.playRepeated = false;
    this.player.play();
  }

  pause(): void {
    this.wantsPlay = false;
    this.replayToken++;
    this.player.pause();
  }

  replay(): void {
    this.wantsPlay = true;
    this.setState({ currentTime: 0, ended: false });
    // The seek has to land first: `play()` is synchronous and `seekTo` isn't, and at
    // the end of a track iOS would otherwise start playing, finish on the spot and
    // only then rewind, leaving the player stopped at 0:00.
    const token = ++this.replayToken;
    const start = (): void => {
      if (token === this.replayToken) this.requestPlay();
    };
    void this.player.seekTo(0).then(start, start);
  }

  async seekTo(seconds: number): Promise<void> {
    if (!this._state.isLoaded && this._state.duration <= 0) {
      this.pendingSeek = Math.max(0, seconds);
      this.setState({ currentTime: this.pendingSeek });
      return;
    }
    const target = clampSeekTarget(seconds, this.player.duration);
    this.setState({ currentTime: target });
    await this.player.seekTo(target);
  }

  setVolume(volume: number): void {
    const v = clampVolume(volume);
    this.player.volume = v;
    this.setState({ volume: v });
  }

  setMuted(muted: boolean): void {
    this.player.muted = muted;
    this.setState({ muted });
  }

  setPlaybackRate(rate: number, pitchCorrection?: PitchCorrectionQuality): void {
    this.player.setPlaybackRate(rate, pitchCorrection);
    this.setState({ playbackRate: rate });
  }

  setLoop(loop: boolean): void {
    this.player.loop = loop;
    this.setState({ loop });
  }

  /**
   * WEB: forward the source object's `crossOrigin` to the expo player so the
   * underlying `<audio>` element carries the attribute. Without it, the browser
   * taints a cross-origin source and expo's Web-Audio sampler refuses to read it
   * (`setAudioSamplingEnabled` reports unsupported), so the spectrum visualizer
   * goes flat. Per-source and self-clearing — a source without `crossOrigin`
   * resets it (expo recreates the element on `replace`). No-op on native, where
   * the field is web-only.
   */
  private applyCrossOrigin(source: AudioSource): void {
    if (!isWeb) return;
    (this.player as { crossOrigin?: "anonymous" | "use-credentials" }).crossOrigin =
      typeof source === "object" && source !== null ? source.crossOrigin : undefined;
  }

  replace(source: AudioSource): void {
    this.lastSource = source;
    this.applyCrossOrigin(source);
    this.load(source);
  }

  retry(): void {
    // Pick up where it failed, and keep playing if that's what it was doing.
    const resumeAt = this._state.currentTime;
    this.load(this.lastSource);
    if (resumeAt > 0) void this.seekTo(resumeAt);
  }

  private load(source: AudioSource): void {
    this.replayToken++;
    this.pendingSeek = null;
    this.streamFailure = null;
    this.finishIsStale = true;
    this.setState({
      status: "loading",
      currentTime: 0,
      duration: 0,
      ended: false,
      isLoaded: false,
      error: null,
    });
    this.player.replace(source as ExpoAudioSource);
    this.bindElementBuffering();
    if (this.wantsPlay) this.requestPlay();
  }

  /* lock screen ------------------------------------------------------------- */

  setActiveForLockScreen(
    active: boolean,
    metadata?: AudioMetadata,
    options?: AudioLockScreenOptions,
  ): void {
    this.player.setActiveForLockScreen(active, toExpoMetadata(metadata), options);
    this.setState({
      lockScreenActive: active,
      metadata: metadata ?? this._state.metadata,
    });
  }

  updateLockScreenMetadata(metadata: AudioMetadata): void {
    this.player.updateLockScreenMetadata(toExpoMetadata(metadata) ?? metadata);
    this.setState({ metadata });
  }

  clearLockScreenControls(): void {
    this.player.clearLockScreenControls();
    this.setState({ lockScreenActive: false });
  }

  /* sampling ---------------------------------------------------------------- */

  setSamplingEnabled(enabled: boolean): void {
    if (!enabled) {
      this.samplePump.stop();
      this.player.setAudioSamplingEnabled(false);
      return;
    }
    // Ask the backend to turn sampling on, THEN check whether it took. The web
    // backend only reports support from inside `setAudioSamplingEnabled`, once it
    // has built the analyser graph and cleared the cross-origin check, so reading
    // `isAudioSamplingSupported` first would always decline on web.
    this.player.setAudioSamplingEnabled(true);
    if (!this.player.isAudioSamplingSupported) return; // e.g. a tainted cross-origin source
    this.samplePump.start();
  }

  override dispose(): void {
    this.stallWatch.clear();
    this.detachElement?.();
    this.detachElement = null;
    for (const subscription of this.subscriptions) subscription.remove();
    this.subscriptions = [];
    this.samplePump.stop();
    // The player itself is owned/released by the useAudioPlayer hook.
    super.dispose();
  }
}

/* helpers ------------------------------------------------------------------- */

function mapStatus(status: AudioStatus, error: AudioError | null): AudioPlaybackStatus {
  if (error) return "error";
  if (status.isLoaded) return "readyToPlay";
  return "loading";
}
