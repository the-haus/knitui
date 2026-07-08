import { type DecideInput, decideSwipe, exitVectorFor, stampOpacityFor } from "./decide";

const base = (over: Partial<DecideInput>): DecideInput => ({
  dx: 0,
  dy: 0,
  vx: 0,
  vy: 0,
  width: 300,
  height: 400,
  threshold: 0.25,
  directions: ["left", "right"],
  velocityThreshold: 800,
  ...over,
});

describe("decideSwipe — distance threshold", () => {
  it("snaps back below threshold", () => {
    // 0.25 * 300 = 75px needed; 50 is short.
    expect(decideSwipe(base({ dx: 50 }))).toBeNull();
    expect(decideSwipe(base({ dx: -50 }))).toBeNull();
  });

  it("commits right/left past the horizontal threshold", () => {
    expect(decideSwipe(base({ dx: 120 }))).toBe("right");
    expect(decideSwipe(base({ dx: -120 }))).toBe("left");
  });
});

describe("decideSwipe — velocity (flick)", () => {
  it("commits on a fast flick even with little travel", () => {
    expect(decideSwipe(base({ dx: 10, vx: 1200 }))).toBe("right");
    expect(decideSwipe(base({ dx: -10, vx: -1200 }))).toBe("left");
  });

  it("does not commit on a slow drag below both gates", () => {
    expect(decideSwipe(base({ dx: 40, vx: 200 }))).toBeNull();
  });
});

describe("decideSwipe — allowed directions", () => {
  it("ignores a committed direction that is not allowed", () => {
    // Strong upward drag, but "up" is not in the default directions.
    expect(decideSwipe(base({ dy: -200, vy: -1500 }))).toBeNull();
  });

  it("commits up (super-like) when enabled", () => {
    expect(decideSwipe(base({ directions: ["left", "right", "up"], dy: -200 }))).toBe("up");
  });
});

describe("decideSwipe — dominant axis wins", () => {
  it("picks the stronger axis when two commit", () => {
    // Both past threshold; horizontal is proportionally stronger.
    const r = decideSwipe(base({ directions: ["left", "right", "up"], dx: 290, dy: -110 }));
    expect(r).toBe("right");
    const u = decideSwipe(base({ directions: ["left", "right", "up"], dx: 80, dy: -390 }));
    expect(u).toBe("up");
  });
});

describe("stampOpacityFor", () => {
  it("is 0 at rest and clamps to 1 at/after threshold", () => {
    expect(stampOpacityFor("right", 0, 0, 300, 400, 0.25)).toBe(0);
    expect(stampOpacityFor("right", 75, 0, 300, 400, 0.25)).toBeCloseTo(1);
    expect(stampOpacityFor("right", 300, 0, 300, 400, 0.25)).toBe(1);
  });

  it("only lights the matching direction", () => {
    expect(stampOpacityFor("left", 75, 0, 300, 400, 0.25)).toBe(0);
    expect(stampOpacityFor("right", -75, 0, 300, 400, 0.25)).toBe(0);
    expect(stampOpacityFor("up", 0, -100, 300, 400, 0.25)).toBeGreaterThan(0);
  });
});

describe("exitVectorFor", () => {
  it("throws well off-screen along the committed axis, keeping the other drag", () => {
    expect(exitVectorFor("right", 300, 400, 80, 20)).toEqual({ x: 450, y: 20 });
    expect(exitVectorFor("left", 300, 400, -80, 20)).toEqual({ x: -450, y: 20 });
    expect(exitVectorFor("up", 300, 400, 15, -80)).toEqual({ x: 15, y: -600 });
    expect(exitVectorFor("down", 300, 400, 15, 80)).toEqual({ x: 15, y: 600 });
  });
});
