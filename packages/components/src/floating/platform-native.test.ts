/**
 * Regression tests for the **native** floating measurement layer.
 *
 * Model: measure the reference (target) in window coordinates — the shared source
 * of truth — and place the floating element there inside the full-screen portal
 * host. On Android a status-bar correction is applied via the container origin
 * (see `getHostOrigin`); these tests run under react-native-web (`Platform.OS`
 * is not "android"), so the container origin is the window origin. Guards:
 *  1. The measurement callback fires async over the bridge — later than any
 *     microtask — so it must never be raced by a microtask/timer resolving data.
 *  2. Non-finite/garbage measurements are rejected, not positioned against.
 *
 * The fake nodes invoke their callbacks asynchronously (like the real bridge).
 */
import { measure } from "./platform.native";

type Rect = { x: number; y: number; width: number; height: number };

/** A node measured in window space via `measureInWindow`. */
function windowNode(rect: Rect) {
  return {
    measureInWindow(cb: (x: number, y: number, w: number, h: number) => void) {
      setTimeout(() => cb(rect.x, rect.y, rect.width, rect.height), 0);
    },
  };
}

/** A node exposing only `measure` (pageX/pageY are window-relative). */
function legacyNode(rect: Rect) {
  return {
    measure(cb: (x: number, y: number, w: number, h: number, px: number, py: number) => void) {
      setTimeout(() => cb(0, 0, rect.width, rect.height, rect.x, rect.y), 0);
    },
  };
}

describe("native floating measurement", () => {
  it("resolves the real async measurement (does not clobber it with null)", async () => {
    const reference = windowNode({ x: 40, y: 200, width: 120, height: 48 });
    const floating = windowNode({ x: 0, y: 0, width: 200, height: 100 });

    const result = await measure(reference as never, floating as never, "absolute");

    expect(result.reference).toEqual({ x: 40, y: 200, width: 120, height: 48 });
    expect(result.floating).toEqual({ width: 200, height: 100 });
  });

  it("uses the window origin as the container origin off Android", async () => {
    const reference = windowNode({ x: 40, y: 200, width: 120, height: 48 });
    const floating = windowNode({ x: 12, y: 340, width: 200, height: 100 });

    const result = await measure(reference as never, floating as never, "absolute");

    // The floating element's own position is irrelevant; placement is in window
    // space and (off Android) the host sits at the window origin.
    expect(result.containerOrigin).toEqual({ x: 0, y: 0 });
  });

  it("falls back to measure()'s pageX/pageY when measureInWindow is absent", async () => {
    const reference = legacyNode({ x: 40, y: 200, width: 120, height: 48 });
    const floating = legacyNode({ x: 0, y: 0, width: 200, height: 100 });

    const result = await measure(reference as never, floating as never, "absolute");

    expect(result.reference).toEqual({ x: 40, y: 200, width: 120, height: 48 });
  });

  it("uses the onLayout size hint and skips measuring the floating element", async () => {
    const reference = windowNode({ x: 40, y: 200, width: 120, height: 48 });
    // No floating node at all — the size hint supplies the size.
    const result = await measure(reference as never, null, "absolute", { width: 220, height: 90 });

    expect(result.reference).toEqual({ x: 40, y: 200, width: 120, height: 48 });
    expect(result.floating).toEqual({ width: 220, height: 90 });
  });

  it("resolves null pieces when a node cannot be measured", async () => {
    const result = await measure(null, null, "absolute");
    expect(result.reference).toBeNull();
    expect(result.floating).toBeNull();
  });

  it("rejects a garbage (non-finite) measurement instead of positioning with NaN", async () => {
    const bad = {
      measureInWindow(cb: (x: number, y: number, w: number, h: number) => void) {
        setTimeout(() => cb(NaN, NaN, NaN, NaN), 0);
      },
    };
    const floating = windowNode({ x: 0, y: 0, width: 200, height: 100 });

    const result = await measure(bad as never, floating as never, "absolute");
    expect(result.reference).toBeNull();
  });
});
