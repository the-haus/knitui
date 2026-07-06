// @vitest-environment jsdom
/**
 * Dynamic-update tests for GPU-accelerated pins/SVG icons.
 *
 * These render the REAL `SvgImage` + `ShapeSource` + `SymbolLayer` web
 * components against a fake maplibre-gl engine that records imperative calls,
 * then drive React **state updates** (changing props) and **tree updates**
 * (mount/unmount, conditional children) and assert the components translate
 * them into the right incremental maplibre calls — `setData`, `addImage` /
 * `removeImage`, `setLayoutProperty`, `setFilter`, layer self-heal on source
 * recreation, and teardown that survives a torn-down style.
 *
 * The SVG-icon pipeline under test: `SvgImage` registers a named image →
 * `SymbolLayer` draws it via `icon-image` (a single batched GPU draw), and the
 * point geometry comes from a `geojson` `ShapeSource`.
 */
import {
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";

import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { MapContext, type MapContextValue, WEB_CAPABILITIES } from "../MapView/MapView.context";
import { createRasterStore, type RasterStore } from "../SvgImage/rasterizer.shared";
import { SvgImage } from "../SvgImage/SvgImage";
import { SymbolLayer } from "../SymbolLayer/SymbolLayer";
import { ShapeSource } from "./ShapeSource";

/**
 * Stand-in for `RasterizerHost`: resolves every requested surface to a stub PNG
 * immediately, so the real `SvgImage → Images → SymbolLayer` pipeline runs
 * end-to-end without react-native-svg's DOM/canvas capture (which can't execute
 * in jsdom). The capture mechanism itself is covered in `rasterizer.test.ts`.
 */
function FakeRasterHost({ store }: { store: RasterStore }): null {
  const requests = useSyncExternalStore(store.subscribe, store.getRequests, store.getRequests);
  useEffect(() => {
    for (const req of requests) {
      store.resolve(req.key, `data:image/png;base64,${req.key}`);
    }
  }, [requests, store]);
  return null;
}

// ── Fake maplibre-gl engine ─────────────────────────────────────────

interface Call {
  name: string;
  args: unknown[];
}

interface FakeSource {
  type: string;
  data: unknown;
  setData: (d: unknown) => void;
}

/**
 * Minimal maplibre `Map` stand-in. Records every imperative mutation so tests
 * can assert on it, and emits `sourcedata` on `addSource` the way the real
 * engine does — which is what the layer self-heal path (and even initial mount,
 * since child layer effects run before the parent source effect) relies on.
 */
class FakeMap {
  // `style` is probed by Images.styleAlive(); truthy = alive.
  style: object | undefined = {};

  sources = new Map<string, FakeSource>();
  layers: Array<Record<string, unknown>> = [];
  layerMap = new Map<string, Record<string, unknown>>();
  images = new Map<string, { img: unknown; sdf: boolean }>();

  paint: Record<string, Record<string, unknown>> = {};
  layout: Record<string, Record<string, unknown>> = {};
  filters: Record<string, unknown> = {};
  zoomRanges: Record<string, [number, number]> = {};

  calls: Call[] = [];
  private handlers = new Map<string, Set<(e: unknown) => void>>();

  private record(name: string, ...args: unknown[]): void {
    this.calls.push({ name, args });
  }

  callsTo(name: string): Call[] {
    return this.calls.filter((c) => c.name === name);
  }

  // ── sources ──
  getSource(id: string): FakeSource | undefined {
    return this.sources.get(id);
  }

  addSource(id: string, config: Record<string, unknown>): void {
    this.record("addSource", id, config);
    const source: FakeSource = {
      type: config.type as string,
      data: config.data,
      setData: (d: unknown) => {
        this.record("setData", id, d);
        source.data = d;
      },
    };
    this.sources.set(id, source);
    // Real maplibre fires `sourcedata` asynchronously after the source loads;
    // fire synchronously here so the layer self-heal handler re-adds.
    this.emit("sourcedata", { sourceId: id });
  }

  removeSource(id: string): void {
    this.record("removeSource", id);
    this.sources.delete(id);
  }

  // ── layers ──
  getLayer(id: string): Record<string, unknown> | undefined {
    return this.layerMap.get(id);
  }

  addLayer(config: Record<string, unknown>, beforeId?: string): void {
    this.record("addLayer", config, beforeId);
    const id = config.id as string;
    const idx = beforeId ? this.layers.findIndex((l) => l.id === beforeId) : -1;
    if (idx >= 0) this.layers.splice(idx, 0, config);
    else this.layers.push(config);
    this.layerMap.set(id, config);
    if (config.paint) this.paint[id] = { ...(config.paint as Record<string, unknown>) };
    if (config.layout) this.layout[id] = { ...(config.layout as Record<string, unknown>) };
  }

  removeLayer(id: string): void {
    this.record("removeLayer", id);
    this.layers = this.layers.filter((l) => l.id !== id);
    this.layerMap.delete(id);
  }

  getStyle(): { layers: Array<Record<string, unknown>> } {
    return { layers: this.layers };
  }

  setPaintProperty(id: string, prop: string, value: unknown): void {
    this.record("setPaintProperty", id, prop, value);
    this.paint[id] ??= {};
    if (value === undefined) delete this.paint[id][prop];
    else this.paint[id][prop] = value;
  }

  setLayoutProperty(id: string, prop: string, value: unknown): void {
    this.record("setLayoutProperty", id, prop, value);
    this.layout[id] ??= {};
    if (value === undefined) delete this.layout[id][prop];
    else this.layout[id][prop] = value;
  }

  setFilter(id: string, filter: unknown): void {
    this.record("setFilter", id, filter);
    this.filters[id] = filter;
  }

  setLayerZoomRange(id: string, min: number, max: number): void {
    this.record("setLayerZoomRange", id, min, max);
    this.zoomRanges[id] = [min, max];
  }

  // ── images ──
  hasImage(id: string): boolean {
    return this.images.has(id);
  }

  addImage(id: string, img: unknown, opts?: { sdf?: boolean }): void {
    this.record("addImage", id, img, opts);
    this.images.set(id, { img, sdf: Boolean(opts?.sdf) });
  }

  removeImage(id: string): void {
    this.record("removeImage", id);
    this.images.delete(id);
  }

  // ── events ──
  on(event: string, handler: (e: unknown) => void): void {
    (this.handlers.get(event) ?? this.handlers.set(event, new Set()).get(event)!).add(handler);
  }

  off(event: string, handler: (e: unknown) => void): void {
    this.handlers.get(event)?.delete(handler);
  }

  emit(event: string, payload?: unknown): void {
    for (const h of this.handlers.get(event) ?? []) h(payload);
  }

  // ── queries (onPress path) ──
  queryRenderedFeatures = vi.fn(() => [] as unknown[]);
  querySourceFeatures = vi.fn(() => [] as unknown[]);
}

// ── jsdom Image stub (fires onload on src assignment) ───────────────

class FakeImage {
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  crossOrigin = "";
  private _src = "";
  set src(v: string) {
    this._src = v;
    queueMicrotask(() => this.onload?.());
  }
  get src(): string {
    return this._src;
  }
}

// ── Test provider ───────────────────────────────────────────────────

function Harness({
  map,
  ready = true,
  children,
}: {
  map: FakeMap;
  ready?: boolean;
  children: ReactNode;
}): ReactElement {
  const rasterizer = useRef<RasterStore>(undefined as unknown as RasterStore);
  if (!rasterizer.current) rasterizer.current = createRasterStore();

  // Stable context value so effects keyed on register* / map don't re-fire on
  // every parent re-render (only `map`/`ready` identity should matter).
  const value = useMemo<MapContextValue>(
    () => ({
      ready,
      adapterKind: "web",
      capabilities: WEB_CAPABILITIES,
      mapEngine: map,
      rasterizer: rasterizer.current,
      registerSource: vi.fn(),
      unregisterSource: vi.fn(),
      registerLayer: vi.fn(),
      unregisterLayer: vi.fn(),
      registerImage: vi.fn(),
      unregisterImage: vi.fn(),
      registerInteractiveSource: vi.fn(),
      unregisterInteractiveSource: vi.fn(),
    }),
    [map, ready],
  );
  return (
    <MapContext.Provider value={value}>
      {children}
      <FakeRasterHost store={rasterizer.current} />
    </MapContext.Provider>
  );
}

/** Flush the microtask queue so stubbed Image.onload (→ addImage) settles. */
async function flushImages(): Promise<void> {
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
  });
}

