import { decodePcm } from "./decode";

describe("decodePcm", () => {
  describe("float32", () => {
    it("copies float samples through unchanged", () => {
      const input = new Float32Array([0, 0.5, -0.5, 1, -1]);
      const frames = decodePcm(input.buffer, "float32");
      expect(frames).toEqual([0, 0.5, -0.5, 1, -1]);
    });

    it("returns an empty array for an empty buffer", () => {
      expect(decodePcm(new ArrayBuffer(0), "float32")).toEqual([]);
    });

    it("ignores trailing bytes that don't form a full 4-byte sample", () => {
      // 6 bytes = one complete float32 sample (4 B) + 2 stray bytes.
      const buf = new ArrayBuffer(6);
      new Float32Array(buf, 0, 1)[0] = 0.25;
      const frames = decodePcm(buf, "float32");
      expect(frames).toEqual([0.25]);
    });
  });

  describe("int16", () => {
    it("normalizes signed 16-bit samples by /32768", () => {
      const input = new Int16Array([0, 16384, -16384, 32767, -32768]);
      const frames = decodePcm(input.buffer, "int16");
      expect(frames[0]).toBe(0);
      expect(frames[1]).toBeCloseTo(0.5, 5);
      expect(frames[2]).toBeCloseTo(-0.5, 5);
      expect(frames[3]).toBeCloseTo(0.99997, 4);
      expect(frames[4]).toBe(-1);
    });

    it("keeps every decoded sample within [-1, 1]", () => {
      const input = new Int16Array([32767, -32768, 12345, -6789]);
      for (const v of decodePcm(input.buffer, "int16")) {
        expect(v).toBeGreaterThanOrEqual(-1);
        expect(v).toBeLessThanOrEqual(1);
      }
    });

    it("returns an empty array for an empty buffer", () => {
      expect(decodePcm(new ArrayBuffer(0), "int16")).toEqual([]);
    });
  });
});
