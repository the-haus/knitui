import { overlayOpacity } from "../overlay";
import { settle } from "../settle";
import {
  clamp,
  clampOffset,
  closedOffset,
  nearestSnapIndex,
  noNegZero,
  snapOffset,
  snapOffsets,
} from "../snap";

const MAX = 1000;

describe("snap geometry", () => {
  it("snapOffset maps % visible → translateY (0% closed, 100% open)", () => {
    expect(snapOffset(100, MAX)).toBe(0); // fully open
    expect(snapOffset(0, MAX)).toBe(MAX); // closed
    expect(snapOffset(80, MAX)).toBe(200); // 80% visible → 20% pushed down
    expect(snapOffset(10, MAX)).toBe(900);
  });

  it("snapOffset clamps the point to 0–100", () => {
    expect(snapOffset(150, MAX)).toBe(0);
    expect(snapOffset(-50, MAX)).toBe(MAX);
  });

  it("snapOffsets returns ascending offsets (index 0 = most open)", () => {
    // default [80, 10] → [200, 900]
    expect(snapOffsets([80, 10], MAX)).toEqual([200, 900]);
    // already-ascending input order is normalized too
    expect(snapOffsets([10, 80], MAX)).toEqual([200, 900]);
  });

  it("closedOffset is the full height", () => {
    expect(closedOffset(MAX)).toBe(MAX);
  });

  it("noNegZero scrubs negative zero", () => {
    expect(Object.is(noNegZero(-0), 0)).toBe(true);
    expect(Object.is(snapOffset(100, MAX), 0)).toBe(true);
  });

  it("clamp bounds values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});

describe("nearestSnapIndex", () => {
  const offsets = [200, 900];
  it("picks the closest snap", () => {
    expect(nearestSnapIndex(210, offsets)).toBe(0);
    expect(nearestSnapIndex(850, offsets)).toBe(1);
  });
  it("ties resolve to the more-open (lower-index) snap", () => {
    expect(nearestSnapIndex(550, offsets)).toBe(0); // equidistant 350/350
  });
});

describe("clampOffset (rubber-band)", () => {
  it("passes through inside the range", () => {
    expect(clampOffset(500, 200, 900)).toBe(500);
  });
  it("rubber-bands above the open edge at half rate", () => {
    expect(clampOffset(100, 200, 900)).toBe(150); // 200 + (100-200)*0.5
  });
  it("rubber-bands below the closed edge at half rate", () => {
    expect(clampOffset(1100, 200, 900)).toBe(1000); // 900 + (1100-900)*0.5
  });
  it("hard-clamps when overdrag disabled", () => {
    expect(clampOffset(100, 200, 900, false)).toBe(200);
    expect(clampOffset(1100, 200, 900, false)).toBe(900);
  });
});

describe("settle", () => {
  const offsets = [200, 900]; // [80%, 10%]
  const dismiss = MAX;

  it("snaps to the nearest snap on a slow release", () => {
    const r = settle({
      offset: 230,
      velocity: 0,
      offsets,
      dismissOffset: dismiss,
      dismissible: true,
    });
    expect(r).toEqual({ index: 0, offset: 200, dismiss: false });
  });

  it("a downward flick advances toward a less-open snap", () => {
    const r = settle({
      offset: 220,
      velocity: 1200,
      offsets,
      dismissOffset: dismiss,
      dismissible: false,
    });
    expect(r.index).toBe(1);
    expect(r.dismiss).toBe(false);
  });

  it("an upward flick advances toward a more-open snap", () => {
    const r = settle({
      offset: 880,
      velocity: -1200,
      offsets,
      dismissOffset: dismiss,
      dismissible: false,
    });
    expect(r.index).toBe(0);
  });

  it("a strong downward fling from the lowest snap dismisses when dismissible", () => {
    const r = settle({
      offset: 905,
      velocity: 2500,
      offsets,
      dismissOffset: dismiss,
      dismissible: true,
    });
    expect(r.dismiss).toBe(true);
    expect(r.index).toBe(-1);
    expect(r.offset).toBe(dismiss);
  });

  it("never dismisses when not dismissible — clamps to the lowest snap", () => {
    const r = settle({
      offset: 950,
      velocity: 3000,
      offsets,
      dismissOffset: dismiss,
      dismissible: false,
    });
    expect(r.dismiss).toBe(false);
    expect(r.index).toBe(1);
  });

  it("a slow drag past the lowest snap dismisses when dismissible", () => {
    const r = settle({
      offset: 970,
      velocity: 0,
      offsets,
      dismissOffset: dismiss,
      dismissible: true,
    });
    expect(r.dismiss).toBe(true);
  });

  it("degenerate empty snaps → dismiss target", () => {
    const r = settle({
      offset: 0,
      velocity: 0,
      offsets: [],
      dismissOffset: dismiss,
      dismissible: true,
    });
    expect(r.dismiss).toBe(true);
  });
});

// KIT-09: three snaps, the geometry of a map browse sheet on a 779px layer —
// full 82% / half 46% / peek 12% → offsets 140 / 421 / 686.
describe("settle — three snaps (KIT-09)", () => {
  const offsets = [140, 421, 686];
  const FULL = 0;
  const HALF = 1;
  const PEEK = 2;
  const base = { offsets, dismissOffset: 779, dismissible: false };
  const fromPeek = (dragUp: number, velocity: number) =>
    settle({ ...base, startOffset: 686, offset: 686 - dragUp, velocity }).index;

  it("a slow 300px drag up from peek lands on half, not full", () => {
    // Released 35px past half. The release velocity of an unhurried touch
    // drag sits around the old 300 px/s threshold, so pin a spread of them.
    for (const v of [0, -150, -299, -300, -450, -499]) {
      expect(fromPeek(300, v)).toBe(HALF);
    }
  });

  it("a slow release lands on the snap nearest the release point", () => {
    expect(fromPeek(120, -100)).toBe(PEEK); // 566: nearer 686 than 421
    expect(fromPeek(150, -100)).toBe(HALF); // 536: nearer 421
    expect(fromPeek(480, -100)).toBe(FULL); // 206: nearer 140
  });

  it("a quick flick from rest still advances one snap", () => {
    expect(fromPeek(20, -800)).toBe(HALF);
    expect(settle({ ...base, startOffset: 421, offset: 405, velocity: -800 }).index).toBe(FULL);
    expect(settle({ ...base, startOffset: 421, offset: 437, velocity: 800 }).index).toBe(PEEK);
  });

  it("a fling goes at most one snap past the snap nearest the release", () => {
    // Released near peek at a hard fling: projection alone would reach full.
    expect(fromPeek(40, -3000)).toBe(HALF);
    // Released near half, flung on: full.
    expect(fromPeek(300, -900)).toBe(FULL);
    expect(fromPeek(300, -2000)).toBe(FULL);
  });

  it("a fling that reverses the drag is not pushed past its start", () => {
    // Up from peek to near half, then flicked back down: peek, never dismiss.
    const r = settle({
      offsets,
      dismissOffset: 779,
      dismissible: true,
      startOffset: 686,
      offset: 430,
      velocity: 900,
    });
    expect(r).toEqual({ index: PEEK, offset: 686, dismiss: false });
  });
});

describe("overlayOpacity", () => {
  it("is full at/above the fade-start (least-open snap)", () => {
    expect(overlayOpacity(200, 900, MAX)).toBe(1);
    expect(overlayOpacity(900, 900, MAX)).toBe(1);
  });
  it("fades linearly from fade-start to closed", () => {
    expect(overlayOpacity(950, 900, MAX)).toBeCloseTo(0.5, 5);
    expect(overlayOpacity(1000, 900, MAX)).toBe(0);
  });
  it("scales by maxOpacity", () => {
    expect(overlayOpacity(900, 900, MAX, 0.6)).toBeCloseTo(0.6, 5);
  });
  it("degenerate zero span → full unless fully closed", () => {
    expect(overlayOpacity(900, 900, 900)).toBe(1);
    expect(overlayOpacity(900, 900, 900, 0.6)).toBe(0.6);
  });
});
