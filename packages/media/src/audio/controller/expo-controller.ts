import type {
  AudioPlayer,
  AudioStatus,
  AudioSample as ExpoAudioSample,
  AudioSource as ExpoAudioSource,
} from "expo-audio";

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
 * waveform data flows through `audioSampleUpdate` (expo's built-in sampler — the
 * higher-fidelity AudioWorklet sampler is reserved for the mic-sourced meter /
 * live-stream sites, which never touch this player element).
 */
import { isWeb } from "@knitui/core";

import { mixChannels, NATIVE_CAPABILITIES, resolveWebRuntimeCapabilities } from "../engine";
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

export class ExpoAudioController extends BaseAudioController {
  // On web, refine with the live browser probes (iOS volume lock, MediaSession,
  // Web Audio availability); native exposes the full feature set.
  readonly capabilities: AudioCapabilities = isWeb
    ? resolveWebRuntimeCapabilities()
    : NATIVE_CAPABILITIES;

  /** The wrapped expo-audio player. */
  readonly player: AudioPlayer;
  private subscriptions: ExpoSubscription[] = [];
  private sampleSub: ExpoSubscription | null = null;
  private lastSource: AudioSource;
  /** The id this player's own status updates carry — adopted from its first event. */
  private ownStatusId: string | null = null;

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
    this.syncFromPlayer();
    if (config.autoPlay) player.play();
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
    // `<AudioStatusBridge>`); `setState` de-dupes, so the redundant feed on
    // web/Android is a harmless no-op.
    this.subscriptions.push(
      p.addListener("playbackStatusUpdate", (status: AudioStatus) => this.applyStatus(status)),
    );
  }

  /**
   * Feed a backend `AudioStatus` into the snapshot. Public so a React status
   * bridge can drive it on iOS, where the constructor-attached `addListener`
   * doesn't deliver events (see {@link bindEvents}). Idempotent via `setState`
   * de-dupe, so the imperative listener and the bridge can both call it.
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
    this.ingestStatus(status);
  }

  private ingestStatus(status: AudioStatus): void {
    const error: AudioError | null = status.error ? { message: status.error } : null;
    // Translate the backend status into the snapshot; the granular events
    // (statusChange / playingChange / volumeChange / playbackRateChange /
    // durationChange / timeUpdate / playToEnd / error) all fan out from the diff
    // in BaseMediaController.deriveEvents — this adapter never hand-emits them.
    this.setState({
      status: mapStatus(status, error),
      playing: status.playing,
      currentTime: status.currentTime,
      duration: status.duration,
      muted: status.mute,
      loop: status.loop,
      playbackRate: status.playbackRate,
      shouldCorrectPitch: status.shouldCorrectPitch,
      isBuffering: status.isBuffering,
      isLoaded: status.isLoaded,
      isLive: status.isLive,
      ended: status.didJustFinish ? true : this._state.ended && !status.playing,
      error,
    });
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
    this.player.play();
  }

  pause(): void {
    this.player.pause();
  }

  replay(): void {
    void this.player.seekTo(0);
    this.player.play();
  }

  async seekTo(seconds: number): Promise<void> {
    const duration = this.player.duration;
    const target =
      Number.isFinite(duration) && duration > 0
        ? Math.min(Math.max(0, seconds), duration)
        : Math.max(0, seconds);
    this.setState({ currentTime: target });
    await this.player.seekTo(target);
  }

  setVolume(volume: number): void {
    const v = Math.max(0, Math.min(1, volume));
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
    this.setState({
      status: "loading",
      currentTime: 0,
      duration: 0,
      ended: false,
      isLoaded: false,
      error: null,
    });
    this.player.replace(source as ExpoAudioSource);
  }

  retry(): void {
    this.setState({ status: "loading", error: null, ended: false });
    this.player.replace(this.lastSource as ExpoAudioSource);
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
    if (enabled) {
      // Ask the backend to turn sampling on, THEN check whether it took. We can't
      // pre-gate on `isAudioSamplingSupported`: the web backend initializes it to
      // `false` and only flips it to `true` *inside* `setAudioSamplingEnabled`
      // (after lazily building the Web-Audio analyser graph and clearing the
      // cross-origin check). Reading it first therefore always short-circuited on
      // web — the analyser was never created, so the waveform/spectrum stayed flat.
      // Native reports support synchronously, so calling first is safe there too.
      this.player.setAudioSamplingEnabled(true);
      if (!this.player.isAudioSamplingSupported) return; // backend declined (e.g. tainted cross-origin source)
      if (this.sampleSub) return;
      this.sampleSub = this.player.addListener("audioSampleUpdate", (sample: ExpoAudioSample) => {
        const channels = sample.channels.map((c) => c.frames);
        const { peak, rms } = mixChannels(channels);
        this.emitSample({ channels, peak, rms, timestamp: sample.timestamp });
      });
    } else {
      this.player.setAudioSamplingEnabled(false);
      this.sampleSub?.remove();
      this.sampleSub = null;
    }
  }

  override dispose(): void {
    for (const subscription of this.subscriptions) subscription.remove();
    this.subscriptions = [];
    this.sampleSub?.remove();
    this.sampleSub = null;
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
