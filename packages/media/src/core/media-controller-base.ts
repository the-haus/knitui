/**
 * The generic, domain-agnostic media controller core — the shared plumbing both
 * the audio and video controller bases specialize. It owns the immutable state
 * snapshot, the typed emitter, subscription, the `setState` merge-and-fan-out,
 * and the trivial derived commands (`togglePlay`, `toggleMuted`, `seekBy`).
 *
 * Each domain provides a thin subclass that adds ONLY its deltas — audio the
 * waveform silence-gate + lock-screen surface, video the fullscreen / PiP / track
 * surface — so the common controller contract lives in exactly one place and the
 * two domains cannot drift. No platform import, no React; concrete adapters
 * (audio's `expo-controller`, video's `html-controller` / `expo-controller.native`)
 * extend the domain base and implement the abstract imperative surface against
 * their backend.
 */
import type { BaseMediaEventMap, BaseMediaState, MediaSampleData } from "../shared";
import { StatefulEmitter } from "./stateful-emitter";

/**
 * The imperative + reactive API common to every media backend. Each domain's
 * `AudioController` / `VideoController` extends this with its own commands.
 */
export interface MediaController<
  State extends BaseMediaState,
  Caps,
  Events extends BaseMediaEventMap<State>,
  Source,
> {
  /** The live, immutable state snapshot. Replaced (never mutated) on change. */
  readonly state: State;
  /** What this backend can do — read by the chrome to gate controls. */
  readonly capabilities: Caps;

  /** Subscribe to the full-snapshot `change` event. Returns an unsubscribe fn. */
  subscribe(listener: (state: State) => void): () => void;
  /** Subscribe to a granular typed event. Returns an unsubscribe fn. */
  on<K extends keyof Events>(type: K, listener: (payload: Events[K]) => void): () => void;

  /* playback */
  play(): void;
  pause(): void;
  togglePlay(): void;
  replay(): void;
  /** Seek to an absolute time (seconds), clamped to the playable range. */
  seekTo(seconds: number): void | Promise<void>;
  /** Seek relative to the current time (seconds). */
  seekBy(seconds: number): void | Promise<void>;

  /* settable properties */
  setVolume(volume: number): void;
  setMuted(muted: boolean): void;
  toggleMuted(): void;
  setPlaybackRate(rate: number, pitchCorrection?: unknown): void;
  setLoop(loop: boolean): void;

  /**
   * Turn real-time waveform sampling on or off (see the `sampleUpdate` event).
   * No-op where `capabilities.canSample` is false.
   */
  setSamplingEnabled(enabled: boolean): void;

  /* source */
  replace(source: Source): void | Promise<void>;
  /** Reload the current source — used by the error overlay's retry button. */
  retry(): void | Promise<void>;

  /** Release platform resources and drop all listeners. */
  dispose(): void;
}

/*
 * Waveform-sample emission gate. It gates on a silence FLOOR, not a peak/rms
 * dead-band: peak and rms are aggregates over a large, overlapping analysis window
 * (about 2048 samples), so they barely move frame to frame during sustained
 * playback even though the waveform a visualizer draws keeps changing. A dead-band
 * suppressed frames the visualizers needed and made playback choppy.
 */
const SAMPLE_SILENCE_FLOOR = 0.01; // about -40 dBFS peak/rms; below this is "silence"
const SAMPLE_SILENCE_TAIL_MS = 400; // keep emitting this long after the last audible frame

function sampleClock(): number {
  const perf = (globalThis as { performance?: { now(): number } }).performance;
  return perf && typeof perf.now === "function" ? perf.now() : Date.now();
}

/**
 * Shared base: owns the state store + emitter (via {@link StatefulEmitter}) and
 * adds the media-specific derived commands. It also centralizes EVERY granular
 * playback event via {@link deriveEvents}: any `setState` that actually moves a
 * tracked field fans out the matching event (`statusChange`, `playingChange`,
 * `volumeChange`, `playbackRateChange`, `durationChange`, `timeUpdate`,
 * `playToEnd`, `error`) exactly once, so adapters only translate their backend's
 * events into `setState` and never hand-emit. This fixes a real drift — the web
 * adapters only ever emitted `statusChange` on error, so `onReady` /
 * `onStatusChange` never fired for `loading` / `readyToPlay` on the web; the
 * native adapters hand-emitted the same events on every status tick, double-firing
 * the centralized `statusChange` and diffing each event a different way.
 */
