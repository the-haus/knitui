import * as React from "react";

import { renderHook } from "@testing-library/react";

import {
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
  useReducedMotion: () => mockState.reduced,
}));

beforeEach(() => {
  mockState.reduced = false;
});

describe("useMotionPreset", () => {
  it("resolves a named preset to spreadable props", () => {
    const { result } = renderHook(() => useMotionPreset("pop"));
    expect(result.current.transition).toBe("bouncy");
    expect(result.current.enterStyle).toEqual(motionPresets.pop.enterStyle);
    expect(result.current.exitStyle).toEqual(motionPresets.pop.exitStyle);
    expect(result.current.animateOnly).toContain("transform");
  });

  it("accepts an inline preset object", () => {
    const { result } = renderHook(() =>
      useMotionPreset({ transition: "slow", enterStyle: { opacity: 0 } }),
    );
    expect(result.current.transition).toBe("slow");
    expect(result.current.enterStyle).toEqual({ opacity: 0 });
  });

  it("overrides the duration while keeping the easing key", () => {
    const { result } = renderHook(() => useMotionPreset("fade", { duration: 500 }));
    expect(result.current.transition).toEqual(["fast", { duration: 500 }]);
  });

  it("overrides the transition key", () => {
    const { result } = renderHook(() => useMotionPreset("fade", { transition: "slow" }));
    expect(result.current.transition).toBe("slow");
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
    expect(result.current.enterStyle).toBeUndefined();
  });

  it("resolves every built-in preset to a usable driver key + enter/exit styles", () => {
    for (const name of Object.keys(motionPresets) as (keyof typeof motionPresets)[]) {
      const { result } = renderHook(() => useMotionPreset(name));
      expect(result.current.transition).toBeTruthy();
      expect(result.current.enterStyle).toBeDefined();
      expect(result.current.exitStyle).toBeDefined();
      // Symmetric by construction — enter and exit share the "from"/"to" snapshot.
      expect(result.current.enterStyle).toEqual(result.current.exitStyle);
    }
  });

  it("resolves the directional transform presets to shorthand transforms", () => {
    expect(renderHook(() => useMotionPreset("pop-up")).result.current.enterStyle).toMatchObject({
      scale: expect.any(Number),
      y: expect.any(Number),
    });
    expect(
      renderHook(() => useMotionPreset("rotate-left")).result.current.enterStyle,
    ).toMatchObject({ rotate: expect.any(String) });
    expect(renderHook(() => useMotionPreset("skew-down")).result.current.enterStyle).toMatchObject({
      skewX: expect.any(String),
    });
    expect(
      renderHook(() => useMotionPreset("zoom")).result.current.enterStyle?.scale,
    ).toBeGreaterThan(1);
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

  it("neutralises the dip and disables easing under reduced motion", () => {
    mockState.reduced = true;
    const { result } = renderHook(() => usePressScale());
    expect(result.current).toEqual({ transition: null, pressStyle: { scale: 1 } });
  });
});

describe("useReducedTransition", () => {
  it("passes the value through when motion is allowed", () => {
    expect(renderHook(() => useReducedTransition("fast")).result.current).toEqual({
      transition: "fast",
    });
    expect(
      renderHook(() => useReducedTransition(["ease-out", { duration: 240 }])).result.current,
    ).toEqual({ transition: ["ease-out", { duration: 240 }] });
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
    // "fast" base = 150ms → ×2 = 300ms, emitted as an explicit [key, { duration }].
    const { result } = renderHook(() => useReducedTransition("fast"), {
      wrapper: withConfig({ durationScale: 2 }),
    });
    expect(result.current).toEqual({ transition: ["fast", { duration: 300 }] });
  });

  it("scales preset and press transitions too", () => {
    const preset = renderHook(() => useMotionPreset("fade"), {
      wrapper: withConfig({ durationScale: 2 }),
    });
    expect(preset.result.current.transition).toEqual(["fast", { duration: 300 }]);

    const press = renderHook(() => usePressScale(), {
      wrapper: withConfig({ durationScale: 0.5 }),
    });
    expect(press.result.current.transition).toEqual(["fast", { duration: 75 }]);
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
    ).toEqual({ transition: null, pressStyle: { scale: 1 } });
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
