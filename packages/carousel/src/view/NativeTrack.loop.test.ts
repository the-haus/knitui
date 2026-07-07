import {
  LOOP_COPIES,
  loopSeekPos,
  middleRingPos,
  recentredPos,
  renderedCount,
  ringLength,
} from "./NativeTrack.shared";

/**
 * Pure math behind native-mode looping (cloned-ring recentre). These mirror the
 * engine unit-tests' style: no React, no reanimated — just the offset ↔ scroll
 * position arithmetic that keeps the recentre invisible and the seek short.
 */
describe("NativeTrack loop math", () => {
  const count = 4;
  const pageSize = 100;
  const ring = ringLength(count, pageSize); // 400

  it("clones the ring LOOP_COPIES times only when looping", () => {
    expect(renderedCount(count, true)).toBe(count * LOOP_COPIES);
    expect(renderedCount(count, false)).toBe(count);
  });

  it("rests item 0 in the middle copy with a full ring of buffer on each side", () => {
    // Middle copy → position `ring` (one full ring of clones precedes it).
    expect(middleRingPos(0, count, pageSize)).toBe(ring);
    expect(middleRingPos(3, count, pageSize)).toBe(ring + 3 * pageSize);
  });

  describe("recentredPos", () => {
    it("is a no-op inside the middle band [ring, 2·ring)", () => {
      expect(recentredPos(ring, ring)).toBeNull();
      expect(recentredPos(ring + 3 * pageSize, ring)).toBeNull();
    });

    it("snaps an out-of-band position back by whole rings (invisible jump)", () => {
      // Drifted a ring below the band → jump up one ring, same visual pixels.
      expect(recentredPos(300, ring)).toBe(700);
      // Drifted a ring above → jump down one ring.
      expect(recentredPos(ring * 2 + pageSize, ring)).toBe(ring + pageSize);
    });

    it("only jumps by a multiple of the ring, so the item shown never changes", () => {
      const before = 300;
      const after = recentredPos(before, ring)!;
      expect((after - before) % ring).toBe(0);
    });
  });

  describe("loopSeekPos", () => {
    it("without a `from`, lands in the middle copy of the target item", () => {
      // target = offsetFor(index 2) = -200 → middle-copy position ring + 200.
      expect(loopSeekPos(-200, ring)).toBe(ring + 200);
    });

    it("with a `from`, travels to the nearest copy (shortest visual path)", () => {
      // Resting at the middle copy's item 0 (pos 400), stepping to item 3.
      // The near copy of item 3 is the first-ring one at 300 (just left), not
      // the middle-ring one at 700.
      expect(loopSeekPos(-300, ring, 400)).toBe(300);
    });

    it("keeps the target inside the safe band so repeated steps can't walk off", () => {
      // A target that resolves below the safe floor is nudged up a ring.
      const pos = loopSeekPos(0, ring, 0); // desired 0, from 0 → 0, below 0.5·ring
      expect(pos).toBeGreaterThanOrEqual(0.5 * ring);
      expect(pos).toBeLessThanOrEqual((LOOP_COPIES - 0.5) * ring);
    });
  });
});
