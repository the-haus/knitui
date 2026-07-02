/**
 * Tests for the shared transition resolver in `./style-props` — the single
 * source of truth that maps a CSS `transition-timing-function` onto a registered
 * animation curve. `CollapseBox` (web), `RollingNumber`, and the native
 * `Transition` all funnel through this, so these lock the mapping (and the
 * `[curve, { duration }]` shape) against drift.
 *
 * The curve keys asserted here MUST stay in sync with the `createAnimations`
 * config in `@knitui/core` (`config/animations.ts` + `.native.ts`).
 */
import { resolveTransition, timedTransition } from "./style-props";

describe("resolveTransition", () => {
  it("maps each CSS easing keyword to its matching registered curve", () => {
    expect(resolveTransition("linear")).toBe("linear");
    expect(resolveTransition("ease")).toBe("ease");
    expect(resolveTransition("ease-in")).toBe("ease-in");
    expect(resolveTransition("ease-out")).toBe("ease-out");
    expect(resolveTransition("ease-in-out")).toBe("ease-in-out");
  });

  it("defaults to `ease` (the library-wide default) with no argument", () => {
    expect(resolveTransition()).toBe("ease");
  });

  it("normalises case and surrounding whitespace", () => {
    expect(resolveTransition("  EASE-OUT  ")).toBe("ease-out");
    expect(resolveTransition("Linear")).toBe("linear");
  });

  it("approximates an arbitrary cubic-bezier to the `bouncy` overshoot curve", () => {
    expect(resolveTransition("cubic-bezier(0.68, -0.55, 0.265, 1.55)")).toBe("bouncy");
  });

  it("falls back to `ease` for an unknown timing function", () => {
    expect(resolveTransition("wobble")).toBe("ease");
  });
});

describe("timedTransition", () => {
  it("pairs the resolved curve with an exact duration override", () => {
    expect(timedTransition(250, "ease-out")).toEqual(["ease-out", { duration: 250 }]);
  });

  it("uses the `ease` curve when no timing function is given", () => {
    expect(timedTransition(200)).toEqual(["ease", { duration: 200 }]);
  });
});
