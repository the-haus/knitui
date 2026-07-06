import {
  EXPAND_EPSILON,
  handoffStart,
  handoffUpdate,
  type HandoffUpdateInput,
  shouldPinToTop,
  shouldSettleOnEnd,
} from "../handoff";

// Geometry of a default [80, 10] sheet over a 1000px layer: offsets [200, 900].
const MIN = 200; // most-open snap (expanded)
const MAX = 900; // lowest snap (furthest travel)

/** Build a `handoffUpdate` input with sensible defaults for the field under test. */
const upd = (over: Partial<HandoffUpdateInput>): HandoffUpdateInput => ({
  coordinated: true,
  translationY: 0,
  scrollOffsetY: 0,
  panStart: MIN,
  minOffset: MIN,
  maxOffset: MAX,
  sheetOwns: false,
  handoff: 0,
  ...over,
});

describe("handoffStart", () => {
  it("uncoordinated → the panel always owns the drag", () => {
    expect(handoffStart(false, MIN, MIN)).toEqual({ sheetOwns: true, handoff: 0 });
    expect(handoffStart(false, MAX, MIN)).toEqual({ sheetOwns: true, handoff: 0 });
  });

  it("coordinated + starting fully expanded → the list owns the drag first", () => {
    expect(handoffStart(true, MIN, MIN).sheetOwns).toBe(false);
    // within the expand epsilon still counts as expanded
    expect(handoffStart(true, MIN + EXPAND_EPSILON, MIN).sheetOwns).toBe(false);
  });

  it("coordinated + starting below the top snap → the panel owns the drag", () => {
    expect(handoffStart(true, MIN + EXPAND_EPSILON + 1, MIN).sheetOwns).toBe(true);
    expect(handoffStart(true, MAX, MIN).sheetOwns).toBe(true);
  });
});

describe("handoffUpdate — no coordination (plain sheet)", () => {
  it("tracks the finger from the anchor", () => {
    const r = handoffUpdate(
      upd({ coordinated: false, panStart: 500, translationY: 100, sheetOwns: true }),
    );
    expect(r.offset).toBe(600);
    expect(r.sheetOwns).toBe(true);
  });

  it("hard-clamps to the travel range (no overshoot)", () => {
    expect(
      handoffUpdate(upd({ coordinated: false, panStart: 850, translationY: 200, sheetOwns: true }))
        .offset,
    ).toBe(MAX);
    expect(
      handoffUpdate(upd({ coordinated: false, panStart: 300, translationY: -200, sheetOwns: true }))
        .offset,
    ).toBe(MIN);
  });
});

describe("handoffUpdate — list owns the drag", () => {
  it("keeps the panel pinned open while the finger pulls up", () => {
    const r = handoffUpdate(upd({ sheetOwns: false, translationY: -50, scrollOffsetY: 0 }));
    expect(r.offset).toBe(MIN);
    expect(r.sheetOwns).toBe(false);
  });

  it("keeps the panel pinned while the finger pulls down but the list is not at the top", () => {
    const r = handoffUpdate(upd({ sheetOwns: false, translationY: 50, scrollOffsetY: 120 }));
    expect(r.offset).toBe(MIN);
    expect(r.sheetOwns).toBe(false);
  });

  it("hands off to the panel when the list is at the top and the finger pulls down", () => {
    const r = handoffUpdate(
      upd({ sheetOwns: false, translationY: 50, scrollOffsetY: 0, panStart: MIN }),
    );
    expect(r.sheetOwns).toBe(true);
    expect(r.handoff).toBe(50); // anchor set to this finger position …
    expect(r.offset).toBe(MIN); // … so the panel starts moving with no jump
  });

  it("treats iOS overscroll (scrollOffsetY < 0) as being at the top", () => {
    expect(
      handoffUpdate(upd({ sheetOwns: false, translationY: 30, scrollOffsetY: -8 })).sheetOwns,
    ).toBe(true);
  });
});

