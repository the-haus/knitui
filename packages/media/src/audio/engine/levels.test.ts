import { amplitudeToLevel, meteringToLevel, mixChannels, peakOf, rmsOf } from "./levels";

describe("audio engine: levels", () => {
  it("computes peak amplitude", () => {
    expect(peakOf([0, 0.5, -0.8, 0.2])).toBeCloseTo(0.8);
    expect(peakOf([])).toBe(0);
    expect(peakOf([2, -3])).toBe(1); // clamped
  });

  it("computes rms", () => {
    expect(rmsOf([1, 1, 1, 1])).toBeCloseTo(1);
    expect(rmsOf([0, 0])).toBe(0);
    expect(rmsOf([])).toBe(0);
  });

  it("mixes channels into one envelope", () => {
    const { peak, rms } = mixChannels([
      [0, 0.4],
      [0, -0.6],
    ]);
    expect(peak).toBeCloseTo(0.6);
    expect(rms).toBeGreaterThan(0);
  });

  it("matches the unfused peakOf/rmsOf pair it replaced, including the clamps", () => {
    // The fused single pass must agree with peakOf/rmsOf exactly: peak = max of the
    // per-channel (clamped) peaks, rms = mean of the per-channel (clamped) RMS values.
    const cases: number[][][] = [
      [[]],
      [[0, 0]],
      [[0.5, -0.5, 0.25]],
      [
        [0.1, 0.9, -0.3],
        [2, -3, 0.5], // out of range → clamped per channel
      ],
      [[1, -1], [], [0.2]],
    ];
    for (const channels of cases) {
      const expectedPeak = channels.reduce((m, ch) => Math.max(m, peakOf(ch)), 0);
      const expectedRms = channels.reduce((sum, ch) => sum + rmsOf(ch), 0) / channels.length;
      const mixed = mixChannels(channels);
      expect(mixed.peak).toBe(expectedPeak);
      expect(mixed.rms).toBe(expectedRms);
    }
    expect(mixChannels([])).toEqual({ peak: 0, rms: 0 });
  });

  it("writes into a caller-owned result object when given one", () => {
    const out = { peak: -1, rms: -1 };
    expect(mixChannels([[0.5, -0.5]], out)).toBe(out); // no allocation per frame
    expect(out.peak).toBeCloseTo(0.5);
    expect(out.rms).toBeCloseTo(0.5);
    mixChannels([], out); // reset path
    expect(out).toEqual({ peak: 0, rms: 0 });
  });

  it("maps amplitude to a normalized dB level", () => {
    expect(amplitudeToLevel(0)).toBe(0);
    expect(amplitudeToLevel(1)).toBe(1);
    expect(amplitudeToLevel(0.001)).toBe(0); // -60 dB floor
    expect(amplitudeToLevel(0.5)).toBeGreaterThan(0);
  });

  it("maps expo metering (dBFS) to a level", () => {
    expect(meteringToLevel(0)).toBe(1);
    expect(meteringToLevel(-60)).toBe(0);
    expect(meteringToLevel(-160)).toBe(0);
    expect(meteringToLevel(undefined)).toBe(0);
    expect(meteringToLevel(-30)).toBeCloseTo(0.5);
  });
});
