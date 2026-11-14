/**
 * Pulls a player's newest waveform window once per display frame and hands it on.
 * The one sampling loop for every backend and both domains: the audio and the video
 * controller each own a pump over their player's `readAudioSamples`.
 *
 * Pull, not push. The native tap keeps the newest decoded audio in a ring buffer
 * and `readAudioSamples` copies it straight into the pump's `Float32Array`, so no
 * event crosses the bridge and nothing is allocated per frame. The pump only runs
 * while it is `wanted` (sampling on AND a listener attached), and a read that
 * returns 0 frames (paused, buffering) emits nothing.
 */

import type { MediaSampleData } from "../shared";

/** The largest window a consumer analyses: a 2048-point FFT. */
const WINDOW_FRAMES = 2048;

/** Copies the newest frames into `target`; returns how many it wrote. */
export type SampleReader = (target: Float32Array) => number;

type FrameHandle = number | ReturnType<typeof setTimeout>;

const requestFrame: (tick: () => void) => FrameHandle =
  typeof requestAnimationFrame === "function"
    ? (tick) => requestAnimationFrame(tick)
    : (tick) => setTimeout(tick, 16);

const cancelFrame: (handle: FrameHandle) => void =
  typeof cancelAnimationFrame === "function"
    ? (handle) => cancelAnimationFrame(handle as number)
    : (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>);

export class SamplePump {
  private readonly buffer = new Float32Array(WINDOW_FRAMES);
  private readonly channels: Float32Array[] = [this.buffer];
  /**
   * The one payload object, reused for every frame along with its channel list and
   * buffer: the sampler allocates nothing while it runs.
   */
  private readonly sample: MediaSampleData = {
    channels: this.channels,
    peak: 0,
    rms: 0,
    timestamp: 0,
  };
  private handle: FrameHandle | null = null;

  constructor(
    private readonly read: SampleReader,
    /** Whether anyone will use a window right now. Checked every frame. */
    private readonly wanted: () => boolean,
    /** The playback position to stamp a window with, in seconds. */
    private readonly now: () => number,
    /** Receives the window. It is reused: read it synchronously, never retain it. */
    private readonly deliver: (sample: MediaSampleData) => void,
  ) {}

  get running(): boolean {
    return this.handle !== null;
  }

  start(): void {
    if (this.handle !== null) return;
    this.handle = requestFrame(this.tick);
  }

  stop(): void {
    if (this.handle === null) return;
    cancelFrame(this.handle);
    this.handle = null;
  }

  private readonly tick = (): void => {
    this.handle = requestFrame(this.tick);
    if (!this.wanted()) return;
    const buffer = this.buffer;
    let count = 0;
    try {
      count = this.read(buffer);
    } catch {
      // A released player throws on any call; the owner stops the pump on dispose.
      return;
    }
    if (!(count > 0)) return;
    if (count > buffer.length) count = buffer.length;

    // The envelope, in the same walk a meter would otherwise repeat.
    let peak = 0;
    let squares = 0;
    for (let i = 0; i < count; i++) {
      const v = buffer[i];
      const a = v < 0 ? -v : v;
      if (a > peak) peak = a;
      squares += v * v;
    }
    const rms = Math.sqrt(squares / count);

    // A short read is rare (the first frames after a start); only then is a view
    // of the filled part built, and only when its length changes.
    const current = this.channels[0];
    if (count === buffer.length) this.channels[0] = buffer;
    else if (current === buffer || current.length !== count) {
      this.channels[0] = buffer.subarray(0, count);
    }

    const sample = this.sample;
    sample.peak = peak > 1 ? 1 : peak;
    sample.rms = rms > 1 ? 1 : rms;
    sample.timestamp = this.now();
    this.deliver(sample);
  };
}