function point(coordinates: [number, number], id?: number): GeoJSON.Feature {
  return {
    type: "Feature",
    id,
    geometry: { type: "Point", coordinates },
    properties: {},
  };
}

function fc(...features: GeoJSON.Feature[]): GeoJSON.FeatureCollection {
  return { type: "FeatureCollection", features };
}

const PIN_RED = `<svg viewBox="0 0 24 24"><path d="M12 2 4 22 20 22Z" fill="#ef4444"/></svg>`;
const PIN_BLUE = `<svg viewBox="0 0 24 24"><path d="M12 2 4 22 20 22Z" fill="#3b82f6"/></svg>`;

// A full pins scene: SVG icon + geojson source + symbol layer drawing it.
function Scene({
  data,
  svg = PIN_RED,
  iconSize = 0.5,
  filter,
  extra,
}: {
  data: GeoJSON.FeatureCollection;
  svg?: string;
  iconSize?: number;
  filter?: unknown;
  extra?: Record<string, unknown>;
}): ReactElement {
  return (
    <>
      <SvgImage id="pin" svg={svg} width={40} height={40} pixelRatio={2} />
      <ShapeSource id="cities" data={data}>
        <SymbolLayer
          id="city-pins"
          source="cities"
          filter={filter as never}
          style={{ iconImage: "pin", iconSize, iconAllowOverlap: true, ...extra }}
        />
      </ShapeSource>
    </>
  );
}

