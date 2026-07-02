import type { MotionPresetName } from "../internal/motion";
import { toOverlayTransition } from "./use-overlay-transition";

describe("toOverlayTransition", () => {
  it("maps shared preset names to themselves", () => {
    const shared: MotionPresetName[] = [
      "fade",
      "fade-up",
      "fade-down",
      "fade-left",
      "fade-right",
      "pop",
      "scale",
      "scale-x",
      "scale-y",
      "slide-up",
      "slide-down",
      "slide-left",
      "slide-right",
      "rotate-left",
      "rotate-right",
      "skew-up",
      "skew-down",
    ];
    for (const name of shared) {
      expect(toOverlayTransition(name)).toBe(name);
    }
  });

  it("falls back preset-only names to the closest overlay preset", () => {
    expect(toOverlayTransition("pop-up")).toBe("pop");
    expect(toOverlayTransition("pop-down")).toBe("pop");
    expect(toOverlayTransition("zoom")).toBe("scale");
  });
});
