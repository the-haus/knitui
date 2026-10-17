/**
 * Tests for the shared v3 transition helpers in `./style-props` — `CollapseBox`
 * (web), `RollingNumber`, the native `Transition` and the overlay engine all
 * funnel through these, so they lock the v3 value shapes (`{ duration, easing,
 * properties }`, `{ preset, properties }`) against drift.
 *
 * The preset names asserted here are the keys of core's `MOTION_PRESETS`, the one
 * table both animation drivers are built from.
 */
import { MOTION_PRESETS } from "@knitui/core";

import {
  presetDurationMs,
  resolveTransition,
  scopeTransition,
  timedTransition,
  transitionProps,
  withTransitionProperties,
} from "./style-props";

describe("resolveTransition", () => {
  it("maps each CSS easing keyword to its matching registered preset", () => {
    expect(resolveTransition("linear")).toBe("linear");
    expect(resolveTransition("ease")).toBe("ease");
    expect(resolveTransition("ease-in")).toBe("ease-in");
    expect(resolveTransition("ease-out")).toBe("ease-out");
    expect(resolveTransition("ease-in-out")).toBe("ease-in-out");
    for (const name of ["linear", "ease", "ease-in", "ease-out", "ease-in-out"]) {
      expect(MOTION_PRESETS).toHaveProperty(name);
    }
  });

  it("defaults to `ease` and normalises case / whitespace", () => {
    expect(resolveTransition()).toBe("ease");
    expect(resolveTransition("  EASE-OUT  ")).toBe("ease-out");
  });

  it("falls back to `ease` for a curve it has no preset for", () => {
    // v3 takes the exact curve in `timedTransition`; a preset NAME can't carry it.
    expect(resolveTransition("cubic-bezier(0.68, -0.55, 0.265, 1.55)")).toBe("ease");
    expect(resolveTransition("wobble")).toBe("ease");
  });
});

describe("timedTransition", () => {
  it("is the v3 object form with the EXACT duration and curve", () => {
    expect(timedTransition(250, "ease-out")).toEqual({ duration: 250, easing: "ease-out" });
    expect(timedTransition(200)).toEqual({ duration: 200, easing: "ease" });
    expect(timedTransition(300, "cubic-bezier(0.68, -0.55, 0.265, 1.55)").easing).toBe(
      "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
    );
  });

  it("scopes to properties (v2 animateOnly) as a CSS property list", () => {
    expect(timedTransition(200, "ease", ["height", "opacity"])).toEqual({
      duration: 200,
      easing: "ease",
      properties: "height, opacity",
    });
  });
});

describe("transition scoping", () => {
  it("wraps a preset name, extends an object, keeps null", () => {
    expect(withTransitionProperties("fast", ["opacity"])).toEqual({
      preset: "fast",
      properties: "opacity",
    });
    expect(withTransitionProperties({ duration: 90 }, "transform, opacity")).toEqual({
      duration: 90,
      properties: "transform, opacity",
    });
    expect(withTransitionProperties(null, ["opacity"])).toBeNull();
    expect(withTransitionProperties("fast", undefined)).toBe("fast");
  });

  it("transitionProps builds a static `{ transition }` fragment", () => {
    expect(transitionProps("fast", ["backgroundColor"])).toEqual({
      transition: { preset: "fast", properties: "backgroundColor" },
    });
    expect(transitionProps(null)).toEqual({ transition: null });
  });

  it("scopeTransition is cached per (result, property list)", () => {
    const fade = { transition: "fast" as const };
    const a = scopeTransition(fade, ["opacity"]);
    expect(a).toEqual({ transition: { preset: "fast", properties: "opacity" } });
    expect(scopeTransition(fade, ["opacity"])).toBe(a);
    expect(scopeTransition(fade, "opacity")).toBe(a);
    expect(scopeTransition(fade, ["left", "opacity"])).not.toBe(a);
  });

  it("reads preset durations from core MOTION_PRESETS (springs have none)", () => {
    expect(presetDurationMs("fast")).toBe(150);
    expect(presetDurationMs("bouncy")).toBeUndefined();
  });
});
