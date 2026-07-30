import { describe, expect, it, vi } from "vitest";

import {
  type CapturableSvg,
  createRasterStore,
  keyFor,
  pngPixelWidth,
  runCapture,
} from "./rasterizer.shared";

/** Build base64 for a PNG whose IHDR declares the given pixel width. */
function pngBase64(width: number): string {
  const bytes = [
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a, // signature
    0x00,
    0x00,
    0x00,
    0x0d, // IHDR length
    0x49,
    0x48,
    0x44,
    0x52, // "IHDR"
    (width >>> 24) & 0xff,
    (width >>> 16) & 0xff,
    (width >>> 8) & 0xff,
    width & 0xff, // width
    0x00,
    0x00,
    0x00,
    0x18, // height (arbitrary)
  ];
  return Buffer.from(bytes).toString("base64");
}

const req = (key: string, svg = "<svg/>") => ({ key, svg, width: 24, height: 24 });

describe("keyFor", () => {
  it("collapses identical (svg, size) to the same key", () => {
    expect(keyFor("<svg>a</svg>", 24, 24)).toBe(keyFor("<svg>a</svg>", 24, 24));
  });

  it("separates different markup or sizes", () => {
    expect(keyFor("<svg>a</svg>", 24, 24)).not.toBe(keyFor("<svg>b</svg>", 24, 24));
    expect(keyFor("<svg>a</svg>", 24, 24)).not.toBe(keyFor("<svg>a</svg>", 48, 48));
  });
});

describe("pngPixelWidth", () => {
  it("reads the real bitmap width from the PNG IHDR", () => {
    // The whole cross-platform fix hinges on this: iOS bakes UIScreen.scale into
    // the bitmap, so a 60px request can come back 180px — we must read the truth.
    expect(pngPixelWidth(pngBase64(60))).toBe(60);
    expect(pngPixelWidth(pngBase64(180))).toBe(180);
    expect(pngPixelWidth(pngBase64(1))).toBe(1);
  });

  it("returns undefined for non-PNG or truncated data", () => {
    expect(pngPixelWidth("AAAA")).toBeUndefined();
    expect(pngPixelWidth("")).toBeUndefined();
  });
});

describe("createRasterStore", () => {
  it("mounts a surface on first acquire and exposes it via getRequests", () => {
    const store = createRasterStore();
    store.acquire(req("a"));
    expect(store.getRequests().map((r) => r.key)).toEqual(["a"]);
  });

  it("ref-counts: a shared icon stays mounted until the last consumer releases", () => {
    const store = createRasterStore();
    store.acquire(req("a"));
    store.acquire(req("a")); // second consumer, same content key
    expect(store.getRequests()).toHaveLength(1);

    store.release("a");
    expect(store.getRequests()).toHaveLength(1); // still one consumer

    store.release("a");
    expect(store.getRequests()).toHaveLength(0); // last one gone
  });

  it("returns a referentially-stable snapshot between changes (for useSyncExternalStore)", () => {
    const store = createRasterStore();
    store.acquire(req("a"));
    const first = store.getRequests();
    expect(store.getRequests()).toBe(first); // no mutation → same reference
    store.acquire(req("b"));
    expect(store.getRequests()).not.toBe(first); // changed → new reference
  });

  it("stores and reports a resolved uri", () => {
    const store = createRasterStore();
    store.acquire(req("a"));
    expect(store.getUri("a")).toBeUndefined();
    store.resolve("a", "data:image/png;base64,AAAA");
    expect(store.getUri("a")).toBe("data:image/png;base64,AAAA");
  });

  it("notifies subscribers on acquire, release, and first resolve", () => {
    const store = createRasterStore();
    const listener = vi.fn();
    store.subscribe(listener);

    store.acquire(req("a"));
    store.resolve("a", "uri-1");
    store.resolve("a", "uri-1"); // unchanged → no notification
    store.release("a");

    expect(listener).toHaveBeenCalledTimes(3);
  });

  it("ignores a late resolve for a released surface", () => {
    const store = createRasterStore();
    store.acquire(req("a"));
    store.release("a");
    store.resolve("a", "uri"); // surface gone
    expect(store.getUri("a")).toBeUndefined();
  });

  it("drops a surface from the render snapshot once it resolves", () => {
    // A surface exists only to produce a bitmap. Keeping it mounted afterwards
    // leaves a live react-native-svg view tree (collapsable={false}) that Android
    // walks on every layout pass, for the whole lifetime of the map.
    const store = createRasterStore();
    store.acquire(req("a"));
    expect(store.getRequests()).toHaveLength(1);

    store.resolve("a", "uri-a");

    expect(store.getRequests()).toHaveLength(0);
    // …but the raster is still available to consumers.
    expect(store.getUri("a")).toBe("uri-a");
  });

  it("reuses a cached raster on remount instead of re-rasterizing", () => {
    // Unmount/remount of an icon (a filter toggle) must not re-run the capture,
    // because that also drives removeImage/addImage — and removing an image a
    // symbol layer references forces MapLibre to redo symbol placement.
    const store = createRasterStore();
    store.acquire(req("a"));
    store.resolve("a", "uri-a", 48);
    store.release("a");

    store.acquire(req("a"));

    // Resolved immediately, and no surface is mounted for it.
    expect(store.getResolved("a")).toEqual({ uri: "uri-a", pixelWidth: 48 });
    expect(store.getRequests()).toHaveLength(0);
  });
});

