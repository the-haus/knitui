import { createSpectrumMapper, fftToBands, type SpectrumMapper } from "./spectrum";

/**
 * Unit tests for the FFT → `SpectrumFrame` mapper: band-edge math (log-spaced,
 * DC-skipping), the three input-scale normalizations, and the allocation-free
 * reuse contract. Pure functions, no Skia / reanimated involved.
 */
describe("createSpectrumMapper", () => {
  // bins=8, bands=2, default minBin=1 → band0 = bin[1,2), band1 = bins[2,8).
  // (Worked out from the log-spaced edge formula: lo=1, hi=8.)
  const bytes = (mapper: SpectrumMapper, mags: number[]) => mapper(mags, []);

  it("produces one value per band", () => {
    const mapper = createSpectrumMapper({ bins: 8, bands: 5, input: "byte" });
    expect(mapper([0, 0, 0, 0, 0, 0, 0, 0], [])).toHaveLength(5);
  });

  it("groups bins into log-spaced bands and takes the per-band peak (byte)", () => {
    const mapper = createSpectrumMapper({ bins: 8, bands: 2, input: "byte" });
    // bin1 → band0 ; bin5 → band1.
    const out = bytes(mapper, [0, 255, 0, 0, 0, 128, 0, 0]);
    expect(out[0]).toBeCloseTo(1, 5); // 255/255
    expect(out[1]).toBeCloseTo(128 / 255, 5);
  });

  it("skips the DC bin (minBin defaults to 1)", () => {
    const mapper = createSpectrumMapper({ bins: 8, bands: 2, input: "byte" });
    // A hot DC bin (index 0) must not leak into any band.
    const withDc = bytes(mapper, [255, 0, 0, 0, 0, 0, 0, 0]);
    expect(withDc[0]).toBe(0);
    expect(withDc[1]).toBe(0);
  });

  it("normalizes dB input across [minDb, maxDb]", () => {
    const mapper = createSpectrumMapper({
      bins: 4,
      bands: 1,
      input: "db",
      minDb: -90,
      maxDb: -10,
    });
    expect(mapper([0, -50, -50, -50], [])[0]).toBeCloseTo(0.5, 5); // (-50+90)/80
    expect(mapper([0, -10, -10, -10], [])[0]).toBeCloseTo(1, 5);
    expect(mapper([0, -90, -90, -90], [])[0]).toBeCloseTo(0, 5);
    expect(mapper([0, -120, -120, -120], [])[0]).toBe(0); // clamped below floor
  });

  it("converts linear magnitudes to dB before normalizing", () => {
    const mapper = createSpectrumMapper({
      bins: 4,
      bands: 1,
      input: "linear",
      minDb: -90,
      maxDb: -10,
    });
    // 20·log10(v) = -50 dB ⇒ v = 10^-2.5 ⇒ band ≈ 0.5.
    expect(mapper([0, Math.pow(10, -2.5), 0, 0], [])[0]).toBeCloseTo(0.5, 4);
    // v=0 is floored to ~1e-9 (≈ -180 dB) ⇒ clamps to 0, never -Infinity.
    expect(mapper([0, 0, 0, 0], [])[0]).toBe(0);
  });

  it("reuses the passed-in output buffer (no allocation)", () => {
    const mapper = createSpectrumMapper({ bins: 8, bands: 3, input: "byte" });
    const out: number[] = [];
    const result = mapper([0, 255, 0, 0, 0, 0, 0, 0], out);
    expect(result).toBe(out);
  });

  it("honors minBin/maxBin window", () => {
    // Only bins [2,4) are considered, so a peak at bin1 is ignored.
    const mapper = createSpectrumMapper({
      bins: 8,
      bands: 1,
      input: "byte",
      minBin: 2,
      maxBin: 4,
    });
    expect(mapper([0, 255, 10, 20, 255, 0, 0, 0], [])[0]).toBeCloseTo(20 / 255, 5);
  });
});

describe("fftToBands", () => {
  it("maps a single magnitude row to a bands-long frame", () => {
    const out = fftToBands([0, 255, 0, 0, 0, 128, 0, 0], { bands: 2, input: "byte" });
    expect(out).toHaveLength(2);
    expect(out[0]).toBeCloseTo(1, 5);
  });

  it("defaults bins to the input length", () => {
    const out = fftToBands(new Array(16).fill(255), { bands: 4, input: "byte" });
    expect(out).toHaveLength(4);
    out.forEach((v) => expect(v).toBeCloseTo(1, 5));
  });
});