// ── Setup ───────────────────────────────────────────────────────────

let originalImage: typeof globalThis.Image;

beforeEach(() => {
  originalImage = globalThis.Image;
  (globalThis as { Image: unknown }).Image = FakeImage;
  (globalThis as { __DEV__?: boolean }).__DEV__ = false;
});

afterEach(() => {
  (globalThis as { Image: unknown }).Image = originalImage;
  vi.restoreAllMocks();
});

// ── Tests ───────────────────────────────────────────────────────────

describe("GPU pins/SVG icons — initial mount", () => {
  it("registers the SVG image, geojson source, and a symbol layer wired to icon-image", async () => {
    const map = new FakeMap();
    render(
      <Harness map={map}>
        <Scene data={fc(point([4.9, 52.37], 0))} />
      </Harness>,
    );
    await flushImages();

    // Source added with the initial feature.
    expect(map.getSource("cities")?.type).toBe("geojson");
    expect((map.getSource("cities")?.data as GeoJSON.FeatureCollection).features).toHaveLength(1);

    // SVG rasterized to a data URI and uploaded as image "pin".
    expect(map.hasImage("pin")).toBe(true);

    // Symbol layer present and drawing the "pin" image at fixed size (GPU icon).
    const layer = map.getLayer("city-pins");
    expect(layer?.type).toBe("symbol");
    expect(map.layout["city-pins"]).toMatchObject({
      "icon-image": "pin",
      "icon-size": 0.5,
      "icon-allow-overlap": true,
    });
  });

  it("adds the layer even though the child layer effect runs before the source exists (self-heal via sourcedata)", async () => {
    const map = new FakeMap();
    render(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} />
      </Harness>,
    );
    await flushImages();
    // If self-heal were broken the layer would be silently missing.
    expect(map.getLayer("city-pins")).toBeDefined();
  });
});

