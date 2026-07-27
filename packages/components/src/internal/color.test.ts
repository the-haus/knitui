/**
 * Colour-conversion regressions.
 *
 * The sector lookup in `hsvaToRgbaObject` is the interesting part: it picks one
 * of six precomputed channel tuples by `hue / 60`, and nothing normalised the
 * hue first, so a negative one indexed off the FRONT of those tuples and yielded
 * `NaN` for every channel.
 *
 * Reachable through the OBJECT API, not through `parseColor`: `VALIDATION_REGEXP.hsl`
 * requires `\d+` for the hue, so a negative-hue *string* is rejected as invalid and
 * resolves to black long before the sector math. But `HsvaColor`, `hsvaToRgbaObject`
 * and `convertHsvaTo` are all public exports and take the hue as a plain number —
 * which is the shape `ColorPicker` feeds them on every hue change.
 */
import { convertHsvaTo, hsvaToRgbaObject, parseColor } from "./color";

describe("hsvaToRgbaObject — hue sector selection", () => {
  it("handles a negative hue instead of producing NaN channels", () => {
    const { r, g, b } = hsvaToRgbaObject({ h: -60, s: 100, v: 100, a: 1 });
    expect(Number.isNaN(r)).toBe(false);
    expect(Number.isNaN(g)).toBe(false);
    expect(Number.isNaN(b)).toBe(false);
  });

  it("treats a negative hue as its positive congruent (-60 ≡ 300 → magenta)", () => {
    expect(hsvaToRgbaObject({ h: -60, s: 100, v: 100, a: 1 })).toEqual(
      hsvaToRgbaObject({ h: 300, s: 100, v: 100, a: 1 }),
    );
  });

  it("wraps hues past a full turn (420 ≡ 60 → yellow)", () => {
    expect(hsvaToRgbaObject({ h: 420, s: 100, v: 100, a: 1 })).toEqual(
      hsvaToRgbaObject({ h: 60, s: 100, v: 100, a: 1 }),
    );
  });

  it("still resolves each in-range sector to its primary", () => {
    expect(hsvaToRgbaObject({ h: 0, s: 100, v: 100, a: 1 })).toMatchObject({ r: 255, g: 0, b: 0 });
    expect(hsvaToRgbaObject({ h: 120, s: 100, v: 100, a: 1 })).toMatchObject({
      r: 0,
      g: 255,
      b: 0,
    });
    expect(hsvaToRgbaObject({ h: 240, s: 100, v: 100, a: 1 })).toMatchObject({
      r: 0,
      g: 0,
      b: 255,
    });
  });
});

describe("convertHsvaTo — the ColorPicker-shaped path", () => {
  // `ColorPicker` calls `convertHsvaTo(format, { ...parsed, h })` on every hue
  // change, so a stray negative `h` used to serialise as `rgb(NaN, NaN, NaN)`.
  it.each(["rgb", "rgba", "hex"] as const)("emits no NaN in %s for a negative hue", (format) => {
    expect(convertHsvaTo(format, { h: -60, s: 100, v: 100, a: 1 })).not.toContain("NaN");
  });

  it("serialises a negative hue as its positive congruent", () => {
    expect(convertHsvaTo("rgb", { h: -60, s: 100, v: 100, a: 1 })).toBe(
      convertHsvaTo("rgb", { h: 300, s: 100, v: 100, a: 1 }),
    );
  });
});

describe("parseColor — a negative-hue STRING stays invalid", () => {
  // Pinning existing behaviour, not changing it: the hue validator requires
  // `\d+`, so this never reaches the sector math and resolves to black.
  it("rejects hsl() with a negative hue and falls back to black", () => {
    expect(parseColor("hsl(-60, 100%, 50%)")).toEqual({ h: 0, s: 0, v: 0, a: 1 });
  });
});