describe("handoffUpdate — panel owns the drag", () => {
  it("tracks the finger from the handoff anchor", () => {
    // handed off at translationY=50; now at 150 → 100px of real panel travel.
    const r = handoffUpdate(
      upd({ sheetOwns: true, handoff: 50, panStart: MIN, translationY: 150 }),
    );
    expect(r.offset).toBe(300);
    expect(r.sheetOwns).toBe(true);
  });

  it("hands the drag back to the list when dragged up to fully expanded", () => {
    // dragged a collapsed sheet all the way up past the top snap while pulling up.
    const r = handoffUpdate(
      upd({ sheetOwns: true, handoff: 0, panStart: MAX, translationY: -750 }),
    );
    expect(r.sheetOwns).toBe(false);
    expect(r.offset).toBe(MIN);
    expect(r.handoff).toBe(-750); // re-anchored so a later down-pull can re-take
  });

  it("does NOT hand back at the top while the finger holds still or pulls down", () => {
    const held = handoffUpdate(
      upd({ sheetOwns: true, handoff: 0, panStart: MIN, translationY: 0 }),
    );
    expect(held.sheetOwns).toBe(true);
    expect(held.offset).toBe(MIN);
  });
});

describe("shouldSettleOnEnd", () => {
  it("settles unless a coordinated list owned the drag", () => {
    expect(shouldSettleOnEnd(false, false)).toBe(true);
    expect(shouldSettleOnEnd(false, true)).toBe(true);
    expect(shouldSettleOnEnd(true, true)).toBe(true);
    expect(shouldSettleOnEnd(true, false)).toBe(false); // list fling must not collapse the sheet
  });
});

describe("shouldPinToTop", () => {
  it("never pins when the handoff is disabled", () => {
    expect(shouldPinToTop(false, MAX, MIN, 100)).toBe(false);
  });

  it("does not pin while fully expanded (the list may scroll)", () => {
    expect(shouldPinToTop(true, MIN, MIN, 100)).toBe(false);
    expect(shouldPinToTop(true, MIN + EXPAND_EPSILON, MIN, 100)).toBe(false);
  });

  it("pins a not-fully-expanded list back to the top", () => {
    expect(shouldPinToTop(true, 400, MIN, 100)).toBe(true);
  });

  it("is a no-op once the list is already at the top", () => {
    expect(shouldPinToTop(true, 400, MIN, 0)).toBe(false);
  });
});

describe("handoffUpdate — full expanded-sheet drag cycle", () => {
  it("scrolls the list, then collapses the sheet after the list reaches the top", () => {
    // Fully expanded; the list is scrolled down and the finger pulls up → list owns.
    let state = handoffUpdate(upd({ sheetOwns: false, translationY: -40, scrollOffsetY: 200 }));
    expect(state).toMatchObject({ sheetOwns: false, offset: MIN });

    // Finger reverses downward but the list still has offset → still the list.
    state = handoffUpdate(
      upd({
        sheetOwns: state.sheetOwns,
        handoff: state.handoff,
        translationY: 20,
        scrollOffsetY: 60,
      }),
    );
    expect(state.sheetOwns).toBe(false);

    // List hits the top and the finger keeps pulling down → panel takes over.
    state = handoffUpdate(
      upd({
        sheetOwns: state.sheetOwns,
        handoff: state.handoff,
        translationY: 30,
        scrollOffsetY: 0,
      }),
    );
    expect(state.sheetOwns).toBe(true);
    expect(state.offset).toBe(MIN);

    // Further downward drag now moves the panel toward the lower snap.
    const t0 = state.handoff;
    state = handoffUpdate(
      upd({
        sheetOwns: true,
        handoff: t0,
        panStart: MIN,
        translationY: t0 + 120,
        scrollOffsetY: 0,
      }),
    );
    expect(state.offset).toBe(MIN + 120);
  });
});
