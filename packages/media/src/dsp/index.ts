/**
 * `@knitui/media/dsp` — pure, cross-platform digital-signal-processing primitives
 * for building an audio visualizer on top of the media kit's PCM streams
 * (`AudioSampleData.channels`, `useAudioStream`'s `frames`). No DOM, no React, no
 * Web Audio: the same code runs on web and native.
 *
 * - {@link SpectrumAnalyzer} — the high-level, `AnalyserNode`-style entry point.
 *   Feed it PCM, read back frequency bins / bars / waveform. Start here.
 * - {@link RealFFT} / {@link FFT} — the allocation-free FFT core, if you want the
 *   raw transform.
 * - {@link makeWindow} / {@link applyWindow} — windowing helpers.
 */
export { FFT, RealFFT } from "./fft";
export {
  type BandOptions,
  type BandReduce,
  SpectrumAnalyzer,
  type SpectrumAnalyzerOptions,
} from "./spectrum";
export { applyWindow, makeWindow, windowGain, type WindowType } from "./window";
