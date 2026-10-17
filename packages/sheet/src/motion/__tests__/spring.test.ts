import { crossedTarget, resolveSpring, springAtRest, stepSpring } from "../spring";
import { DEFAULT_SPRING } from "../spring-config";

describe("resolveSpring", () => {
  it("uses the default spring when nothing is given", () => {
    expect(resolveSpring(undefined)).toEqual({
      mass: DEFAULT_SPRING.mass,
      stiffness: DEFAULT_SPRING.stiffness,
      damping: DEFAULT_SPRING.damping,
      overshootClamping: false,
    });
  });

  it("derives damping from a damping ratio", () => {
    const p = resolveSpring({ stiffness: 400, mass: 1, dampingRatio: 1 });
    expect(p.damping).toBeCloseTo(2 * Math.sqrt(400), 6);
  });

  it("turns a duration-based spring into a stiffness", () => {
    const p = resolveSpring({ duration: 500, dampingRatio: 0.8 });
    // ω₀ = 2π / 0.5 s
    expect(p.stiffness).toBeCloseTo((2 * Math.PI * 2) ** 2, 3);
  });
});

describe("stepSpring", () => {
  it("comes to rest on its target", () => {
    const params = resolveSpring(undefined);
    let state = { position: 600, velocity: 0 };
    let frames = 0;
    while (!springAtRest(state, 100) && frames < 600) {
      state = stepSpring(state, 100, params, 1 / 60);
      frames += 1;
    }
    expect(springAtRest(state, 100)).toBe(true);
    // The default spring settles well inside a second.
    expect(frames).toBeLessThan(60);
  });

  it("overshoots a little with the default (under-damped) spring", () => {
    const params = resolveSpring(undefined);
    let state = { position: 600, velocity: 0 };
    let lowest = Infinity;
    for (let i = 0; i < 120; i++) {
      state = stepSpring(state, 100, params, 1 / 60);
      lowest = Math.min(lowest, state.position);
    }
    expect(lowest).toBeLessThan(100);
    expect(lowest).toBeGreaterThan(90);
  });

  it("carries a release velocity", () => {
    const params = resolveSpring(undefined);
    const still = stepSpring({ position: 300, velocity: 0 }, 300, params, 1 / 60);
    const flung = stepSpring({ position: 300, velocity: 2000 }, 300, params, 1 / 60);
    expect(still.position).toBe(300);
    expect(flung.position).toBeGreaterThan(300);
  });
});

describe("crossedTarget", () => {
  it("is true when a step passes or lands on the target", () => {
    expect(crossedTarget(110, 95, 100)).toBe(true);
    expect(crossedTarget(110, 100, 100)).toBe(true);
    expect(crossedTarget(110, 105, 100)).toBe(false);
  });
});
