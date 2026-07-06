import { describe, expect, it, vi } from "vitest";

import { createRasterStore, keyFor, pngPixelWidth } from "./rasterizer.shared";

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
});
