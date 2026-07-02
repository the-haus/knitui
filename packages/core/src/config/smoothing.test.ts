import { createSmoother, createTimeSmoother, smoothingCoefficients } from "./smoothing";

describe("smoothingCoefficients", () => {
  it("is instant at 0", () => {
    expect(smoothingCoefficients(0)).toEqual({ attack: 1, release: 1 });
  });

  it("smooths most at 1, with attack leading release", () => {
    const { attack, release } = smoothingCoefficients(1);
    expect(attack).toBeLessThan(1);
    expect(release).toBeLessThan(attack);
    expect(release).toBeGreaterThan(0);
  });

  it("clamps out-of-range amounts", () => {
    expect(smoothingCoefficients(-5)).toEqual({ attack: 1, release: 1 });
    expect(smoothingCoefficients(5)).toEqual(smoothingCoefficients(1));
  });
});

describe("createSmoother", () => {
  it("passes targets straight through when instant", () => {
    const smooth = createSmoother(3, 1, 1);
    expect(smooth([0.2, 0.5, 1])).toEqual([0.2, 0.5, 1]);
  });

  it("eases toward a rising target over successive frames", () => {
    const smooth = createSmoother(1, 0.5, 0.5);
    expect(smooth([1])[0]).toBeCloseTo(0.5, 6);
    expect(smooth([1])[0]).toBeCloseTo(0.75, 6);
    expect(smooth([1])[0]).toBeCloseTo(0.875, 6);
  });

  it("falls more slowly than it rises", () => {
    const smooth = createSmoother(1, 0.8, 0.2);
    const up = smooth([1])[0]; // rise from 0
    smooth([1]);
    smooth([1]); // settle near 1
    const before = smooth([1])[0];
    const after = smooth([0])[0]; // now fall toward 0
    expect(up).toBeCloseTo(0.8, 6);
    expect(before - after).toBeLessThan(up); // one release step moves less than one attack step
  });

  it("reuses its buffer across calls (steady-state allocation-free)", () => {
    const smooth = createSmoother(2, 0.5, 0.5);
    const a = smooth([1, 1]);
    const b = smooth([1, 1]);
    expect(a).toBe(b);
  });

  it("reset() drops history to zero", () => {
    const smooth = createSmoother(2, 0.5, 0.5);
    smooth([1, 1]);
    smooth([1, 1]);
    smooth.reset();
    expect(smooth([0, 0])).toEqual([0, 0]);
  });

  it("treats missing target entries as zero", () => {
    const smooth = createSmoother(3, 1, 1);
    expect(smooth([0.5])).toEqual([0.5, 0, 0]);
  });
});

describe("createTimeSmoother", () => {
  it("snaps to the target when tau is 0", () => {
    const smooth = createTimeSmoother(2, 0, 0);
    expect(smooth([0.3, 1], 16)).toEqual([0.3, 1]);
  });

  it("closes ~63% of the gap after one time constant", () => {
    const smooth = createTimeSmoother(1, 100, 100);
    // dt == tau ⇒ 1 - e^-1 ≈ 0.632 of the gap from 0 → 1.
    expect(smooth([1], 100)[0]).toBeCloseTo(1 - Math.exp(-1), 6);
  });

  it("is frame-rate independent: one big step ≈ several small steps", () => {
    const big = createTimeSmoother(1, 80, 80);
    const small = createTimeSmoother(1, 80, 80);
    const oneStep = big([1], 60)[0];
    let v = 0;
    for (let i = 0; i < 6; i++) v = small([1], 10)[0]; // 6 × 10ms = 60ms
    expect(v).toBeCloseTo(oneStep, 6);
  });

  it("falls more slowly than it rises when releaseTau > attackTau", () => {
    const smooth = createTimeSmoother(1, 20, 200);
    const up = smooth([1], 16)[0];
    smooth([1], 16);
    smooth([1], 16);
    const before = smooth([1], 16)[0];
    const after = smooth([0], 16)[0];
    expect(before - after).toBeLessThan(up);
  });

  it("reset() drops history to zero", () => {
    const smooth = createTimeSmoother(2, 50, 50);
    smooth([1, 1], 50);
    smooth.reset();
    expect(smooth([0, 0], 50)).toEqual([0, 0]);
  });
});