describe("dynamic data updates (moving/adding/removing pins)", () => {
  it("calls source.setData with the new features on a data prop change", async () => {
    const map = new FakeMap();
    const { rerender } = render(
      <Harness map={map}>
        <Scene data={fc(point([0, 0], 0))} />
      </Harness>,
    );
    await flushImages();
    // The data effect fires once on mount too (harmless — addSource already
    // carried the data); baseline it so we assert the *delta* from the change.
    const baseline = map.callsTo("setData").length;

    // Add a second pin.
    rerender(
      <Harness map={map}>
        <Scene data={fc(point([0, 0], 0), point([1, 1], 1))} />
      </Harness>,
    );

    const setData = map.callsTo("setData");
    expect(setData).toHaveLength(baseline + 1);
    expect((setData.at(-1)!.args[1] as GeoJSON.FeatureCollection).features).toHaveLength(2);
    expect((map.getSource("cities")?.data as GeoJSON.FeatureCollection).features).toHaveLength(2);
  });

  it("does not tear down and recreate the source on a pure data change", async () => {
    const map = new FakeMap();
    const { rerender } = render(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} />
      </Harness>,
    );
    await flushImages();
    const addsBefore = map.callsTo("addSource").length;

    rerender(
      <Harness map={map}>
        <Scene data={fc(point([2, 2]))} />
      </Harness>,
    );

    // setData path only — no remove/re-add churn of the source.
    expect(map.callsTo("addSource")).toHaveLength(addsBefore);
    expect(map.callsTo("removeSource")).toHaveLength(0);
  });
});

describe("dynamic SVG icon updates (React state → re-registered image)", () => {
  it("removes the old raster and adds the new one when the svg changes", async () => {
    const map = new FakeMap();
    const { rerender } = render(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} svg={PIN_RED} />
      </Harness>,
    );
    await flushImages();
    expect(map.callsTo("addImage")).toHaveLength(1);

    rerender(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} svg={PIN_BLUE} />
      </Harness>,
    );
    await flushImages();

    // URL changed → old image removed, new one uploaded, same id reused.
    expect(map.callsTo("removeImage").map((c) => c.args[0])).toContain("pin");
    expect(map.callsTo("addImage")).toHaveLength(2);
    expect(map.hasImage("pin")).toBe(true);
  });

  it("does not churn the image when the svg is unchanged across a re-render", async () => {
    const map = new FakeMap();
    const { rerender } = render(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} svg={PIN_RED} />
      </Harness>,
    );
    await flushImages();

    rerender(
      <Harness map={map}>
        <Scene data={fc(point([1, 1]))} svg={PIN_RED} />
      </Harness>,
    );
    await flushImages();

    expect(map.callsTo("addImage")).toHaveLength(1);
    expect(map.callsTo("removeImage")).toHaveLength(0);
  });
});

describe("dynamic symbol layout/paint updates", () => {
  it("applies icon-size changes incrementally via setLayoutProperty", async () => {
    const map = new FakeMap();
    const { rerender } = render(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} iconSize={0.5} />
      </Harness>,
    );
    await flushImages();

    rerender(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} iconSize={1} />
      </Harness>,
    );

    const sizeCalls = map.callsTo("setLayoutProperty").filter((c) => c.args[1] === "icon-size");
    expect(sizeCalls.at(-1)?.args[2]).toBe(1);
    expect(map.layout["city-pins"]["icon-size"]).toBe(1);
    // No re-add of the layer — it was updated in place.
    expect(map.callsTo("addLayer")).toHaveLength(1);
  });

  it("resets a layout key to its default when it is dropped between renders", async () => {
    const map = new FakeMap();
    const { rerender } = render(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} extra={{ iconRotate: 45 }} />
      </Harness>,
    );
    await flushImages();
    expect(map.layout["city-pins"]["icon-rotate"]).toBe(45);

    // Drop iconRotate.
    rerender(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} />
      </Harness>,
    );

    const resets = map
      .callsTo("setLayoutProperty")
      .filter((c) => c.args[1] === "icon-rotate" && c.args[2] === undefined);
    expect(resets.length).toBeGreaterThan(0);
    expect(map.layout["city-pins"]["icon-rotate"]).toBeUndefined();
  });

  it("updates the feature filter via setFilter", async () => {
    const map = new FakeMap();
    const first = ["==", ["get", "kind"], "a"];
    const next = ["==", ["get", "kind"], "b"];
    const { rerender } = render(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} filter={first} />
      </Harness>,
    );
    await flushImages();

    rerender(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} filter={next} />
      </Harness>,
    );

    expect(map.callsTo("setFilter").at(-1)?.args[1]).toEqual(next);
    expect(map.filters["city-pins"]).toEqual(next);
  });
});

