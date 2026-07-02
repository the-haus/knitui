import { transformToCss } from "./painter.web";

describe("transformToCss", () => {
  it("appends px to numeric translate values", () => {
    expect(transformToCss([{ translateX: 320 }])).toBe("translateX(320px)");
    expect(transformToCss([{ translateY: -96.5 }])).toBe("translateY(-96.5px)");
  });

  it("leaves scale unitless, gives perspective px, and keeps string units verbatim", () => {
    expect(transformToCss([{ scale: 0.85 }])).toBe("scale(0.85)");
    // `perspective()` is invalid CSS without a unit, so it must get px.
    expect(transformToCss([{ perspective: 1000 }])).toBe("perspective(1000px)");
    expect(transformToCss([{ rotateZ: "30deg" }])).toBe("rotateZ(30deg)");
  });

  it("emits 3D rotations and a hinge-pivot transform as valid CSS", () => {
    expect(transformToCss([{ perspective: 800 }, { rotateY: "45deg" }, { scale: 0.9 }])).toBe(
      "perspective(800px) rotateY(45deg) scale(0.9)",
    );
  });

  it("joins a multi-part transform in order", () => {
    expect(transformToCss([{ translateX: 10 }, { scale: 0.9 }, { rotateZ: "5deg" }])).toBe(
      "translateX(10px) scale(0.9) rotateZ(5deg)",
    );
  });

  it("returns empty string for a non-array", () => {
    expect(transformToCss(undefined)).toBe("");
    expect(transformToCss({})).toBe("");
  });
});
