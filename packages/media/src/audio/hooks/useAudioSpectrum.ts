/**
 * `useAudioSpectrum` — turn a playing `<Audio>` (or any {@link AudioController})
 * into a live frequency spectrum, as cheaply as the platform allows. This is the
 * production path for an audio visualizer: it taps the player's EXISTING
 * off-thread sampler instead of decoding anything itself, and never re-renders
 * React on the hot path.
 *
 * The pipeline, and why each step is the performant choice:
 *
 *   1. PCM is captured OFF the audio thread by the player's sampler (an
 *      AudioWorklet on web, `expo-audio`'s native sampling on device) and arrives
 *      as the controller's `sampleUpdate` event. We don't open a second audio
 *      graph — we reuse the one the player already runs.
 *   2. Each `sampleUpdate` does only a cheap ring-buffer copy
 *      ({@link SpectrumAnalyzer.write}) — no FFT, no allocation, synchronous, so
 *      the audio callback stays light.
 *   3. A SINGLE `requestAnimationFrame` loop runs the FFT at most once per painted
 *      frame (not once per audio buffer) and hands the eased per-bar levels to
 *      `onFrame`. Driving the renderer from a ref/callback keeps React out of the
 *      per-frame path entirely — no `setState`, no re-render.
 *   4. The loop SELF-SUSPENDS: the controller stops emitting on silence/pause, so
 *      when no sample has arrived for {@link REST_AFTER_MS} the loop fires `onRest`
 *      once and stops scheduling — a paused player costs nothing. The next sample
 *      resumes it.
 *
 * Cross-platform and dependency-light: it needs only the controller contract,
 * `requestAnimationFrame` (present on web and React Native), and the pure
 * `@knitui/media/dsp` FFT. It has NO renderer dependency — wire `onFrame` to
 * whatever draws (e.g. push the bands into an `<AudioVisualizer>` ref).
 */
import * as React from "react";

import { type BandOptions, SpectrumAnalyzer } from "../../dsp";
import type { AudioController } from "../controller/audio-controller-base";
import type { AudioSampleData } from "../types";

/** Suspend the rAF loop after this long without a fresh sample (ms). */
const REST_AFTER_MS = 250;

/** Options for {@link useAudioSpectrum}. Only `onFrame` is required. */
export interface UseAudioSpectrumOptions {
  /**
   * Called once per painted frame with the latest per-bar levels (`0..1`). The
   * array is a REUSED buffer — read/copy it synchronously, don't retain it.
   */
  onFrame: (bands: Float32Array) => void;
  /** Called once when the audio goes silent/paused, so the renderer can decay. */
  onRest?: () => void;
  /** FFT window size (power of two). Default `2048` — matches the sampler window. */
  fftSize?: number;
  /** Number of output bars. Default `64`. */
  bands?: number;
  /**
   * Sample rate of the incoming PCM, Hz — used only to map bins to frequencies
   * for the band grouping. `sampleUpdate` doesn't carry it, so set it if you know
   * it (web `AudioContext` is usually 44100/48000). Default `44100`.
   */
  sampleRate?: number;
  /** Band-axis spacing. `"log"` matches pitch perception. Default `"log"`. */
  scale?: "log" | "linear";
  /** Low edge of the lowest bar, Hz. Default `30`. */
  minHz?: number;
  /** High edge of the highest bar, Hz. Default `16000`. */
  maxHz?: number;
  /** Combine bins within a bar by peak or mean. Default `"max"`. */
  reduce?: "max" | "avg";
  /** dB floor mapped to `0`. Default `-90`. */
  minDecibels?: number;
  /** dB ceiling mapped to `1`. Default `-20`. */
  maxDecibels?: number;
  /**
   * Frame-to-frame smoothing in the analyzer, `0..1`. Default `0` — leave the
   * easing to the renderer (e.g. the visualizer's `responseTime`) so it stays
   * frame-rate-independent.
   */
  smoothingTimeConstant?: number;
}

/**
 * Subscribe a visualizer to a player's live spectrum. Pass the controller from
 * `<Audio getController>` (or `useAudioController`); `null`/`undefined` is a no-op
 * until it's ready. Sampling is enabled on the controller while mounted and
 * disabled on cleanup.
 */