export abstract class BaseMediaController<
  State extends BaseMediaState,
  Caps,
  Events extends BaseMediaEventMap<State>,
  Source,
>
  extends StatefulEmitter<State, Events>
  implements MediaController<State, Caps, Events, Source>
{
  abstract readonly capabilities: Caps;

  protected constructor(makeInitial: (init?: Partial<State>) => State, initial?: Partial<State>) {
    super(makeInitial(initial));
  }

  /**
   * Derive the granular playback events from a real state transition. The single
   * fan-out point for every common media event — adapters just `setState` the
   * fresh snapshot and the matching events emit here, in one place. `timeUpdate`
   * is the hot per-tick event, so it's gated on having a listener (the emitter
   * exposes `hasListeners` for exactly this). Domain bases override this, call
   * `super.deriveEvents(prev, next)`, then add their own (video: fullscreen / PiP).
   */
  protected override deriveEvents(prev: State, next: State): void {
    if (next.status !== prev.status) {
      this.emitEvent(
        "statusChange" as keyof Events,
        {
          status: next.status,
          error: next.error,
        } as Events[keyof Events],
      );
    }
    if (next.playing !== prev.playing) {
      this.emitEvent(
        "playingChange" as keyof Events,
        {
          playing: next.playing,
        } as Events[keyof Events],
      );
    }
    if (next.volume !== prev.volume || next.muted !== prev.muted) {
      this.emitEvent(
        "volumeChange" as keyof Events,
        {
          volume: next.volume,
          muted: next.muted,
        } as Events[keyof Events],
      );
    }
    if (next.playbackRate !== prev.playbackRate) {
      this.emitEvent(
        "playbackRateChange" as keyof Events,
        {
          playbackRate: next.playbackRate,
        } as Events[keyof Events],
      );
    }
    if (next.duration !== prev.duration) {
      this.emitEvent(
        "durationChange" as keyof Events,
        {
          duration: next.duration,
        } as Events[keyof Events],
      );
    }
    if (!prev.ended && next.ended) {
      this.emitEvent("playToEnd" as keyof Events, undefined as Events[keyof Events]);
    }
    if (prev.error == null && next.error != null) {
      this.emitEvent("error" as keyof Events, next.error as Events[keyof Events]);
    }
    if (
      (next.currentTime !== prev.currentTime || next.bufferedPosition !== prev.bufferedPosition) &&
      this.hasListeners("timeUpdate" as keyof Events)
    ) {
      this.emitEvent(
        "timeUpdate" as keyof Events,
        {
          currentTime: next.currentTime,
          duration: next.duration,
          bufferedPosition: next.bufferedPosition,
        } as Events[keyof Events],
      );
    }
  }

  /* sampling ---------------------------------------------------------------- */

  private _lastAudibleSampleMs = 0;

  /**
   * Emit a `sampleUpdate`, gated on audibility. A paused or silent track keeps
   * producing all-zero windows; forwarding each one would wake every subscribed
   * visualizer at the display rate to redraw nothing. Audible windows always pass,
   * and silence passes only for a short tail so subscribers can settle to rest.
   */
  protected emitSample(sample: MediaSampleData): void {
    const t = sampleClock();
    if (sample.peak >= SAMPLE_SILENCE_FLOOR || sample.rms >= SAMPLE_SILENCE_FLOOR) {
      this._lastAudibleSampleMs = t;
    } else if (t - this._lastAudibleSampleMs > SAMPLE_SILENCE_TAIL_MS) {
      return;
    }
    this.emitEvent("sampleUpdate" as keyof Events, sample as Events[keyof Events]);
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

  /* `dispose()` (clears the emitter) is inherited from StatefulEmitter; adapters
     override it to also release platform resources, then call `super.dispose()`. */

  /* Abstract platform surface ------------------------------------------------ */
  abstract play(): void;
  abstract pause(): void;
  abstract replay(): void;
  abstract seekTo(seconds: number): void | Promise<void>;
  abstract setVolume(volume: number): void;
  abstract setMuted(muted: boolean): void;
  abstract setPlaybackRate(rate: number, pitchCorrection?: unknown): void;
  abstract setLoop(loop: boolean): void;
  abstract setSamplingEnabled(enabled: boolean): void;
  abstract replace(source: Source): void | Promise<void>;
  abstract retry(): void | Promise<void>;
}
