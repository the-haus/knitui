import { SpectrumAnalyzer } from "./spectrum";

/** A pure tone at `hz` sampled at `sampleRate`, `length` samples long. */
function tone(hz: number, sampleRate: number, length: number, amplitude = 1): Float32Array {
  const out = new Float32Array(length);
  for (let i = 0; i < length; i++)
    out[i] = amplitude * Math.sin((2 * Math.PI * hz * i) / sampleRate);
  return out;
}

describe("SpectrumAnalyzer", () => {
  it("derives bin counts and frequencies from fftSize + sampleRate", () => {
    const a = new SpectrumAnalyzer({ fftSize: 1024, sampleRate: 48000 });
    expect(a.fftSize).toBe(1024);
    expect(a.frequencyBinCount).toBe(512);
    expect(a.frequencyOfBin(1)).toBeCloseTo(48000 / 1024, 6);
    expect(a.frequencyOfBin(512)).toBeCloseTo(24000, 6); // Nyquist
  });

  it("rejects a non-power-of-two fftSize", () => {
    expect(() => new SpectrumAnalyzer({ fftSize: 1000 })).toThrow(RangeError);
  });

  it("locates a pure tone in the correct frequency bin", () => {
    const fftSize = 2048;
    const sampleRate = 48000;
    const a = new SpectrumAnalyzer({ fftSize, sampleRate, smoothingTimeConstant: 0 });

    const targetHz = (sampleRate / fftSize) * 50; // exactly bin 50
    a.write(tone(targetHz, sampleRate, fftSize, 0.5));

    // Peak-detect on the unclamped dB spectrum (byte data can saturate at the top
    // of the [minDecibels, maxDecibels] window for a loud tone).
    const db = new Float32Array(a.frequencyBinCount);
    a.getFloatFrequencyData(db);

    let peak = 0;
    for (let i = 1; i < db.length; i++) if (db[i] > db[peak]) peak = i;
    expect(peak).toBe(50);

    // The byte path still reports strong energy at the tone.
    const bins = new Uint8Array(a.frequencyBinCount);
    a.getByteFrequencyData(bins);
    expect(bins[50]).toBeGreaterThan(0);
  });

  it("keeps only the most recent fftSize samples across many writes", () => {
    const fftSize = 256;
    const sampleRate = 48000;
    const a = new SpectrumAnalyzer({ fftSize, sampleRate, smoothingTimeConstant: 0 });

    // First fill with silence, then stream in a tone in small chunks.
    a.write(new Float32Array(fftSize));
    const targetHz = (sampleRate / fftSize) * 20;
    const full = tone(targetHz, sampleRate, fftSize, 0.5);
    for (let off = 0; off < fftSize; off += 32) a.write(full.subarray(off, off + 32));

    const db = new Float32Array(a.frequencyBinCount);
    a.getFloatFrequencyData(db);
    let peak = 0;
    for (let i = 1; i < db.length; i++) if (db[i] > db[peak]) peak = i;
    expect(peak).toBe(20);
  });

  it("getFloatFrequencyData returns dB with -Infinity for empty bins", () => {
    const a = new SpectrumAnalyzer({ fftSize: 256, sampleRate: 48000, smoothingTimeConstant: 0 });
    const out = new Float32Array(a.frequencyBinCount);
    a.getFloatFrequencyData(out); // never fed any audio → all silent
    for (const v of out) expect(v).toBe(-Infinity);
  });

  it("smoothing rises gradually toward the steady-state level", () => {
    const fftSize = 512;
    const sampleRate = 48000;
    const a = new SpectrumAnalyzer({ fftSize, sampleRate, smoothingTimeConstant: 0.8 });
    const targetHz = (sampleRate / fftSize) * 16;
    const sig = tone(targetHz, sampleRate, fftSize);

    const out = new Float32Array(a.frequencyBinCount);
    a.write(sig);
    a.getFloatFrequencyData(out);
    const first = out[16];

    // Re-feeding the same frame should push the smoothed value higher.
    for (let f = 0; f < 5; f++) {
      a.write(sig);
      a.getFloatFrequencyData(out);
    }
    expect(out[16]).toBeGreaterThan(first);
  });

  describe("getBands", () => {
    it("produces one normalized 0..1 value per bar", () => {
      const a = new SpectrumAnalyzer({
        fftSize: 1024,
        sampleRate: 48000,
        smoothingTimeConstant: 0,
      });
      a.write(tone(1000, 48000, 1024));
      const bars = new Float32Array(16);
      a.getBands(bars);
      expect(bars.length).toBe(16);
      for (const v of bars) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    });

    it("places a 1 kHz tone's energy in the matching log band", () => {
      const a = new SpectrumAnalyzer({
        fftSize: 2048,
        sampleRate: 48000,
        smoothingTimeConstant: 0,
      });
      a.write(tone(1000, 48000, 2048, 1));
      const count = 24;
      const bars = new Float32Array(count);
      a.getBands(bars, { scale: "log", minHz: 20, maxHz: 20000, reduce: "max" });

      // The loudest bar should sit on the band that contains 1 kHz.
      const ratio = 20000 / 20;
      let expectedBand = 0;
      for (let b = 0; b < count; b++) {
        const hiHz = 20 * Math.pow(ratio, (b + 1) / count);
        if (1000 <= hiHz) {
          expectedBand = b;
          break;
        }
      }
      let peak = 0;
      for (let b = 1; b < count; b++) if (bars[b] > bars[peak]) peak = b;
      expect(Math.abs(peak - expectedBand)).toBeLessThanOrEqual(1);
    });

    it("handles a zero-length output without throwing", () => {
      const a = new SpectrumAnalyzer({ fftSize: 256, sampleRate: 48000 });
      expect(() => a.getBands(new Float32Array(0))).not.toThrow();
    });
  });

  describe("bandsFromSpectrum (off-thread fast path)", () => {
    it("bins an external magnitude spectrum without running the FFT", () => {
      const fftSize = 2048;
      const sampleRate = 48000;
      const a = new SpectrumAnalyzer({ fftSize, sampleRate });
      // A magnitude spectrum (N/2 bins) with a single spike at the 1 kHz bin.
      const binCount = fftSize / 2;
      const mags = new Float32Array(binCount);
      const spikeBin = Math.round((1000 * fftSize) / sampleRate);
      mags[spikeBin] = 1;

      const count = 24;
      const bars = new Float32Array(count);
      a.bandsFromSpectrum(mags, bars, { scale: "log", minHz: 20, maxHz: 20000 });

      const ratio = 20000 / 20;
      let expectedBand = 0;
      for (let b = 0; b < count; b++) {
        if (1000 <= 20 * Math.pow(ratio, (b + 1) / count)) {
          expectedBand = b;
          break;
        }
      }
      let peak = 0;
      for (let b = 1; b < count; b++) if (bars[b] > bars[peak]) peak = b;
      expect(Math.abs(peak - expectedBand)).toBeLessThanOrEqual(1);
      for (const v of bars) {
        expect(v).toBeGreaterThanOrEqual(0);
        expect(v).toBeLessThanOrEqual(1);
      }
    });

    it("does not throw on empty inputs", () => {
      const a = new SpectrumAnalyzer({ fftSize: 256, sampleRate: 48000 });
      expect(() => a.bandsFromSpectrum(new Float32Array(0), new Float32Array(8))).not.toThrow();
      expect(() => a.bandsFromSpectrum(new Float32Array(128), new Float32Array(0))).not.toThrow();
    });
  });

  it("getFloatTimeDomainData returns the latest waveform oldest-first", () => {
    const fftSize = 64;
    const a = new SpectrumAnalyzer({ fftSize, sampleRate: 48000 });
    const ramp = new Float32Array(fftSize);
    for (let i = 0; i < fftSize; i++) ramp[i] = i / fftSize;
    a.write(ramp);

    const out = new Float32Array(fftSize);
    a.getFloatTimeDomainData(out);
    expect(Array.from(out)).toEqual(Array.from(ramp));
  });

  it("clear() resets captured audio and smoothing", () => {
    const a = new SpectrumAnalyzer({ fftSize: 256, sampleRate: 48000, smoothingTimeConstant: 0 });
    a.write(tone(1000, 48000, 256));
    a.clear();
    const out = new Float32Array(a.frequencyBinCount);
    a.getFloatFrequencyData(out);
    for (const v of out) expect(v).toBe(-Infinity);
  });
});