export function useAudioSpectrum(
  controller: AudioController | null | undefined,
  options: UseAudioSpectrumOptions,
): void {
  const {
    fftSize = 2048,
    bands = 64,
    sampleRate = 44100,
    scale = "log",
    minHz = 30,
    maxHz = 16000,
    reduce = "max",
    minDecibels = -90,
    maxDecibels = -20,
    smoothingTimeConstant = 0,
  } = options;

  // Keep the callbacks in a ref so an inline `onFrame`/`onRest` doesn't re-run
  // the subscription effect every render.
  const callbacks = React.useRef({ onFrame: options.onFrame, onRest: options.onRest });
  callbacks.current = { onFrame: options.onFrame, onRest: options.onRest };

  React.useEffect(() => {
    if (!controller) return;
    if (typeof requestAnimationFrame === "undefined") return; // SSR / non-DOM

    const analyzer = new SpectrumAnalyzer({
      fftSize,
      sampleRate,
      smoothingTimeConstant,
      minDecibels,
      maxDecibels,
    });
    const bars = new Float32Array(bands);
    const bandOptions: BandOptions = { scale, minHz, maxHz, reduce };

    const clock = (): number =>
      typeof performance !== "undefined" && performance.now ? performance.now() : Date.now();

    let rafId = 0;
    let lastSampleAt = 0;
    let resting = true;
    // Track playback so we can rest the moment audio stops, and drop any sample
    // that trails the stop. Assume playing until a `playingChange` says otherwise
    // — samples only arrive while playing, so the gate exists purely to react to
    // the play→pause transition (the snapshot seeds it when one is exposed).
    let playing = controller.state?.playing ?? true;
    // When a backend supplies a precomputed `frequency` spectrum (off-thread —
    // a web AudioWorklet or native vDSP), we skip the JS FFT entirely and bin that
    // instead. Copied into owned scratch because the source buffer is reused.
    let mode: "pcm" | "spectrum" = "pcm";
    let magScratch: Float32Array | null = null;

    // Suspend the loop and tell the renderer to decay (once). Called on sample
    // starvation AND immediately when playback stops.
    const enterRest = (): void => {
      if (rafId !== 0) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      if (!resting) {
        resting = true;
        callbacks.current.onRest?.();
      }
    };

    const tick = (): void => {
      if (clock() - lastSampleAt > REST_AFTER_MS) {
        // No fresh audio — suspend until the next sample wakes the loop.
        enterRest();
        return;
      }
      if (mode === "spectrum" && magScratch) {
        analyzer.bandsFromSpectrum(magScratch, bars, bandOptions);
      } else {
        analyzer.getBands(bars, bandOptions);
      }
      callbacks.current.onFrame(bars);
      rafId = requestAnimationFrame(tick);
    };

    const wake = (): void => {
      if (rafId === 0) {
        resting = false;
        rafId = requestAnimationFrame(tick);
      }
    };

    controller.setSamplingEnabled(true);

    // Rest the instant playback stops. Native stops emitting samples on pause, so
    // without this the loop would keep re-running the FFT over the LAST captured
    // buffer until the REST_AFTER_MS starvation timeout — a frozen, non-zero
    // spectrum for a beat after stop. Coasting across buffer gaps WHILE playing is
    // unaffected (this only fires on the play→pause transition).
    const offPlaying = controller.on("playingChange", (e: { playing: boolean }) => {
      playing = e.playing;
      if (!playing) enterRest();
    });

    const unsubscribe = controller.on("sampleUpdate", (sample: AudioSampleData) => {
      // Drop any sample that trails a stop — the buffer captured just before pause
      // can arrive just after it, which would wake the loop for one stale frame.
      if (!playing) return;
      // Off-thread fast path: the backend already computed the spectrum.
      const freq = sample.frequency;
      if (freq && freq.length > 0) {
        if (!magScratch || magScratch.length !== freq.length) {
          magScratch = new Float32Array(freq.length);
        }
        magScratch.set(freq);
        mode = "spectrum";
        lastSampleAt = clock();
        wake();
        return;
      }
      // Fallback: run the FFT here over the time-domain PCM.
      const mono = sample.channels[0];
      if (mono && mono.length > 0) {
        analyzer.write(mono);
        mode = "pcm";
        lastSampleAt = clock();
        wake();
      }
    });

    return () => {
      offPlaying();
      unsubscribe();
      if (rafId !== 0) cancelAnimationFrame(rafId);
      controller.setSamplingEnabled(false);
    };
  }, [
    controller,
    fftSize,
    bands,
    sampleRate,
    scale,
    minHz,
    maxHz,
    reduce,
    minDecibels,
    maxDecibels,
    smoothingTimeConstant,
  ]);
}