/**
 * A manual animation-frame clock. `runCapture` schedules everything through
 * `requestAnimationFrame`, so driving frames by hand is what makes its pacing
 * observable at all — real timers would make these tests both slow and flaky.
 */
function fakeRaf() {
  let nextId = 1;
  let scheduled = new Map<number, () => void>();
  return {
    raf: (cb: () => void): number => {
      const id = nextId++;
      scheduled.set(id, cb);
      return id;
    },
    caf: (id: number): void => {
      scheduled.delete(id);
    },
    /** Advance `frames` frames, running whatever was due on each. */
    tick(frames = 1): void {
      for (let i = 0; i < frames; i++) {
        const due = [...scheduled.values()];
        scheduled = new Map();
        for (const cb of due) cb();
      }
    },
  };
}

/** A stand-in react-native-svg surface whose capture result the test controls. */
function fakeSurface(result: () => string) {
  const toDataURL = vi.fn((cb: (b64: string) => void) => cb(result()));
  return { ref: { current: { toDataURL } }, toDataURL };
}

/**
 * Frames needed to walk the whole eager window: `scheduleIn(1)` then a
 * geometric backoff capped at 8, across {@link MAX_CAPTURE_ATTEMPTS} retries.
 * Over-shoots deliberately — the assertions are about behaviour, not timing.
 */
const PAST_EAGER_WINDOW = 120;

