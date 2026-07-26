/**
 * Web audio sampler — the single off-main-thread analysis primitive shared by
 * every web sampling site (the player, the recorder meter, and the live mic
 * stream).
 *
 * Best-practice capture: instead of polling an `AnalyserNode` from a
 * `requestAnimationFrame` loop on the main thread (starved when the main thread
 * is busy, frozen in background tabs), an `AudioWorklet` runs on the audio
 * rendering thread and posts time-domain PCM frames over its `MessagePort`. The
 * worklet stays deliberately tiny — it only mixes to mono and posts the latest
 * window; peak/RMS happen on the main thread via the shared, unit-tested
 * {@link mixChannels} engine, so web and native analyze sound through the exact
 * same code.
 *
 * `AudioWorklet` requires a secure context; where it is unavailable (plain HTTP)
 * the sampler transparently falls back to an `AnalyserNode` + rAF loop posting
 * the identical frame shape. If neither can be set up the sampler degrades to a
 * no-op rather than throwing.
 *
 * Routing contract: the sampler analyses; the caller owns the source node (the
 * web `createMediaElementSource` may be called only once per element, so it must
 * live in the controller). The worklet node connects to `destination` because
 * the Web Audio graph only pulls nodes that reach the destination — it always
 * writes silence, so it never adds audio or microphone feedback. `audible: true`
 * (the player) additionally wires `source → destination` for the real audio; the
 * mic sites pass `audible: false`.
 *
 * This file is web-only — it is imported solely by the `.ts`/`.tsx` web targets
 * and never by a `.native` module.
 */
import { DEFAULT_MAX_DB, DEFAULT_MIN_DB, mixChannels } from "../engine";

/** The registered name of the worklet processor. */
const PROCESSOR_NAME = "knitui-audio-sampler";

/** Default analysis window (samples); a power of two for the FFT downstream. */
const DEFAULT_FFT_SIZE = 2048;
/** Default frames-per-second the worklet posts at. */
const DEFAULT_FPS = 60;

/**
 * The `AudioWorkletProcessor` source, loaded into the audio thread via a Blob
 * URL. It runs in an isolated realm (`AudioWorkletGlobalScope`) with no module
 * system, so it must be fully self-contained — keep it minimal. It maintains a
 * ring buffer of the latest `fftSize` mono samples and posts that window (oldest
 * → newest) at roughly `fps`, transferring the buffer so there is no copy. It
 * writes nothing to its output (silence) and returns `true` to stay alive.
 *
 * Exported (not part of the public package surface) so the capture math can be
 * exercised directly in a simulated `AudioWorkletGlobalScope` under test.
 */
export const SAMPLER_PROCESSOR_SRC = `
class KnituiAudioSampler extends AudioWorkletProcessor {
  constructor(options) {
    super();
    const o = (options && options.processorOptions) || {};
    this.fftSize = o.fftSize || ${DEFAULT_FFT_SIZE};
    this.ring = new Float32Array(this.fftSize);
    this.writeIndex = 0;
    this.filled = 0;
    this.sinceLastPost = 0;
    this.postInterval = Math.max(1, Math.floor(sampleRate / (o.fps || ${DEFAULT_FPS})));
  }
  process(inputs) {
    const input = inputs[0];
    if (input && input.length > 0 && input[0]) {
      const nch = input.length;
      const frames = input[0].length;
      for (let i = 0; i < frames; i++) {
        let sum = 0;
        for (let c = 0; c < nch; c++) sum += input[c][i];
        this.ring[this.writeIndex] = sum / nch;
        this.writeIndex = (this.writeIndex + 1) % this.fftSize;
        if (this.filled < this.fftSize) this.filled++;
      }
      this.sinceLastPost += frames;
    }
    if (this.sinceLastPost >= this.postInterval && this.filled >= this.fftSize) {
      this.sinceLastPost = 0;
      const out = new Float32Array(this.fftSize);
      const start = this.writeIndex; // oldest sample in the ring
      for (let i = 0; i < this.fftSize; i++) {
        out[i] = this.ring[(start + i) % this.fftSize];
      }
      this.port.postMessage({ time: out }, [out.buffer]);
    }
    return true;
  }
}
registerProcessor(${JSON.stringify(PROCESSOR_NAME)}, KnituiAudioSampler);
`;

/** A reduced analysis frame, the unit both the worklet and fallback paths emit. */
export interface SamplerFrame {
  /** The latest mono PCM window, `-1..1`. A fresh buffer each frame — safe to retain. */
  mono: Float32Array;
  /** Peak absolute amplitude over the window, `0..1`. */
  peak: number;
  /** Root-mean-square (loudness) over the window, `0..1`. */
  rms: number;
}

/**
 * The one-slot channel list handed to {@link mixChannels}, reused across frames.
 * `mixChannels` reads it synchronously and never retains it, and this module is only
 * ever entered from a (single-threaded) audio/rAF callback, so one module-level slot
 * is enough — `frameFromTimeDomain` runs up to 60 times a second per live sampler.
 */
const MONO_CHANNEL: ArrayLike<number>[] = [];

/**
 * Reduce a mono time-domain window into a {@link SamplerFrame}. Pure; unit-tested.
 * The envelope is written straight into the returned frame (and the channel list is
 * reused), so the whole reduction costs ONE object per frame instead of three.
 */
export function frameFromTimeDomain(mono: Float32Array): SamplerFrame {
  const frame: SamplerFrame = { mono, peak: 0, rms: 0 };
  MONO_CHANNEL[0] = mono;
  mixChannels(MONO_CHANNEL, frame);
  return frame;
}

