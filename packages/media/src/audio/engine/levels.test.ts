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
