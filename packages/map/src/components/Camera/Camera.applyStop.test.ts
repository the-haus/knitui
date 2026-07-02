import type { Map as MLMap } from "maplibre-gl";
import { describe, expect, it, vi } from "vitest";

import { applyStop } from "./Camera";

/**
 * Minimal MapLibre `Map` mock that records the options each camera method
 * receives. We only model the surface `applyStop` touches.
 */
function createMapMock() {
  const calls: { method: string; options: unknown }[] = [];
  const record =
    (method: string) =>
    (options: unknown = {}) => {
      calls.push({ method, options });
    };
  const map = {
    isMoving: () => false,
    stop: vi.fn(),
    flyTo: record("flyTo"),
    easeTo: record("easeTo"),
    jumpTo: record("jumpTo"),
    fitBounds: record("fitBounds"),
  } as unknown as MLMap;
  return { map, calls };
}

const BERLIN: [number, number] = [13.405, 52.52];

describe("applyStop → MapLibre camera mapping", () => {
  it('does NOT pass an own `easing` key for "ease" (avoids clobbering MapLibre defaultEasing)', () => {
    const { map, calls } = createMapMock();

    applyStop(map, { center: BERLIN, zoom: 11, duration: 1500, easing: "ease" });

    expect(calls).toHaveLength(1);
    const { method, options } = calls[0];
    expect(method).toBe("easeTo");
    // The regression: MapLibre merges options over its defaults with a plain
    // `for (const k in src)` loop, so an explicit `easing: undefined` would
    // overwrite `defaultEasing` and throw every animation frame. The key must
    // be absent entirely, not present-and-undefined.
    expect(Object.prototype.hasOwnProperty.call(options, "easing")).toBe(false);
    expect(options).toMatchObject({ center: BERLIN, zoom: 11, duration: 1500 });
  });

  it('passes a linear easing function for "linear"', () => {
    const { map, calls } = createMapMock();

    applyStop(map, { center: BERLIN, zoom: 11, duration: 1500, easing: "linear" });

    const { method, options } = calls[0];
    expect(method).toBe("easeTo");
    const easing = (options as { easing?: (t: number) => number }).easing;
    expect(typeof easing).toBe("function");
    // identity: linear progress
    expect(easing?.(0.25)).toBe(0.25);
  });

  it('routes "fly" to flyTo without injecting easing', () => {
    const { map, calls } = createMapMock();

    applyStop(map, { center: BERLIN, zoom: 11, duration: 2000, easing: "fly" });

    const { method, options } = calls[0];
    expect(method).toBe("flyTo");
    expect(Object.prototype.hasOwnProperty.call(options, "easing")).toBe(false);
  });

  it("jumps instantly when duration is 0 and no easing is given", () => {
    const { map, calls } = createMapMock();

    applyStop(map, { center: BERLIN, zoom: 11, duration: 0 });

    expect(calls[0].method).toBe("jumpTo");
  });
});
