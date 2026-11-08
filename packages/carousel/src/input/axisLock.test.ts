import {
  AXIS_LOCK_DISTANCE,
  decideAxis,
  LOCK_CROSS,
  LOCK_MAIN,
  LOCK_NONE,
  LOCK_REJECT,
} from "./axisLock";

describe("decideAxis", () => {
  it("stays undecided under the lock distance (a tap)", () => {
    expect(decideAxis(3, -4, true, true)).toBe(LOCK_NONE);
    expect(decideAxis(AXIS_LOCK_DISTANCE - 0.1, 0, false, true)).toBe(LOCK_NONE);
  });

  it("picks the dominant axis (vertical carousel: Y is main)", () => {
    expect(decideAxis(2, -12, true, true)).toBe(LOCK_MAIN);
    expect(decideAxis(-12, 2, true, true)).toBe(LOCK_CROSS);
  });

  it("picks the dominant axis (horizontal carousel: X is main)", () => {
    expect(decideAxis(-12, 2, false, true)).toBe(LOCK_MAIN);
    expect(decideAxis(2, 12, false, true)).toBe(LOCK_CROSS);
  });

  it("breaks an exact 45° tie toward the main axis", () => {
    expect(decideAxis(-11, -11, true, true)).toBe(LOCK_MAIN);
    expect(decideAxis(11, 11, false, true)).toBe(LOCK_MAIN);
  });

  it("rejects a cross-dominant drag on a single-axis carousel", () => {
    expect(decideAxis(-40, 3, true, false)).toBe(LOCK_REJECT);
    expect(decideAxis(3, -40, true, false)).toBe(LOCK_MAIN);
  });
});