describe("tree updates (mount/unmount, conditional layers)", () => {
  it("removes the layer, source and image when the whole scene unmounts", async () => {
    const map = new FakeMap();
    const { unmount } = render(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} />
      </Harness>,
    );
    await flushImages();
    expect(map.getLayer("city-pins")).toBeDefined();
    expect(map.hasImage("pin")).toBe(true);

    unmount();

    expect(map.getLayer("city-pins")).toBeUndefined();
    expect(map.getSource("cities")).toBeUndefined();
    expect(map.hasImage("pin")).toBe(false);
  });

  it("adds/removes a second symbol layer when it is conditionally rendered", async () => {
    const map = new FakeMap();
    function Two({ show }: { show: boolean }): ReactElement {
      return (
        <>
          <SvgImage id="pin" svg={PIN_RED} width={40} height={40} />
          <ShapeSource id="cities" data={fc(point([0, 0]))}>
            <SymbolLayer id="pins-a" source="cities" style={{ iconImage: "pin" }} />
            {show ? (
              <SymbolLayer id="pins-b" source="cities" style={{ iconImage: "pin", iconSize: 2 }} />
            ) : null}
          </ShapeSource>
        </>
      );
    }

    const { rerender } = render(
      <Harness map={map}>
        <Two show={false} />
      </Harness>,
    );
    await flushImages();
    expect(map.getLayer("pins-a")).toBeDefined();
    expect(map.getLayer("pins-b")).toBeUndefined();

    rerender(
      <Harness map={map}>
        <Two show={true} />
      </Harness>,
    );
    await flushImages();
    expect(map.getLayer("pins-b")).toBeDefined();

    rerender(
      <Harness map={map}>
        <Two show={false} />
      </Harness>,
    );
    expect(map.getLayer("pins-b")).toBeUndefined();
    // The first layer is untouched throughout.
    expect(map.getLayer("pins-a")).toBeDefined();
  });
});

describe("structural source change (self-heal)", () => {
  it("recreates the source and re-adds the dependent symbol layer when cluster toggles", async () => {
    const map = new FakeMap();
    function Clustered({ cluster }: { cluster: boolean }): ReactElement {
      return (
        <>
          <SvgImage id="pin" svg={PIN_RED} width={40} height={40} />
          <ShapeSource id="cities" data={fc(point([0, 0]))} cluster={cluster}>
            <SymbolLayer id="city-pins" source="cities" style={{ iconImage: "pin" }} />
          </ShapeSource>
        </>
      );
    }

    const { rerender } = render(
      <Harness map={map}>
        <Clustered cluster={false} />
      </Harness>,
    );
    await flushImages();
    expect(map.getLayer("city-pins")).toBeDefined();
    const addLayersBefore = map.callsTo("addLayer").length;

    // Toggling cluster is a structural change: source is torn down + recreated.
    rerender(
      <Harness map={map}>
        <Clustered cluster={true} />
      </Harness>,
    );
    await flushImages();

    expect(map.callsTo("removeSource").length).toBeGreaterThan(0);
    expect(map.getSource("cities") as unknown as { setData: unknown }).toBeDefined();
    // Layer survived the source recreation via the sourcedata self-heal.
    expect(map.getLayer("city-pins")).toBeDefined();
    expect(map.callsTo("addLayer").length).toBeGreaterThan(addLayersBefore);
  });
});

describe("teardown safety when the style is gone", () => {
  it("does not throw on unmount after the map style has been torn down", async () => {
    const map = new FakeMap();
    const { unmount } = render(
      <Harness map={map}>
        <Scene data={fc(point([0, 0]))} />
      </Harness>,
    );
    await flushImages();

    // Simulate maplibre dropping the style (setStyle / remove).
    map.style = undefined;

    expect(() => unmount()).not.toThrow();
  });
});
