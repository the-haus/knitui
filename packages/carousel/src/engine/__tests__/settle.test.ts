import { offsetFor } from "../offset";
import { FLICK_VELOCITY_THRESHOLD, settle } from "../settle";
import type { SettleInput } from "../types";

const base = (over: Partial<SettleInput>): SettleInput => ({
  offset: 0,
  velocity: 0,
  size: 100,
  count: 5,
  loop: true,
  pagingEnabled: true,
  snapEnabled: true,
  ...over,
});

const FAST = FLICK_VELOCITY_THRESHOLD + 200; // a decisive flick

describe("settle — guards", () => {
  it("decays when size is non-positive or count is zero", () => {
    expect(settle(base({ size: 0 }))).toEqual({ kind: "decay", velocity: 0 });
    expect(settle(base({ count: 0 }))).toEqual({ kind: "decay", velocity: 0 });
  });
});

describe("settle — paging (caps to ±1 page)", () => {
  it("snaps back to the current page on a slow release", () => {
    expect(settle(base({ offset: -30, velocity: 0 }))).toEqual({ kind: "to", target: 0, page: 0 });
    expect(settle(base({ offset: -80, velocity: 0 }))).toEqual({
      kind: "to",
      target: -100,
      page: 1,
    });
  });

  it("advances exactly one page on a forward flick, even from a short drag", () => {
    // forward fling ⇒ negative offset velocity
    expect(settle(base({ offset: -30, velocity: -FAST }))).toEqual({
      kind: "to",
      target: -100,
      page: 1,
    });
  });

  it("never advances more than one page in a single paging swipe", () => {
    // dragged 80% toward the next page AND flicked hard forward → still page 1
    expect(settle(base({ offset: -80, velocity: -FAST }))).toEqual({
      kind: "to",
      target: -100,
      page: 1,
    });
  });

  it("goes back one page on a backward flick", () => {
    // currently past page 1 (offset -120), backward fling ⇒ positive velocity
    expect(settle(base({ offset: -120, velocity: FAST }))).toEqual({
      kind: "to",
      target: -100,
      page: 1,
    });
  });

  it("does not commit a page on a weak (sub-threshold) flick", () => {
    expect(settle(base({ offset: -30, velocity: -(FLICK_VELOCITY_THRESHOLD - 50) }))).toEqual({
      kind: "to",
      target: 0,
      page: 0,
    });
  });
});

describe("settle — paging boundaries", () => {
  it("clamps to [0, count-1] in non-loop mode", () => {
    // at page 0, backward flick would go to -1 → clamp to 0
    expect(settle(base({ offset: 0, velocity: FAST, loop: false }))).toEqual({
      kind: "to",
      target: 0,
      page: 0,
    });
  });

  it("allows the un-wrapped page to go negative in loop mode", () => {
    expect(settle(base({ offset: 0, velocity: FAST, loop: true }))).toEqual({
      kind: "to",
      target: offsetFor(-1, 100),
      page: -1,
    });
  });
});

describe("settle — snap (velocity-projected, may skip items)", () => {
  const snap = (over: Partial<SettleInput>) =>
    settle(base({ pagingEnabled: false, snapEnabled: true, ...over }));

  it("snaps to nearest on a slow release", () => {
    expect(snap({ offset: -30 })).toEqual({ kind: "to", target: 0, page: 0 });
    expect(snap({ offset: -260 })).toEqual({ kind: "to", target: -300, page: 3 });
  });

  it("skips multiple items on a hard flick (loop)", () => {
    // projected = round( rawIndex(-30 + (-1000*2), 100) ) = round(20.3) = 20
    expect(snap({ offset: -30, velocity: -1000, loop: true })).toEqual({
      kind: "to",
      target: offsetFor(20, 100),
      page: 20,
    });
  });

  it("clamps the projected skip in non-loop mode", () => {
    expect(snap({ offset: -30, velocity: -1000, loop: false })).toEqual({
      kind: "to",
      target: -400,
      page: 4,
    });
  });
});

describe("settle — free decay", () => {
  it("returns a decay descriptor when neither paging nor snapping", () => {
    expect(settle(base({ pagingEnabled: false, snapEnabled: false, velocity: -800 }))).toEqual({
      kind: "decay",
      velocity: -800,
    });
  });
});

describe("settle — per-swipe distance caps (require startOffset)", () => {
  it("min: a short total travel keeps the page even past the half-way point", () => {
    // dragged to 0.6 of a page but only 60px total travel; min 100 ⇒ stay on page 0
    expect(
      settle(base({ offset: -60, velocity: 0, startOffset: 0, minScrollDistancePerSwipe: 100 })),
    ).toEqual({ kind: "to", target: 0, page: 0 });
  });

  it("min is ignored when startOffset is absent", () => {
    expect(settle(base({ offset: -60, velocity: 0, minScrollDistancePerSwipe: 100 }))).toEqual({
      kind: "to",
      target: -100,
      page: 1,
    });
  });

  it("max: limits a hard-flick snap to N pages from the swipe origin", () => {
    // snap would project to page 20; max 350px ⇒ at most 3 pages from start page 0
    expect(
      settle(
        base({
          offset: -30,
          velocity: -1000,
          loop: true,
          pagingEnabled: false,
          snapEnabled: true,
          startOffset: 0,
          maxScrollDistancePerSwipe: 350,
        }),
      ),
    ).toEqual({ kind: "to", target: offsetFor(3, 100), page: 3 });
  });
});
