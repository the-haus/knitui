/**
 * The waveform-sample emit gate lives in `BaseAudioController.emitSample`. It gates
 * on SILENCE, not on change: any audible frame (peak/rms ≥ the silence floor) always
 * passes — so the visualizers see every frame and animate smoothly — and only
 * SUSTAINED silence, past a short decay tail, is dropped. We drive a minimal
 * concrete subclass (the gate is backend-agnostic) and mock the clock to exercise
 * the time-based tail deterministically.
 */
import { NATIVE_CAPABILITIES } from "../engine";
import type { AudioCapabilities, AudioSource } from "../types";
import { BaseAudioController } from "./audio-controller-base";

type Sample = { channels: number[][]; peak: number; rms: number; timestamp: number };

/** A no-op concrete controller that only exposes the inherited silence gate. */
class TestAudioController extends BaseAudioController {
  readonly capabilities: AudioCapabilities = NATIVE_CAPABILITIES;
  emit(sample: Sample): void {
    this.emitSample(sample);
  }
  play(): void {}
  pause(): void {}
  replay(): void {}
  seekTo(): void {}
  setVolume(): void {}
  setMuted(): void {}
  setPlaybackRate(): void {}
  setLoop(): void {}
  replace(_source: AudioSource): void {}
  retry(): void {}
  setActiveForLockScreen(): void {}
  updateLockScreenMetadata(): void {}
  clearLockScreenControls(): void {}
  setSamplingEnabled(): void {}
}

function setup(): {
  controller: TestAudioController;
  emit: (s: Sample) => void;
  received: () => number;
} {
  const controller = new TestAudioController();
  let count = 0;
  controller.on("sampleUpdate", () => {
    count += 1;
  });
  return { controller, emit: (s) => controller.emit(s), received: () => count };
}

/** A frame at the given peak/rms level (peak===rms keeps the silence check simple). */
function frame(level: number): Sample {
  return { channels: [[level]], peak: level, rms: level, timestamp: 0 };
}

describe("emitSample silence gate", () => {
  let now = 0;
  let perfSpy: jest.SpyInstance;

  beforeEach(() => {
    now = 1_000;
    perfSpy = jest.spyOn(performance, "now").mockImplementation(() => now);
  });
  afterEach(() => perfSpy.mockRestore());

  it("passes EVERY audible frame — including steady ones (the key fix)", () => {
    const { emit, received, controller } = setup();
    emit(frame(0.5));
    emit(frame(0.5)); // steady but audible → still passes (no dead-band)
    now += 1_000; // and still passes long after, as long as it stays audible
    emit(frame(0.5));
    emit(frame(0.5));
    expect(received()).toBe(4);
    controller.dispose();
  });

  it("passes audible frames all the way down through a decay", () => {
    const { emit, received, controller } = setup();
    for (const v of [0.9, 0.5, 0.2, 0.05, 0.02]) emit(frame(v)); // all ≥ floor (0.01)
    expect(received()).toBe(5);
    controller.dispose();
  });

  it("emits into silence for the tail, then suppresses sustained silence", () => {
    const { emit, received, controller } = setup();
    emit(frame(0.5)); // 1 — audible, marks last-audible
    emit(frame(0.0)); // 2 — silent but within the decay tail → still emitted
    now += 1_000; // advance past SAMPLE_SILENCE_TAIL_MS (400 ms)
    emit(frame(0.0)); // sustained silence → suppressed
    emit(frame(0.0)); // still suppressed
    expect(received()).toBe(2);
    controller.dispose();
  });

  it("resumes immediately when audio returns after silence", () => {
    const { emit, received, controller } = setup();
    emit(frame(0.5)); // 1
    now += 1_000;
    emit(frame(0.0)); // suppressed (sustained silence)
    emit(frame(0.6)); // 2 — audible again → passes right away
    expect(received()).toBe(2);
    controller.dispose();
  });
});
