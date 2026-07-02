import {
  bars,
  dots,
  line,
  mirror,
  radial,
  registerVisualizerVariant,
  resolveVariant,
  type VariantOptions,
  type VisualizerCircle,
  type VisualizerLine,
  type VisualizerRect,
  visualizerVariantNames,
  wave,
} from "./geometry";

/**
 * Unit tests for the pure, worklet-safe variant geometry: each variant's
 * shape output, the shared empty-input guards, and the variant registry.
 * No Skia / reanimated — the `"worklet"` directive is an inert string here.
 */
const OPTS: VariantOptions = { gap: 2, radius: 2 };

describe("bars", () => {
  it("emits one bottom-anchored rect per level with gap-aware widths", () => {
    const shapes = bars([1, 0], 10, 100, OPTS) as VisualizerRect[];
    expect(shapes).toHaveLength(2);
    // bw = (10 - gap*(n-1))/n = (10-2)/2 = 4.
    expect(shapes[0]).toMatchObject({ kind: "rect", x: 0, y: 0, w: 4, h: 100, r: 2 });
    // Second bar: x = i*(bw+gap) = 6; a 0 level floors the height to 1px.
    expect(shapes[1]).toMatchObject({ kind: "rect", x: 6, w: 4, h: 1, y: 99 });
  });

  it("clamps levels above 1 and corner radius to half the bar width", () => {
    const [bar] = bars([5], 3, 100, { gap: 2, radius: 50 }) as VisualizerRect[];
    expect(bar.h).toBe(100); // clamped to height, not 5×
    expect(bar.r).toBe(bar.w / 2); // radius capped at bw/2
  });
});

describe("mirror", () => {
  it("centers each bar about the vertical middle", () => {
    const shapes = mirror([1, 0], 10, 100, OPTS) as VisualizerRect[];
    expect(shapes[0]).toMatchObject({ y: 0, h: 100 }); // full height ⇒ y=0
    expect(shapes[1]).toMatchObject({ h: 1, y: 49.5 }); // (100-1)/2
  });
});

describe("dots", () => {
  it("emits a centered circle per level whose radius tracks the level", () => {
    const shapes = dots([1, 0], 20, 100, OPTS) as VisualizerCircle[];
    // step = width/n = 10; maxR = min(step/2, height/2) = 5.
    expect(shapes[0]).toMatchObject({ kind: "circle", x: 5, y: 50, r: 5 });
    expect(shapes[1]).toMatchObject({ x: 15, y: 50, r: 1 }); // min radius 1
  });
});

describe("line", () => {
  it("emits a single open polyline tracing each level", () => {
    const [shape] = line([0, 1], 10, 100, OPTS) as VisualizerLine[];
    expect(shape).toMatchObject({ kind: "line", closed: false, strokeWidth: 2 });
    // step = width/(n-1) = 10. y = height - level*height.
    expect(shape.points).toEqual([0, 100, 10, 0]);
  });
});

describe("wave", () => {
  it("emits a closed, mirrored envelope with 4·n points", () => {
    const [shape] = wave([1, 0], 10, 100, OPTS) as VisualizerLine[];
    expect(shape).toMatchObject({ kind: "line", closed: true, strokeWidth: 0 });
    expect(shape.points).toHaveLength(8);
    // top L→R then bottom R→L, around mid=50.
    expect(shape.points).toEqual([0, 0, 10, 50, 10, 50, 0, 100]);
  });
});

describe("radial", () => {
  it("emits one spoke per level as an open 2-point line", () => {
    const shapes = radial([0, 0, 0, 0], 100, 100, OPTS) as VisualizerLine[];
    expect(shapes).toHaveLength(4);
    shapes.forEach((s) => {
      expect(s.kind).toBe("line");
      expect(s.closed).toBe(false);
      expect(s.points).toHaveLength(4);
    });
  });
});

describe("empty / degenerate input guards", () => {
  it("returns [] for empty levels", () => {
    for (const v of [bars, mirror, dots, line, wave, radial]) {
      expect(v([], 100, 100, OPTS)).toEqual([]);
    }
  });

  it("returns [] for a zero-width canvas", () => {
    for (const v of [bars, mirror, dots, line, wave, radial]) {
      expect(v([1, 1], 0, 100, OPTS)).toEqual([]);
    }
  });
});

describe("resolveVariant / registry", () => {
  it("resolves built-in names to their functions", () => {
    expect(resolveVariant("bars")).toBe(bars);
    expect(resolveVariant("radial")).toBe(radial);
  });

  it("passes a function variant straight through", () => {
    const custom = bars;
    expect(resolveVariant(custom)).toBe(custom);
  });

  it("falls back to bars for unknown names and undefined", () => {
    expect(resolveVariant("nope")).toBe(bars);
    expect(resolveVariant(undefined)).toBe(bars);
  });

  it("resolves variants registered via registerVisualizerVariant", () => {
    const custom = (_l: number[]) => [];
    registerVisualizerVariant("test-variant", custom);
    expect(resolveVariant("test-variant")).toBe(custom);
    expect(visualizerVariantNames()).toEqual(expect.arrayContaining(["bars", "test-variant"]));
  });
});
