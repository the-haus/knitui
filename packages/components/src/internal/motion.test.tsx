import * as React from "react";

import { renderHook } from "@testing-library/react";

import { styled } from "@knitui/core";

import { cssRulesOf } from "../__tests__/css-rules.test.helper";
import { Box } from "../Box";
import { render, screen } from "../test-utils";
import {
  compileMotion,
  MotionConfig,
  motionPresets,
  useMotionPreset,
  usePressScale,
  useReducedTransition,
} from "./motion";

// Mock the reduced-motion preference so we can drive both branches. The factory
// may only reference `mock`-prefixed outer bindings (jest hoists it above imports).
const mockState = { reduced: false };
jest.mock("@knitui/hooks", () => ({
  ...jest.requireActual("@knitui/hooks"),
  useReducedMotion: () => mockState.reduced,
}));

beforeEach(() => {
  mockState.reduced = false;
});

describe("useMotionPreset", () => {
  it("resolves a named preset to spreadable v3 clause props", () => {
    const { result } = renderHook(() => useMotionPreset("pop"));
    expect(result.current).toEqual({
      transition: { preset: "bouncy", properties: "transform, opacity" },
      opacity: "enter:0 exit:0",
      scale: "enter:0.9 exit:0.9",
    });
    expect(result.current).not.toHaveProperty("enterStyle");
    expect(result.current).not.toHaveProperty("animateOnly");
  });

  it("compiles lengths with px and keeps angle strings", () => {
    expect(compileMotion(motionPresets["fade-down"])).toEqual({
      opacity: "enter:0 exit:0",
      y: "enter:-30px exit:-30px",
    });
    expect(compileMotion(motionPresets["rotate-left"]).rotate).toBe("enter:-5deg exit:-5deg");
    expect(compileMotion({ enter: { opacity: 0 }, exit: { x: 4 } })).toEqual({
      opacity: "enter:0",
      x: "exit:4px",
    });
  });

  it("accepts an inline preset object", () => {
    const { result } = renderHook(() =>
      useMotionPreset({ transition: "slow", enter: { opacity: 0 } }),
    );
    expect(result.current).toEqual({ transition: "slow", opacity: "enter:0" });
  });

  it("overrides the duration while keeping the preset", () => {
    const { result } = renderHook(() => useMotionPreset("fade", { duration: 500 }));
    expect(result.current.transition).toEqual({
      preset: "fast",
      duration: 500,
      properties: "opacity",
    });
  });

  it("overrides the transition key", () => {
    const { result } = renderHook(() => useMotionPreset("fade", { transition: "slow" }));
    expect(result.current.transition).toEqual({ preset: "slow", properties: "opacity" });
  });

  it("returns the same object for the same inputs (memoised)", () => {
    const { result, rerender } = renderHook(() => useMotionPreset("fade-up"));
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("is inert when disabled or given a falsy preset", () => {
    expect(renderHook(() => useMotionPreset(false)).result.current).toEqual({ transition: null });
    expect(renderHook(() => useMotionPreset("pop", { enabled: false })).result.current).toEqual({
      transition: null,
    });
  });

  it("collapses to inert under reduced motion", () => {
    mockState.reduced = true;
    const { result } = renderHook(() => useMotionPreset("pop"));
    expect(result.current).toEqual({ transition: null });
    expect(result.current.opacity).toBeUndefined();
  });

  it("resolves every built-in preset to a driver key + symmetric enter/exit clauses", () => {
    for (const name of Object.keys(motionPresets) as (keyof typeof motionPresets)[]) {
      const { result } = renderHook(() => useMotionPreset(name));
      const { transition, ...clauses } = result.current;
      expect(transition).toBeTruthy();
      expect(Object.keys(clauses).length).toBeGreaterThan(0);
      for (const value of Object.values(clauses)) {
        // Symmetric by construction: one enter and one exit clause, same payload.
        const [enter, exit] = String(value).split(" ");
        expect(enter.startsWith("enter:")).toBe(true);
        expect(exit.startsWith("exit:")).toBe(true);
        expect(enter.slice(6)).toBe(exit.slice(5));
      }
    }
  });

  it("resolves the directional transform presets to shorthand transforms", () => {
    expect(renderHook(() => useMotionPreset("pop-up")).result.current).toMatchObject({
      scale: "enter:0.9 exit:0.9",
      y: "enter:8px exit:8px",
    });
    expect(renderHook(() => useMotionPreset("skew-down")).result.current.skewX).toBe(
      "enter:-8deg exit:-8deg",
    );
    expect(renderHook(() => useMotionPreset("zoom")).result.current.scale).toBe(
      "enter:1.05 exit:1.05",
    );
  });
});

describe("motion props render as v3 enter clauses (web)", () => {
  // A frame's BASE (styled) value and the call-site mount clause merge per
  // (property, condition) slot. (A call-site `opacity={…}` next to the spread is a
  // different story: one JSX prop, one value — the later one wins whole.)
  const Dimmed = styled(Box, { opacity: 0.5 });

  it("emits the enter clause rules and keeps the frame's resting value", () => {
    function Tile() {
      const motion = useMotionPreset("fade-up");
      return <Dimmed testID="tile" {...motion} />;
    }
    render(<Tile />);
    const tile = screen.getByTestId("tile");
    const rules = cssRulesOf(tile);
    // Resting value from the frame + the mount clause from the preset, one property.
    expect(rules.some((r) => /\{\s*opacity: 0\.5;?\s*\}/.test(r))).toBe(true);
    expect(rules.some((r) => r.includes("t_unmounted") && /opacity: 0;/.test(r))).toBe(true);
    expect(rules.some((r) => r.includes("t_unmounted") && r.includes("30px"))).toBe(true);
    expect(tile.getAttribute("style") ?? "").toContain("transition:");
    // No v2 condition objects leak to the DOM.
    expect(tile.hasAttribute("enterStyle")).toBe(false);
  });
});

describe("usePressScale", () => {
  it("returns just the easing key when motion is allowed", () => {
    const { result } = renderHook(() => usePressScale());
    expect(result.current).toEqual({ transition: "fast" });
  });

  it("honours a custom transition key", () => {
    const { result } = renderHook(() => usePressScale({ transition: "medium" }));
    expect(result.current.transition).toBe("medium");
  });

  it("neutralises the dip (a call-site press clause) and disables easing under reduced motion", () => {
    mockState.reduced = true;
    const { result } = renderHook(() => usePressScale());
    expect(result.current).toEqual({ transition: null, scale: "press:1" });
  });
});

describe("useReducedTransition", () => {
  it("passes the value through when motion is allowed", () => {
    expect(renderHook(() => useReducedTransition("fast")).result.current).toEqual({
      transition: "fast",
    });
    expect(
      renderHook(() => useReducedTransition({ duration: 240, easing: "ease-out" })).result.current,
    ).toEqual({ transition: { duration: 240, easing: "ease-out" } });
  });

  it("scopes the transition to properties", () => {
    expect(renderHook(() => useReducedTransition("fast", ["opacity"])).result.current).toEqual({
      transition: { preset: "fast", properties: "opacity" },
    });
  });

  it("is stable across renders even for an inline object value", () => {
    const { result, rerender } = renderHook(() =>
      useReducedTransition({ duration: 240, easing: "ease-out" }),
    );
    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("keeps an already-disabled branch null", () => {
    expect(renderHook(() => useReducedTransition(null)).result.current).toEqual({
      transition: null,
    });
  });

  it("nulls the transition under reduced motion", () => {
    mockState.reduced = true;
    expect(renderHook(() => useReducedTransition("fast")).result.current).toEqual({
      transition: null,
    });
  });
});

describe("MotionConfig", () => {
  const withConfig = (props: { disabled?: boolean; durationScale?: number }) => {
    const Wrapper = ({ children }: { children: React.ReactNode }) => (
      <MotionConfig {...props}>{children}</MotionConfig>
    );
    Wrapper.displayName = "MotionConfigWrapper";
    return Wrapper;
  };

  it("scales the duration of a bare driver key via durationScale", () => {
    // "fast" base = 150ms (core MOTION_PRESETS) → ×2 = 300ms, as { preset, duration }.
    const { result } = renderHook(() => useReducedTransition("fast"), {
      wrapper: withConfig({ durationScale: 2 }),
    });
    expect(result.current).toEqual({ transition: { preset: "fast", duration: 300 } });
  });

  it("scales preset and press transitions too", () => {
    const preset = renderHook(() => useMotionPreset("fade"), {
      wrapper: withConfig({ durationScale: 2 }),
    });
    expect(preset.result.current.transition).toEqual({
      preset: "fast",
      duration: 300,
      properties: "opacity",
    });

    const press = renderHook(() => usePressScale(), {
      wrapper: withConfig({ durationScale: 0.5 }),
    });
    expect(press.result.current.transition).toEqual({ preset: "fast", duration: 75 });
  });

  it("leaves spring keys (bouncy) unscaled — no scalable duration", () => {
    const { result } = renderHook(() => useReducedTransition("bouncy"), {
      wrapper: withConfig({ durationScale: 3 }),
    });
    expect(result.current).toEqual({ transition: "bouncy" });
  });

  it("disables all motion when disabled", () => {
    expect(
      renderHook(() => useMotionPreset("pop"), { wrapper: withConfig({ disabled: true }) }).result
        .current,
    ).toEqual({ transition: null });
    expect(
      renderHook(() => useReducedTransition("fast"), { wrapper: withConfig({ disabled: true }) })
        .result.current,
    ).toEqual({ transition: null });
    expect(
      renderHook(() => usePressScale(), { wrapper: withConfig({ disabled: true }) }).result.current,
    ).toEqual({ transition: null, scale: "press:1" });
  });

  it("composes nested durationScale multiplicatively", () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <MotionConfig durationScale={2}>
        <MotionConfig durationScale={0.5}>{children}</MotionConfig>
      </MotionConfig>
    );
    // 2 × 0.5 = 1 → unit scale → bare key passes through unchanged.
    expect(renderHook(() => useReducedTransition("fast"), { wrapper }).result.current).toEqual({
      transition: "fast",
    });
  });
});