describe("runCapture", () => {
  it("captures on the first attempt once the surface paints", () => {
    const clock = fakeRaf();
    vi.stubGlobal("requestAnimationFrame", clock.raf);
    vi.stubGlobal("cancelAnimationFrame", clock.caf);
    const surface = fakeSurface(() => pngBase64(48));
    const onCapture = vi.fn();

    const cancel = runCapture(surface.ref, { width: 24, height: 24 }, onCapture);
    clock.tick(2);

    expect(onCapture).toHaveBeenCalledTimes(1);
    // The data-URI prefix is added here, and the real pixel width is read back out
    // of the PNG header so the caller can register the right density.
    expect(onCapture.mock.calls[0][0]).toBe(`data:image/png;base64,${pngBase64(48)}`);
    expect(onCapture.mock.calls[0][1]).toBe(48);
    cancel();
    vi.unstubAllGlobals();
  });

  it("retries while the surface is not yet attached", () => {
    const clock = fakeRaf();
    vi.stubGlobal("requestAnimationFrame", clock.raf);
    vi.stubGlobal("cancelAnimationFrame", clock.caf);
    const ref: { current: CapturableSvg | null } = { current: null };
    const onCapture = vi.fn();

    const cancel = runCapture(ref, { width: 24, height: 24 }, onCapture);
    clock.tick(6);
    expect(onCapture).not.toHaveBeenCalled();

    // The host attaches the surface a few frames late — the usual case.
    ref.current = { toDataURL: (cb) => cb(pngBase64(24)) };
    clock.tick(20);

    expect(onCapture).toHaveBeenCalledTimes(1);
    cancel();
    vi.unstubAllGlobals();
  });

  it("keeps retrying past the eager window and still captures once the surface paints", () => {
    // THE REGRESSION TEST. Exhausting the eager window used to END the job without
    // ever calling `onCapture`: nothing re-requested it, so a surface that was
    // mounted but not yet being DRAWN (a map warmed offscreen, a frozen screen)
    // never produced a bitmap, `SvgImage` registered no MapLibre image, and every
    // symbol layer drawing that icon silently drew nothing for the whole session.
    const clock = fakeRaf();
    vi.stubGlobal("requestAnimationFrame", clock.raf);
    vi.stubGlobal("cancelAnimationFrame", clock.caf);

    // Empty bytes is what an unpainted view hands back.
    let painted = false;
    const surface = fakeSurface(() => (painted ? pngBase64(32) : ""));
    const onCapture = vi.fn();

    const cancel = runCapture(surface.ref, { width: 24, height: 24 }, onCapture);
    clock.tick(PAST_EAGER_WINDOW);

    expect(onCapture).not.toHaveBeenCalled();
    const attemptsSoFar = surface.toDataURL.mock.calls.length;
    expect(attemptsSoFar).toBeGreaterThan(0);

    // Still trying, at the patient cadence rather than not at all.
    clock.tick(PAST_EAGER_WINDOW);
    expect(surface.toDataURL.mock.calls.length).toBeGreaterThan(attemptsSoFar);

    // The surface finally gets drawn — the next patient poll must pick it up.
    painted = true;
    clock.tick(PAST_EAGER_WINDOW);

    expect(onCapture).toHaveBeenCalledTimes(1);
    expect(onCapture.mock.calls[0][1]).toBe(32);
    cancel();
    vi.unstubAllGlobals();
  });

  it("hands its concurrency slot back when it drops to the patient cadence", () => {
    // Otherwise four icons against a cap of three would deadlock: three surfaces
    // that are not painting would hold every slot forever and the fourth — which
    // might well succeed immediately — would never start.
    const clock = fakeRaf();
    vi.stubGlobal("requestAnimationFrame", clock.raf);
    vi.stubGlobal("cancelAnimationFrame", clock.caf);

    const stuck = [0, 1, 2].map(() => fakeSurface(() => ""));
    const last = fakeSurface(() => pngBase64(16));
    const onCapture = vi.fn();
    const cancels = [
      ...stuck.map((s) => runCapture(s.ref, { width: 24, height: 24 }, vi.fn())),
      runCapture(last.ref, { width: 24, height: 24 }, onCapture),
    ];

    // The cap is 3, so the fourth job is still queued and untouched.
    clock.tick(4);
    expect(last.toDataURL).not.toHaveBeenCalled();
    expect(stuck.every((s) => s.toDataURL.mock.calls.length > 0)).toBe(true);

    // Once the three stuck jobs go patient they release their slots, the queue
    // pumps, and the fourth finally runs — and succeeds.
    clock.tick(PAST_EAGER_WINDOW);
    expect(onCapture).toHaveBeenCalledTimes(1);

    for (const cancel of cancels) cancel();
    vi.unstubAllGlobals();
  });

  it("stops for good when its surface unmounts", () => {
    // The patient cadence is indefinite, so cleanup is the only thing that ends it.
    // A leak here would poll a dead surface for the map's lifetime.
    const clock = fakeRaf();
    vi.stubGlobal("requestAnimationFrame", clock.raf);
    vi.stubGlobal("cancelAnimationFrame", clock.caf);
    const surface = fakeSurface(() => "");
    const onCapture = vi.fn();

    const cancel = runCapture(surface.ref, { width: 24, height: 24 }, onCapture);
    clock.tick(PAST_EAGER_WINDOW);
    const attemptsAtCancel = surface.toDataURL.mock.calls.length;

    cancel();
    clock.tick(PAST_EAGER_WINDOW * 3);

    expect(surface.toDataURL.mock.calls.length).toBe(attemptsAtCancel);
    expect(onCapture).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
