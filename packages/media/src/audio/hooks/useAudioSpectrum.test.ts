import { act, renderHook } from "@testing-library/react";

import type { AudioController } from "../controller/audio-controller-base";
import type { AudioSampleData } from "../types";
import { useAudioSpectrum } from "./useAudioSpectrum";

/** Minimal controller stub: records sampling toggles and replays `sampleUpdate`. */
function makeController(): {
  controller: AudioController;
  emit: (sample: AudioSampleData) => void;
  setPlaying: (playing: boolean) => void;
  setSamplingEnabled: jest.Mock;
  listenerCount: () => number;
} {
  const listeners = new Set<(s: AudioSampleData) => void>();
  const playingListeners = new Set<(e: { playing: boolean }) => void>();
  const setSamplingEnabled = jest.fn();
  const controller = {
    setSamplingEnabled,
    state: { playing: true },
    on: (type: string, listener: (payload: never) => void) => {
      if (type === "sampleUpdate") {
        listeners.add(listener as (s: AudioSampleData) => void);
        return () => listeners.delete(listener as (s: AudioSampleData) => void);
      }
      if (type === "playingChange") {
        playingListeners.add(listener as (e: { playing: boolean }) => void);
        return () => playingListeners.delete(listener as (e: { playing: boolean }) => void);
      }
      return () => {};
    },
  } as unknown as AudioController;
  return {
    controller,
    emit: (sample) => listeners.forEach((l) => l(sample)),
    setPlaying: (playing) => playingListeners.forEach((l) => l({ playing })),
    setSamplingEnabled,
    listenerCount: () => listeners.size,
  };
}

/** A 1 kHz tone window so the spectrum is non-trivial. */
function toneWindow(size = 2048, sampleRate = 48000): Float32Array {
  const out = new Float32Array(size);
  for (let i = 0; i < size; i++) out[i] = Math.sin((2 * Math.PI * 1000 * i) / sampleRate);
  return out;
}

describe("useAudioSpectrum", () => {
  let rafQueue: FrameRequestCallback[];
  let now: number;

  let rafIds: number[];

  beforeEach(() => {
    rafQueue = [];
    rafIds = [];
    now = 1000;
    let id = 1;
    jest.spyOn(globalThis, "requestAnimationFrame").mockImplementation((cb) => {
      const thisId = id++;
      rafQueue.push(cb);
      rafIds.push(thisId);
      return thisId;
    });
    jest.spyOn(globalThis, "cancelAnimationFrame").mockImplementation((cancelId) => {
      if (cancelId == null) return;
      const i = rafIds.indexOf(cancelId);
      if (i !== -1) {
        rafIds.splice(i, 1);
        rafQueue.splice(i, 1);
      }
    });
    jest.spyOn(performance, "now").mockImplementation(() => now);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  /** Run every currently-queued rAF callback once (one "frame"). */
  const flushFrame = (): void => {
    const due = rafQueue;
    rafQueue = [];
    rafIds = []; // all pending ids are being consumed; reschedules repopulate both
    act(() => {
      due.forEach((cb) => cb(now));
    });
  };

  const sample = (): AudioSampleData => ({
    channels: [toneWindow()],
    peak: 1,
    rms: 0.7,
    timestamp: 0,
  });

  it("enables sampling and subscribes on mount", () => {
    const ctl = makeController();
    renderHook(() => useAudioSpectrum(ctl.controller, { onFrame: jest.fn(), bands: 8 }));
    expect(ctl.setSamplingEnabled).toHaveBeenCalledWith(true);
    expect(ctl.listenerCount()).toBe(1);
  });

  it("is a no-op when the controller is null", () => {
    const onFrame = jest.fn();
    renderHook(() => useAudioSpectrum(null, { onFrame }));
    expect(rafQueue).toHaveLength(0);
    expect(onFrame).not.toHaveBeenCalled();
  });

  it("emits one bands frame per painted frame after a sample arrives", () => {
    const ctl = makeController();
    const onFrame = jest.fn();
    renderHook(() => useAudioSpectrum(ctl.controller, { onFrame, bands: 8, sampleRate: 48000 }));

    // No audio yet → the loop hasn't started.
    expect(rafQueue).toHaveLength(0);

    act(() => ctl.emit(sample())); // wakes the loop
    flushFrame();

    expect(onFrame).toHaveBeenCalledTimes(1);
    const bars = onFrame.mock.calls[0][0] as Float32Array;
    expect(bars).toHaveLength(8);
    for (const v of bars) {
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThanOrEqual(1);
    }
  });

  it("self-suspends and fires onRest once audio goes quiet", () => {
    const ctl = makeController();
    const onFrame = jest.fn();
    const onRest = jest.fn();
    renderHook(() => useAudioSpectrum(ctl.controller, { onFrame, onRest, bands: 8 }));

    act(() => ctl.emit(sample()));
    flushFrame(); // one frame rendered, next frame scheduled
    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(rafQueue).toHaveLength(1);

    // No new sample; jump past the rest threshold and run the scheduled frame.
    now += 1000;
    flushFrame();
    expect(onRest).toHaveBeenCalledTimes(1);
    expect(rafQueue).toHaveLength(0); // loop suspended — nothing rescheduled

    // A fresh sample wakes it back up.
    act(() => ctl.emit(sample()));
    flushFrame();
    expect(onFrame).toHaveBeenCalledTimes(2);
  });

  it("rests immediately on pause and drops a sample trailing the stop", () => {
    const ctl = makeController();
    const onFrame = jest.fn();
    const onRest = jest.fn();
    renderHook(() => useAudioSpectrum(ctl.controller, { onFrame, onRest, bands: 8 }));

    act(() => ctl.emit(sample()));
    flushFrame();
    expect(onFrame).toHaveBeenCalledTimes(1);
    expect(rafQueue).toHaveLength(1); // loop running

    // Playback stops: rest at once (not after REST_AFTER_MS) and cancel the loop.
    act(() => ctl.setPlaying(false));
    expect(onRest).toHaveBeenCalledTimes(1);
    expect(rafQueue).toHaveLength(0); // loop suspended immediately

    // A buffer captured just before the stop arrives just after it — must be
    // dropped, not re-woken into one more stale frame.
    act(() => ctl.emit(sample()));
    flushFrame();
    expect(onFrame).toHaveBeenCalledTimes(1); // still 1 — trailing sample ignored
  });

  it("uses a backend-provided frequency spectrum without time-domain PCM", () => {
    const ctl = makeController();
    const onFrame = jest.fn();
    renderHook(() => useAudioSpectrum(ctl.controller, { onFrame, bands: 8 }));

    // A sample with NO channels but a precomputed spectrum (off-thread producer).
    const frequency = new Float32Array(1024);
    frequency[64] = 1; // a spike — proves the spectrum path drives the bands
    act(() => ctl.emit({ channels: [], peak: 1, rms: 0.7, timestamp: 0, frequency }));
    flushFrame();

    expect(onFrame).toHaveBeenCalledTimes(1);
    const bars = onFrame.mock.calls[0][0] as Float32Array;
    expect(bars).toHaveLength(8);
    expect(Math.max(...bars)).toBeGreaterThan(0); // the spike lit a band
  });

  it("disables sampling and unsubscribes on unmount", () => {
    const ctl = makeController();
    const { unmount } = renderHook(() => useAudioSpectrum(ctl.controller, { onFrame: jest.fn() }));
    unmount();
    expect(ctl.setSamplingEnabled).toHaveBeenLastCalledWith(false);
    expect(ctl.listenerCount()).toBe(0);
  });
});