/** Options for {@link createWebAudioSampler}. */
export interface WebAudioSamplerOptions {
  /** Analysis window size (samples), a power of two. Default 2048. */
  fftSize?: number;
  /** Target frames-per-second for the worklet's posts. Default 60. */
  fps?: number;
  /**
   * Whether the source should also be heard. `true` (the player) wires
   * `source → destination` for audio; `false` (mic capture) leaves it silent to
   * avoid feedback. Default `false`.
   */
  audible?: boolean;
}

/** A live sampler handle. */
export interface WebAudioSampler {
  /** Resume the underlying context (call from a user gesture). */
  resume(): void;
  /** Tear down the analysis nodes and stop emitting frames. */
  dispose(): void;
}

/* The blob URL is built once and the `addModule` promise is deduped per context
   (loading the same module twice into one context is wasteful and can warn). */
let processorBlobUrl: string | null = null;
const moduleReady = new WeakMap<BaseAudioContext, Promise<void>>();

function ensureProcessorModule(context: BaseAudioContext): Promise<void> {
  let ready = moduleReady.get(context);
  if (!ready) {
    if (!processorBlobUrl) {
      const blob = new Blob([SAMPLER_PROCESSOR_SRC], { type: "application/javascript" });
      processorBlobUrl = URL.createObjectURL(blob);
    }
    ready = context.audioWorklet.addModule(processorBlobUrl);
    moduleReady.set(context, ready);
  }
  return ready;
}

function getRaf(): ((cb: () => void) => number) | null {
  const raf = (globalThis as { requestAnimationFrame?: (cb: () => void) => number })
    .requestAnimationFrame;
  return typeof raf === "function" ? raf : null;
}

function getCaf(): ((id: number) => void) | null {
  const caf = (globalThis as { cancelAnimationFrame?: (id: number) => void }).cancelAnimationFrame;
  return typeof caf === "function" ? caf : null;
}

/**
 * Create a sampler that feeds `onFrame` with time-domain PCM windows off the
 * `source` node. Prefers an `AudioWorklet`; falls back to an `AnalyserNode` + rAF
 * loop where worklets are unavailable. Returns synchronously — worklet wiring
 * happens once `addModule` resolves, and is skipped if `dispose()` ran first.
 */
export function createWebAudioSampler(
  context: AudioContext,
  source: AudioNode,
  onFrame: (frame: SamplerFrame) => void,
  options: WebAudioSamplerOptions = {},
): WebAudioSampler {
  const fftSize = options.fftSize ?? DEFAULT_FFT_SIZE;
  const fps = options.fps ?? DEFAULT_FPS;
  const audible = options.audible ?? false;

  let disposed = false;
  let rafId: number | null = null;
  let node: AudioWorkletNode | AnalyserNode | null = null;

  // The audible (direct) audio path, independent of the analysis node so a
  // worklet glitch can never affect playback.
  if (audible) {
    try {
      source.connect(context.destination);
    } catch {
      /* already connected / no destination — ignore */
    }
  }

  const startAnalyserFallback = (): void => {
    if (disposed || node) return;
    const raf = getRaf();
    try {
      const analyser = context.createAnalyser();
      analyser.fftSize = fftSize;
      // The fallback does no temporal smoothing (the consumer smooths) and shares
      // the engine's dB window so its frames match the worklet/native paths.
      analyser.smoothingTimeConstant = 0;
      analyser.minDecibels = DEFAULT_MIN_DB;
      analyser.maxDecibels = DEFAULT_MAX_DB;
      source.connect(analyser);
      node = analyser;
      if (!raf) return; // no rAF (SSR/headless) — graph is wired, just no frames
      const buf = new Float32Array(analyser.fftSize);
      const tick = (): void => {
        if (disposed) return;
        analyser.getFloatTimeDomainData(buf);
        // A fresh copy per frame so consumers may retain `mono` safely.
        onFrame(frameFromTimeDomain(new Float32Array(buf)));
        rafId = raf(tick);
      };
      rafId = raf(tick);
    } catch {
      /* analyser unavailable — degrade to silence */
    }
  };

  const hasWorklet =
    typeof context.audioWorklet?.addModule === "function" &&
    typeof (globalThis as { AudioWorkletNode?: unknown }).AudioWorkletNode === "function";

  if (hasWorklet) {
    ensureProcessorModule(context)
      .then(() => {
        if (disposed || node) return;
        try {
          const wn = new AudioWorkletNode(context, PROCESSOR_NAME, {
            numberOfInputs: 1,
            numberOfOutputs: 1,
            processorOptions: { fftSize, fps },
          });
          wn.port.onmessage = (event: MessageEvent): void => {
            if (disposed) return;
            const time = (event.data as { time?: Float32Array } | null)?.time;
            if (time) onFrame(frameFromTimeDomain(time));
          };
          source.connect(wn);
          // Connect to destination so the graph pulls the node; it writes silence.
          wn.connect(context.destination);
          node = wn;
        } catch {
          startAnalyserFallback();
        }
      })
      .catch(() => {
        if (!disposed) startAnalyserFallback();
      });
  } else {
    startAnalyserFallback();
  }

  return {
    resume(): void {
      void context.resume?.();
    },
    dispose(): void {
      disposed = true;
      if (rafId != null) {
        getCaf()?.(rafId);
        rafId = null;
      }
      const n = node;
      node = null;
      if (n && "port" in n) {
        n.port.onmessage = null;
        try {
          n.port.close();
        } catch {
          /* ignore */
        }
      }
      try {
        source.disconnect(n as AudioNode);
      } catch {
        /* not connected — ignore */
      }
      try {
        n?.disconnect();
      } catch {
        /* already disconnected — ignore */
      }
      if (audible) {
        try {
          source.disconnect(context.destination);
        } catch {
          /* not connected — ignore */
        }
      }
    },
  };
}
